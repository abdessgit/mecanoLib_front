import { useState, useEffect } from "react"
import { getStoredAuth, getProfile, normalizeClientProfile } from "../../services/api"

function ProfilClient() {
    const { token } = getStoredAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(Boolean(token))
    const [error, setError] = useState(token ? "" : "Vous devez etre connecte.")

    useEffect(() => {
        if (!token) {
            return
        }

        getProfile(token)
            .then((data) => setProfile(normalizeClientProfile(data)))
            .catch(() => setError("Impossible de charger le profil."))
            .finally(() => setLoading(false))
    }, [token])

    return (
        <main className="container py-4 py-md-5" style={{ maxWidth: "680px" }}>
            <h1 className="fw-bold mb-4">Mon profil</h1>

            {loading && <div className="text-muted">Chargement...</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {profile && (
                <div className="card border-0 shadow-sm rounded-4 p-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                        <div
                            className="rounded-circle bg-warning d-flex align-items-center justify-content-center fw-bold fs-4 text-dark"
                            style={{ width: 64, height: 64, flexShrink: 0 }}
                        >
                            {(profile.prenom?.[0] || "?").toUpperCase()}
                        </div>
                        <div>
                            <div className="fw-bold fs-5">{profile.prenom} {profile.nom}</div>
                            <div className="text-muted small">{profile.email || "—"}</div>
                        </div>
                    </div>

                    <dl className="row mb-0">
                        <dt className="col-sm-4 text-muted">Prenom</dt>
                        <dd className="col-sm-8">{profile.prenom || "—"}</dd>

                        <dt className="col-sm-4 text-muted">Nom</dt>
                        <dd className="col-sm-8">{profile.nom || "—"}</dd>

                        <dt className="col-sm-4 text-muted">Email</dt>
                        <dd className="col-sm-8">{profile.email || "—"}</dd>

                        <dt className="col-sm-4 text-muted">Telephone</dt>
                        <dd className="col-sm-8">{profile.telephone || "—"}</dd>

                        <dt className="col-sm-4 text-muted">Ville</dt>
                        <dd className="col-sm-8">{profile.ville || "—"}</dd>

                        <dt className="col-sm-4 text-muted">Code postal</dt>
                        <dd className="col-sm-8">{profile.codePostal || "—"}</dd>

                        <dt className="col-sm-4 text-muted">Adresse</dt>
                        <dd className="col-sm-8">{profile.adresse || "—"}</dd>

                        {profile.codeInsee && (
                            <>
                                <dt className="col-sm-4 text-muted">Code INSEE</dt>
                                <dd className="col-sm-8">{profile.codeInsee}</dd>
                            </>
                        )}
                    </dl>
                </div>
            )}
        </main>
    )
}

export default ProfilClient
