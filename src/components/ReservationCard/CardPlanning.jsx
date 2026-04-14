export default function CardPlanning({ prestations, onSelectCreneau }) {
    return (
        <div className="planning-container">
            <h2>Choisissez un créneau</h2>

            <div className="creneaux-grid">
                {prestations.map((creneau) => (
                    <button
                        key={creneau.id}
                        className="creneau-btn"
                        onClick={() => onSelectCreneau(creneau)}
                    >
                        {creneau.date} à {creneau.heure}
                    </button>
                ))}
            </div>
        </div>
    );
}