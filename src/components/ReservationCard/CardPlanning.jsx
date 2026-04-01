export default function CardPlanning({ prestations, onSelectCreneau }) {
    return (
        <div className="card">
            <h2>Planning disponible</h2>

            <div className="list">
                {prestations.length === 0 && <p>Aucun créneau disponible.</p>}
                {prestations.map((p, index) => (
                    <div
                        key={index}
                        className="planning-item"
                        onClick={() => onSelectCreneau(p)}
                        style={{ cursor: "pointer" }}
                    >
                        {p.date} à {p.heure}
                    </div>
                ))}
            </div>
        </div>
    );
}