// --- VALIDATION GARAGE ---
/**
 * Valide ou invalide un garage par son ID
 * @param {string} token - JWT d'authentification
 * @param {number|string} garageId - ID du garage à valider
 * @param {boolean} isValide - true pour valider, false pour invalider
 * @returns {Promise<any>} Résultat de la requête
 */
export async function validateGarage(token, garageId, isValide = true) {
    return apiFetch(`/api/v1/garages/${garageId}`, {
        method: "PATCH",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({ isValide }),
    });
}
// --- GARAGES ---
/**
 * Supprime un garage par son ID
 * @param {string} token - JWT d'authentification
 * @param {number|string} garageId - ID du garage à supprimer
 * @returns {Promise<any>} Résultat de la requête
 */
export async function deleteGarage(token, garageId) {
    return apiFetch(`/api/v1/garages/${garageId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
    });
}
// --- UTILISATEURS (ADMIN) ---
export async function deleteUser(token, userId) {
    return apiFetch(`/api/v1/users/${userId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
    });
}
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")
const AUTH_TOKEN_KEY = "auth_token"
const AUTH_ROLE_KEY = "auth_role"
const AUTH_REMEMBER_KEY = "auth_remember"

async function safeJson(response) {
    try {
        return await response.json()
    } catch {
        return null
    }
}

async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, options)
    const data = await safeJson(response)

    if (!response.ok) {
        const message = data?.message || data?.error || data?.erreur || "Requete API impossible"
        throw new Error(message)
    }

    return data
}

function buildAuthHeaders(token) {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    }
}

export function getStoredAuth() {
    const localToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const sessionToken = sessionStorage.getItem(AUTH_TOKEN_KEY)
    const token = localToken || sessionToken

    const localRole = localStorage.getItem(AUTH_ROLE_KEY)
    const sessionRole = sessionStorage.getItem(AUTH_ROLE_KEY)
    const role = localRole || sessionRole

    return { token, role }
}

export function setStoredAuth({ token, role, remember }) {
    const targetStorage = remember ? localStorage : sessionStorage
    const otherStorage = remember ? sessionStorage : localStorage

    targetStorage.setItem(AUTH_TOKEN_KEY, token)
    targetStorage.setItem(AUTH_ROLE_KEY, role)
    targetStorage.setItem(AUTH_REMEMBER_KEY, remember ? "1" : "0")

    otherStorage.removeItem(AUTH_TOKEN_KEY)
    otherStorage.removeItem(AUTH_ROLE_KEY)
    otherStorage.removeItem(AUTH_REMEMBER_KEY)
}

export function clearStoredAuth() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_ROLE_KEY)
    localStorage.removeItem(AUTH_REMEMBER_KEY)
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_ROLE_KEY)
    sessionStorage.removeItem(AUTH_REMEMBER_KEY)
}

export function isJwtExpired(token) {
    if (!token) return true

    try {
        const payloadBase64 = token.split(".")[1]
        if (!payloadBase64) return true

        const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/")
        const payload = JSON.parse(atob(normalized))
        const exp = payload?.exp

        if (!exp) return false

        return Date.now() >= exp * 1000
    } catch {
        return true
    }
}


export function getDefaultDashboardPath(role) {
    if (role === "superadmin") return "/dashboardSuperAdmin";
    if (role === "garage") return "/dashboardGarage";
    return "/dashboardClient";
}


function mapRolesToAppRole(roles) {
    if (!Array.isArray(roles)) {
        return "client";
    }
    if (roles.includes("ROLE_SUPER_ADMIN")) {
        return "superadmin";
    }
    if (roles.includes("ROLE_ADMIN")) {
        return "garage";
    }
    return "client";
}

