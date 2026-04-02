const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "")
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
        "Content-Type": "apilication/json",
        Authorization: `Bearer ${token}`,
    }
}

function buildJsonHeaders(token) {
    if (!token) {
        return {
            "Content-Type": "apilication/json",
        }
    }

    return buildAuthHeaders(token)
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

export async function get2faStatus(token) {
    return apiFetch("/api/v1/users/connecter", {
        method: "GET",
        headers: buildAuthHeaders(token),
    }).then((data) => {
        if (typeof data?.enabled === "boolean") return data
        return { enabled: Boolean(data?.is2fa) }
    })
}

export async function setup2fa(token, { email } = {}) {
    return apiFetch("/api/v1/users/activer_2fa", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({ email }),
    })
}

export async function verify2fa(token, code, { email } = {}) {
    return apiFetch("/api/v1/users/verify_2fa", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({ email, code }),
    })
}

export async function disable2fa(token, { email } = {}) {
    return apiFetch("/api/v1/users/desactiver_2fa", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({ email }),
    })
}

export async function getGarageProfile(token, { userId } = {}) {
    const suffix = userId ? `?userId=${encodeURIComponent(userId)}` : ""
    return apiFetch(`/api/v1/profil${suffix}`, {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function updateGarageProfile(token, data) {
    return apiFetch("/api/v1/profil", {
        method: "PATCH",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function deleteGarageProfile(token, data = {}) {
    return apiFetch("/api/v1/profil", {
        method: "DELETE",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function updateGarageHoraires(token, data) {
    return apiFetch("/api/v1/horaires/ouvertures-fermetures", {
        method: "PATCH",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function updateGaragePlanningSemaine(token, data) {
    return apiFetch("/api/v1/planning/semaine", {
        method: "PATCH",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function getGaragePlanningSemaine(token, { garageId, userId } = {}) {
    const params = new URLSearchParams()
    if (garageId) params.set("garageId", garageId)
    if (userId) params.set("userId", userId)
    const suffix = params.toString() ? `?${params.toString()}` : ""

    return apiFetch(`/api/v1/planning/semaine${suffix}`, {
        method: "GET",
        headers: buildJsonHeaders(token),
    })
}

export async function searchGarages({ ville, prestationId, onlyValidated } = {}) {
    const params = new URLSearchParams()
    if (ville) params.set("ville", ville)
    if (prestationId) params.set("prestationId", prestationId)
    if (typeof onlyValidated === "boolean") params.set("onlyValidated", String(onlyValidated))
    const suffix = params.toString() ? `?${params.toString()}` : ""

    return apiFetch(`/api/v1/garages/search${suffix}`, {
        method: "GET",
    })
}

export async function getPrestationsCatalogue() {
    return apiFetch("/api/v1/prestations/catalogue", {
        method: "GET",
    })
}

export async function getClientVehiculesMe(token) {
    return apiFetch("/api/v1/client/vehicules/me", {
        method: "GET",
        headers: buildJsonHeaders(token),
    })
}

export async function createClientRdv(token, data) {
    return apiFetch("/api/v1/creer_rdv", {
        method: "POST",
        headers: buildJsonHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function addGaragePrestation(token, data) {
    return apiFetch("/api/v1/prestations", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function deleteGaragePrestation(token, prestationId, data = {}) {
    return apiFetch(`/api/v1/prestations/${prestationId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function getGarageRdvList(token, garageId, { userId } = {}) {
    const params = new URLSearchParams()
    if (garageId) params.set("garageId", garageId)
    if (userId) params.set("userId", userId)
    const suffix = params.toString() ? `?${params.toString()}` : ""
    return apiFetch(`/api/v1/rdv${suffix}`, {
        method: "GET",
        headers: buildJsonHeaders(token),
    })
}

export async function getGarageRdvDetail(token, rdvId) {
    return apiFetch(`/api/v1/rdv/${rdvId}`, {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function getGarageRdvPrestations(token, rdvId) {
    return apiFetch(`/api/v1/rdv/${rdvId}/prestations`, {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function updateGarageRdvStatus(token, rdvId, data) {
    return apiFetch(`/api/v1/rdv/${rdvId}/gestion`, {
        method: "PATCH",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function addGarageRdvHistorique(token, rdvId, data) {
    return apiFetch(`/api/v1/rdv/${rdvId}/historique`, {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function createGarageRdv(token, data) {
    return apiFetch("/api/v1/rdv", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export async function changePassword(token, data) {
    return apiFetch("/api/v1/users/change-password", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(data),
    })
}

export default {
    getStoredAuth,
    setStoredAuth,
    clearStoredAuth,
    get2faStatus,
    setup2fa,
    verify2fa,
    disable2fa,
    getGarageProfile,
    updateGarageProfile,
    deleteGarageProfile,
    updateGarageHoraires,
    updateGaragePlanningSemaine,
    getGaragePlanningSemaine,
    searchGarages,
    getPrestationsCatalogue,
    getClientVehiculesMe,
    createClientRdv,
    addGaragePrestation,
    deleteGaragePrestation,
    getGarageRdvList,
    getGarageRdvDetail,
    getGarageRdvPrestations,
    updateGarageRdvStatus,
    addGarageRdvHistorique,
    createGarageRdv,
    changePassword,
}

export { API_BASE_URL }
