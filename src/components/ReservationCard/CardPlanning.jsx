export default function CardPlanning({ planning, onSelectCreneau }) {
    const jours = Object.keys(planning || {}).sort();

    return (
        <div className="planning-container">
            <h2>Choisissez votre jour</h2>

            {!jours || jours.length === 0 ? (
                <p>Aucun créneau disponible.</p>
            ) : (
                <div className="planning-days">
                    {jours.map((jour) => {
                        const selectedPlanningDay = planning?.[jour];
                        const creneaux = Array.isArray(selectedPlanningDay)
                            ? selectedPlanningDay
                            : selectedPlanningDay?.creneaux || [];

                        return (
                            <details key={jour} className="planning-day">
                                <summary>
                                    <span>{selectedPlanningDay?.label || jour}</span>
                                    <span className="planning-day-count">
                                        {creneaux.length} créneau{creneaux.length > 1 ? "x" : ""}
                                    </span>
                                </summary>

                                <div className="planning-day-body">
                                    {creneaux.length === 0 ? (
                                        <p>Aucun créneau disponible pour cette date.</p>
                                    ) : (
                                        <label className="planning-field">
                                            <span>Horaire disponible</span>
                                            <select
                                                defaultValue=""
                                                onChange={(event) => {
                                                    const slotIndex = event.target.value;
                                                    if (slotIndex === "") return;

                                                    const creneau = creneaux[Number(slotIndex)];
                                                    if (!creneau || creneau?.available === false) return;

                                                    onSelectCreneau({
                                                        jour,
                                                        label: selectedPlanningDay?.label || jour,
                                                        ...creneau,
                                                    });
                                                }}
                                            >
                                                <option value="">Choisissez un créneau</option>
                                                {creneaux.map((creneau, index) => (
                                                    <option
                                                        key={`${jour}-${index}`}
                                                        value={index}
                                                        disabled={creneau?.available === false}
                                                    >
                                                        {creneau.start} → {creneau.end}
                                                        {creneau?.available === false ? " (indisponible)" : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    )}
                                </div>
                            </details>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
