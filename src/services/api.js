const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "")
const AUTH_TOKEN_KEY = "auth_token"
const AUTH_ROLE_KEY = "auth_role"
const AUTH_REMEMBER_KEY = "auth_remember"
const LEGACY_TOKEN_KEY = "token"

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

function buildJsonHeaders(token) {
    if (!token) {
        return {
            "Content-Type": "application/json",
        }
    }

    return buildAuthHeaders(token)
}

export function getStoredAuth() {
    const localToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const sessionToken = sessionStorage.getItem(AUTH_TOKEN_KEY)
    const legacyLocalToken = localStorage.getItem(LEGACY_TOKEN_KEY)
    const legacySessionToken = sessionStorage.getItem(LEGACY_TOKEN_KEY)
    const token = localToken || sessionToken || legacyLocalToken || legacySessionToken

    const localRole = localStorage.getItem(AUTH_ROLE_KEY)
    const sessionRole = sessionStorage.getItem(AUTH_ROLE_KEY)
    const storedRole = localRole || sessionRole || ""
    const role = storedRole || extractRoleFromJwt(token)

    return { token, role }
}

function extractRoleFromJwt(token) {
    if (!token) return ""
    const parts = String(token).split(".")
    if (parts.length !== 3) return ""

    try {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
        const roleCandidate = payload?.roles?.[0] || payload?.role || ""
        return normalizeRole(roleCandidate)
    } catch {
        return ""
    }
}

export function setStoredAuth({ token, role, remember }) {
    const targetStorage = remember ? localStorage : sessionStorage
    const otherStorage = remember ? sessionStorage : localStorage

    targetStorage.setItem(AUTH_TOKEN_KEY, token)
    targetStorage.setItem(AUTH_ROLE_KEY, role)
    targetStorage.setItem(AUTH_REMEMBER_KEY, remember ? "1" : "0")
    targetStorage.setItem(LEGACY_TOKEN_KEY, token)

    otherStorage.removeItem(AUTH_TOKEN_KEY)
    otherStorage.removeItem(AUTH_ROLE_KEY)
    otherStorage.removeItem(AUTH_REMEMBER_KEY)
    otherStorage.removeItem(LEGACY_TOKEN_KEY)
}

export function clearStoredAuth() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_ROLE_KEY)
    localStorage.removeItem(AUTH_REMEMBER_KEY)
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_ROLE_KEY)
    sessionStorage.removeItem(AUTH_REMEMBER_KEY)
    sessionStorage.removeItem(LEGACY_TOKEN_KEY)
}

function normalizeRole(rawRole) {
    const role = String(rawRole || "").toLowerCase()
    if (role.includes("super_admin")) return "super_admin"
    if (role.includes("admin") || role.includes("garage") || role.includes("garagiste")) return "garage"
    if (role.includes("user") || role.includes("client")) return "client"
    return ""
}


// La redirection du dashboard par défaut est maintenant gérée dans le composant login.

export function isJwtExpired(token) {
    if (!token) return true
    const parts = String(token).split(".")
    if (parts.length !== 3) return false

    try {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
        if (!payload?.exp) return false
        return Date.now() >= payload.exp * 1000
    } catch {
        return false
    }
}

function extractRoleFromPayload(data) {
    const roleCandidate =
        data?.role?.nomRole ||
        data?.role ||
        data?.user?.role?.nomRole ||
        data?.user?.role ||
        data?.roles?.[0]?.nomRole ||
        data?.roles?.[0] ||
        data?.user?.roles?.[0]?.nomRole ||
        data?.user?.roles?.[0] ||
        data?.nomRole ||
        data?.typeCompte ||
        data?.user?.typeCompte ||
        data?.utilisateur?.role?.nomRole ||
        data?.utilisateur?.role ||
        data?.utilisateur?.roles?.[0]?.nomRole ||
        data?.utilisateur?.roles?.[0]

    return normalizeRole(roleCandidate)
}

