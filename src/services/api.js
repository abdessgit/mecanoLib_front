// --- VALIDATION GARAGE ---
/**
 * Valide ou invalide un garage par son ID
 * @param {string} token - JWT d'authentification
 * @param {number|string} garageId - ID du garage à valider
 * @param {boolean} isValide - true pour valider, false pour invalider
 * @returns {Promise<any>} Résultat de la requête
 */
export async function validateGarage(token, garageId, isValide = true) {
    return apiFetch(`/app/v1/garages/${garageId}/validation`, {
        method: "PATCH",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({ isValide }),
    })
}
// --- GARAGES ---
/**
 * Supprime un garage par son ID
 * @param {string} token - JWT d'authentification
 * @param {number|string} garageId - ID du garage à supprimer
 * @returns {Promise<any>} Résultat de la requête
 */
export async function deleteGarage(token, garageId) {
    return apiFetch(`/api/v1/profil?garageId=${garageId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({ garageId: Number(garageId) }),
    })
}
// --- UTILISATEURS (ADMIN) ---
export async function deleteUser(token, userId) {
    return apiFetch(`/api/v1/users/${userId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
    });
}

export async function getGaragesForModeration(token) {
    return apiFetch("/api/v1/garages", {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function createSuperAdmin(token, { email, mdp }) {
    if (!isValidEmailFormat(email)) {
        throw new Error("Merci de saisir une adresse email valide.")
    }

    return apiFetch("/api/v1/users/ajouter_superadmin", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({
            email,
            mdp,
            emailUtilisateur: email,
            mdpUtilisateur: mdp,
        }),
    })
}
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")
const AUTH_TOKEN_KEY = "auth_token"
const AUTH_ROLE_KEY = "auth_role"
const AUTH_REMEMBER_KEY = "auth_remember"
const AUTH_PROFILE_KEY = "auth_profile"
const API_TIMEOUT_MS = 30000

async function safeJson(response) {
    try {
        return await response.json()
    } catch {
        return null
    }
}

async function safeText(response) {
    try {
        const text = await response.text()
        return typeof text === "string" ? text.trim() : ""
    } catch {
        return ""
    }
}

function parseStoredJson(value) {
    if (!value) return null

    try {
        return JSON.parse(value)
    } catch {
        return null
    }
}

export function isValidEmailFormat(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value || "").trim())
}

export function isValidPhoneFormat(value) {
    const raw = String(value || "").trim()
    if (!raw) return false

    const cleaned = raw.replace(/[\s().-]/g, "")
    return /^(?:\+33|0033|0)[1-9]\d{8}$/.test(cleaned)
}

export function getGarageIdFromProfile(profile) {
    const directId =
        profile?.garageId ??
        profile?.idGarage ??
        profile?.id_garage ??
        profile?.garage?.garageId ??
        profile?.garage?.idGarage ??
        profile?.garage?.id_garage ??
        profile?.garage?.id ??
        profile?.profil?.garageId ??
        profile?.profil?.idGarage ??
        profile?.profil?.id_garage

    if (directId !== undefined && directId !== null && directId !== "") {
        return String(directId)
    }

    const possibleLists = [profile?.garages, profile?.garageList, profile?.items]
    for (const list of possibleLists) {
        if (!Array.isArray(list)) continue

        const firstGarage = list.find(Boolean)
        const listId = firstGarage?.garageId ?? firstGarage?.idGarage ?? firstGarage?.id_garage ?? firstGarage?.id
        if (listId !== undefined && listId !== null && listId !== "") {
            return String(listId)
        }
    }

    return ""
}

export function getClientIdFromProfile(profile) {
    const directId =
        profile?.clientId ??
        profile?.idClient ??
        profile?.id_client ??
        profile?.client?.clientId ??
        profile?.client?.idClient ??
        profile?.client?.id_client ??
        profile?.client?.id ??
        profile?.profil?.clientId ??
        profile?.profil?.idClient ??
        profile?.profil?.id_client ??
        profile?.data?.clientId ??
        profile?.data?.idClient ??
        profile?.data?.id_client ??
        profile?.data?.client?.id_client ??
        profile?.data?.client?.idClient ??
        profile?.data?.client?.id ??
        profile?.data?.id ??
        profile?.id ??
        profile?.utilisateur?.clientId ??
        profile?.utilisateur?.idClient ??
        profile?.utilisateur?.id_client ??
        profile?.utilisateur?.client?.id_client ??
        profile?.utilisateur?.client?.idClient ??
        profile?.utilisateur?.client?.id

    if (directId !== undefined && directId !== null && directId !== "") {
        return String(directId)
    }

    const firstClientFromLists = pickFirstArrayItem(
        profile?.clients,
        profile?.data?.clients,
        profile?.profil?.clients,
        profile?.utilisateur?.clients,
        profile?.user?.clients,
        profile?.dbProfile?.clients,
        profile?.connectedUser?.clients,
    )

    const listId =
        firstClientFromLists?.clientId ??
        firstClientFromLists?.idClient ??
        firstClientFromLists?.id_client ??
        firstClientFromLists?.id

    if (listId !== undefined && listId !== null && listId !== "") {
        return String(listId)
    }

    return ""
}

