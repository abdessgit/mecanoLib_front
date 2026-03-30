import React from 'react';

const MentionsLegales = () => {
  return (
    <main className="container py-5" style={{maxWidth: 800}}>
      <h1 className="fw-bold mb-4">Mentions légales</h1>
      <p><strong>Éditeur du site :</strong> MecanoLib<br/>Adresse : 123 rue de la Mécanique, 75000 Paris<br/>Email : contact@mecanolib.fr<br/>SIRET : 123 456 789 00012</p>
      <p><strong>Hébergement :</strong> OVH, 2 rue Kellermann, 59100 Roubaix</p>
      <p><strong>Responsable de publication :</strong> M. Dupont</p>
      <p><strong>Propriété intellectuelle :</strong> Tous les contenus présents sur ce site sont la propriété de MecanoLib.</p>
    </main>
  );
};

export default MentionsLegales;
