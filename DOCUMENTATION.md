# MecanoLib — Documentation du projet

Application web de prise de rendez-vous en ligne pour garages automobiles.

---

## Table des matières

1. [Architecture générale](#1-architecture-générale)
2. [Routage](#2-routage)
3. [Contexte global](#3-contexte-global--apcontextjsx)
4. [Données mockées](#4-données-mockées--datamockdatajs)
5. [Pages](#5-pages)
   - [Home](#51-home---page-daccueil)
   - [Booking](#52-booking---prise-de-rendez-vous)
   - [BookingConfirmation](#53-bookingconfirmation---confirmation)
   - [ClientLogin](#54-clientlogin---espace-client)
   - [AdminLogin](#55-adminlogin---super-admin)
   - [GarageLogin](#56-garagelogin---espace-garage)
   - [GarageDashboard](#57-garagedashboard---tableau-de-bord-garage)
6. [Composants](#6-composants)
   - [Navbar](#61-navbar)
   - [Footer](#62-footer)
   - [Button](#63-button)
   - [Card](#64-card)
   - [Input](#65-input)
   - [Modal](#66-modal)
   - [Logo](#67-logo)
   - [HeroCarousel](#68-herocarousel)
   - [ServiceCard](#69-servicecard)
   - [StatusBadge](#610-statusbadge)
   - [TimeSlot](#611-timeslot)
7. [Points d'attention](#7-points-dattention)

---

## 1. Architecture générale

```
AppProvider (AppContext)
  └── BrowserRouter
        └── AnimatedRoutes (AnimatePresence — transitions de page)
              ├── MainLayout  →  Navbar + <page> + Footer
              └── CleanLayout →  <page> seule (sans Navbar/Footer)
```

**Stack technique :**
| Outil | Version | Rôle |
|---|---|---|
| React | 19.2 | UI |
| Vite | 8.0 | Build / Dev server |
| React Router | 7.13 | Routage |
| Framer Motion | 12.38 | Animations |
| Tailwind CSS | 3.4 | Styles utilitaires |
| lucide-react | 1.7 | Icônes |
| clsx + tailwind-merge | — | Fusion de classes CSS |

---

## 2. Routage

Déclaré dans `src/App.jsx`.

| Route | Page | Layout | Description |
|---|---|---|---|
| `/` | `Home` | MainLayout | Page d'accueil marketing |
| `/booking` | `Booking` | MainLayout | Formulaire de prise de RDV (4 étapes) |
| `/booking/confirmation` | `BookingConfirmation` | MainLayout | Confirmation après réservation |
| `/client` | `ClientLogin` | MainLayout | Connexion espace client (stub) |
| `/admin` | `AdminLogin` | CleanLayout | Connexion super-administrateur |
| `/garage` | `GarageLogin` | CleanLayout | Connexion garage partenaire |
| `/garage/dashboard` | `GarageDashboard` | CleanLayout | Dashboard de gestion du garage |

---

## 3. Contexte global — `AppContext.jsx`

Fichier : `src/context/AppContext.jsx`

Source de vérité de l'application. Enveloppe toute l'app via `<AppProvider>`.  
Hook d'accès : `useApp()` (erreur si utilisé hors du Provider).

### État géré

| Variable | Type | Description |
|---|---|---|
| `appointments` | Array | Liste des RDV — initialisée depuis `mockData.appointments` |
| `bookingState` | Object | `{ step, service, date, time, clientInfo }` — état du tunnel de réservation |
| `garageAuth` | Object | `{ isAuthenticated: bool, user: object }` |

### Fonctions exposées

| Fonction | Description |
|---|---|
| `resetBooking()` | Réinitialise `bookingState` à l'étape 1 |
| `updateBookingStep(step, data)` | Fusionne des données dans `bookingState` |
| `createAppointment(data)` | Crée un RDV avec ID auto (`RDV-001`, `RDV-002`…), statut `pending`, timestamp actuel |
| `updateAppointmentStatus(id, status)` | Met à jour le statut d'un RDV existant par son ID |
| `loginGarage({ email, password })` | Auth garage — retourne `true`/`false` |
| `logoutGarage()` | Déconnecte le garage |

### Données statiques aussi exposées

`services`, `garageInfo`, `garageStats` — importées depuis `mockData.js`.

---

## 4. Données mockées — `data/mockData.js`

Fichier : `src/data/mockData.js`

Simule un backend. Tous les exports sont des tableaux/objets JavaScript statiques.

| Export | Contenu |
|---|---|
| `services` | 8 prestations avec `id`, `name`, `description`, `duration` (min), `price` (€), `category`, `icon`, `image`, `prerequisites` |
| `serviceCategories` | 5 catégories de filtre : all, entretien, reparation, diagnostic, autre |
| `timeSlots` | Créneaux pour 2 dates fixes (08:00 → 17:30) avec `{ time, available }` |
| `appointments` | 5 RDV d'exemple avec statuts variés (confirmed, pending, completed, cancelled) |
| `garageStats` | Statistiques du garage : total RDV, taux no-show, note moyenne, etc. |
| `garageHours` | Horaires d'ouverture lun–sam (sam matin seulement), dimanche fermé |
| `garageInfo` | Nom, adresse, téléphone, email, SIRET du "Garage Auto Pro" |

---

## 5. Pages

### 5.1 Home — Page d'accueil

Fichier : `src/pages/Home/Home.jsx`  
Route : `/`  
Layout : MainLayout

Page marketing sans état. Données entièrement en dur.

**Sections dans l'ordre :**
1. **Hero** — `HeroCarousel` plein écran (3 slides avec images locales `/images/hero-1.jpg`, `-2`, `-3`) + indicateur de scroll animé
2. **Avantages** — 6 cartes (Réservation 24/7, Gain de temps, Rappels, Sécurité, Mobile, Prestations) avec animation en cascade
3. **Comment ça marche** — 4 étapes numérotées 01→04 avec animations au scroll
4. **Statistiques** — 4 compteurs (10 000+ RDV, 150+ garages, 98% satisfaction, -40% no-show)
5. **Témoignages** — 3 avis clients avec notation étoiles
6. **CTA final** — Bouton vers `/booking`

**Composants utilisés :** `Button`, `HeroCarousel`

---

### 5.2 Booking — Prise de rendez-vous

Fichier : `src/pages/Booking/Booking.jsx`  
Route : `/booking`  
Layout : MainLayout

Formulaire multi-étapes en 4 étapes avec barre de progression.

#### Étapes

| Étape | Contenu |
|---|---|
| 1 — Prestation | Menu de 5 catégories (hover) → liste de prestations avec animation stagger |
| 2 — Garage | Recherche par ville via Nominatim + Overpass API OSM (rayon 10 km, max 20 résultats) |
| 3 — Date & Heure | 14 prochains jours générés dynamiquement + créneaux simulés (Math.random) |
| 4 — Vos infos | Formulaire client (prénom, nom, email, tél.) + véhicule (immat, marque, modèle, année) + notes |

#### Les 5 catégories de prestations

- Pneumatique & tenue de route
- Freinage & sécurité
- Mécanique & diagnostics
- Entretien & révision
- Électrique & Hybride

#### État (useState)

| Variable | Description |
|---|---|
| `step` (1–4) | Étape courante |
| `selectedCategory` | Catégorie sélectionnée |
| `hoveredCategory` | Catégorie survolée (pour l'affichage du panneau prestations) |
| `selectedService` | `{ id, name, duration, category }` |
| `selectedDate` | Date ISO choisie |
| `selectedTime` | Heure choisie |
| `formData` | Infos client et véhicule |
| `city` | Ville saisie pour la recherche garage |
| `garages` | Résultats API Overpass |
| `selectedGarage` | Garage retenu |
| `garageLoading` / `garageError` | États de la requête |
| `isSubmitting` | Bool de soumission finale |

#### Soumission

`handleSubmit()` appelle `createAppointment()` (contexte), attend 1,5 s, puis redirige vers `/booking/confirmation` avec `{ state: { appointment } }`.

**Composants utilisés :** `Button`, `Input`, `TimeSlot`, `Card`, `CardContent`

---

### 5.3 BookingConfirmation — Confirmation

Fichier : `src/pages/BookingConfirmation/BookingConfirmation.jsx`  
Route : `/booking/confirmation`  
Layout : MainLayout

Reçoit `appointment` depuis `location.state` (passé par `navigate`).  
Si absent → écran d'erreur avec lien vers `/booking`.

**Sections :**
- Header animé avec icône `CheckCircle` (spring Framer Motion)
- Carte récapitulatif : ID RDV, prestation, date, heure, client, véhicule
- Instructions "Et maintenant ?" (email + WhatsApp automatique)
- Boutons : Retour accueil, Nouveau RDV, Imprimer (`window.print()`), Partager sur WhatsApp

**Composants utilisés :** `Button`, `Card`, `CardContent`

---

### 5.4 ClientLogin — Espace Client

Fichier : `src/pages/ClientLogin/ClientLogin.jsx`  
Route : `/client`  
Layout : MainLayout

> **Statut : stub — authentification non implémentée**

Affiche toujours le message : *"Connexion client non encore disponible. Prenez un RDV directement."*

**Sections :**
- Gauche : branding bleu avec 3 fonctionnalités (Suivi RDV, Historique, Rappels)
- Droite : formulaire email + mot de passe + lien "Mot de passe oublié ?" + bouton "Prendre un rendez-vous"

**Composants utilisés :** `Button`, `Input`, `Card`, `CardContent`

---

### 5.5 AdminLogin — Super Admin

Fichier : `src/pages/AdminLogin/AdminLogin.jsx`  
Route : `/admin`  
Layout : CleanLayout

Accès réservé aux administrateurs MecanoLib. Design sombre.

**Identifiants hardcodés :**
- Email : `admin@mecanolib.fr`
- Mot de passe : `Admin@2026`
- Redirige vers `/admin/dashboard` (route à créer)

**Composants utilisés :** `Card`, `CardContent`

> ⚠️ Les credentials sont en clair côté client — à remplacer par une vraie API en production.

---

### 5.6 GarageLogin — Espace Garage

Fichier : `src/pages/GarageLogin/GarageLogin.jsx`  
Route : `/garage`  
Layout : CleanLayout

Connexion pour les garages partenaires. Si déjà connecté, redirige automatiquement vers `/garage/dashboard`.

**Identifiants (via contexte AppContext) :**
- Email : `garage@mecanolib.fr`
- Mot de passe : `password`

**Sections :** Layout deux colonnes — branding pro à gauche, formulaire à droite.

**Composants utilisés :** `Button`, `Input`, `Card`, `CardContent`

---

### 5.7 GarageDashboard — Tableau de bord garage

Fichier : `src/pages/GarageDashboard/GarageDashboard.jsx`  
Route : `/garage/dashboard`  
Layout : CleanLayout

Interface complète de gestion pour le garage connecté. Redirige vers `/garage` si non authentifié.

**Navigation par onglets (`activeTab`) :**

| Onglet | Contenu |
|---|---|
| `appointments` | Statistiques + liste filtrables des RDV avec actions |
| `calendar` | Vue agenda jour par jour (08h–17h30), navigation ±1 jour |
| `clients` | Non implémenté |
| `settings` | Non implémenté |

**État (useState) :**

| Variable | Description |
|---|---|
| `activeTab` | Onglet actif |
| `statusFilter` | Filtre statut (`all`, `pending`, `confirmed`…) |
| `searchQuery` | Recherche texte (nom, email, immat, ID) |
| `selectedAppointment` | RDV ouvert dans la modale de détail |
| `isDetailModalOpen` | Visibilité de la modale |
| `currentDate` | Date affichée dans l'agenda |

**Logique clé :**
- `filteredAppointments` calculé avec `useMemo`
- `handleStatusChange()` appelle `updateAppointmentStatus()` (contexte) et met à jour la modale en temps réel
- 4 cartes de stats : RDV du jour, En attente, Confirmés, Total clients

**Composants utilisés :** `Button`, `Input`, `Card`, `CardContent`, `StatusBadge`, `Modal`

---

## 6. Composants

Tous les composants sont exportés depuis `src/components/index.js`.

---

### 6.1 Navbar

Fichier : `src/components/Navbar/Navbar.jsx`  
Présent dans : `MainLayout` (toutes les pages publiques)

Barre de navigation fixe en haut. Toujours visible avec fond blanc semi-transparent + blur.

**Liens de navigation :**
| Label | Route |
|---|---|
| Accueil | `/` |
| Prendre RDV | `/booking` |
| Espace Client | `/client` |
| Espace Garage | `/garage` |

**Bouton CTA :** "Connexion" → `/admin` (style sombre)

**Comportement :**
- Devient légèrement plus opaque au scroll (> 20 px) via classe `navbar-scrolled`
- Lien actif mis en évidence via `useLocation()`
- Menu hamburger sur mobile avec fermeture automatique au clic d'un lien

---

### 6.2 Footer

Fichier : `src/components/Footer/Footer.jsx`  
Présent dans : `MainLayout`

Pied de page statique. Aucune prop.

**Colonnes :** Produit, Entreprise, Légal, Contacts  
**Icônes sociales :** Facebook, Instagram, Twitter, LinkedIn (SVG inline)  
**Année dynamique :** `new Date().getFullYear()`

---

### 6.3 Button

Fichier : `src/components/Button/Button.jsx`

Bouton réutilisable générique. Utilise `React.forwardRef`.

| Prop | Type | Défaut | Valeurs possibles |
|---|---|---|---|
| `variant` | string | `'default'` | `default`, `primary`, `secondary`, `outline`, `ghost`, `danger`, `success` |
| `size` | string | `'default'` | `default`, `sm`, `lg`, `icon` |
| `loading` | bool | `false` | Affiche un spinner, désactive le bouton |
| `disabled` | bool | `false` | Désactive le bouton |
| `className` | string | `''` | Classes CSS additionnelles |

---

### 6.4 Card

Fichier : `src/components/Card/Card.jsx`

Conteneur carte avec sous-composants composables. Tous utilisent `React.forwardRef`.

**Exports disponibles :** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`

| Prop de `Card` | Type | Description |
|---|---|---|
| `hover` | bool | Ajoute un effet hover (élévation) |
| `clickable` | bool | Rend la carte cliquable (curseur pointer) |
| `onClick` | func | Callback de clic |
| `className` | string | Classes additionnelles |

---

### 6.5 Input

Fichier : `src/components/Input/Input.jsx`

Champ de formulaire avec label intégré. Utilise `React.forwardRef`.

| Prop | Type | Description |
|---|---|---|
| `label` | string | Label affiché au-dessus du champ |
| `error` | string | Message d'erreur rouge (priorité sur `helperText`) |
| `helperText` | string | Texte d'aide gris en dessous |
| `icon` | component | Icône Lucide à gauche du champ |
| `required` | bool | Affiche un `*` rouge dans le label |
| `type` | string | Type HTML de l'input (défaut : `'text'`) |

---

### 6.6 Modal

Fichier : `src/components/Modal/Modal.jsx`

Fenêtre modale générique avec backdrop.

| Prop | Type | Description |
|---|---|---|
| `isOpen` | bool | Contrôle l'affichage |
| `onClose` | func | Callback de fermeture |
| `title` | string | Titre du header |
| `description` | string | Sous-titre optionnel |
| `children` | node | Contenu principal |
| `footer` | node | Contenu du bas de modale |
| `size` | string | `sm`, `md`, `lg`, `xl`, `full` |

**Comportements :**
- Bloque le scroll de la page quand ouverte (`document.body.style.overflow`)
- Clic sur le backdrop → fermeture (clic sur la modale elle-même ignoré)
- Retourne `null` si `isOpen === false`

---

### 6.7 Logo

Fichier : `src/components/Logo/Logo.jsx`

Logo animé avec deux engrenages rotatifs (Framer Motion).

| Prop | Défaut | Description |
|---|---|---|
| `size` | `'medium'` | `small` (40px), `medium` (56px), `large` (80px), `xl` (120px) |
| `animated` | `true` | Active/désactive les animations |
| `className` | `''` | Classes additionnelles |

**Animations :**
- Engrenage externe : rotation 360° en 8 s infini
- Engrenage interne : rotation -360° en 6 s infini
- Pulse de l'icône centrale : scale + opacité oscillants en 2 s
- Hover : agrandissement scale 1.05

> **Note :** Ce composant existe mais n'est pas utilisé dans la Navbar (qui utilise une icône `Wrench` de lucide-react à la place).

---

### 6.8 HeroCarousel

Fichier : `src/components/HeroCarousel/HeroCarousel.jsx`  
Utilisé dans : `Home`

Carrousel fullscreen animé pour la section hero.

| Prop | Défaut | Description |
|---|---|---|
| `images` | `[]` | Tableau de slides `{ src, badge, title, subtitle, cta: { text, link } }` |
| `autoPlay` | `true` | Défilement automatique |
| `interval` | `5000` | Intervalle entre slides (ms) |
| `showIndicators` | `true` | Affiche les points de pagination |
| `showArrows` | `true` | Affiche les flèches précédent/suivant |
| `overlay` | `true` | Overlay sombre sur l'image de fond |

**Fonctionnement :**
- Pause automatique au hover (`onMouseEnter` / `onMouseLeave`)
- Transition `spring` horizontale avec scale via `AnimatePresence`
- Textes (badge, titre, sous-titre, CTA) animés avec délai progressif
- Barre de progression animée en bas pendant l'auto-play
- `paginate()` mémorisée avec `useCallback`

---

### 6.9 ServiceCard

Fichier : `src/components/ServiceCard/ServiceCard.jsx`  
Utilisé dans : `Booking` (anciennement, désormais remplacé par le système catégories/prestations)

Carte de sélection d'une prestation de service.

| Prop | Description |
|---|---|
| `icon` | Composant icône Lucide |
| `title` | Nom de la prestation |
| `description` | Description courte |
| `duration` | Durée en minutes |
| `price` | Prix indicatif en € |
| `selected` | Bool — style surligné si sélectionné |
| `onClick` | Callback de sélection |

---

### 6.10 StatusBadge

Fichier : `src/components/StatusBadge/StatusBadge.jsx`  
Utilisé dans : `GarageDashboard`

Badge coloré indiquant le statut d'un rendez-vous.

| Prop | Défaut | Description |
|---|---|---|
| `status` | — | Clé du statut (voir tableau ci-dessous) |
| `showIcon` | `true` | Afficher/masquer l'icône |
| `className` | — | Classes additionnelles |

**Statuts supportés :**

| Statut | Libellé affiché | Couleur |
|---|---|---|
| `pending` | En attente | Orange (warning) |
| `confirmed` | Confirmé | Vert (success) |
| `refused` | Refusé | Rouge (danger) |
| `cancelled_client` | Annulé (client) | Gris (neutral) |
| `cancelled_garage` | Annulé (garage) | Gris (neutral) |
| `completed` | Terminé | Bleu (primary) |
| `no_show` | No-show | Rouge (danger) |

---

### 6.11 TimeSlot

Fichier : `src/components/TimeSlot/TimeSlot.jsx`  
Utilisé dans : `Booking` (étape 3)

Bouton de sélection d'un créneau horaire.

| Prop | Défaut | Description |
|---|---|---|
| `time` | — | Heure affichée (ex. `"09:30"`) |
| `available` | `true` | Si `false` → affichage grisé non cliquable |
| `selected` | `false` | Style actif + icône `Check` |
| `onClick` | — | Callback de sélection |

**Rendu conditionnel :** `<div>` non-interactif si indisponible, `<button>` cliquable sinon.

---

## 7. Points d'attention

| # | Sujet | Description |
|---|---|---|
| 1 | **Route manquante** | `/admin/dashboard` est référencée dans `AdminLogin.jsx` après connexion réussie, mais cette route n'est pas déclarée dans `App.jsx`. |
| 2 | **Auth côté client** | Les identifiants Admin (`admin@mecanolib.fr` / `Admin@2026`) et Garage (`garage@mecanolib.fr` / `password`) sont en clair dans le code. À remplacer par une vraie API en production. |
| 3 | **Espace Client stub** | La page `/client` est un formulaire vide qui retourne toujours une erreur — aucune auth client implémentée. |
| 4 | **Créneaux aléatoires** | À l'étape 3 du Booking, les créneaux disponibles sont générés avec `Math.random()`, non liés aux données du garage. |
| 5 | **API externes** | La recherche de garages (étape 2) utilise les APIs gratuites Nominatim et Overpass (OpenStreetMap). Aucune clé API requise, mais les requêtes sont soumises aux limites de débit d'OSM. |
| 6 | **Onglets non implémentés** | Dans `GarageDashboard`, les onglets "Clients" et "Paramètres" existent dans le menu mais n'ont pas de contenu. |