function pickFirstArrayItem(...lists) {
    for (const list of lists) {
        if (!Array.isArray(list)) continue

        const item = list.find(Boolean)
        if (item && typeof item === "object") {
            return item
        }
    }

    return null
}

function pickFirstValue(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            return value
        }
    }

    return ""
}

function pickFirstObject(...values) {
    for (const value of values) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
            return value
        }
    }

    return {}
}

export function normalizeClientProfile(profile) {
    const details = pickFirstObject(
        profile?.dbProfile,
        profile?.details,
        profile?.profileData,
        profile?.currentProfile,
    )
    const clientFromList = pickFirstObject(
        pickFirstArrayItem(
            profile?.clients,
            profile?.data?.clients,
            profile?.profil?.clients,
            profile?.utilisateur?.clients,
            profile?.user?.clients,
            details?.clients,
            details?.data?.clients,
        ),
    )
    const root = pickFirstObject(
        profile?.client,
        profile?.data?.client,
        profile?.profil?.client,
        details?.client,
        details?.data?.client,
        details?.profil?.client,
        clientFromList,
        details?.profil,
        details?.data,
        profile?.profil,
        profile?.data,
        profile?.utilisateur,
        profile?.user,
        profile,
    )
    const user = pickFirstObject(
        root?.utilisateur,
        root?.user,
        details?.utilisateur,
        details?.user,
        details?.data?.utilisateur,
        details?.data?.user,
        profile?.utilisateur,
        profile?.user,
    )
    const locationSource = pickFirstObject(root?.location, user?.location, details?.location, details?.data?.location, profile?.location)
    const villeSource = pickFirstObject(root?.ville, user?.ville, root?.villeClient, profile?.ville, details?.ville, locationSource)
    const adresseValue = pickFirstValue(
        root?.adresse_client,
        root?.adresseClient,
        root?.adresse,
        root?.rue,
        user?.adresse_client,
        user?.adresseClient,
        user?.adresse,
        details?.adresse_client,
        details?.adresseClient,
        details?.adresse,
        details?.rue,
        locationSource?.address,
        locationSource?.adresse,
        locationSource?.street,
        profile?.adresse_client,
        profile?.adresseClient,
        profile?.adresse,
    )

    return {
        id: String(getClientIdFromProfile(profile) || ""),
        prenom: String(
            pickFirstValue(
                root?.prenom_client,
                root?.prenomClient,
                root?.prenom,
                clientFromList?.prenom_client,
                clientFromList?.prenom,
                details?.prenom_client,
                details?.prenom,
                user?.prenom,
                user?.firstName,
                profile?.prenom,
            ) || "",
        ),
        nom: String(
            pickFirstValue(
                root?.nom_client,
                root?.nomClient,
                root?.nom,
                clientFromList?.nom_client,
                clientFromList?.nom,
                details?.nom_client,
                details?.nom,
                user?.nom,
                user?.lastName,
                profile?.nom,
            ) || "",
        ),
        email: String(
            pickFirstValue(
                root?.email,
                root?.email_client,
                clientFromList?.email,
                clientFromList?.email_client,
                details?.email,
                details?.email_client,
                user?.email,
                user?.emailUtilisateur,
                profile?.email,
            ) || "",
        ),
        telephone: String(
            pickFirstValue(
                root?.tel,
                root?.telephone,
                root?.telephone_client,
                clientFromList?.tel,
                clientFromList?.telephone,
                clientFromList?.telephone_client,
                details?.tel,
                details?.telephone,
                details?.telephone_client,
                user?.tel,
                user?.telephone,
                profile?.tel,
            ) || "Non renseigne",
        ),
        ville: String(
            (typeof root?.ville === "string" ? root?.ville : pickFirstValue(
                root?.nom_ville,
                root?.ville,
                root?.ville_client,
                clientFromList?.nom_ville,
                clientFromList?.ville,
                details?.nom_ville,
                details?.ville,
                user?.nom_ville,
                user?.ville,
                locationSource?.city,
                locationSource?.ville,
                locationSource?.name,
                villeSource?.nom_ville,
                villeSource?.nomVille,
                villeSource?.ville,
                villeSource?.name,
                villeSource?.libelle,
            )) || "",
        ),
        codePostal: String(
            pickFirstValue(
                root?.cp,
                root?.code_postal,
                root?.codePostal,
                clientFromList?.cp,
                clientFromList?.code_postal,
                clientFromList?.codePostal,
                details?.cp,
                details?.code_postal,
                details?.codePostal,
                user?.cp,
                user?.code_postal,
                locationSource?.postalCode,
                locationSource?.code_postal,
                locationSource?.cp,
                villeSource?.code_postal,
                villeSource?.codePostal,
                villeSource?.cp,
                profile?.cp,
                profile?.code_postal,
                profile?.codePostal,
            ) || "",
        ),
        adresse: String(adresseValue || "Non renseignee"),
        codeInsee: String(
            pickFirstValue(
                root?.code_insee,
                root?.codeInsee,
                clientFromList?.code_insee,
                clientFromList?.codeInsee,
                details?.code_insee,
                details?.codeInsee,
                user?.code_insee,
                user?.codeInsee,
                locationSource?.codeInsee,
                locationSource?.code_insee,
                villeSource?.code_insee,
                villeSource?.codeInsee,
                villeSource?.citycode,
                profile?.code_insee,
                profile?.codeInsee,
            ) || "",
        ),
        pays: String(
            pickFirstValue(root?.pays, root?.country, details?.pays, details?.country, user?.pays, user?.country, profile?.pays, profile?.country) || "France",
        ),
    }
}

