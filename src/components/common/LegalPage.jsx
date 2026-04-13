import { Link } from "react-router-dom"

const CONTENT = {
    mentions: {
        title: "Mentions legales",
        body: [
            "Editeur: MecanoLib.",
            "Ce service propose la mise en relation entre clients et garages partenaires.",
            "Hebergeur: infrastructure cloud conforme aux standards de securite applicables.",
        ],
    },
    cgu: {
        title: "Conditions generales d'utilisation",
        body: [
            "L'utilisateur s'engage a fournir des informations exactes lors de la prise de rendez-vous.",
            "Le garage reste responsable de la confirmation finale de la disponibilite.",
            "Tout usage abusif de la plateforme peut entrainer la suspension du compte.",
        ],
    },
    privacy: {
        title: "Politique de confidentialite",
        body: [
            "Les donnees sont traitees uniquement pour la gestion des comptes et des rendez-vous.",
            "Vous pouvez demander l'acces, la rectification ou la suppression de vos donnees.",
            "Les donnees sensibles ne sont pas revendues a des tiers.",
        ],
    },
}

function LegalPage({ type = "mentions" }) {
    const content = CONTENT[type] || CONTENT.mentions

    return (
        <main className="container py-5" style={{ maxWidth: "880px" }}>
            <article className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
                <h1 className="fw-bold mb-3">{content.title}</h1>
                <p className="text-muted mb-4">Derniere mise a jour: avril 2026</p>

                {content.body.map((paragraph) => (
                    <p key={paragraph} className="mb-3" style={{ lineHeight: 1.65 }}>{paragraph}</p>
                ))}

                <div className="mt-4 d-flex gap-2 flex-wrap">
                    <Link to="/" className="btn btn-warning fw-semibold px-4">Retour accueil</Link>
                    <Link to="/booking" className="btn btn-outline-secondary px-4">Prendre rendez-vous</Link>
                </div>
            </article>
        </main>
    )
}

export default LegalPage
