import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClientRegister from './ClientRegister';

const apiMocks = vi.hoisted(() => ({
  getFrenchAddressSuggestions: vi.fn(),
  getFrenchCitySuggestions: vi.fn(),
  getMarques: vi.fn(),
  getModelesByMarque: vi.fn(),
  registerClient: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  getFrenchAddressSuggestions: apiMocks.getFrenchAddressSuggestions,
  getFrenchCitySuggestions: apiMocks.getFrenchCitySuggestions,
  getMarques: apiMocks.getMarques,
  getModelesByMarque: apiMocks.getModelesByMarque,
  isValidEmailFormat: (value) => /@/.test(String(value || '')),
  isValidPhoneFormat: (value) => /^(?:\+33|0)[1-9]\d{8}$/.test(String(value || '').replace(/[\s().-]/g, '')),
  registerClient: apiMocks.registerClient,
}));

describe('ClientRegister', () => {
  beforeEach(() => {
    apiMocks.getFrenchAddressSuggestions.mockReset();
    apiMocks.getFrenchCitySuggestions.mockReset();
    apiMocks.getMarques.mockReset();
    apiMocks.getModelesByMarque.mockReset();
    apiMocks.registerClient.mockReset();

    apiMocks.getFrenchAddressSuggestions.mockResolvedValue([]);
    apiMocks.getFrenchCitySuggestions.mockResolvedValue([]);
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
    apiMocks.registerClient.mockResolvedValue({ ok: true });
  });

  it('charge les marques puis les modeles de la marque choisie', async () => {
    render(
      <MemoryRouter>
        <ClientRegister />
      </MemoryRouter>
    );

    const selects = await screen.findAllByRole('combobox');
    const brandSelect = selects.find((select) => select.getAttribute('name') === 'brandId');
    const modelSelect = selects.find((select) => select.getAttribute('name') === 'modelId');

    expect(brandSelect).toBeTruthy();
    expect(modelSelect).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Renault' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Peugeot' })).toBeInTheDocument();
    });

    fireEvent.change(brandSelect, { target: { value: '101' } });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Clio' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Megane' })).toBeInTheDocument();
    });

    fireEvent.change(modelSelect, { target: { value: '11' } });
    expect(modelSelect.value).toBe('11');
  });

  it('refuse un numero de telephone invalide lors de l inscription', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/client/register',
            state: {
              prefill: {
                firstName: 'Jean',
                lastName: 'Dupont',
                email: 'jean.dupont@example.com',
                phone: 'abc',
                city: 'Paris',
                postalCode: '75001',
                address: '1 rue de Rivoli',
                codeInsee: '75056',
              },
            },
          },
        ]}
      >
        <ClientRegister />
      </MemoryRouter>
    );

    const passwordInput = document.querySelector('input[name="password"]');
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]');

    expect(passwordInput).not.toBeNull();
    expect(confirmPasswordInput).not.toBeNull();

    fireEvent.change(passwordInput, { target: { value: 'secret123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /Creer mon compte/i }));

    expect(await screen.findByText(/Veuillez saisir un numero de telephone valide/i)).toBeInTheDocument();
    expect(apiMocks.registerClient).not.toHaveBeenCalled();
  });
});