function toNetworkErrorMessage(path) {
    return `API injoignable (${path}). Verifiez que le backend tourne et que CORS autorise http://localhost:5173.`
}

async function apiFetch(path, options = {}) {
    const { timeoutMs = API_TIMEOUT_MS, ...fetchOptions } = options
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    let response
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...fetchOptions,
            signal: controller.signal,
        })
    } catch (error) {
        if (error?.name === "AbortError") {
            throw new Error(`Timeout API (${path}) apres ${Math.round(timeoutMs / 1000)}s`)
        }
        throw new Error(toNetworkErrorMessage(path))
    } finally {
        clearTimeout(timeoutId)
    }

    const data = await safeJson(response.clone())

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            clearStoredAuth()
            const authMessage = data?.message || data?.error || data?.erreur || "Session expiree ou token invalide. Merci de vous reconnecter."
            throw new Error(authMessage)
        }

        const rawText = data ? "" : await safeText(response.clone())
        const bodyText = rawText ? ` - ${rawText.slice(0, 180)}` : ""
        const fallback = `Requete API impossible (${response.status} ${path})${bodyText}`
        const message = data?.message || data?.error || data?.erreur || fallback
        throw new Error(message)
    }

    return data
}

function buildAuthHeaders(token) {
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

export function getStoredAuth() {
    const localToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const sessionToken = sessionStorage.getItem(AUTH_TOKEN_KEY)
    const token = localToken || sessionToken

    const localRole = localStorage.getItem(AUTH_ROLE_KEY)
    const sessionRole = sessionStorage.getItem(AUTH_ROLE_KEY)
    const role = localRole || sessionRole

    const localProfile = parseStoredJson(localStorage.getItem(AUTH_PROFILE_KEY))
    const sessionProfile = parseStoredJson(sessionStorage.getItem(AUTH_PROFILE_KEY))
    const profile = localProfile || sessionProfile

    return {
        token,
        role,
        profile,
        garageId: getGarageIdFromProfile(profile),
        clientId: getClientIdFromProfile(profile),
    }
}

export function setStoredAuth({ token, role, remember, profile = null }) {
    const targetStorage = remember ? localStorage : sessionStorage
    const otherStorage = remember ? sessionStorage : localStorage

    targetStorage.setItem(AUTH_TOKEN_KEY, token)
    targetStorage.setItem(AUTH_ROLE_KEY, role)
    targetStorage.setItem(AUTH_REMEMBER_KEY, remember ? "1" : "0")

    if (profile) {
        targetStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile))
    } else {
        targetStorage.removeItem(AUTH_PROFILE_KEY)
    }

    otherStorage.removeItem(AUTH_TOKEN_KEY)
    otherStorage.removeItem(AUTH_ROLE_KEY)
    otherStorage.removeItem(AUTH_REMEMBER_KEY)
    otherStorage.removeItem(AUTH_PROFILE_KEY)
}

export function clearStoredAuth() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_ROLE_KEY)
    localStorage.removeItem(AUTH_REMEMBER_KEY)
    localStorage.removeItem(AUTH_PROFILE_KEY)
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_ROLE_KEY)
    sessionStorage.removeItem(AUTH_REMEMBER_KEY)
    sessionStorage.removeItem(AUTH_PROFILE_KEY)
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
    if (role === "superadmin") return "/admin/dashboard";
    if (role === "garage") return "/garage/dashboard";
    return "/client/dashboard";
}


