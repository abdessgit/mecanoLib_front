import { useState } from "react"
import { registerClient } from "../../services/api"

function InscriptionClient() {
    const [form, setForm] = useState({
        prenom: "",
        nom: "",
        telephone: "",
        email: "",
        password: "",
        confirmPassword: "",
        consentement: false,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setSuccess("")

        if (form.password !== form.confirmPassword) {
            setError("Les mots de passe ne correspondent pas.")
            return
        }

        setLoading(true)
        try {
            await registerClient({
                nom: form.nom,
                prenom: form.prenom,
                email: form.email,
                mdp: form.password,
                tel: form.telephone,
                consentement: form.consentement,
            })
            setSuccess("Compte client créé avec succès. Vous pouvez maintenant vous connecter.")
            setForm({
                prenom: "",
                nom: "",
                telephone: "",
                email: "",
                password: "",
                confirmPassword: "",
                consentement: false,
            })
        } catch (err) {
            setError(err.message || "Une erreur est survenue")
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="container py-5" style={{ maxWidth: "700px" }}>
            <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5">
                <h2 className="fw-bold mb-2">Inscription client</h2>
                <p className="text-muted mb-4">Creer un compte utilisateur (role user).</p>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success" role="alert">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-semibold" htmlFor="prenom">
                                Prenom
                            </label>
                            <input
                                id="prenom"
                                name="prenom"
                                className="form-control"
                                value={form.prenom}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-semibold" htmlFor="nom">
                                Nom
                            </label>
                            <input
                                id="nom"
                                name="nom"
                                className="form-control"
                                value={form.nom}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-semibold" htmlFor="telephone">
                                Telephone
                            </label>
                            <input
                                id="telephone"
                                name="telephone"
                                className="form-control"
                                value={form.telephone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-semibold" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                className="form-control"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-semibold" htmlFor="password">
                                Mot de passe
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                className="form-control"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-semibold" htmlFor="confirmPassword">
                                Confirmer le mot de passe
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                name="confirmPassword"
                                className="form-control"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-check mt-3">
                        <input
                            id="consentement"
                            type="checkbox"
                            name="consentement"
                            className="form-check-input"
                            checked={form.consentement}
                            onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="consentement">
                            J'accepte les conditions d'utilisation
                        </label>
                    </div>

                    <button type="submit" className="btn btn-warning mt-4 w-100 fw-bold" disabled={loading}>
                        {loading ? "Inscription..." : "Creer mon compte client"}
                    </button>
                </form>
            </div>
        </section>
    )
}

export default InscriptionClient