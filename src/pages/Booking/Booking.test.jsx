import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Booking from './Booking';

const updateBookingStep = vi.fn();
const createAppointment = vi.fn();
const createRendezVousMock = vi.hoisted(() => vi.fn());
const apiMocks = vi.hoisted(() => ({
  getAssociations: vi.fn(),
  getCategories: vi.fn(),
  getFrenchCitySuggestions: vi.fn(),
  getGarageRendezVous: vi.fn(),
  getGaragesByVille: vi.fn(),
  getModeles: vi.fn(),
  getPrestationsByCategorie: vi.fn(),
  getStoredAuth: vi.fn(),
  getVehiculesClient: vi.fn(),
  getVilles: vi.fn(),
}));

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    createAppointment,
    updateBookingStep,
    appointments: [],
  }),
}));

vi.mock('../../services/api', () => ({
  createRendezVous: createRendezVousMock,
  getAssociations: apiMocks.getAssociations,
  getCategories: apiMocks.getCategories,
  getFrenchCitySuggestions: apiMocks.getFrenchCitySuggestions,
  getGarageRendezVous: apiMocks.getGarageRendezVous,
  getGaragesByVille: apiMocks.getGaragesByVille,
  getModeles: apiMocks.getModeles,
  getPrestationsByCategorie: apiMocks.getPrestationsByCategorie,
  getStoredAuth: apiMocks.getStoredAuth,
  getVehiculesClient: apiMocks.getVehiculesClient,
  getVilles: apiMocks.getVilles,
  isJwtExpired: vi.fn().mockReturnValue(false),
  isValidEmailFormat: (value) => /@/.test(String(value || '')),
  normalizeClientProfile: (profile) => ({
    prenom: profile?.client?.prenom || profile?.prenom || profile?.utilisateur?.prenom || '',
    nom: profile?.client?.nom || profile?.nom || profile?.utilisateur?.nom || '',
    email:
      profile?.client?.email ||
      profile?.user?.email ||
      profile?.utilisateur?.email ||
      profile?.utilisateur?.emailUtilisateur ||
      profile?.email ||
      '',
    telephone:
      profile?.client?.telephone ||
      profile?.user?.telephone ||
      profile?.utilisateur?.telephone ||
      profile?.telephone ||
      profile?.tel ||
      '',
  }),
}));