function mapRolesToAppRole(roles) {
    if (!Array.isArray(roles)) {
        return "client";
    }
    if (roles.includes("ROLE_SUPER_ADMIN")) {
        return "superadmin";
    }
    if (roles.includes("ROLE_ADMIN") || roles.includes("ROLE_GARAGE")) {
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
    if (!isValidEmailFormat(email)) {
        throw new Error("Merci de saisir une adresse email valide.")
    }

    const body = {
        email,
        mdp: password,
        emailUtilisateur: email,
        mdpUtilisateur: password,
    }
    if (otp) {
        body.code = otp
        body.authCode = otp
    }

    const loginPaths = [
        "/api/v1/users/login",
        "/api/v1/login",
        "/api/login",
        "/login",
    ]

    let response = null
    let data = null
    let lastError = null

    for (const path of loginPaths) {
        try {
            response = await fetch(`${API_BASE_URL}${path}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })

            data = await safeJson(response)

            if (response.status === 202 && data?.requires2fa) {
                return { requires2fa: true }
            }

            if (response.ok) {
                break
            }

            if (response.status === 404 || response.status === 405) {
                lastError = new Error(`Route de connexion introuvable (${path})`)
                response = null
                data = null
                continue
            }

            if (data?.requires2fa) return { requires2fa: true, error: data?.erreur }

            throw new Error(data?.erreur || data?.message || `Connexion impossible (${response.status} ${path})`)
        } catch (error) {
            if (error instanceof TypeError) {
                lastError = new Error(toNetworkErrorMessage(path))
                response = null
                data = null
                continue
            }

            throw error
        }
    }

    if (!response?.ok) {
        throw lastError || new Error("Connexion impossible")
    }

    const token = data?.token || data?.access_token || data?.jwt
    if (!token) throw new Error("Token manquant dans la reponse")

    const connected = await fetchConnectedUser(token)
    const role = mapRolesToAppRole(connected?.roles)

    let profile = connected
    if (role === "garage") {
        try {
            const garageId = getGarageIdFromProfile(connected)
            const garageProfile = await getGarageProfile(token, garageId || undefined)
            profile = {
                ...connected,
                garage: garageProfile?.garage || garageProfile?.data?.garage || garageProfile?.garage,
                garageProfile,
            }
        } catch {
            profile = connected
        }
    }

    setStoredAuth({ token, role, remember, profile })

    return { token, role, profile }
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

export async function getClientProfile(token) {
    try {
        return await apiFetch("/api/v1/client/profil", {
            method: "GET",
            headers: buildAuthHeaders(token),
        })
    } catch (error) {
        const message = String(error?.message || "")
        if (!/\((404|405) \/api\/v1\/client\/profil\)|route.*introuvable|not found/i.test(message)) {
            throw error
        }

        return getProfile(token)
    }
}

export async function updateClientProfile(token, payload) {
    if (payload?.email && !isValidEmailFormat(payload.email)) {
        throw new Error("Merci de saisir une adresse email valide.")
    }

    const body = {
        clientId: payload?.id,
        idClient: payload?.id,
        id_client: payload?.id,
        nom: payload?.nom,
        nom_client: payload?.nom,
        prenom: payload?.prenom,
        prenom_client: payload?.prenom,
        email: payload?.email,
        email_client: payload?.email,
        tel: payload?.telephone,
        telephone: payload?.telephone,
        telephone_client: payload?.telephone,
        ville: payload?.ville,
        nom_ville: payload?.ville,
        cp: payload?.codePostal,
        code_postal: payload?.codePostal,
        adresse: payload?.adresse,
        adresse_client: payload?.adresse,
        code_insee: payload?.codeInsee,
        codeInsee: payload?.codeInsee,
    }

    const fallbackableErrorPattern = /\((500|404|405) \/api\/v1\/client\/profil\)|route.*introuvable|not found|EntityRepository|ClientRepository|Argument #3/i

    try {
        return await apiFetch("/api/v1/client/profil", {
            method: "PATCH",
            headers: buildAuthHeaders(token),
            body: JSON.stringify(body),
        })
    } catch (error) {
        const message = String(error?.message || "")
        if (!fallbackableErrorPattern.test(message)) {
            throw error
        }

        return apiFetch("/api/v1/profil", {
            method: "PATCH",
            headers: buildAuthHeaders(token),
            body: JSON.stringify(body),
        })
    }
}

export async function getGarageProfile(token, garageId) {
    const query = garageId ? `?garageId=${encodeURIComponent(garageId)}` : ""

    return apiFetch(`/api/v1/profil${query}`, {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function updateGarageProfile(token, payload) {
    if (payload?.emailGarage && !isValidEmailFormat(payload.emailGarage)) {
        throw new Error("Merci de saisir une adresse email valide.")
    }

    const resolvedEmail = payload?.emailUtilisateur ?? payload?.emailGarage
    const resolvedPassword = payload?.mdp ?? payload?.newPassword ?? payload?.password
    const resolvedCurrentPassword = payload?.ancienMdp ?? payload?.oldPassword ?? payload?.currentPassword

    const body = {
        garageId: payload?.idGarage,
        idGarage: payload?.idGarage,
        id_garage: payload?.idGarage,
        userId: payload?.userId,
        idUser: payload?.userId,
        id_user: payload?.userId,
        utilisateurId: payload?.userId,
        idUtilisateur: payload?.userId,
        id_utilisateur: payload?.userId,
        nomGarage: payload?.nomGarage,
        nom_garage: payload?.nomGarage,
        emailGarage: payload?.emailGarage,
        email_garage: payload?.emailGarage,
        email: resolvedEmail,
        emailUtilisateur: resolvedEmail,
        telephoneGarage: payload?.telephoneGarage,
        telephone_garage: payload?.telephoneGarage,
        telephone: payload?.telephoneGarage,
        adresseGarage: payload?.adresseGarage,
        adresse_garage: payload?.adresseGarage,
        adresse: payload?.adresseGarage,
        siret: payload?.siret,
        tva: payload?.tva,
        villeId: payload?.villeId,
        id_ville: payload?.villeId,
        ville: payload?.ville,
        cp: payload?.postalCode,
        code_postal: payload?.postalCode,
        code_insee: payload?.codeInsee,
        imgGarage: payload?.imgGarage,
        imgLogo: payload?.imgLogo,
        mdp: resolvedPassword,
        mdpUtilisateur: payload?.mdpUtilisateur ?? resolvedPassword,
        password: payload?.password ?? payload?.newPassword ?? resolvedPassword,
        newPassword: payload?.newPassword ?? resolvedPassword,
        new_password: payload?.newPassword ?? resolvedPassword,
        nouveauMdp: payload?.newPassword ?? resolvedPassword,
        confirmPassword: payload?.confirmPassword,
        confirmMdp: payload?.confirmPassword,
        confirmationMdp: payload?.confirmPassword,
        currentPassword: payload?.currentPassword ?? resolvedCurrentPassword,
        oldPassword: payload?.oldPassword ?? resolvedCurrentPassword,
        ancienMdp: payload?.ancienMdp ?? resolvedCurrentPassword,
        ancien_mdp: payload?.ancienMdp ?? resolvedCurrentPassword,
    }

    return apiFetch("/api/v1/profil", {
        method: "PATCH",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(body),
    })
}

export async function changeGaragePassword(token, payload) {
    if (!payload?.newPassword && !payload?.mdp && !payload?.password) {
        throw new Error("Le nouveau mot de passe est requis.")
    }

    const body = {
        ...payload,
        mdp: payload?.mdp ?? payload?.newPassword ?? payload?.password,
        mdpUtilisateur: payload?.mdpUtilisateur ?? payload?.mdp ?? payload?.newPassword ?? payload?.password,
        password: payload?.password ?? payload?.newPassword ?? payload?.mdp,
        newPassword: payload?.newPassword ?? payload?.mdp ?? payload?.password,
        confirmPassword: payload?.confirmPassword,
        currentPassword: payload?.currentPassword ?? payload?.oldPassword ?? payload?.ancienMdp,
        oldPassword: payload?.oldPassword ?? payload?.currentPassword ?? payload?.ancienMdp,
        ancienMdp: payload?.ancienMdp ?? payload?.currentPassword ?? payload?.oldPassword,
    }

    const attempts = [
        { path: "/api/v1/profil", method: "PATCH" },
        { path: "/api/v1/users/change-password", method: "POST" },
        { path: "/api/v1/profil/change-password", method: "POST" },
        { path: "/api/v1/users/password", method: "PATCH" },
    ]

    let lastError = null

    for (const attempt of attempts) {
        try {
            return await apiFetch(attempt.path, {
                method: attempt.method,
                headers: buildAuthHeaders(token),
                body: JSON.stringify(body),
            })
        } catch (error) {
            const message = String(error?.message || "")
            if (/(404|405)|introuvable|not found/i.test(message)) {
                lastError = error
                continue
            }
            throw error
        }
    }

    throw lastError || new Error("Impossible de modifier le mot de passe de connexion.")
}

export async function getHorairesByGarage(token, garageId) {
    return apiFetch(`/api/v1/get_horaires_by_garage/${garageId}`, {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function getJours() {
    return apiFetch("/api/v1/get_jours", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
}

export async function getAssociations() {
    return apiFetch("/api/v1/get_associations", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
}

export async function updateGaragePlanning(token, payload) {
    const planningMap = new Map()

    if (Array.isArray(payload?.planning)) {
        payload.planning.forEach((item) => {
            const jourId = Number(item?.jourId ?? item?.idJour ?? item?.id_jour ?? 0)
            const horaireId = Number(item?.horaireId ?? item?.idHoraire ?? item?.id_horaire ?? 0)

            if (!jourId || !horaireId) {
                return
            }

            planningMap.set(String(jourId), {
                jourId,
                idJour: jourId,
                id_jour: jourId,
                horaireId,
                idHoraire: horaireId,
                id_horaire: horaireId,
            })
        })
    }

    const planning = Array.from(planningMap.values())

    return apiFetch("/api/v1/planning/semaine", {
        method: "PATCH",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({
            garageId: payload?.idGarage,
            idGarage: payload?.idGarage,
            id_garage: payload?.idGarage,
            planning,
            semaine: planning,
            semainePlanning: planning,
        }),
    })
}

export async function upsertGarageHoraire(token, payload) {
    const body = {
        idGarage: payload?.idGarage,
        id_garage: payload?.idGarage,
        horaireId: payload?.idHoraire,
        id_horaire: payload?.idHoraire,
        hreOuvreMatin: payload?.hreOuvreMatin,
        hreFermeMatin: payload?.hreFermeMatin,
        hreOuvreSoir: payload?.hreOuvreSoir,
        hreFermeSoir: payload?.hreFermeSoir,
        hre_ouvre_matin: payload?.hreOuvreMatin,
        hre_ferme_matin: payload?.hreFermeMatin,
        hre_ouvre_soir: payload?.hreOuvreSoir,
        hre_ferme_soir: payload?.hreFermeSoir,
    }

    if (payload?.idHoraire) {
        return apiFetch(`/api/v1/edit_horaire/${payload.idHoraire}`, {
            method: "POST",
            headers: buildAuthHeaders(token),
            body: JSON.stringify(body),
        })
    }

    return apiFetch("/api/v1/new_horaire", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(body),
    })
}

export async function registerClient({
    nom,
    prenom,
    email,
    mdp,
    tel,
    consentement,
    ville = "",
    cp = "",
    adresse = "",
    code_insee = "",
    immatriculation = "",
    annee = "",
    id_marque = null,
    id_modele = null,
    marque = "",
    modele = "",
}) {
    if (!isValidEmailFormat(email)) {
        throw new Error("Merci de saisir une adresse email valide.")
    }

    if (!isValidPhoneFormat(tel)) {
        throw new Error("Merci de saisir un numéro de téléphone valide.")
    }

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
            telephone: tel,
            telephone_client: tel,
            consentement,
            ville,
            nom_ville: ville,
            cp,
            code_postal: cp,
            adresse,
            adresse_client: adresse,
            code_insee,
            codeInsee: code_insee,
            immatriculation,
            plaque_immatriculation: immatriculation,
            annee,
            annee_vehicule: annee,
            id_marque: id_marque ? Number(id_marque) : undefined,
            id_modele: id_modele ? Number(id_modele) : undefined,
            marque,
            nom_marque: marque,
            modele,
            nom_modele: modele,
        }),
    })
}

export async function registerGarage({ nom_garage, email, telephone, adresse, siret, tva, id_ville, ville = null, cp = null, code_insee = null, mdp, img_garage = null, img_logo = null }) {
    if (!isValidEmailFormat(email)) {
        throw new Error("Merci de saisir une adresse email valide.")
    }

    if (!isValidPhoneFormat(telephone)) {
        throw new Error("Merci de saisir un numéro de téléphone valide.")
    }

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
            ville,
            cp,
            code_insee,
            mdp,
            img_garage,
            img_logo,
        }),
    })
}

// --- CATEGORIES ---
export async function getCategories() {
    return apiFetch("/api/v1/get_categories", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
}

export async function getVilles() {
    return apiFetch("/api/v1/get_villes", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
}

function normalizeMarquesPayload(data) {
    if (Array.isArray(data)) {
        return data
    }

    if (Array.isArray(data?.marques)) {
        return data.marques
    }

    if (Array.isArray(data?.data?.marques)) {
        return data.data.marques
    }

    if (Array.isArray(data?.data)) {
        return data.data
    }

    if (Array.isArray(data?.value)) {
        return data.value
    }

    if (Array.isArray(data?.results)) {
        return data.results
    }

    if (Array.isArray(data?.items)) {
        return data.items
    }

    if (Array.isArray(data?.["hydra:member"])) {
        return data["hydra:member"]
    }

    if (data && typeof data === "object" && (data?.id_marque || data?.idMarque || data?.nom_marque || data?.nomMarque || data?.nom)) {
        return [data]
    }

    return []
}

function normalizeModelesPayload(data) {
    if (Array.isArray(data)) {
        return data
    }

    if (Array.isArray(data?.modeles)) {
        return data.modeles
    }

    if (Array.isArray(data?.data?.modeles)) {
        return data.data.modeles
    }

    if (Array.isArray(data?.data)) {
        return data.data
    }

    if (Array.isArray(data?.value)) {
        return data.value
    }

    if (Array.isArray(data?.results)) {
        return data.results
    }

    if (Array.isArray(data?.items)) {
        return data.items
    }

    if (Array.isArray(data?.["hydra:member"])) {
        return data["hydra:member"]
    }

    if (data && typeof data === "object" && (data?.id_modele || data?.idModele || data?.nom_modele || data?.nomModele || data?.nom)) {
        return [data]
    }

    return []
}

function extractModelesFromMarqueItem(item) {
    const rawModeles = []

    if (Array.isArray(item?.modeles)) {
        rawModeles.push(...item.modeles)
    }

    if (Array.isArray(item?.modele)) {
        rawModeles.push(...item.modele)
    } else if (item?.modele && typeof item.modele === "object") {
        rawModeles.push(item.modele)
    }

    if (item?.id_modele || item?.idModele || item?.nom_modele || item?.nomModele) {
        rawModeles.push(item)
    }

    const seen = new Set()

    return rawModeles
        .map((modele) => {
            const id = String(modele?.id_modele ?? modele?.idModele ?? modele?.id ?? "")
            const name = modele?.nom_modele || modele?.nomModele || modele?.nom || "Modele"

            return {
                id,
                id_modele: id,
                name,
                nom_modele: name,
                nom: name,
            }
        })
        .filter((modele) => {
            const key = String(modele.id || modele.name || "")
            if (!key || seen.has(key)) {
                return false
            }
            seen.add(key)
            return true
        })
}

function getMarqueName(item) {
    return String(item?.nom_marque ?? item?.nomMarque ?? item?.nom ?? "").trim()
}

function collectModelesForMarqueId(marques, marqueId) {
    const targetId = String(marqueId || "").trim()
    if (!targetId) {
        return []
    }

    const items = Array.isArray(marques) ? marques : []
    const selectedMarque = items.find((item) => String(item?.id_marque ?? item?.idMarque ?? item?.id ?? "") === targetId)
    const selectedName = getMarqueName(selectedMarque)
    const relatedItems = selectedName
        ? items.filter((item) => getMarqueName(item).toLowerCase() === selectedName.toLowerCase())
        : items.filter((item) => String(item?.id_marque ?? item?.idMarque ?? item?.id ?? "") === targetId)

    const mergedModeles = new Map()

    relatedItems.forEach((item) => {
        extractModelesFromMarqueItem(item).forEach((modele) => {
            const key = String(modele.id || modele.name || "")
            if (!key || mergedModeles.has(key)) {
                return
            }

            mergedModeles.set(key, {
                ...modele,
                marqueId: String(item?.id_marque ?? item?.idMarque ?? item?.id ?? ""),
            })
        })
    })

    return Array.from(mergedModeles.values())
}

function isRecoverableLookupError(error) {
    const message = String(error?.message || "")

    return /401|403|404|405|408|429|500|502|503|504|introuvable|not found|non autorise|unauthori[sz]ed|jwt token|token not found|missing token|access denied|api injoignable|failed to fetch|network ?error|load failed|cors|connexion.*interrompue/i.test(message)
}

export async function getMarques(token = "") {
    const attempts = [
        {
            path: "/api/v1/get_marques",
            headers: {
                "Content-Type": "application/json",
            },
        },
    ]

    if (token) {
        attempts.push({
            path: "/api/v1/choisir_marque",
            headers: buildAuthHeaders(token),
        })
    }

    for (const attempt of attempts) {
        try {
            const data = await apiFetch(attempt.path, {
                method: "GET",
                headers: attempt.headers,
            })

            return normalizeMarquesPayload(data)
        } catch (error) {
            if (!isRecoverableLookupError(error)) {
                throw error
            }
        }
    }

    return []
}

export async function getModeles() {
    try {
        const data = await apiFetch("/api/v1/get_modeles", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })

        return normalizeModelesPayload(data)
    } catch (error) {
        if (/404|405|500|introuvable/i.test(String(error?.message || ""))) {
            return []
        }
        throw error
    }
}

export async function getMarquesByModele(modeleId, token = "") {
    if (!modeleId) return []

    const attempts = [
        {
            path: `/api/v1/get_marques_modele/${modeleId}`,
            headers: {
                "Content-Type": "application/json",
            },
        },
        {
            path: `/api/v1/get_marques_by_modele/${modeleId}`,
            headers: {
                "Content-Type": "application/json",
            },
        },
        {
            path: "/api/v1/get_marques",
            headers: {
                "Content-Type": "application/json",
            },
        },
    ]

    if (token) {
        attempts.push({
            path: "/api/v1/choisir_marque",
            headers: buildAuthHeaders(token),
        })
    }

    for (const attempt of attempts) {
        try {
            const data = await apiFetch(attempt.path, {
                method: "GET",
                headers: attempt.headers,
            })

            const marques = normalizeMarquesPayload(data)
            const filtered = marques.filter((item) => {
                const relatedModeles = extractModelesFromMarqueItem(item)
                const relatedModeleIds = relatedModeles.map((modele) => String(modele.id || "")).filter(Boolean)
                return relatedModeleIds.length === 0 || relatedModeleIds.includes(String(modeleId))
            })

            return filtered.length ? filtered : marques
        } catch (error) {
            if (!isRecoverableLookupError(error)) {
                throw error
            }
        }
    }

    return []
}

export async function getModelesByMarque(marqueId, token = "") {
    if (!marqueId) return []

    try {
        const marques = await getMarques(token)
        const modeles = collectModelesForMarqueId(marques, marqueId)

        if (modeles.length) {
            return modeles
        }
    } catch (error) {
        if (!isRecoverableLookupError(error)) {
            throw error
        }
    }

    if (token) {
        try {
            const data = await apiFetch(`/api/v1/choisir_modele/${marqueId}`, {
                method: "GET",
                headers: buildAuthHeaders(token),
            })

            const modeles = normalizeModelesPayload(data)
            if (modeles.length) {
                return modeles
            }
        } catch (error) {
            if (!isRecoverableLookupError(error)) {
                throw error
            }
        }
    }

    return []
}

export function calculateFrenchVatNumber(value) {
    const digits = String(value || "").replace(/\D+/g, "")

    if (!digits || digits.length < 9) {
        return null
    }

    const siren = digits.slice(0, 9)
    if (!/^\d{9}$/.test(siren)) {
        return null
    }

    const sirenModulo = Number(siren) % 97
    const key = (12 + 3 * sirenModulo) % 97
    const formattedKey = String(key).padStart(2, "0")

    return `FR${formattedKey}${siren}`
}

export async function lookupFrenchBusinessBySiretOrSiren(value) {
    const digits = String(value || "").replace(/\D+/g, "")
    if (![9, 14].includes(digits.length)) {
        return null
    }

    const response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(digits)}&page=1&per_page=1`
    )

    if (!response.ok) {
        throw new Error("Impossible de verifier ce SIREN / SIRET pour le moment.")
    }

    const data = await response.json()
    const company = Array.isArray(data?.results) ? data.results.find(Boolean) : null
    const fallbackTva = calculateFrenchVatNumber(digits)

    if (!company) {
        return {
            found: false,
            siren: digits.slice(0, 9),
            siret: digits.length === 14 ? digits : "",
            name: "",
            address: "",
            city: "",
            postalCode: "",
            codeInsee: "",
            tva: fallbackTva || "",
        }
    }

    const headOffice = company?.siege || company?.etablissement_siege || company?.matching_etablissements?.[0] || {}
    const addressParts = [
        headOffice?.adresse,
        headOffice?.adresse_complete,
        headOffice?.libelle_voie,
        headOffice?.complement_adresse,
    ].filter(Boolean)

    return {
        found: true,
        siren: String(company?.siren || digits.slice(0, 9)),
        siret: String(headOffice?.siret || company?.siret || (digits.length === 14 ? digits : "")),
        name: company?.nom_complet || company?.nom_raison_sociale || company?.nom || "",
        address: addressParts[0] || addressParts.join(" ").trim(),
        city: headOffice?.libelle_commune || headOffice?.commune || "",
        postalCode: String(headOffice?.code_postal || ""),
        codeInsee: String(headOffice?.commune_code || headOffice?.code_commune || ""),
        tva: company?.tva_intracommunautaire || fallbackTva || "",
    }
}

export async function getFrenchCitySuggestions(query) {
    const value = String(query || "").trim()
    if (!value) return []

    const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&type=municipality&autocomplete=1&limit=6`
    )
    const data = await response.json()

    const seen = new Set()
    return (Array.isArray(data?.features) ? data.features : [])
        .map((item) => ({
            city: item?.properties?.city || item?.properties?.name || "",
            postcode: item?.properties?.postcode || "",
            codeInsee: item?.properties?.citycode || "",
            label: item?.properties?.label || `${item?.properties?.name || ""} ${item?.properties?.postcode || ""}`.trim(),
        }))
        .filter((item) => {
            const key = `${item.city}-${item.postcode}-${item.codeInsee}`
            if (!item.city || seen.has(key)) return false
            seen.add(key)
            return true
        })
}

export async function getFrenchAddressSuggestions(query, { city = "", postcode = "" } = {}) {
    const value = String(query || "").trim()
    if (!value) return []

    const params = new URLSearchParams({
        q: value,
        autocomplete: "1",
        limit: "6",
    })

    if (city) params.append("city", city)
    if (postcode) params.append("postcode", postcode)

    const response = await fetch(`https://api-adresse.data.gouv.fr/search/?${params.toString()}`)
    const data = await response.json()

    return (Array.isArray(data?.features) ? data.features : []).map((item) => ({
        address: item?.properties?.label || item?.properties?.name || "",
        city: item?.properties?.city || city || "",
        postcode: item?.properties?.postcode || postcode || "",
        codeInsee: item?.properties?.citycode || "",
    }))
}

export async function getGaragesByVille(villeId) {
    return apiFetch(`/api/v1/get_garages_by_ville/${villeId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
}

export async function createCategory(token, { name }) {
    return apiFetch("/api/v1/new_categorie", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({
            nom_categorie: name,
            nomcategorie: name,
        }),
    })
}

export async function updateCategory(token, categoryId, { name }) {
    return apiFetch(`/api/v1/edit_categorie/${categoryId}`, {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({
            nom_categorie: name,
            nomcategorie: name,
        }),
    })
}

export async function deleteCategory(token, categoryId) {
    return apiFetch(`/api/v1/delete_categorie/${categoryId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
    })
}

// --- PRESTATIONS CATALOGUE ---
export async function getPrestationsByCategorie(categoryId) {
    return apiFetch(`/api/v1/get_prestations_by_categorie/${categoryId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
}

export async function getPrestationById(prestationId) {
    return apiFetch(`/api/v1/get_prestation/${prestationId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
}

export async function createPrestation(token, { name, description, duration, categoryId }) {
    return apiFetch("/api/v1/new_prestation", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({
            nomprestation: name,
            descriptionprestation: description,
            duree_prestation: duration,
            categorie: Number(categoryId),
        }),
    })
}

export async function updatePrestation(token, prestationId, { name, description, duration, categoryId }) {
    return apiFetch(`/api/v1/edit_prestation/${prestationId}`, {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({
            nomprestation: name,
            descriptionprestation: description,
            duree_prestation: duration,
            categorie: Number(categoryId),
        }),
    })
}

export async function deletePrestation(token, prestationId) {
    return apiFetch(`/api/v1/delete_prestation/${prestationId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
    })
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
    const profileResult = await fetchConnectedUser(token)

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
    if (!clientId) return []

    const paths = [
        `/api/v1/client/rdvs?clientId=${clientId}`,
        `/api/v1/client/rdvs/${clientId}`,
        `/api/v1/client/${clientId}/rdvs`,
    ]

    for (const path of paths) {
        try {
            return await apiFetch(path, {
                method: "GET",
                headers: buildAuthHeaders(token),
            })
        } catch (error) {
            if (!/404|405|introuvable/i.test(String(error?.message || ""))) {
                throw error
            }
        }
    }

    return []
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

export async function getStatusRendezVous(token) {
    return apiFetch("/api/v1/get_status_rdvs", {
        method: "GET",
        headers: buildAuthHeaders(token),
    })
}

export async function changeRendezVousStatus(token, data) {
    return apiFetch("/api/v1/changer_status", {
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

// --- PROPOSITIONS (prestations avec prix du garage) ---
export async function getPropositionsByGarage(garageId) {
    return apiFetch(`/api/v1/get_propositions_by_garage/${garageId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
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
export async function getHistoriques(token, rdvId, garageId) {
    let url = "/api/v1/get_historiques"
    const params = []
    if (rdvId) params.push(`rdvId=${rdvId}`)
    if (garageId) params.push(`garageId=${garageId}`)
    if (params.length > 0) url += `?${params.join("&")}`
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