export async function loginUser({ email, password, otp, remember } = {}) {
    const payload = {
        emailUtilisateur: email,
        mdpUtilisateur: password,
    }

    if (otp) {
        payload.authCode = otp
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/users/login`, {
        method: "POST",
        headers: buildJsonHeaders(),
        body: JSON.stringify(payload),
    })

    const data = await safeJson(response)

    if (!response.ok) {
        const message = data?.message || data?.error || "Connexion impossible"
        if (response.status === 403 && /2fa|authenticator|code/i.test(message)) {
            return {
                requires2fa: true,
                error: message,
            }
        }

        throw new Error(message)
    }

    if (data?.need2FA || data?.requires2fa) {
        return {
            requires2fa: true,
            error: data?.message || "Code 2FA requis",
        }
    }

    const token = data?.token || data?.jwt || ""
    const role = extractRoleFromPayload(data)

    if (token) {
        setStoredAuth({ token, role, remember: Boolean(remember) })
    }

    return {
        requires2fa: false,
        token,
        role,
        user: data?.user || null,
    }
}

export async function getProfile(token) {
    const data = await apiFetch("/api/v1/users/connecter", {
        method: "GET",
        headers: buildAuthHeaders(token),
    })

    const remember = localStorage.getItem(AUTH_REMEMBER_KEY) === "1"
    const { role: storedRole } = getStoredAuth()
    const resolvedRole = extractRoleFromPayload(data) || storedRole || extractRoleFromJwt(token)

    if (token && resolvedRole) {
        setStoredAuth({ token, role: resolvedRole, remember })
    }

    return {
        ...data,
        role: resolvedRole,
        id: data?.userId,
        nom: data?.nom || "",
        prenom: data?.prenom || "",
        email: data?.email || "",
        tel: data?.tel || "",
        data: {
            id: data?.userId,
            nom: data?.nom || "",
            prenom: data?.prenom || "",
            email: data?.email || "",
            tel: data?.tel || "",
        },
    }
}

export async function updateMyProfile(token, payload) {
    return apiFetch("/api/v1/users/me", {
        method: "PATCH",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(payload),
    })
}

export async function requestPasswordReset(email) {
    return apiFetch("/api/v1/users/forget_password", {
        method: "POST",
        headers: buildJsonHeaders(),
        body: JSON.stringify({ email }),
    })
}

export async function resetPassword(token, password) {
    return apiFetch("/api/v1/users/reset_password", {
        method: "POST",
        headers: buildJsonHeaders(),
        body: JSON.stringify({ token, password }),
    })
}

export async function getPrestations() {
    const response = await getPrestationsCatalogue()
    return response?.prestations || []
}

export async function getUsersByRole(token, role) {
    return apiFetch("/api/v1/users/get_utilisateur", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({ role }),
    })
}

export async function getAdminGarages(token) {
    return apiFetch("/api/v1/garages/search", {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function validateGarage(token, garageId, isValide = true) {
    return apiFetch(`/api/v1/garages/${garageId}/validation`, {
        method: "PATCH",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({ isValide }),
    })
}

export async function getAllAvis(token) {
    return apiFetch("/api/v1/avis", {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function getClientRendezVous(token) {
    return apiFetch("/api/v1/client/rdv/me", {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function getClientDashboard(token) {
    const profile = await getProfile(token)
    const rdvRaw = await getClientRendezVous(token)
    const rdv = Array.isArray(rdvRaw?.rdv) ? rdvRaw.rdv : Array.isArray(rdvRaw) ? rdvRaw : []

    return {
        fullName: [profile?.prenomUtilisateur, profile?.nomUtilisateur].filter(Boolean).join(" ") || "Client",
        stats: [
            { label: "RDV planifies", value: rdv.length, icon: "RDV" },
            { label: "Garages suivis", value: "-", icon: "GAR" },
            { label: "Interventions", value: rdv.length, icon: "INT" },
            { label: "Notifications", value: "-", icon: "NOT" },
        ],
        appointments: rdv.slice(0, 5).map((item) => ({
            id: item?.idRdv || item?.id || Math.random().toString(36).slice(2),
            garage: item?.garage?.nomGarage || item?.nomGarage || "Garage",
            service: item?.prestation?.nomPrestation || item?.nomPrestation || "Prestation",
            date: item?.dateDebut || item?.date || "-",
            status: item?.status || "En attente",
        })),
    }
}

export async function getClientDevisSnapshot(token) {
    const response = await apiFetch("/api/v1/client/devis/me", {
        method: "GET",
        headers: buildAuthHeaders(token),
    })

    return Array.isArray(response?.devis) ? response.devis : []
}

export async function getClientFacturesSnapshot(token) {
    const response = await apiFetch("/api/v1/client/factures/me", {
        method: "GET",
        headers: buildAuthHeaders(token),
    })

    return Array.isArray(response?.factures) ? response.factures : []
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

export async function createRendezVous(token, data) {
    if (!data?.garageId || !data?.vehiculeId || !data?.prestationId) {
        throw new Error("Informations manquantes. Utilisez le formulaire complet de reservation.")
    }

    const start = new Date(`${data.date}T${data.heure}:00`)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + 60)

    const formatDateTimeForApi = (dateObj) => {
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, "0")
        const day = String(dateObj.getDate()).padStart(2, "0")
        const hours = String(dateObj.getHours()).padStart(2, "0")
        const minutes = String(dateObj.getMinutes()).padStart(2, "0")
        const seconds = String(dateObj.getSeconds()).padStart(2, "0")
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }

    return createClientRdv(token, {
        id_garage: Number(data.garageId),
        id_vehicule: Number(data.vehiculeId),
        id_prestation: Number(data.prestationId),
        date_debut: formatDateTimeForApi(start),
        date_fin: formatDateTimeForApi(end),
        commantaire_client: data.motif || "Demande client",
    })
}

export async function registerClient(payload) {
    return apiFetch("/api/v1/users/inscrire_client", {
        method: "POST",
        headers: buildJsonHeaders(),
        body: JSON.stringify(payload),
    })
}

export async function registerGarage(payload) {
    return apiFetch("/api/v1/users/inscrire-garage", {
        method: "POST",
        headers: buildJsonHeaders(),
        body: JSON.stringify(payload),
    })
}

export async function checkSiretInsee(siret) {
    return apiFetch(`/api/v1/check_siret_insee/${encodeURIComponent(siret)}`, {
        method: "GET",
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
    const vehiculeId = Number(data?.vehiculeId)
    if (!Number.isInteger(vehiculeId) || vehiculeId <= 0) {
        throw new Error("vehiculeId est requis pour creer un rendez-vous garage")
    }

    if (!data?.dateDebut || !data?.dateFin) {
        throw new Error("dateDebut et dateFin sont requis")
    }

    const start = new Date(data.dateDebut)
    const end = new Date(data.dateFin)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error("Format de date invalide")
    }

    if (end <= start) {
        throw new Error("La date de fin doit etre apres la date de debut")
    }

    return apiFetch("/api/v1/rdv", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({ ...data, vehiculeId }),
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
    createRendezVous,
    registerClient,
    registerGarage,
    checkSiretInsee,
    addGaragePrestation,
    deleteGaragePrestation,
    getGarageRdvList,
    getGarageRdvDetail,
    getGarageRdvPrestations,
    updateGarageRdvStatus,
    addGarageRdvHistorique,
    createGarageRdv,
    changePassword,
    loginUser,
    getProfile,
    updateMyProfile,
    requestPasswordReset,
    resetPassword,
    getPrestations,
    getUsersByRole,
    getAdminGarages,
    validateGarage,
    getAllAvis,
    getClientRendezVous,
    getClientDashboard,
    getClientDevisSnapshot,
    getClientFacturesSnapshot,
    isJwtExpired,
}

export { API_BASE_URL }