export async function fetchConnectedUser(token) {
    return apiFetch("/api/v1/users/connecter", {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function loginUser({ email, password, otp = "", remember }) {
    const body = { email, mdp: password }
    if (otp) body.code = otp

    const response = await fetch(`${API_BASE_URL}/api/v1/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })

    const data = await safeJson(response)

    if (response.status === 202 && data?.requires2fa) {
        return { requires2fa: true }
    }

    if (!response.ok) {
        if (data?.requires2fa) return { requires2fa: true, error: data?.erreur }
        throw new Error(data?.erreur || data?.message || "Connexion impossible")
    }

    const token = data?.token || data?.access_token || data?.jwt
    if (!token) throw new Error("Token manquant dans la reponse")

    const connected = await fetchConnectedUser(token)
    const role = mapRolesToAppRole(connected?.roles)
    setStoredAuth({ token, role, remember })

    return { token, role, profile: connected }
}

export async function setup2fa(token) {
    return apiFetch("/api/v1/garages/2fa/setup", {
        method: "POST",
        headers: buildAuthHeaders(token),
    })
}

export async function verify2fa(token, code) {
    return apiFetch("/api/v1/garages/2fa/verify", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({ code }),
    })
}

export async function disable2fa(token, { mdp, code }) {
    return apiFetch("/api/v1/garages/2fa/disable", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({ mdp, code }),
    })
}

export async function get2faStatus(token) {
    return apiFetch("/api/v1/garages/2fa", {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function getProfile(token) {
    return apiFetch("/api/v1/users/connecter", {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function registerClient({ nom, prenom, email, mdp, tel, consentement }) {
    return apiFetch("/api/v1/users/inscrire_client", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            nom,
            prenom,
            email,
            mdp,
            tel,
            consentement,
        }),
    })
}

export async function registerGarage({ nom_garage, email, telephone, adresse, siret, tva, id_ville, mdp, img_garage = null, img_logo = null }) {
    return apiFetch("/api/v1/users/inscrire-garage", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            nom_garage,
            email,
            telephone,
            adresse,
            siret,
            tva,
            id_ville,
            mdp,
            img_garage,
            img_logo,
        }),
    })
}

async function tryFirst(paths, optionsBuilder) {
    let lastError = null

    for (const path of paths) {
        try {
            return await apiFetch(path, optionsBuilder(path))
        } catch (error) {
            lastError = error
        }
    }

    throw lastError || new Error("Aucun endpoint disponible")
}

function normalizeAppointments(raw) {
    const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw?.data)
            ? raw.data
            : []

    return list.map((item, index) => {
        const garage = item?.garage?.nom_garage || item?.garage_name || item?.garage || "Garage"
        const service = item?.service || item?.prestation || item?.title || "Intervention"
        const dateRaw = item?.date || item?.date_rdv || item?.appointment_date || item?.created_at || ""
        const status = item?.status || item?.etat || "En attente"

        let date = "Date non precisee"
        if (dateRaw) {
            const parsed = new Date(dateRaw)
            date = Number.isNaN(parsed.getTime()) ? String(dateRaw) : parsed.toLocaleString("fr-FR")
        }

        return {
            id: item?.id || index + 1,
            garage,
            service,
            date,
            status,
        }
    })
}

function normalizeStats(rawStats, appointments) {
    const source = rawStats?.data || rawStats || {}
    const pendingFromAppointments = appointments.filter((item) => String(item.status).toLowerCase().includes("attente")).length

    return [
        {
            label: "Rendez-vous a venir",
            value: source.upcoming_appointments ?? source.rendez_vous_a_venir ?? appointments.length,
            icon: "📅",
        },
        {
            label: "Demandes en attente",
            value: source.pending_requests ?? source.demandes_en_attente ?? pendingFromAppointments,
            icon: "⏳",
        },
        {
            label: "Interventions terminees",
            value: source.completed_services ?? source.interventions_terminees ?? 0,
            icon: "✅",
        },
        {
            label: "Garages favoris",
            value: source.favorite_garages ?? source.garages_favoris ?? 0,
            icon: "⭐",
        },
    ]
}

export async function getClientDashboard(token) {
    const authOptions = {
        method: "GET",
        headers: buildAuthHeaders(token),
    }

    // Récupère le profil utilisateur connecté
    const profileResult = await tryFirst(["/api/v1/users/connecter"], () => authOptions)

    // Récupère les rendez-vous du client (à adapter si besoin)
    // Ici, il faut probablement l'id du client, à récupérer dans le profil
    const clientId = profileResult?.id || profileResult?.data?.id || profileResult?.clientId || profileResult?.data?.clientId
    let appointmentsResult = []
    if (clientId) {
        appointmentsResult = await apiFetch(`/api/v1/client/vehicules/${clientId}`, authOptions)
    }

    // Pas de route stats dédiée, on laisse vide ou à adapter selon besoin
    const statsResult = {}

    const appointments = normalizeAppointments(appointmentsResult)
    const stats = normalizeStats(statsResult, appointments)

    const firstName = profileResult?.prenom || profileResult?.first_name || profileResult?.data?.prenom || ""
    const lastName = profileResult?.nom || profileResult?.last_name || profileResult?.data?.nom || ""
    const fullName = `${firstName} ${lastName}`.trim() || "Client"

    return {
        fullName,
        stats,
        appointments,
    }
}

// --- RENDEZ-VOUS ---
export async function getClientRendezVous(token, clientId) {
    return apiFetch(`/api/v1/client/rdvs?clientId=${clientId}`, {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function getGarageRendezVous(token, garageId) {
    return apiFetch(`/api/v1/garage/${garageId}/rdvs`, {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function createRendezVous(token, data) {
    return apiFetch("/api/v1/creer_rdv", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function updateRendezVous(token, data) {
    return apiFetch("/api/v1/modifier_rdv", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function deleteRendezVous(token, id) {
    return apiFetch(`/api/v1/rdv/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
    })
}

// --- PRESTATIONS ---
export async function getPrestations(token) {
    return apiFetch("/api/v1/get_prestations", {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function getPrestationsByGarage(token, garageId) {
    return apiFetch(`/api/v1/get_prestations_by_garage/${garageId}`, {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function addPrestationsGarage(token, garageId, prestations) {
    return apiFetch(`/api/v1/garage/${garageId}/add_prestations`, {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({ prestations }),
    })
}

export async function deletePrestationGarage(token, garageId, prestationId) {
    return apiFetch(`/api/v1/garage/${garageId}/delete_prestation/${prestationId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
    })
}

// --- AVIS ---
export async function getAvis(token, { garageId, clientId } = {}) {
    let url = "/api/v1/avis"
    const params = []
    if (garageId) params.push(`garageId=${garageId}`)
    if (clientId) params.push(`clientId=${clientId}`)
    if (params.length) url += `?${params.join("&")}`
    return apiFetch(url, {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function createAvis(token, data) {
    return apiFetch("/api/v1/avis", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function updateAvis(token, id, data) {
    return apiFetch(`/api/v1/avis/${id}`, {
        method: "PUT",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function deleteAvis(token, id) {
    return apiFetch(`/api/v1/avis/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
    })
}

// --- HISTORIQUES ---
export async function getHistoriques(token, rdvId) {
    let url = "/api/v1/historiques"
    if (rdvId) url += `?rdvId=${rdvId}`
    return apiFetch(url, {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function createHistorique(token, data) {
    return apiFetch("/api/v1/historiques", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

// --- VEHICULES ---
export async function getVehiculesClient(token, clientId) {
    return apiFetch(`/api/v1/client/vehicules/${clientId}`, {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function addVehicule(token, data) {
    return apiFetch("/api/v1/client/add_vehicule", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function updateVehicule(token, id, data) {
    return apiFetch(`/api/v1/client/update_vehicule/${id}`, {
        method: "PATCH",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function deleteVehicule(token, id) {
    return apiFetch(`/api/v1/client/delete_vehicule/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
    })
}

// --- NOTIFICATIONS ---
export async function sendNotification(token, data) {
    return apiFetch("/api/v1/status_notif/send", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function verifyOtpNotif(token, data) {
    return apiFetch("/api/v1/status_notif/verify-otp", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export { API_BASE_URL }