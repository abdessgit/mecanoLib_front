import { useState, useEffect } from "react"
import { getStoredAuth, getProfile } from "../../services/api"

function ProfilClient() {
    const { token } = getStoredAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        getProfile(token)
            .then(setProfile)
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
                        <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center fw-bold fs-4 text-dark"
                            style={{ width: 64, height: 64, flexShrink: 0 }}>
                            {(profile.prenom?.[0] || "?").toUpperCase()}
                        </div>
                        <div>
                            <div className="fw-bold fs-5">{profile.prenom} {profile.nom}</div>
                            <div className="text-muted small">{profile.email}</div>
                        </div>
                    </div>

                    <dl className="row mb-0">
                        <dt className="col-sm-3 text-muted">Prenom</dt>
                        <dd className="col-sm-9">{profile.prenom || "—"}</dd>

                        <dt className="col-sm-3 text-muted">Nom</dt>
                        <dd className="col-sm-9">{profile.nom || "—"}</dd>

                        <dt className="col-sm-3 text-muted">Email</dt>
                        <dd className="col-sm-9">{profile.email || "—"}</dd>

                        {profile.tel && (
                            <>
                                <dt className="col-sm-3 text-muted">Telephone</dt>
                                <dd className="col-sm-9">{profile.tel}</dd>
                            </>
                        )}
                    </dl>
                </div>
            )}
        </main>
    )
}

export default ProfilClient
