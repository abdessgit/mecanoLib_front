import { Link } from "react-router-dom"

function PlaceholderPage({ title, description }) {
    return (
        <main className="container py-5" style={{ maxWidth: "780px" }}>
            <section className="card border-0 shadow-sm rounded-4 p-4 p-md-5 text-center">
                <h1 className="fw-bold mb-3">{title}</h1>
                <p className="text-muted mb-4">{description}</p>
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                    <Link to="/" className="btn btn-warning fw-semibold px-4">
                        Retour a l'accueil
                    </Link>
                    <Link to="/dashboardClient" className="btn btn-outline-secondary px-4">
                        Aller au dashboard client
                    </Link>
                </div>
            </section>
        </main>
    )
}

export default PlaceholderPage
