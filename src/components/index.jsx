import React from "react";

export function Button({ children, variant = "primary", size = "md", className = "", onClick, disabled, type = "button", ...props }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "0.5rem",
    border: "1px solid transparent",
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    padding: size === "sm" ? "0.4rem 0.75rem" : "0.6rem 1rem",
    fontSize: size === "sm" ? "0.875rem" : "0.9375rem",
    background: variant === "outline" ? "#111111" : "#facc15",
    color: variant === "outline" ? "#ffffff" : "#000000",
    borderColor: variant === "outline" ? "#444444" : "#facc15",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className} style={base} {...props}>
      {children}
    </button>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        height: "44px",
        padding: "0 0.75rem",
        fontSize: "0.875rem",
        color: "#eeeeee",
        background: "#1a1a1a",
        border: "1px solid #444444",
        borderRadius: "0.625rem",
        outline: "none",
        ...(props.style || {}),
      }}
    />
  );
}

export function Card({ children, className = "" }) {
  return (
    <div
      className={className}
      style={{
        background: "#111111",
        borderRadius: "1rem",
        border: "1px solid #333333",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

const STATUS_LABELS = {
  reserved: { text: "Réservé", bg: "#1a1a1a", color: "#facc15" },
  pending: { text: "En attente", bg: "#1a1a1a", color: "#facc15" },
  confirmed: { text: "Confirmé", bg: "#1a1a1a", color: "#facc15" },
  completed: { text: "Terminé", bg: "#1a1a1a", color: "#ffffff" },
  refused: { text: "Refusé", bg: "#3d1515", color: "#ffffff" },
  cancelled_client: { text: "Annulé client", bg: "#3d1515", color: "#ffffff" },
  cancelled_garage: { text: "Annulé garage", bg: "#3d1515", color: "#ffffff" },
};

export function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase().trim();
  const conf = STATUS_LABELS[s] || { text: s || "Inconnu", bg: "#1a1a1a", color: "#ffffff" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.25rem 0.6rem",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: conf.bg,
        color: conf.color,
      }}
    >
      {conf.text}
    </span>
  );
}

export function Modal({ isOpen, onClose, title, children, size = "md", footer }) {
  if (!isOpen) return null;
  const width = size === "lg" ? "640px" : "480px";
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15,23,42,0.45)",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: width,
          background: "#111111",
          borderRadius: "1rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid #333333",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#ffffff" }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.25rem",
              lineHeight: 1,
              cursor: "pointer",
              color: "#aaaaaa",
            }}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <div style={{ padding: "1.25rem" }}>{children}</div>
        {footer && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              padding: "0.75rem 1.25rem",
              borderTop: "1px solid #333333",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export { PrestationsManager } from "./PrestationsManager.jsx";
