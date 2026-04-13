import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPrestationsCatalogue, searchGarages } from '../../services/api'

const RechercheGarages = () => {
  const [ville, setVille] = useState('')
  const [prestationId, setPrestationId] = useState('')
  const [prestations, setPrestations] = useState([])
  const [garages, setGarages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getPrestationsCatalogue()
      .then((data) => setPrestations(Array.isArray(data?.prestations) ? data.prestations : []))
      .catch(() => setPrestations([]))
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = await searchGarages({
        ville: ville.trim(),
        prestationId: prestationId || undefined,
        onlyValidated: true,
      })
      setGarages(Array.isArray(data?.garages) ? data.garages : [])
    } catch (err) {
      setGarages([])
      setError(err.message || 'Recherche impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container py-5" style={{ maxWidth: 1000 }}>
      <section className="mb-4">
        <h1 className="fw-bold mb-2">Recherche de garages</h1>
        <p className="text-muted mb-0">Trouvez un garage partenaire selon votre ville et la prestation souhaitée.</p>
      </section>

      <form className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4" onSubmit={handleSubmit}>
        <div className="row g-3 align-items-end">
          <div className="col-md-5">
            <label className="form-label fw-semibold">Ville ou code postal</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ville ou code postal"
              value={ville}
              onChange={(event) => setVille(event.target.value)}
            />
          </div>
          <div className="col-md-5">
            <label className="form-label fw-semibold">Prestation</label>
            <select className="form-select" value={prestationId} onChange={(event) => setPrestationId(event.target.value)}>
              <option value="">Toutes les prestations</option>
              {prestations.map((prestation) => (
                <option key={prestation.idPrestation} value={prestation.idPrestation}>
                  {prestation.nomPrestation}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2 d-grid">
            <button type="submit" className="btn btn-warning fw-semibold" disabled={loading}>
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>
        </div>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="row g-3">
        {garages.length > 0 ? garages.map((garage) => (
          <div key={garage.idGarage} className="col-12 col-lg-6">
            <article className="card border-0 shadow-sm rounded-4 p-3 p-md-4 h-100">
              <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                <div>
                  <h2 className="h5 fw-bold mb-1">{garage.nomGarage}</h2>
                  <p className="text-muted mb-0">{garage.adresseGarage || 'Adresse non renseignee'}</p>
                </div>
                <span className="badge text-bg-success">Disponible</span>
              </div>
              <p className="mb-2"><strong>Ville:</strong> {garage.ville?.nomVille || '-'} {garage.ville?.codePostal || ''}</p>
              <p className="mb-2"><strong>Contact:</strong> {garage.telephoneGarage || garage.emailGarage || '-'}</p>
              <div>
                <strong className="d-block mb-2">Prestations</strong>
                <div className="d-flex flex-wrap gap-2">
                  {(garage.prestations || []).length > 0 ? garage.prestations.map((prestation) => (
                    <span key={prestation.idPrestation} className="badge text-bg-light border text-dark">
                      {prestation.nomPrestation}
                    </span>
                  )) : <span className="text-muted">Aucune prestation detaillee</span>}
                </div>
              </div>
              <div className="mt-3 d-flex gap-2 flex-wrap">
                <Link
                  to={`/booking?ville=${encodeURIComponent(garage.ville?.nomVille || ville)}&garageId=${garage.idGarage}`}
                  className="btn btn-warning fw-semibold"
                >
                  Reserver avec ce garage
                </Link>
              </div>
            </article>
          </div>
        )) : (
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 p-4 text-center text-muted">
              Aucun garage affiche pour le moment. Lancez une recherche pour voir les resultats.
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default RechercheGarages
