
export default function CardCategorie({ categories, onSelectCategorie }) {
    return (
        <div className="card">
            <h2>Choisissez une catégorie</h2>

            <div className="list">
                {categories.map(cat => (
                    <div
                        key={cat.id}
                        className="list-item"
                        onClick={() => onSelectCategorie(cat)}
                    >
                        {cat.nom}
                    </div>
                ))}
            </div>
        </div>
    );
}
