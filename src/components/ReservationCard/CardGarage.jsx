export default function CardGarage({
    villeId,
    setVilleId,
    garages,
    loading,
    onSearchGarage,
    onSelectGarage,
    errorMessage
}) {
    return (
        <div className="card">
            <h2>Choisissez votre ville</h2>

            <div className="search-box">
                <input
                    placeholder="Code Postal"
                    value={villeId}
                    onChange={(e) => setVilleId(e.target.value)}
                />
                <button onClick={onSearchGarage}>Rechercher</button>
            </div>

            {loading && <p>Chargement garages...</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            <div className="list">
                {garages.map(g => (
                    <div
                        key={g.id_garage}
                        className="garage-item"
                        onClick={() => onSelectGarage(g)} //  pour passer au planning
                        style={{ cursor: "pointer" }}
                    >
                        {g.nom_garage} — {g.adresse_garage}
                    </div>
                ))}
            </div>
        </div>
    );
}