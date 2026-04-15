import { useState, useEffect } from "react"
import { getClientDevisSnapshot, getStoredAuth } from "../../services/api"

function statusBadge(s) {
    const map = { accepte: "success", refuse: "danger", en_attente: "warning" }
    const key = String(s || "").toLowerCase().replace(/\s/g, "_")
    return map[key] || "secondary"
}

function DevisClient() {
    const { token } = getStoredAuth()
    const [devis, setDevis] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!token) {
            const task = setTimeout(() => {
                setError("Vous devez etre connecte.")
                setLoading(false)
            }, 0)
            return () => clearTimeout(task)
        }

        getClientDevisSnapshot(token)
            .then((data) => setDevis(Array.isArray(data) ? data : []))
            .catch((err) => setError(err?.message || "La liste des devis n'est pas encore disponible."))
            .finally(() => setLoading(false))
    }, [token])

    return (
        <main className="container py-4 py-md-5">
            <h1 className="fw-bold mb-4">Mes devis</h1>

            {loading && <div className="text-muted">Chargement...</div>}

            {error && (
                <div className="alert alert-info d-flex align-items-center gap-2">
                    <span>📋</span>
                    <span>{error}</span>
                </div>
            )}

            {!loading && !error && devis.length === 0 && (
                <div className="text-center text-muted py-5">
                    <div className="fs-1 mb-2">📋</div>
                    <p className="mb-0">Aucun devis pour le moment.</p>
                </div>
            )}

            {devis.length > 0 && (
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>#</th>
                                <th>Garage</th>
                                <th>Description</th>
                                <th>Montant</th>
                                <th>Date</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {devis.map((d, i) => (
                                <tr key={d.id || i}>
                                    <td className="text-muted small">{d.id || i + 1}</td>
                                    <td>{d.garage?.nomGarage || d.garage?.nom_garage || d.garage || "—"}</td>
                                    <td>{d.description || d.prestation || "—"}</td>
                                    <td>{d.montant != null ? `${d.montant} €` : "—"}</td>
                                    <td className="small text-muted">
                                        {d.date ? new Date(d.date).toLocaleDateString("fr-FR") : "—"}
                                    </td>
                                    <td>
                                        <span className={`badge bg-${statusBadge(d.statut || d.status)}`}>
                                            {d.statut || d.status || "—"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    )
}

export default DevisClient
