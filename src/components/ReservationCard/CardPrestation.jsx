export default function CardPrestation({ prestations, onSelectPrestation, loading }) {

    if (loading) return <p>Chargement prestations...</p>;

    return (
        <div className="card">
            <h2>Choisissez une prestation</h2>

            <div className="list">
                {prestations.map(p => (
                    <div
                        key={p.id}
                        className="list-item"
                        onClick={() => onSelectPrestation(p)}
                    >
                        {p.nomprestation}
                    </div>
                ))}
            </div>
        </div>
    );
}