describe('Booking', () => {
  beforeEach(() => {
    updateBookingStep.mockClear();
    createAppointment.mockClear();
    createRendezVousMock.mockReset();
    apiMocks.getAssociations.mockReset();
    apiMocks.getCategories.mockReset();
    apiMocks.getFrenchCitySuggestions.mockReset();
    apiMocks.getGarageRendezVous.mockReset();
    apiMocks.getGaragesByVille.mockReset();
    apiMocks.getPrestationsByCategorie.mockReset();
    apiMocks.getStoredAuth.mockReset();
    apiMocks.getVehiculesClient.mockReset();
    apiMocks.getModeles.mockReset();
    apiMocks.getVilles.mockReset();

    apiMocks.getAssociations.mockResolvedValue([]);
    apiMocks.getCategories.mockResolvedValue([
      { id_categorie: 1, nom_categorie: 'Moteur' },
    ]);
    apiMocks.getFrenchCitySuggestions.mockResolvedValue([]);
    apiMocks.getGarageRendezVous.mockResolvedValue([]);
    apiMocks.getGaragesByVille.mockResolvedValue({ garages: [] });
    apiMocks.getPrestationsByCategorie.mockResolvedValue([
      { id_prestation: 85, nom_prestation: 'Diagnostic moteur' },
    ]);
    apiMocks.getStoredAuth.mockReturnValue({ token: '', clientId: '', role: '', profile: null });
    apiMocks.getVehiculesClient.mockResolvedValue([]);
    createRendezVousMock.mockResolvedValue({ id_rdv: 123 });
    apiMocks.getModeles.mockResolvedValue([
      { id_modele: 20, nom_modele: '208' },
    ]);
    apiMocks.getVilles.mockResolvedValue([]);
    window.localStorage.clear();
  });

  it('permet de confirmer une prestation et passer à l’étape garage', async () => {
    render(
      <MemoryRouter>
        <Booking />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Choisissez votre catégorie et votre prestation/i)).toBeInTheDocument();

    const categorySelect = await screen.findByLabelText(/Catégorie/i);
    fireEvent.change(categorySelect, { target: { value: '1' } });

    const prestationSelect = await screen.findByLabelText(/Prestation/i);
    fireEvent.change(prestationSelect, { target: { value: '85' } });

    const continueButton = await screen.findByRole('button', { name: /Continuer vers les garages/i });
    fireEvent.click(continueButton);

    expect(await screen.findByText(/Choisissez votre garage/i)).toBeInTheDocument();
    expect(updateBookingStep).toHaveBeenCalledWith(
      2,
      expect.objectContaining({
        service: expect.objectContaining({
          name: expect.any(String),
        }),
      })
    );
  });

  it('garde la catégorie stable même après le chargement différé du backend', async () => {
    apiMocks.getCategories.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([{ id_categorie: 99, nom_categorie: 'Freinage' }]), 50))
    );
    apiMocks.getPrestationsByCategorie.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([{ id_prestation: 199, nom_prestation: 'Plaquettes' }]), 50))
    );

    render(
      <MemoryRouter>
        <Booking />
      </MemoryRouter>
    );

    const categorySelect = await screen.findByLabelText(/Catégorie/i);
    fireEvent.change(categorySelect, { target: { value: 'reparation' } });

    expect(categorySelect.value).toBe('reparation');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 140));
    });

    expect(categorySelect.value).toBe('reparation');
  });

  it('affiche le catalogue local si l’API catégories est injoignable', async () => {
    apiMocks.getCategories.mockRejectedValue(new Error('API injoignable (/api/v1/get_categories).'));
    apiMocks.getPrestationsByCategorie.mockRejectedValue(new Error('API injoignable'));

    render(
      <MemoryRouter>
        <Booking />
      </MemoryRouter>
    );

    const categorySelect = await screen.findByLabelText(/Catégorie/i);
    expect(categorySelect).toBeInTheDocument();
    expect(screen.queryByText(/API injoignable/i)).not.toBeInTheDocument();
  });

  it('affiche aussi les catégories backend sans prestation', async () => {
    apiMocks.getCategories.mockResolvedValue([
      { id_categorie: 1, nom_categorie: 'Moteur' },
      { id_categorie: 2, nom_categorie: 'Suspension' },
    ]);
    apiMocks.getPrestationsByCategorie.mockImplementation((categoryId) => (
      String(categoryId) === '1'
        ? Promise.resolve([{ id_prestation: 85, nom_prestation: 'Diagnostic moteur' }])
        : Promise.resolve([])
    ));

    render(
      <MemoryRouter>
        <Booking />
      </MemoryRouter>
    );

    expect(await screen.findByRole('option', { name: 'Moteur' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Suspension' })).toBeInTheDocument();
  });

  it('affiche toutes les voitures du client et lui laisse choisir une voiture avant confirmation', async () => {
    const selectedDate = new Date().toISOString().split('T')[0];

    apiMocks.getStoredAuth.mockReturnValue({
      token: 'token-client',
      clientId: '42',
      role: 'client',
      profile: { prenom: 'Jean', nom: 'Dupont' },
    });
    apiMocks.getModeles.mockResolvedValue([
      { idmodele: 20, nommodele: '208' },
    ]);
    apiMocks.getVehiculesClient.mockResolvedValue([
      {
        id_vehicule: 1,
        immatriculation: 'AA-123-AA',
        marque: { nom_marque: 'Renault', modele: { nom_modele: 'Clio' } },
        annee: '2020',
      },
      {
        id_vehicule: 2,
        immatriculation: 'BB-456-BB',
        modele: 20,
        idmodele: 20,
        marque: {
          nom_marque: 'Peugeot',
        },
        annee: '2022',
      },
    ]);

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/booking',
            state: {
              restoreBooking: {
                step: 4,
                selectedCategory: '1',
                selectedService: {
                  id: '85',
                  name: 'Diagnostic moteur',
                  duration: 30,
                  category: '1',
                },
                selectedGarage: {
                  id: 12,
                  name: 'Garage Test',
                },
                selectedDate,
                selectedTime: '08:00',
                formData: {
                  firstName: 'Jean',
                  lastName: 'Dupont',
                  plate: '',
                  brand: '',
                  model: '',
                  year: '',
                  notes: '',
                },
              },
            },
          },
        ]}
      >
        <Booking />
      </MemoryRouter>
    );

    const immatriculationField = await screen.findByLabelText(/Immatriculation/i);
    expect(immatriculationField.tagName).toBe('SELECT');
    expect(immatriculationField.value).toBe('');
    expect(await screen.findByRole('option', { name: 'AA-123-AA' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'BB-456-BB' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Année/i)).not.toBeInTheDocument();

    fireEvent.change(immatriculationField, { target: { value: '2' } });
    expect(immatriculationField.value).toBe('2');
    expect(screen.queryByLabelText(/Marque/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Modèle/i)).not.toBeInTheDocument();
  });

  it('utilise l email du client connecte lors de la confirmation si le champ email est vide', async () => {
    const selectedDate = new Date().toISOString().split('T')[0];

    apiMocks.getStoredAuth.mockReturnValue({
      token: 'token-client',
      clientId: '42',
      role: 'client',
      profile: {
        client: { prenom: 'Jean', nom: 'Dupont' },
        user: { email: 'jean.dupont@example.com', telephone: '0601020304' },
      },
    });
    apiMocks.getVehiculesClient.mockResolvedValue([
      {
        id_vehicule: 2,
        immatriculation: 'BB-456-BB',
        marque: { nom_marque: 'Peugeot' },
        annee: '2022',
      },
    ]);

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/booking',
            state: {
              restoreBooking: {
                step: 4,
                selectedCategory: '1',
                selectedService: {
                  id: '85',
                  name: 'Diagnostic moteur',
                  duration: 30,
                  category: '1',
                },
                selectedGarage: {
                  id: 12,
                  name: 'Garage Test',
                },
                selectedDate,
                selectedTime: '08:00',
                selectedVehicleId: '2',
                formData: {
                  firstName: 'Jean',
                  lastName: 'Dupont',
                  email: '',
                  phone: '',
                  plate: '',
                  brand: '',
                  model: '',
                  year: '',
                  notes: '',
                },
              },
            },
          },
        ]}
      >
        <Booking />
      </MemoryRouter>
    );

    const confirmButton = await screen.findByRole('button', { name: /Confirmer ma demande/i });

    await act(async () => {
      fireEvent.click(confirmButton);
      await new Promise((resolve) => setTimeout(resolve, 900));
    });

    expect(screen.queryByText(/Merci de saisir une adresse email valide/i)).not.toBeInTheDocument();
    expect(createRendezVousMock).toHaveBeenCalledWith(
      'token-client',
      expect.objectContaining({
        id_status_rdv: 1,
      })
    );
    expect(createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        client: expect.objectContaining({
          email: 'jean.dupont@example.com',
        }),
      })
    );
  });

  it('affiche un message client plus clair si le statut en attente est introuvable en base', async () => {
    const selectedDate = new Date().toISOString().split('T')[0];

    createRendezVousMock.mockRejectedValueOnce(new Error('Statut "En attente" introuvable en base'));
    apiMocks.getStoredAuth.mockReturnValue({
      token: 'token-client',
      clientId: '42',
      role: 'client',
      profile: {
        client: { prenom: 'Jean', nom: 'Dupont' },
        user: { email: 'jean.dupont@example.com', telephone: '0601020304' },
      },
    });
    apiMocks.getVehiculesClient.mockResolvedValue([
      {
        id_vehicule: 2,
        immatriculation: 'BB-456-BB',
        marque: { nom_marque: 'Peugeot' },
        annee: '2022',
      },
    ]);

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/booking',
            state: {
              restoreBooking: {
                step: 4,
                selectedCategory: '1',
                selectedService: {
                  id: '85',
                  name: 'Diagnostic moteur',
                  duration: 30,
                  category: '1',
                },
                selectedGarage: {
                  id: 12,
                  name: 'Garage Test',
                },
                selectedDate,
                selectedTime: '08:00',
                selectedVehicleId: '2',
                formData: {
                  firstName: 'Jean',
                  lastName: 'Dupont',
                  email: '',
                  phone: '',
                  plate: '',
                  brand: '',
                  model: '',
                  year: '',
                  notes: '',
                },
              },
            },
          },
        ]}
      >
        <Booking />
      </MemoryRouter>
    );

    const confirmButton = await screen.findByRole('button', { name: /Confirmer ma demande/i });

    await act(async () => {
      fireEvent.click(confirmButton);
      await new Promise((resolve) => setTimeout(resolve, 900));
    });

    expect(screen.queryByText(/Statut\s+"En attente"\s+introuvable\s+en\s+base/i)).not.toBeInTheDocument();
    expect(await screen.findByText(/Votre demande de rendez-vous ne peut pas être finalisée pour le moment/i)).toBeInTheDocument();
  });

  it('demande une connexion ou une creation de compte avant la fin de la reservation', async () => {
    const selectedDate = new Date().toISOString().split('T')[0];

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/booking',
            state: {
              restoreBooking: {
                step: 4,
                selectedCategory: '1',
                selectedService: {
                  id: '85',
                  name: 'Diagnostic moteur',
                  duration: 30,
                  category: '1',
                },
                selectedGarage: {
                  id: 12,
                  name: 'Garage Test',
                },
                selectedDate,
                selectedTime: '08:00',
                formData: {
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  plate: '',
                  brand: '',
                  model: '',
                  year: '',
                  notes: '',
                },
              },
            },
          },
        ]}
      >
        <Booking />
      </MemoryRouter>
    );

    expect(await screen.findByText(/connectez-vous ou creez un compte/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmer ma demande/i })).toBeDisabled();
  });
});
