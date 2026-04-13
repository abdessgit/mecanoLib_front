import { useEffect, useState } from "react"
import { getAdminGarages, getAllAvis, getPrestations, getStoredAuth, getUsersByRole, validateGarage } from "../../../services/api"

export default function DashboardSuperAdmin() {
    const { token } = getStoredAuth()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [stats, setStats] = useState({ clients: 0, garages: 0, avis: 0, prestations: 0 })
    const [garages, setGarages] = useState([])
    const [recentAvis, setRecentAvis] = useState([])

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            setError("")

            try {
                const [clients, garagesResponse, avisResponse, prestations] = await Promise.all([
                    getUsersByRole(token, "ROLE_USER"),
                    getAdminGarages(token),
                    getAllAvis(token),
                    getPrestations(),
                ])

                const garageList = Array.isArray(garagesResponse?.garages) ? garagesResponse.garages : []
                const avisList = Array.isArray(avisResponse?.avis) ? avisResponse.avis : []
                const clientList = Array.isArray(clients) ? clients : []
                const prestationList = Array.isArray(prestations) ? prestations : []

                setStats({
                    clients: clientList.length,
                    garages: garageList.length,
                    avis: avisList.length,
                    prestations: prestationList.length,
                })
                setGarages(garageList.slice(0, 8))
                setRecentAvis(avisList.slice(0, 5))
            } catch (err) {
                setError(err.message || "Impossible de charger le dashboard super admin")
            } finally {
                setLoading(false)
            }
        }

        if (token) {
            loadData()
        }
    }, [token])

    const handleValidateGarage = async (garageId, isValide) => {
        try {
            await validateGarage(token, garageId, !isValide)
            setGarages((prev) => prev.map((garage) => (
                garage.idGarage === garageId ? { ...garage, isValide: !isValide } : garage
            )))
        } catch (err) {
            setError(err.message || "Impossible de mettre a jour le garage")
        }
    }

    return (
        <main className="container py-4 py-md-5">
            <section className="p-4 p-md-5 rounded-4 text-white shadow-sm mb-4" style={{ background: "linear-gradient(135deg, #1f2937 0%, #0f766e 100%)" }}>
                <p className="mb-2 text-warning fw-semibold">Pilotage plateforme</p>
                <h1 className="display-6 fw-bold mb-3">Dashboard super admin</h1>
                <p className="mb-0" style={{ maxWidth: "760px" }}>
                    Supervisez les comptes, les garages, les avis et la qualite globale de la plateforme depuis un seul panneau.
                </p>
            </section>

            {loading && <div className="alert alert-info">Chargement du dashboard...</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <section className="row g-3 mb-4">
                {[
                    { label: "Clients", value: stats.clients },
                    { label: "Garages", value: stats.garages },
                    { label: "Avis", value: stats.avis },
                    { label: "Prestations", value: stats.prestations },
                ].map((item) => (
                    <div key={item.label} className="col-6 col-lg-3">
                        <article className="h-100 bg-white rounded-4 border shadow-sm p-3 p-md-4">
                            <p className="text-muted mb-2">{item.label}</p>
                            <h2 className="fw-bold mb-0">{item.value}</h2>
                        </article>
                    </div>
                ))}
            </section>

            <section className="row g-4">
                <div className="col-xl-7">
                    <article className="bg-white rounded-4 border shadow-sm p-3 p-md-4 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                            <h3 className="h5 fw-bold mb-0">Garages a surveiller</h3>
                            <span className="text-muted small">Validation rapide</span>
                        </div>

                        <div className="table-responsive">
                            <table className="table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Garage</th>
                                        <th>Contact</th>
                                        <th>Ville</th>
                                        <th>Statut</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {garages.length > 0 ? garages.map((garage) => (
                                        <tr key={garage.idGarage}>
                                            <td className="fw-semibold">{garage.nomGarage}</td>
                                            <td>{garage.emailGarage || garage.telephoneGarage || "-"}</td>
                                            <td>{garage.ville?.nomVille || "-"}</td>
                                            <td>
                                                <span className={`badge ${garage.isValide ? "text-bg-success" : "text-bg-warning"}`}>
                                                    {garage.isValide ? "Valide" : "En attente"}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${garage.isValide ? "btn-outline-secondary" : "btn-success"}`}
                                                    onClick={() => handleValidateGarage(garage.idGarage, garage.isValide)}
                                                >
                                                    {garage.isValide ? "Retirer" : "Valider"}
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="text-center text-muted py-4">Aucun garage a afficher.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </article>
                </div>

                <div className="col-xl-5">
                    <article className="bg-white rounded-4 border shadow-sm p-3 p-md-4 h-100">
                        <h3 className="h5 fw-bold mb-3">Derniers avis</h3>
                        <div className="d-grid gap-3">
                            {recentAvis.length > 0 ? recentAvis.map((avis) => (
                                <div key={avis.idAvis} className="border rounded-4 p-3">
                                    <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                                        <strong>{avis.garage?.nomGarage || "Garage"}</strong>
                                        <span className="badge text-bg-dark">{avis.note}/5</span>
                                    </div>
                                    <p className="mb-1">{avis.commentaire}</p>
                                    <p className="text-muted small mb-0">{avis.client?.prenomClient || "Client"} {avis.client?.nomClient || ""}</p>
                                </div>
                            )) : (
                                <p className="text-muted mb-0">Aucun avis recent.</p>
                            )}
                        </div>
                    </article>
                </div>
            </section>
        </main>
    )
}