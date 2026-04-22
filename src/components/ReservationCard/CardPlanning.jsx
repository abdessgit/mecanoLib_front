import { useState } from "react";

export default function CardPlanning({ planning, onSelectCreneau }) {
    const [selectedDay, setSelectedDay] = useState("__AUTO__");
    const jours = planning ? Object.keys(planning).sort() : [];
    const effectiveSelectedDay =
        selectedDay === "__AUTO__"
            ? jours[0] || null
            : selectedDay && planning?.[selectedDay]
                ? selectedDay
                : selectedDay === null
                    ? null
                    : jours[0] || null;
    const selectedPlanningDay = effectiveSelectedDay ? planning?.[effectiveSelectedDay] : null;
    const creneaux = Array.isArray(selectedPlanningDay)
        ? selectedPlanningDay
        : selectedPlanningDay?.creneaux || [];

    return (
        <div className="planning-container">
            <h2>
                {effectiveSelectedDay
                    ? `Créneaux pour ${selectedPlanningDay?.label || effectiveSelectedDay}`
                    : "Choisissez une date"}
            </h2>

            {!jours || jours.length === 0 ? (
                <p>Aucun créneau disponible.</p>
            ) : (
                <>
                    {effectiveSelectedDay ? (
                        <>
                            <button type="button" className="btn-back" onClick={() => setSelectedDay(null)}>
                                ← Retour aux dates
                            </button>
                            {creneaux.length === 0 ? (
                                <p>Aucun créneau disponible pour cette date.</p>
                            ) : (
                                <div className="creneaux-grid">
                                    {creneaux.map((creneau, index) => (
                                        <button
                                            key={`${effectiveSelectedDay}-${index}`}
                                            type="button"
                                            disabled={creneau?.available === false}
                                            className={`creneau-btn ${creneau?.available === false ? "blocked" : "free"}`}
                                            onClick={() =>
                                                creneau?.available !== false &&
                                                onSelectCreneau({
                                                    jour: effectiveSelectedDay,
                                                    label: selectedPlanningDay?.label || effectiveSelectedDay,
                                                    ...creneau,
                                                })
                                            }
                                        >
                                            {creneau.start} → {creneau.end}
                                            {creneau?.available === false ? " Indisponible" : ""}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="dates-list">
                            {jours.map((jour) => (
                                <button
                                    key={jour}
                                    type="button"
                                    className="date-btn"
                                    onClick={() => setSelectedDay(jour)}
                                >
                                    {planning?.[jour]?.label || jour}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
