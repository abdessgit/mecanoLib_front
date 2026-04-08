import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClientDashboard from './ClientDashboard';

const apiMocks = vi.hoisted(() => ({
  getClientProfile: vi.fn(),
  getClientRendezVous: vi.fn(),
  getMarques: vi.fn(),
  getModelesByMarque: vi.fn(),
  getProfile: vi.fn(),
  getStoredAuth: vi.fn(),
  getVehiculesClient: vi.fn(),
}));

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    appointments: [],
  }),
}));

vi.mock('../../services/api', () => ({
  addVehicule: vi.fn(),
  clearStoredAuth: vi.fn(),
  deleteVehicule: vi.fn(),
  getClientIdFromProfile: vi.fn(() => '42'),
  getClientProfile: apiMocks.getClientProfile,
  getClientRendezVous: apiMocks.getClientRendezVous,
  getMarques: apiMocks.getMarques,
  getModelesByMarque: apiMocks.getModelesByMarque,
  getProfile: apiMocks.getProfile,
  getStoredAuth: apiMocks.getStoredAuth,
  getVehiculesClient: apiMocks.getVehiculesClient,
  isJwtExpired: vi.fn().mockReturnValue(false),
  normalizeClientProfile: vi.fn((profile = {}) => ({
    id: '42',
    prenom: profile?.client?.prenom || profile?.prenom || 'Jean',
    nom: profile?.client?.nom || profile?.nom || 'Dupont',
    email: profile?.client?.email || profile?.email || 'jean@example.com',
    telephone: profile?.client?.telephone || profile?.telephone || '0600000000',
    adresse: profile?.client?.adresse || profile?.adresse || '1 rue Test',
    ville: profile?.client?.ville || profile?.ville || 'Lyon',
    codePostal: profile?.client?.codePostal || profile?.codePostal || '69000',
    codeInsee: profile?.client?.codeInsee || profile?.codeInsee || '69380',
    pays: 'France',
  })),
  updateClientProfile: vi.fn(),
}));

describe('ClientDashboard', () => {
  beforeEach(() => {
    apiMocks.getStoredAuth.mockReset();
    apiMocks.getProfile.mockReset();
    apiMocks.getClientProfile.mockReset();
    apiMocks.getVehiculesClient.mockReset();
    apiMocks.getClientRendezVous.mockReset();
    apiMocks.getMarques.mockReset();
    apiMocks.getModelesByMarque.mockReset();

    apiMocks.getStoredAuth.mockReturnValue({
      token: 'token-client',
      role: 'client',
      clientId: '42',
      profile: { prenom: 'Jean', nom: 'Dupont', email: 'jean@example.com' },
    });
    apiMocks.getProfile.mockResolvedValue({ prenom: 'Jean', nom: 'Dupont', email: 'jean@example.com' });
    apiMocks.getClientProfile.mockResolvedValue({ client: { prenom: 'Jean', nom: 'Dupont', email: 'jean@example.com' } });
    apiMocks.getVehiculesClient.mockResolvedValue([]);
    apiMocks.getClientRendezVous.mockResolvedValue([]);
    apiMocks.getMarques.mockResolvedValue([
      {
        id_marque: 101,
        nom_marque: 'Renault',
        modeles: [
          { id_modele: 10, nom_modele: 'Clio' },
          { id_modele: 11, nom_modele: 'Megane' },
        ],
      },
      {
        id_marque: 201,
        nom_marque: 'Peugeot',
        modeles: [
          { id_modele: 20, nom_modele: '208' },
        ],
      },
    ]);
    apiMocks.getModelesByMarque.mockResolvedValue([
      { id_modele: 10, nom_modele: 'Clio' },
      { id_modele: 11, nom_modele: 'Megane' },
    ]);
  });

  it('recupere les modeles de la marque choisie dans le formulaire vehicule', async () => {
    render(
      <MemoryRouter>
        <ClientDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Ajouter un vehicule/i)).toBeInTheDocument();

    const selects = await screen.findAllByRole('combobox');
    const marqueSelects = selects.filter((select) => select.getAttribute('name') === 'id_marque');
    const modeleSelects = selects.filter((select) => select.getAttribute('name') === 'id_modele');
    const marqueSelect = marqueSelects[0];
    const modeleSelect = modeleSelects[0];

    expect(marqueSelects).toHaveLength(1);
    expect(modeleSelects).toHaveLength(1);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Renault' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Peugeot' })).toBeInTheDocument();
    });

    fireEvent.change(marqueSelect, { target: { value: '101' } });

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: 'Clio' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('option', { name: 'Megane' }).length).toBeGreaterThan(0);
    });

    fireEvent.change(modeleSelect, { target: { value: '11' } });
    expect(modeleSelect.value).toBe('11');
  });

  it('affiche marque et modele des vehicules du client depuis la base', async () => {
    apiMocks.getVehiculesClient.mockResolvedValue([
      {
        id_vehicule: 1,
        immatriculation: 'AA-123-AA',
        nom_marque: 'Renault',
        nom_modele: 'Clio',
        annee: '2020',
      },
    ]);

    render(
      <MemoryRouter>
        <ClientDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText('AA-123-AA')).toBeInTheDocument();
    expect(await screen.findByText(/Renault.*Clio/i)).toBeInTheDocument();
    expect(await screen.findByText(/Annee : 2020/i)).toBeInTheDocument();
  });
});
