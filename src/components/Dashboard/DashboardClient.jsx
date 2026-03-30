import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getClientDashboard, getStoredAuth } from "../../services/api"

function DashboardClient() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [fullName, setFullName] = useState("Client")
    const [stats, setStats] = useState([])
    const [appointments, setAppointments] = useState([])

    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true)
            setError("")

            try {
                const { token, role } = getStoredAuth()

                if (!token) {
                    throw new Error("Vous devez etre connecte pour acceder au dashboard.")
                }

                if (role && role !== "client") {
                    throw new Error("Ce dashboard est reserve aux comptes client.")
                }

                const data = await getClientDashboard(token)
                setFullName(data.fullName)
                setStats(data.stats)
                setAppointments(data.appointments)
            } catch (err) {
                setError(err.message || "Impossible de charger le dashboard")
            } finally {
                setLoading(false)
            }
        }

        loadDashboard()
    }, [])

    return (
        <main className="container py-4 py-md-5">
            <section className="p-4 p-md-5 rounded-4 text-white shadow-sm" style={{ background: "linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)" }}>
                <p className="mb-2 text-warning fw-semibold">Espace client</p>
                <h1 className="display-6 fw-bold mb-3">Bienvenue sur votre dashboard</h1>
                <p className="mb-4" style={{ maxWidth: "680px" }}>
                    Bonjour {fullName}. Suivez vos rendez-vous, retrouvez vos garages favoris et gardez un oeil sur l'historique de vos interventions.
                </p>
                <div className="d-flex gap-3 flex-wrap">
                    <Link to="/rendez-vous/new" className="btn btn-warning fw-bold px-4">Prendre un rendez-vous</Link>
                    <Link to="/garages" className="btn btn-outline-light px-4">Rechercher un garage</Link>
                </div>
            </section>

            {loading && (
                <div className="alert alert-info mt-4 mb-0" role="status">
                    Chargement des donnees du dashboard...
                </div>
            )}

            {error && (
                <div className="alert alert-danger mt-4 mb-0" role="alert">
                    {error}
                </div>
            )}

            <section className="row g-3 g-md-4 mt-1">
                {stats.map((item) => (
                    <div key={item.label} className="col-6 col-lg-3">
                        <article className="h-100 bg-white rounded-4 shadow-sm border p-3 p-md-4 text-start">
                            <p className="fs-4 mb-2">{item.icon}</p>
                            <h2 className="h4 fw-bold mb-1">{item.value}</h2>
                            <p className="text-muted mb-0">{item.label}</p>
                        </article>
                    </div>
                ))}
            </section>

            <section className="row g-3 g-md-4 mt-1">
                <div className="col-lg-8">
                    <article className="bg-white rounded-4 shadow-sm border p-3 p-md-4 h-100 text-start">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                            <h3 className="h5 fw-bold mb-0">Mes prochains rendez-vous</h3>
                            <Link to="/client/rendez-vous" className="btn btn-sm btn-outline-secondary">Voir tout</Link>
                        </div>

                        <div className="table-responsive">
                            <table className="table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Garage</th>
                                        <th>Service</th>
                                        <th>Date</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.length > 0 ? (
                                        appointments.map((appointment) => (
                                            <tr key={appointment.id}>
                                                <td className="fw-semibold">{appointment.garage}</td>
                                                <td>{appointment.service}</td>
                                                <td>{appointment.date}</td>
                                                <td>
                                                    <span className={`badge ${String(appointment.status).toLowerCase().includes("confirm") ? "text-bg-success" : "text-bg-warning"}`}>
                                                        {appointment.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center text-muted py-4">
                                                Aucun rendez-vous trouve.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </article>
                </div>

                <div className="col-lg-4">
                    <article className="bg-white rounded-4 shadow-sm border p-3 p-md-4 h-100 text-start">
                        <h3 className="h5 fw-bold mb-3">Actions rapides</h3>
                        <div className="d-grid gap-2">
                            <Link to="/client/devis" className="btn btn-outline-primary">Demander un devis</Link>
                            <Link to="/client/factures" className="btn btn-outline-primary">Consulter mes factures</Link>
                            <Link to="/client/profil" className="btn btn-outline-primary">Mettre a jour mon profil</Link>
                        </div>

                        <hr className="my-4" />

                        <h4 className="h6 fw-bold mb-2">Conseil entretien</h4>
                        <p className="text-muted mb-0">
                            Verifiez la pression des pneus tous les mois pour limiter l'usure et reduire la consommation.
                        </p>
                    </article>
                </div>
            </section>
        </main>
    )
}

export default DashboardClient