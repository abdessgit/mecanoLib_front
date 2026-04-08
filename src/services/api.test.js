import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateFrenchVatNumber,
  getMarques,
  getMarquesByModele,
  getModelesByMarque,
  isValidPhoneFormat,
  lookupFrenchBusinessBySiretOrSiren,
  registerClient,
  registerGarage,
} from './api';

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('public marque/modele lookups', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rebuilds all modeles of the same marque name from the public get_marques payload', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(200, [
      {
        id_marque: 101,
        nom_marque: 'Peugeot',
        modele: { id_modele: 10, nom_modele: '208' },
      },
      {
        id_marque: 102,
        nom_marque: 'Peugeot',
        modele: { id_modele: 11, nom_modele: '308' },
      },
      {
        id_marque: 201,
        nom_marque: 'Renault',
        modele: { id_modele: 20, nom_modele: 'Clio' },
      },
    ]));

    const result = await getModelesByMarque(101);

    expect(result).toMatchObject([
      { id: '10', name: '208' },
      { id: '11', name: '308' },
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain('/api/v1/get_marques');
  });

  it('falls back to the alternate Symfony marque route when the first route is unreachable', async () => {
    fetch
      .mockRejectedValueOnce(new Error('API injoignable (/api/v1/get_marques_modele/10). Verifiez que le backend tourne et que CORS autorise http://localhost:5173.'))
      .mockResolvedValueOnce(jsonResponse(200, [
        { id_marque: 101, nom_marque: 'Renault' },
        { id_marque: 102, nom_marque: 'Dacia' },
      ]));

    const result = await getMarquesByModele(10);

    expect(result).toEqual([
      { id_marque: 101, nom_marque: 'Renault' },
      { id_marque: 102, nom_marque: 'Dacia' },
    ]);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[0][0]).toContain('/api/v1/get_marques_modele/10');
    expect(fetch.mock.calls[1][0]).toContain('/api/v1/get_marques_by_modele/10');
  });

  it('does not surface a JWT error for public marque loading', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(401, { message: 'JWT Token not found' }));

    const result = await getMarques();

    expect(result).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain('/api/v1/get_marques');
  });
});

describe('SIREN / SIRET helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calculates the French TVA number from a SIREN or SIRET', () => {
    expect(calculateFrenchVatNumber('732829320')).toBe('FR44732829320');
    expect(calculateFrenchVatNumber('73282932000074')).toBe('FR44732829320');
    expect(calculateFrenchVatNumber('123')).toBeNull();
  });

  it('normalizes company information returned by the public SIREN/SIRET API', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(200, {
      results: [
        {
          siren: '732829320',
          nom_complet: 'SNCF',
          siege: {
            siret: '73282932000074',
            adresse: '2 PLACE AUX ETOILES',
            code_postal: '93200',
            libelle_commune: 'Saint-Denis',
            commune_code: '93066',
          },
        },
      ],
    }));

    const result = await lookupFrenchBusinessBySiretOrSiren('73282932000074');

    expect(result).toMatchObject({
      found: true,
      siren: '732829320',
      siret: '73282932000074',
      name: 'SNCF',
      city: 'Saint-Denis',
      postalCode: '93200',
      codeInsee: '93066',
      tva: 'FR44732829320',
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain('recherche-entreprises.api.gouv.fr/search');
  });
});

describe('phone validation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts only valid French phone numbers', () => {
    expect(isValidPhoneFormat('06 12 34 56 78')).toBe(true);
    expect(isValidPhoneFormat('+33 6 12 34 56 78')).toBe(true);
    expect(isValidPhoneFormat('abc')).toBe(false);
    expect(isValidPhoneFormat('12345')).toBe(false);
  });

  it('rejects invalid phone numbers for client and garage registration', async () => {
    await expect(registerClient({
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean@example.com',
      mdp: 'secret123',
      tel: 'nimportequoi',
      consentement: true,
    })).rejects.toThrow('Merci de saisir un numéro de téléphone valide.');

    await expect(registerGarage({
      nom_garage: 'Garage Test',
      email: 'contact@garage.fr',
      telephone: 'telephone bidon',
      adresse: '1 rue de Paris',
      siret: '12345678900012',
      tva: '',
      id_ville: 1,
      mdp: 'secret123',
    })).rejects.toThrow('Merci de saisir un numéro de téléphone valide.');

    expect(fetch).not.toHaveBeenCalled();
  });
});
