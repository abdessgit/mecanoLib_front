import * as apiModule from "./api"

const root = apiModule?.default?.default ?? apiModule?.default ?? apiModule ?? {}

function deepFindFunction(name, candidate, depth = 0) {
    if (!candidate || depth > 4) return null
    if (typeof candidate[name] === "function") return candidate[name]

    const nested = [candidate.default, candidate.api, candidate.module, candidate.exports]
    for (const item of nested) {
        const found = deepFindFunction(name, item, depth + 1)
        if (found) return found
    }

    return null
}

const AUTH_TOKEN_KEY = "auth_token"
const AUTH_ROLE_KEY = "auth_role"
const AUTH_REMEMBER_KEY = "auth_remember"
const LEGACY_TOKEN_KEY = "token"

function pickFunction(name, fallback) {
    const found = deepFindFunction(name, apiModule) || deepFindFunction(name, root)
    if (found) return found
    return fallback
}

function normalizeRole(rawRole) {
    const role = String(rawRole || "").toLowerCase()
    if (role.includes("super_admin")) return "super_admin"
    if (role.includes("admin") || role.includes("garage")) return "garage"
    if (role.includes("user") || role.includes("client")) return "client"
    return "client"
}

function fallbackGetStoredAuth() {
    const localToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const sessionToken = sessionStorage.getItem(AUTH_TOKEN_KEY)
    const legacyLocalToken = localStorage.getItem(LEGACY_TOKEN_KEY)
    const legacySessionToken = sessionStorage.getItem(LEGACY_TOKEN_KEY)
    const token = localToken || sessionToken || legacyLocalToken || legacySessionToken || ""

    const localRole = localStorage.getItem(AUTH_ROLE_KEY)
    const sessionRole = sessionStorage.getItem(AUTH_ROLE_KEY)
    const role = normalizeRole(localRole || sessionRole || "")

    return { token, role }
}

function fallbackClearStoredAuth() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_ROLE_KEY)
    localStorage.removeItem(AUTH_REMEMBER_KEY)
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_ROLE_KEY)
    sessionStorage.removeItem(AUTH_REMEMBER_KEY)
    sessionStorage.removeItem(LEGACY_TOKEN_KEY)
}

function fallbackIsJwtExpired(token) {
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

function fallbackGetDefaultDashboardPath(role) {
    // Redirection déjà gérée dans le composant login, donc on ne retourne rien ici
    return "/";
}

async function fallbackGetProfile() {
    throw new Error("API profile indisponible")
}

async function fallbackLoginUser() {
    throw new Error("API login indisponible")
}

export const getStoredAuth = pickFunction("getStoredAuth", fallbackGetStoredAuth)
export const clearStoredAuth = pickFunction("clearStoredAuth", fallbackClearStoredAuth)
export const isJwtExpired = pickFunction("isJwtExpired", fallbackIsJwtExpired)
export const getDefaultDashboardPath = pickFunction("getDefaultDashboardPath", fallbackGetDefaultDashboardPath)
export const getProfile = pickFunction("getProfile", fallbackGetProfile)
export const loginUser = pickFunction("loginUser", fallbackLoginUser)
