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
    return role === "garage" ? "/dashboardGarage" : "/dashboardClient"
}

function mapRolesToAppRole(roles) {
    if (!Array.isArray(roles)) {
        return "client"
    }

    if (roles.includes("ROLE_ADMIN") || roles.includes("ROLE_SUPER_ADMIN")) {
        return "garage"
    }

    return "client"
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

    const [profileResult, appointmentsResult, statsResult] = await Promise.allSettled([
        tryFirst(["/api/v1/users/connecter", "/api/v1/user/me", "/api/v1/user/profile"], () => authOptions),
        tryFirst(["/api/v1/user/appointments", "/api/v1/appointments"], () => authOptions),
        tryFirst(["/api/v1/user/dashboard/stats", "/api/v1/user/stats"], () => authOptions),
    ])

    const profile = profileResult.status === "fulfilled" ? profileResult.value : null
    const appointments = normalizeAppointments(appointmentsResult.status === "fulfilled" ? appointmentsResult.value : null)
    const stats = normalizeStats(statsResult.status === "fulfilled" ? statsResult.value : null, appointments)

    const firstName = profile?.prenom || profile?.first_name || profile?.data?.prenom || ""
    const lastName = profile?.nom || profile?.last_name || profile?.data?.nom || ""
    const fullName = `${firstName} ${lastName}`.trim() || "Client"

    return {
        fullName,
        stats,
        appointments,
    }
}

export { API_BASE_URL }