import React, { useEffect, useState, useCallback } from 'react';
import { Button, Modal } from './index';
import { PlusCircle, CheckCircle, Trash2, Tag, Loader2, AlertCircle } from 'lucide-react';
import { 
  getCategories, 
  getPrestationsByGarage, 
  getPrestations, 
  addPrestationsGarage, 
  deletePrestationGarage,
  getPropositionsByGarage,
  API_BASE_URL 
} from '../services/api';

const CACHE_KEY_CATEGORIES = 'mecano_cache_categories';
const CACHE_KEY_PRESTATIONS = 'mecano_cache_prestations';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const badgeColors = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
  'bg-red-100 text-red-800',
];
const getBadgeColor = (idx) => badgeColors[idx % badgeColors.length];

// Fonction utilitaire pour le cache
const getCache = (key) => {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const setCache = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // Ignore cache errors
  }
};

const PrestationsManager = ({ token, garageId }) => {
  const [categories, setCategories] = useState([]);
  const [allPrestations, setAllPrestations] = useState([]);
  const [garagePrestations, setGaragePrestations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPrestations, setSelectedPrestations] = useState([]);
  const [prixMap, setPrixMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  // Charger les données avec cache
  const loadData = useCallback(async (forceRefresh = false) => {
    if (!token || !garageId) {
      setError('Session invalide. Veuillez vous reconnecter.');
      setInitialLoading(false);
      return;
    }

    // Utiliser le cache si disponible et pas de force refresh
    const cachedCategories = !forceRefresh ? getCache(CACHE_KEY_CATEGORIES) : null;
    const cachedPrestations = !forceRefresh ? getCache(CACHE_KEY_PRESTATIONS) : null;

    if (cachedCategories && cachedPrestations && !forceRefresh) {
      console.log('✅ Données chargées depuis le cache');
      setCategories(cachedCategories);
      setAllPrestations(cachedPrestations);
      setInitialLoading(false);
      setBackgroundLoading(true);
    } else {
      setInitialLoading(true);
    }

    setError('');
    setLoadingStep('Chargement des prestations du garage...');
    
    const startTime = Date.now();
    
    try {
      // ÉTAPE 1: Charger les prestations du garage en PRIORITÉ
      let garagePres = [];
      let usedEndpoint = '';
      
      try {
        setLoadingStep('Récupération de vos prestations...');
        garagePres = await getPrestationsByGarage(token, garageId);
        usedEndpoint = 'get_prestations_by_garage';
      } catch (err1) {
        console.warn('⚠️ get_prestations_by_garage a échoué, fallback...');
        try {
          const propositions = await getPropositionsByGarage(garageId);
          usedEndpoint = 'get_propositions_by_garage';
          const allPres = cachedPrestations || [];
          garagePres = (Array.isArray(propositions) ? propositions : []).map(prop => {
            const fullPrestation = allPres.find(p => 
              p.id_prestation === prop.id_prestation || 
              p.idPrestation === prop.id_prestation
            );
            return {
              id_prestation: prop.id_prestation,
              nom_prestation: prop.nom_prestation,
              prix: prop.prix,
              categorie: fullPrestation?.categorie || null
            };
          });
        } catch (err2) {
          throw new Error(`Prestations du garage: ${err1.message}`);
        }
      }
      
      setGaragePrestations(Array.isArray(garagePres) ? garagePres : []);
      setInitialLoading(false);
      setLoadingStep('Chargement des catégories et prestations...');

      // ÉTAPE 2: Charger les catégories et prestations globales (en parallèle)
      const loadCategoriesAndPrestations = async () => {
        const results = await Promise.allSettled([
          getCategories(),
          getPrestations(token)
        ]);

        const cats = results[0].status === 'fulfilled' ? results[0].value : [];
        const allPres = results[1].status === 'fulfilled' ? results[1].value : [];

        if (results[0].status === 'rejected') {
          console.error('❌ Erreur catégories:', results[0].reason);
        }
        if (results[1].status === 'rejected') {
          console.error('❌ Erreur prestations globales:', results[1].reason);
        }

        // Mettre en cache
        if (Array.isArray(cats) && cats.length > 0) {
          setCache(CACHE_KEY_CATEGORIES, cats);
          setCategories(cats);
        }
        if (Array.isArray(allPres) && allPres.length > 0) {
          setCache(CACHE_KEY_PRESTATIONS, allPres);
          setAllPrestations(allPres);
        }

        // Mettre à jour les catégories des prestations du garage si on a les prestations globales
        if (Array.isArray(allPres) && allPres.length > 0 && usedEndpoint === 'get_propositions_by_garage') {
          setGaragePrestations(prev => prev.map(p => {
            const fullPrestation = allPres.find(gp => 
              gp.id_prestation === p.id_prestation || 
              gp.idPrestation === p.id_prestation
            );
            return fullPrestation ? { ...p, categorie: fullPrestation.categorie } : p;
          }));
        }

        return { cats, allPres };
      };

      const { cats, allPres } = await loadCategoriesAndPrestations();
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ Chargement terminé en ${loadTime}ms`);
      
      setDebugInfo({
        loadTimeMs: loadTime,
        categoriesCount: Array.isArray(cats) ? cats.length : 0,
        prestationsCount: Array.isArray(allPres) ? allPres.length : 0,
        garagePrestationsCount: Array.isArray(garagePres) ? garagePres.length : 0,
        usedEndpoint,
        fromCache: !!(cachedCategories && cachedPrestations && !forceRefresh),
        apiBaseUrl: API_BASE_URL
      });
      
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError(`Erreur: ${err.message}`);
      setDebugInfo(prev => ({ ...prev, error: err.message }));
    } finally {
      setInitialLoading(false);
      setBackgroundLoading(false);
      setLoadingStep('');
    }
  }, [token, garageId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData(true); // Force refresh sans cache
  };

  const handleDelete = async (prestationId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette prestation ?')) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await deletePrestationGarage(token, garageId, prestationId);
      setGaragePrestations((prev) => prev.filter((p) => 
        p.idPrestation !== prestationId && p.id_prestation !== prestationId
      ));
      setSuccess('Prestation supprimée avec succès');
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError(`Erreur lors de la suppression: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrestations = async () => {
    if (selectedPrestations.length === 0) {
      setError('Veuillez sélectionner au moins une prestation');
      return;
    }
    
    const missingPrices = selectedPrestations.filter(id => !prixMap[id] || parseFloat(prixMap[id]) <= 0);
    if (missingPrices.length > 0) {
      setError('Veuillez définir un prix pour toutes les prestations sélectionnées');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const prestations = selectedPrestations.map((id) => ({ 
        id, 
        prix: parseFloat(prixMap[id]) || 0 
      }));
      
      console.log('Ajout des prestations:', prestations);
      await addPrestationsGarage(token, garageId, prestations);
      
      setSuccess('Prestations ajoutées avec succès');
      
      // Rafraîchir sans forcer le cache
      await loadData(true);
      
      setSelectedPrestations([]);
      setPrixMap({});
      setSelectedCategory('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Erreur ajout:', err);
      setError(`Erreur lors de l'ajout: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Catégorie lookup
  const catMap = Object.fromEntries(
    categories.map((c, i) => [
      String(c.id_categorie || c.idCategorie), 
      { ...c, color: getBadgeColor(i) }
    ])
  );

  // Filtre les prestations par catégorie
  const prestationsByCategory = selectedCategory 
    ? allPrestations.filter(p => {
        const prestationCatId = String(
          p.categorie?.id_categorie || 
          p.categorie || 
          p.id_categorie || 
          ''
        );
        return prestationCatId === String(selectedCategory);
      })
    : [];

  // Affichage du chargement initial rapide
  if (initialLoading) {
    return (
      <div className="garage-dashboard-content">
        <div className="garage-dashboard-content-header">
          <h2 className="garage-dashboard-header-title">Prestations proposées</h2>
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '3rem',
          color: '#64748b',
          gap: '1rem'
        }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <div>{loadingStep}</div>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Chargement rapide en cours...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="garage-dashboard-content">
      <div className="garage-dashboard-content-header">
        <h2 className="garage-dashboard-header-title">Prestations proposées</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {backgroundLoading && (
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#64748b' }} />
          )}
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={loading || backgroundLoading}
            title="Rafraîchir"
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : '↻'}
          </Button>
          <Button 
            onClick={() => { setShowAddModal(true); setError(''); setSuccess(''); }} 
            variant="primary" 
            disabled={loading}
          >
            <PlusCircle size={18} /> Ajouter
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="garage-dashboard-error" style={{marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      
      {success && (
        <div className="garage-dashboard-success" style={{marginBottom: '1rem'}}>
          {success}
        </div>
      )}
      
      <div className="garage-dashboard-table-container">
        <table className="garage-dashboard-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {garagePrestations.map((p, idx) => {
              const catId = String(
                p.idCategorie || 
                p.categorie?.id_categorie || 
                p.categorie || 
                p.id_categorie || 
                ''
              );
              const cat = catMap[catId];
              const prestationId = p.idPrestation || p.id_prestation || p.id;
              
              return (
                <tr key={prestationId || idx}>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag size={16} style={{ color: '#64748b' }} />
                      {p.nomPrestation || p.nom_prestation || p.nom || 'Sans nom'}
                    </span>
                  </td>
                  <td>
                    {cat ? (
                      <span 
                        className={cat.color}
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        {cat.nom_categorie || cat.nomCategorie || cat.nom || 'Catégorie'}
                      </span>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: 13 }}>
                        {backgroundLoading ? '...' : '-'}
                      </span>
                    )}
                  </td>
                  <td>
                    {p.prix !== null && p.prix !== undefined ? (
                      <span style={{ color: '#059669', fontWeight: 700 }}>{p.prix} €</span>
                    ) : (
                      <span style={{ color: '#64748b', fontStyle: 'italic' }}>Non défini</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      style={{ color: '#e53e3e', borderColor: '#e53e3e' }} 
                      onClick={() => handleDelete(prestationId)}
                      disabled={loading}
                    >
                      <Trash2 size={16} style={{ marginRight: 4 }} /> Supprimer
                    </Button>
                  </td>
                </tr>
              );
            })}
            {garagePrestations.length === 0 && (
              <tr>
                <td colSpan={4} className="garage-dashboard-table-empty">
                  Aucune prestation sélectionnée. Cliquez sur &quot;Ajouter&quot; pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {debugInfo && (
        <details style={{ marginTop: '1rem', padding: '0.5rem', background: '#f1f5f9', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#64748b' }}>
          <summary>Informations de débogage</summary>
          <pre style={{ marginTop: '0.5rem', overflow: 'auto' }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      )}
      
      <Modal 
        isOpen={showAddModal} 
        onClose={() => { setShowAddModal(false); setError(''); }} 
        title="Ajouter des prestations"
      >
        <div className="garage-dashboard-modal-content" style={{ minWidth: '450px', maxWidth: '600px' }}>
          {error && (
            <div className="garage-dashboard-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          
          <div>
            <label className="garage-dashboard-modal-label" style={{ display: 'block', marginBottom: '0.25rem' }}>
              Catégorie :
            </label>
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)} 
              className="garage-dashboard-modal-select"
              style={{ width: '100%' }}
              disabled={categories.length === 0}
            >
              <option value="">-- Sélectionnez une catégorie --</option>
              {categories.length === 0 ? (
                <option value="" disabled>Chargement des catégories...</option>
              ) : (
                categories.map((cat) => (
                  <option 
                    key={cat.id_categorie || cat.idCategorie} 
                    value={cat.id_categorie || cat.idCategorie}
                  >
                    {cat.nom_categorie || cat.nomCategorie || cat.nom || 'Catégorie'}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className="garage-dashboard-modal-list" style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
            {!selectedCategory ? (
              <div className="garage-dashboard-modal-empty">
                Veuillez d&apos;abord choisir une catégorie ci-dessus.
              </div>
            ) : allPrestations.length === 0 ? (
              <div className="garage-dashboard-modal-empty">
                Chargement des prestations...
              </div>
            ) : prestationsByCategory.length === 0 ? (
              <div className="garage-dashboard-modal-empty">
                Aucune prestation disponible dans cette catégorie.
              </div>
            ) : (
              <>
                {prestationsByCategory.map((p) => {
                  const prestationId = p.id_prestation || p.idPrestation || p.id;
                  const dejaAssocie = garagePrestations.some(gp => 
                    gp.idPrestation === prestationId || 
                    gp.id_prestation === prestationId
                  );
                  const isSelected = selectedPrestations.includes(prestationId);
                  
                  return (
                    <div 
                      key={prestationId} 
                      className="garage-dashboard-modal-item" 
                      style={{
                        opacity: dejaAssocie ? 0.5 : 1,
                        pointerEvents: dejaAssocie ? 'none' : 'auto',
                        backgroundColor: isSelected ? '#eff6ff' : 'white',
                        borderColor: isSelected ? '#3b82f6' : '#e5e7eb'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        disabled={dejaAssocie} 
                        checked={isSelected}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedPrestations(prev => [...prev, prestationId]);
                          } else {
                            setSelectedPrestations(prev => prev.filter(id => id !== prestationId));
                            const newPrixMap = { ...prixMap };
                            delete newPrixMap[prestationId];
                            setPrixMap(newPrixMap);
                          }
                        }} 
                      />
                      <span className="garage-dashboard-modal-item-name" style={{ flex: 1 }}>
                        {p.nom_prestation || p.nomPrestation || p.nom || 'Prestation'}
                      </span>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        placeholder="Prix (€)" 
                        value={prixMap[prestationId] || ''} 
                        onChange={e => setPrixMap(prev => ({ 
                          ...prev, 
                          [prestationId]: e.target.value 
                        }))} 
                        className="garage-dashboard-modal-item-price" 
                        disabled={dejaAssocie || !isSelected}
                        style={{ 
                          width: '100px',
                          opacity: (!isSelected || dejaAssocie) ? 0.5 : 1
                        }}
                      />
                      {dejaAssocie && (
                        <span style={{marginLeft: 8, color: '#888', fontSize: 12, whiteSpace: 'nowrap'}}>
                          (déjà associée)
                        </span>
                      )}
                    </div>
                  );
                })}
                <div style={{marginTop: 10, color: '#64748b', fontSize: 14, fontStyle: 'italic'}}>
                  Cochez une ou plusieurs prestations, définissez leur prix, puis cliquez sur <b>Ajouter</b>.
                </div>
              </>
            )}
          </div>
          
          <div className="garage-dashboard-modal-actions" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <Button 
              variant="outline" 
              onClick={() => setShowAddModal(false)} 
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleAddPrestations} 
              disabled={selectedPrestations.length === 0 || loading}
            >
              {loading ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <CheckCircle size={16} />
              )}
              {loading ? ' Ajout...' : ' Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PrestationsManager;
