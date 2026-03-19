import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { loginUser } from "../../services/api"

function ConnexionGarage() {
    const navigate = useNavigate()

    const [step, setStep] = useState("credentials") // "credentials" | "otp"
    const [form, setForm] = useState({ email: "", password: "", remember: false })
    const [otp, setOtp] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    }

    const handleCredentials = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)
        try {
            const result = await loginUser({ email: form.email, password: form.password, remember: form.remember })
            if (result.requires2fa) {
                setStep("otp")
                return
            }
            navigate(result.role === "garage" ? "/dashboardGarage" : "/dashboardClient")
        } catch (err) {
            setError(err.message || "Connexion impossible")
        } finally {
            setLoading(false)
        }
    }

    const handleOtp = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)
        try {
            const result = await loginUser({ email: form.email, password: form.password, otp, remember: form.remember })
            if (result.requires2fa) {
                setError(result.error || "Code 2FA invalide, reessayez")
                return
            }
            navigate(result.role === "garage" ? "/dashboardGarage" : "/dashboardClient")
        } catch (err) {
            setError(err.message || "Code 2FA invalide")
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="container py-5" style={{ maxWidth: "520px" }}>
            <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5">

                {step === "credentials" ? (
                    <>
                        <h2 className="fw-bold mb-2">Connexion</h2>
                        <p className="text-muted mb-4">Connectez-vous a votre espace MecanoLib.</p>

                        {error && <div className="alert alert-danger" role="alert">{error}</div>}

                        <form onSubmit={handleCredentials}>
                            <div className="mb-3">
                                <label className="form-label fw-semibold" htmlFor="email">Email</label>
                                <input
                                    id="email" type="email" name="email"
                                    className="form-control form-control-lg"
                                    placeholder="email@exemple.fr"
                                    value={form.email} onChange={handleChange} required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-semibold" htmlFor="password">Mot de passe</label>
                                <input
                                    id="password" type="password" name="password"
                                    className="form-control form-control-lg"
                                    placeholder="Votre mot de passe"
                                    value={form.password} onChange={handleChange} required
                                />
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-4 gap-3 flex-wrap">
                                <div className="form-check">
                                    <input
                                        id="remember" type="checkbox" name="remember"
                                        className="form-check-input"
                                        checked={form.remember} onChange={handleChange}
                                    />
                                    <label className="form-check-label" htmlFor="remember">Se souvenir de moi</label>
                                </div>
                                <Link to="/mot-de-passe-oublie" className="text-decoration-none">Mot de passe oublie ?</Link>
                            </div>
                            <button type="submit" className="btn btn-warning btn-lg w-100 fw-bold" disabled={loading}>
                                {loading ? "Connexion..." : "Se connecter"}
                            </button>
                        </form>

                        <p className="mt-4 mb-0 text-center text-muted">
                            Pas encore inscrit ?{" "}
                            <Link to="/inscription" className="fw-semibold text-decoration-none">Creer un compte</Link>
                        </p>
                    </>
                ) : (
                    <>
                        <div className="text-center mb-4">
                            <div className="fs-1 mb-2">🔐</div>
                            <h2 className="fw-bold mb-2">Verification 2FA</h2>
                            <p className="text-muted">
                                Entrez le code a 6 chiffres genere par votre application d'authentification
                                (Google Authenticator, Authy, etc.).
                            </p>
                        </div>

                        {error && <div className="alert alert-danger" role="alert">{error}</div>}

                        <form onSubmit={handleOtp}>
                            <div className="mb-4">
                                <label className="form-label fw-semibold" htmlFor="otp">Code 2FA</label>
                                <input
                                    id="otp" type="text" inputMode="numeric" pattern="[0-9]{6}"
                                    maxLength={6}
                                    className="form-control form-control-lg text-center fw-bold fs-4"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    autoFocus required
                                />
                                <div className="form-text text-center">Le code expire toutes les 30 secondes.</div>
                            </div>
                            <button
                                type="submit" className="btn btn-warning btn-lg w-100 fw-bold"
                                disabled={loading || otp.length !== 6}
                            >
                                {loading ? "Verification..." : "Valider le code"}
                            </button>
                            <button
                                type="button" className="btn btn-link w-100 mt-2 text-muted text-decoration-none"
                                onClick={() => { setStep("credentials"); setOtp(""); setError("") }}
                            >
                                ← Revenir a la connexion
                            </button>
                        </form>
                    </>
                )}
            </div>
        </section>
    )
}

export default ConnexionGarage