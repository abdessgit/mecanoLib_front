import { useState } from "react"
import InscriptionClient from "./InscriptionClient.jsx"
import InscriptionGarage from "./InscriptionGarage.jsx"

function Inscription() {
    const [typeInscription, setTypeInscription] = useState("client")

    return (
        <main className="py-4">
            <section className="container">
                <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4">
                    <h2 className="fw-bold mb-2">Inscription</h2>
                    <p className="text-muted mb-4">
                        Choisissez votre profil pour continuer votre inscription.
                    </p>

                    <div className="d-flex gap-2 flex-wrap">
                        <button
                            type="button"
                            className={`btn ${
                                typeInscription === "client" ? "btn-warning" : "btn-outline-secondary"
                            } fw-semibold px-4`}
                            onClick={() => setTypeInscription("client")}
                        >
                            Client
                        </button>
                        <button
                            type="button"
                            className={`btn ${
                                typeInscription === "garage" ? "btn-warning" : "btn-outline-secondary"
                            } fw-semibold px-4`}
                            onClick={() => setTypeInscription("garage")}
                        >
                            Garage
                        </button>
                    </div>
                </div>
            </section>

            {typeInscription === "client" ? <InscriptionClient /> : <InscriptionGarage />}
        </main>
    )
}

export default Inscription