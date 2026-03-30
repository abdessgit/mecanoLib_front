import { useState, useEffect } from "react"
import { getStoredAuth, get2faStatus, setup2fa, verify2fa, disable2fa } from "../../services/api"

function DashboardGarage() {
    const { token } = getStoredAuth()

    const [status2fa, setStatus2fa] = useState(null) // { enabled, pendingSetup }
    const [loadingStatus, setLoadingStatus] = useState(true)

    // Setup flow
    const [setupData, setSetupData] = useState(null) // { secret, manualEntryKey, otpauthUrl }
    const [verifyCode, setVerifyCode] = useState("")
    const [verifyLoading, setVerifyLoading] = useState(false)
    const [verifyError, setVerifyError] = useState("")

    // Disable flow
    const [showDisable, setShowDisable] = useState(false)
    const [disableForm, setDisableForm] = useState({ mdp: "", code: "" })
    const [disableLoading, setDisableLoading] = useState(false)
    const [disableError, setDisableError] = useState("")

    const [successMsg, setSuccessMsg] = useState("")

    useEffect(() => {
        get2faStatus(token)
            .then(setStatus2fa)
            .catch(() => setStatus2fa(null))
            .finally(() => setLoadingStatus(false))
    }, [token])

    const handleSetup = async () => {
        setSuccessMsg("")
        try {
            const data = await setup2fa(token)
            setSetupData(data)
        } catch (err) {
            setVerifyError(err.message || "Impossible d'activer le 2FA")
        }
    }

    const handleVerify = async (e) => {
        e.preventDefault()
        setVerifyError("")
        setVerifyLoading(true)
        try {
            await verify2fa(token, verifyCode)
            setSuccessMsg("2FA active avec succes !")
            setSetupData(null)
            setVerifyCode("")
            setStatus2fa((prev) => ({ ...prev, enabled: true, pendingSetup: false }))
        } catch (err) {
            setVerifyError(err.message || "Code invalide")
        } finally {
            setVerifyLoading(false)
        }
    }

    const handleDisable = async (e) => {
        e.preventDefault()
        setDisableError("")
        setDisableLoading(true)
        try {
            await disable2fa(token, { mdp: disableForm.mdp, code: disableForm.code })
            setSuccessMsg("2FA desactive avec succes.")
            setShowDisable(false)
            setDisableForm({ mdp: "", code: "" })
            setStatus2fa((prev) => ({ ...prev, enabled: false }))
        } catch (err) {
            setDisableError(err.message || "Erreur lors de la desactivation")
        } finally {
            setDisableLoading(false)
        }
    }

    return (
        <main className="container py-4 py-md-5">
            {/* Hero */}
            <section className="p-4 p-md-5 rounded-4 text-white shadow-sm mb-4"
                style={{ background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)" }}>
                <p className="mb-2 text-warning fw-semibold">Espace garage</p>
                <h1 className="display-6 fw-bold mb-3">Tableau de bord</h1>
                <p className="mb-0" style={{ maxWidth: "680px" }}>
                    Gerez votre garage, vos rendez-vous, devis et la securite de votre compte.
                </p>
            </section>

            {successMsg && (
                <div className="alert alert-success alert-dismissible" role="alert">
                    {successMsg}
                    <button type="button" className="btn-close" onClick={() => setSuccessMsg("")} />
                </div>
            )}

            {/* 2FA Card */}
            <div className="card border-0 shadow-sm rounded-4 p-4">
                <h2 className="fw-bold fs-5 mb-1">Double authentification (2FA)</h2>
                <p className="text-muted small mb-3">
                    Protegez votre compte avec une application TOTP (Google Authenticator, Authy, etc.).
                </p>

                {loadingStatus ? (
                    <div className="text-muted">Chargement du statut 2FA...</div>
                ) : status2fa === null ? (
                    <div className="text-muted small">Statut 2FA indisponible.</div>
                ) : status2fa.enabled ? (
                    /* ---- 2FA enabled ---- */
                    <>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <span className="badge bg-success fs-6">✓ Actif</span>
                            <span className="text-muted small">Votre compte est protege par le 2FA.</span>
                        </div>
                        {!showDisable ? (
                            <button className="btn btn-outline-danger btn-sm" onClick={() => setShowDisable(true)}>
                                Desactiver le 2FA
                            </button>
                        ) : (
                            <form onSubmit={handleDisable} style={{ maxWidth: "360px" }}>
                                <p className="text-danger small fw-semibold mb-2">
                                    Confirmer la desactivation :
                                </p>
                                {disableError && <div className="alert alert-danger py-2 small">{disableError}</div>}
                                <div className="mb-2">
                                    <input type="password" className="form-control form-control-sm"
                                        placeholder="Mot de passe" value={disableForm.mdp}
                                        onChange={(e) => setDisableForm((p) => ({ ...p, mdp: e.target.value }))} required />
                                </div>
                                <div className="mb-3">
                                    <input type="text" className="form-control form-control-sm"
                                        placeholder="Code 2FA (6 chiffres)" maxLength={6}
                                        value={disableForm.code}
                                        onChange={(e) => setDisableForm((p) => ({ ...p, code: e.target.value.replace(/\D/g, "").slice(0, 6) }))} required />
                                </div>
                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-danger btn-sm" disabled={disableLoading}>
                                        {disableLoading ? "..." : "Confirmer"}
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary btn-sm"
                                        onClick={() => { setShowDisable(false); setDisableError("") }}>
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                ) : setupData ? (
                    /* ---- QR Code + verify ---- */
                    <div style={{ maxWidth: "400px" }}>
                        <div className="alert alert-info small">
                            <strong>Scannez le QR code</strong> avec votre application, ou saisissez la cle manuellement.
                        </div>
                        {setupData.otpauthUrl && (
                            <div className="text-center mb-3">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupData.otpauthUrl)}`}
                                    alt="QR Code 2FA"
                                    className="rounded"
                                />
                            </div>
                        )}
                        {setupData.manualEntryKey && (
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Cle manuelle</label>
                                <code className="d-block bg-light p-2 rounded small user-select-all">
                                    {setupData.manualEntryKey}
                                </code>
                            </div>
                        )}
                        <form onSubmit={handleVerify}>
                            {verifyError && <div className="alert alert-danger py-2 small">{verifyError}</div>}
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Code de verification</label>
                                <input type="text" className="form-control text-center fw-bold"
                                    placeholder="000000" maxLength={6}
                                    value={verifyCode}
                                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    autoFocus required />
                            </div>
                            <div className="d-flex gap-2">
                                <button type="submit" className="btn btn-warning btn-sm fw-bold"
                                    disabled={verifyLoading || verifyCode.length !== 6}>
                                    {verifyLoading ? "Verification..." : "Activer le 2FA"}
                                </button>
                                <button type="button" className="btn btn-outline-secondary btn-sm"
                                    onClick={() => { setSetupData(null); setVerifyCode(""); setVerifyError("") }}>
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    /* ---- 2FA disabled ---- */
                    <>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <span className="badge bg-secondary fs-6">Inactif</span>
                            <span className="text-muted small">Le 2FA n'est pas active sur ce compte.</span>
                        </div>
                        {verifyError && <div className="alert alert-danger py-2 small mb-2">{verifyError}</div>}
                        <button className="btn btn-warning btn-sm fw-bold" onClick={handleSetup}>
                            Activer le 2FA
                        </button>
                    </>
                )}
            </div>
        </main>
    )
}

export default DashboardGarage
