import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserPlus, CheckCircle2, XCircle, RefreshCw, LogOut, FolderTree, Wrench, Pencil, Trash2, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, Button } from '../../components';
import {
	clearStoredAuth,
	createCategory,
	createPrestation,
	createSuperAdmin,
	deleteCategory,
	deletePrestationGarage,
	deletePrestation,
	getCategories,
	getGaragesForModeration,
	getPrestationsByCategorie,
	getProfile,
	getStoredAuth,
	isJwtExpired,
	updateCategory,
	updatePrestation,
	validateGarage,
} from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [profile, setProfile] = useState(null);
	const [garages, setGarages] = useState([]);
	const [filter, setFilter] = useState('pending');
	const [moderationState, setModerationState] = useState({});
	const [garageModerationLocalOnly, setGarageModerationLocalOnly] = useState(false);
	const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
	const [highlightedGarageId, setHighlightedGarageId] = useState('');
	const [error, setError] = useState('');

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [creatingAdmin, setCreatingAdmin] = useState(false);
	const [adminMessage, setAdminMessage] = useState('');
	const [categories, setCategories] = useState([]);
	const [selectedCategoryId, setSelectedCategoryId] = useState('');
	const [prestationsByCategory, setPrestationsByCategory] = useState({});
	const [catalogLoading, setCatalogLoading] = useState(false);
	const [catalogMessage, setCatalogMessage] = useState('');
	const [newCategoryName, setNewCategoryName] = useState('');
	const [newPrestation, setNewPrestation] = useState({ name: '', description: '', duration: '' });

	const { token, role } = getStoredAuth();

	const getGarageStatus = useCallback((garage) => {
		if (garage.isValide) return 'validated';
		if (moderationState[garage.idGarage] === 'refused') return 'refused';
		return 'pending';
	}, [moderationState]);

	const counters = useMemo(() => {
		const summary = { all: garages.length, pending: 0, validated: 0, refused: 0 };
		garages.forEach((garage) => {
			const status = getGarageStatus(garage);
			summary[status] += 1;
		});
		return summary;
	}, [garages, getGarageStatus]);

	const selectedCategory = useMemo(
		() => categories.find((item) => item.id === selectedCategoryId) || null,
		[categories, selectedCategoryId]
	);

	const displayedGarages = useMemo(() => {
		if (filter === 'all') return garages;
		return garages.filter((garage) => getGarageStatus(garage) === filter);
	}, [garages, filter, getGarageStatus]);

	const pendingGarages = useMemo(() => (
		garages.filter((garage) => getGarageStatus(garage) === 'pending')
	), [garages, getGarageStatus]);

	const loadData = async ({ withSpinner = true } = {}) => {
		if (withSpinner) setLoading(true);
		setRefreshing(!withSpinner);
		setError('');

		try {
			const [connectedResult, listResult] = await Promise.allSettled([
				getProfile(token),
				getGaragesForModeration(token),
			]);

			if (connectedResult.status === 'fulfilled') {
				setProfile(connectedResult.value);
			}

			if (listResult.status === 'fulfilled') {
				setGarages(Array.isArray(listResult.value?.garages) ? listResult.value.garages : []);
			}

			if (connectedResult.status === 'rejected' && listResult.status === 'rejected') {
				throw new Error(connectedResult.reason?.message || listResult.reason?.message || 'Impossible de charger le dashboard admin.');
			}
		} catch (err) {
			setError(err.message || 'Impossible de charger le dashboard admin.');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}

		loadCatalog();
	};

	const normalizeCategory = (item) => ({
		id: String(item?.id_categorie ?? item?.idCategorie ?? item?.id ?? ''),
		name: item?.nom_categorie || item?.nomCategorie || item?.nom || 'Categorie',
	});

	const normalizePrestation = (item, index) => {
		const source = item?.prestation || item?.prestationDTO || item;
		const rawId =
			source?.id_prestation ??
			source?.idPrestation ??
			source?.idprestation ??
			source?.prestation_id ??
			source?.prestationId ??
			source?.id ??
			null;

		return {
			id: rawId === null || rawId === undefined || rawId === '' ? null : String(rawId),
			name: source?.nomprestation || source?.nom_prestation || source?.nomPrestation || source?.nom || `Prestation ${index + 1}`,
			description: source?.descriptionprestation || source?.description_prestation || source?.descriptionPrestation || source?.description || '',
			duration: source?.duree_prestation || source?.dureePrestation || source?.duree || '',
		};
	};

	const loadPrestationsForCategory = async (categoryId, { force = false, withLoading = true } = {}) => {
		if (!categoryId) return;
		if (!force && prestationsByCategory[categoryId]) return;

		if (withLoading) setCatalogLoading(true);
		try {
			let prestationsResponse = [];
			try {
				prestationsResponse = await getPrestationsByCategorie(categoryId);
			} catch {
				prestationsResponse = [];
			}

			const prestations = (Array.isArray(prestationsResponse) ? prestationsResponse : []).map((rawItem, index) =>
				normalizePrestation(rawItem, index)
			);

			setPrestationsByCategory((prev) => ({
				...prev,
				[categoryId]: prestations,
			}));
		} catch (err) {
			setError(err.message || 'Impossible de charger les prestations de la categorie.');
		} finally {
			if (withLoading) setCatalogLoading(false);
		}
	};

	const loadCatalog = async () => {
		setCatalogLoading(true);
		try {
			const categoriesResponse = await getCategories();
			const normalizedCategories = (Array.isArray(categoriesResponse) ? categoriesResponse : [])
				.map(normalizeCategory)
				.filter((item) => item.id);

			setCategories(normalizedCategories);
			setPrestationsByCategory((prev) => {
				const next = {};
				normalizedCategories.forEach((category) => {
					if (prev[category.id]) next[category.id] = prev[category.id];
				});
				return next;
			});

			const firstId = normalizedCategories[0]?.id || '';
			const resolvedCategoryId =
				(selectedCategoryId && normalizedCategories.some((item) => item.id === selectedCategoryId)
					? selectedCategoryId
					: firstId);

			setSelectedCategoryId(resolvedCategoryId);
			await loadPrestationsForCategory(resolvedCategoryId, { force: true, withLoading: false });
		} catch (err) {
			setError(err.message || 'Impossible de charger les categories et prestations.');
		} finally {
			setCatalogLoading(false);
		}
	};

	useEffect(() => {
		if (!token || isJwtExpired(token) || role !== 'superadmin') {
			clearStoredAuth();
			navigate('/admin');
			return;
		}

		loadData({ withSpinner: true });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [navigate, role, token]);

	useEffect(() => {
		if (!loading) return;

		const timer = setTimeout(() => {
			setLoading(false);
			setRefreshing(false);
			setError((current) => current || 'Chargement trop long: verifiez la reponse du backend admin.');
		}, 8000);

		return () => clearTimeout(timer);
	}, [loading]);

	useEffect(() => {
		if (!selectedCategoryId) return;
		loadPrestationsForCategory(selectedCategoryId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedCategoryId]);

	const handleLogout = () => {
		clearStoredAuth();
		navigate('/admin');
	};

	const handleNotificationClick = (garageId) => {
		setFilter('pending');
		setHighlightedGarageId(String(garageId || ''));
		setIsNotificationsOpen(false);

		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => {
				const target = document.getElementById(`admin-garage-${garageId}`);
				if (target) {
					target.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			});
		});
	};

	const handleCreateSuperAdmin = async (e) => {
		e.preventDefault();
		setCreatingAdmin(true);
		setAdminMessage('');

		try {
			await createSuperAdmin(token, { email, mdp: password });
			setAdminMessage('Super admin ajouté avec succès.');
			setEmail('');
			setPassword('');
		} catch (err) {
			setAdminMessage(err.message || 'Création super admin impossible.');
		} finally {
			setCreatingAdmin(false);
		}
	};

	const handleGarageValidation = async (garageId, isValide) => {
		const applyLocalStatus = () => {
			setGarages((prev) => prev.map((g) => (g.idGarage === garageId ? { ...g, isValide } : g)));
			setModerationState((prev) => ({
				...prev,
				[garageId]: isValide ? 'validated' : 'refused',
			}));
		};

		if (garageModerationLocalOnly) {
			applyLocalStatus();
			setError('Mode local actif: la validation des garages est visible dans le dashboard mais non persistée en base tant que l API backend manque.');
			return;
		}

		try {
			await validateGarage(token, garageId, isValide);
			applyLocalStatus();
		} catch (err) {
			const message = err?.message || '';
			if (message.includes('Validation garage indisponible')) {
				setGarageModerationLocalOnly(true);
				applyLocalStatus();
				setError('Validation backend indisponible: le changement est applique localement dans le dashboard, mais pas encore en base de donnees.');
				return;
			}
			setError(message || 'Action impossible sur ce garage.');
		}
	};

	const handleAddCategory = async (e) => {
		e.preventDefault();
		setCatalogMessage('');
		try {
			await createCategory(token, { name: newCategoryName.trim() });
			setNewCategoryName('');
			setCatalogMessage('Categorie ajoutee avec succes.');
			await loadCatalog();
		} catch (err) {
			setError(err.message || 'Impossible d ajouter la categorie.');
		}
	};

	const handleAddPrestation = async (e) => {
		e.preventDefault();
		if (!selectedCategoryId) return;
		setCatalogMessage('');
		try {
			await createPrestation(token, {
				name: newPrestation.name.trim(),
				description: newPrestation.description.trim(),
				duration: newPrestation.duration.trim(),
				categoryId: selectedCategoryId,
			});
			setNewPrestation({ name: '', description: '', duration: '' });
			setCatalogMessage('Prestation ajoutee avec succes.');
			await loadCatalog();
		} catch (err) {
			setError(err.message || 'Impossible d ajouter la prestation.');
		}
	};

	const handleEditCategory = async () => {
		if (!selectedCategory?.id) return;

		const nextName = window.prompt('Nouveau nom de la categorie', selectedCategory.name || '');
		if (nextName === null || !nextName.trim()) return;

		setCatalogMessage('');
		try {
			await updateCategory(token, selectedCategory.id, { name: nextName.trim() });
			setCatalogMessage('Categorie modifiee avec succes.');
			await loadCatalog();
		} catch (err) {
			setError(err.message || 'Impossible de modifier la categorie.');
		}
	};

	const handleDeleteCategory = async () => {
		if (!selectedCategory?.id) return;
		if (!window.confirm(`Supprimer la categorie "${selectedCategory.name}" ?`)) return;

		setCatalogMessage('');
		try {
			await deleteCategory(token, selectedCategory.id);
			setCatalogMessage('Categorie supprimee avec succes.');
			await loadCatalog();
		} catch (err) {
			setError(err.message || 'Impossible de supprimer la categorie.');
		}
	};

	const handleEditPrestation = async (prestation) => {
		if (!prestation?.id) {
			setCatalogMessage('Modification impossible: l API ne renvoie pas l identifiant de cette prestation.');
			return;
		}

		const nextName = window.prompt('Nouveau nom de la prestation', prestation.name || '');
		if (nextName === null || !nextName.trim()) return;
		const nextDescription = window.prompt('Nouvelle description', prestation.description || '');
		if (nextDescription === null || !nextDescription.trim()) return;
		const nextDuration = window.prompt('Nouvelle duree (ex: 45 min)', prestation.duration || '45 min');
		if (nextDuration === null || !nextDuration.trim()) return;

		try {
			await updatePrestation(token, prestation.id, {
				name: nextName.trim(),
				description: nextDescription.trim(),
				duration: nextDuration.trim(),
				categoryId: selectedCategoryId,
			});
			setCatalogMessage('Prestation modifiee avec succes.');
			await loadCatalog();
		} catch (err) {
			setError(err.message || 'Impossible de modifier la prestation.');
		}
	};

	const handleDeletePrestation = async (prestation) => {
		if (!prestation?.id) {
			setCatalogMessage('Suppression impossible: l API ne renvoie pas l identifiant de cette prestation.');
			return;
		}
		if (!window.confirm(`Supprimer la prestation "${prestation.name}" ?`)) return;

		try {
			const garageIds = Array.from(
				new Set(
					(garages || [])
						.map((garage) => garage?.idGarage ?? garage?.id ?? null)
						.filter((id) => id !== null && id !== undefined && id !== '')
						.map((id) => String(id))
				)
			);

			if (garageIds.length) {
				await Promise.allSettled(
					garageIds.map((garageId) => deletePrestationGarage(token, garageId, prestation.id))
				);
			}

			await deletePrestation(token, prestation.id);
			setCatalogMessage('Prestation supprimee avec succes.');
			await loadCatalog();
		} catch (err) {
			const message = err?.message || '';
			if (message.includes('/api/v1/delete_prestation/') || message.includes('500')) {
				setError(`Suppression impossible: erreur backend sur delete_prestation. Detail: ${message}`);
				return;
			}
			setError(message || 'Impossible de supprimer la prestation.');
		}
	};

	if (loading) {
		return <div className="admin-dashboard-loading">Chargement du dashboard...</div>;
	}

	return (
		<div className="admin-dashboard-page">
			<motion.div
				className="admin-dashboard-shell"
				initial={{ opacity: 0, y: 18 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35 }}
			>
				<header className="admin-dashboard-header">
					<div className="admin-dashboard-title-wrap">
						<div className="admin-dashboard-title-icon">
							<ShieldCheck size={24} />
						</div>
						<div>
							<h1>Dashboard Super Admin</h1>
							<p>Gérez les comptes administrateurs et validez les garages inscrits.</p>
						</div>
					</div>

					<div className="admin-dashboard-header-actions">
						<div className="admin-dashboard-notifications">
							<button
								type="button"
								className="admin-dashboard-notify-button"
								onClick={() => setIsNotificationsOpen((prev) => !prev)}
								aria-label="Voir les garages en attente"
								title="Garages en attente"
							>
								<Bell size={18} />
								<span className="admin-dashboard-notify-badge">{pendingGarages.length}</span>
							</button>

							{isNotificationsOpen && (
								<div className="admin-dashboard-notifications-panel">
									<div className="admin-dashboard-notifications-header">
										<strong>Garages en attente</strong>
										<span>{pendingGarages.length}</span>
									</div>

									<div className="admin-dashboard-notifications-list">
										{pendingGarages.length === 0 ? (
											<div className="admin-dashboard-notifications-empty">
												Aucun garage en attente de validation.
											</div>
										) : (
											pendingGarages.map((garage) => (
												<button
													key={garage.idGarage}
													type="button"
													className="admin-dashboard-notification-item"
													onClick={() => handleNotificationClick(garage.idGarage)}
												>
													<div className="admin-dashboard-notification-top">
														<span className="admin-dashboard-notification-name">{garage.nomGarage}</span>
														<span className="admin-dashboard-notification-status">À valider</span>
													</div>
													<span className="admin-dashboard-notification-meta">{garage.emailGarage || 'Email non renseigné'}</span>
													<span className="admin-dashboard-notification-meta">{garage.telephoneGarage || 'Téléphone non renseigné'}</span>
												</button>
											))
										)}
									</div>
								</div>
							)}
						</div>

						<Button type="button" onClick={() => loadData({ withSpinner: false })} disabled={refreshing}>
							<RefreshCw size={16} />
							{refreshing ? 'Actualisation...' : 'Actualiser'}
						</Button>
						<Button type="button" onClick={handleLogout}>
							<LogOut size={16} />
							Déconnexion
						</Button>
					</div>
				</header>

				{error && <div className="admin-dashboard-error">{error}</div>}
				{catalogMessage && <div className="admin-dashboard-note">{catalogMessage}</div>}

				<section className="admin-dashboard-grid">
					<Card className="admin-dashboard-card">
						<CardContent className="admin-dashboard-card-content">
							<h2><UserPlus size={18} /> Ajouter un superadmin</h2>
							<form onSubmit={handleCreateSuperAdmin} className="admin-dashboard-form">
								<label>
									Email
									<input
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="nouveau-admin@mecanolib.fr"
										required
									/>
								</label>

								<label>
									Mot de passe
									<input
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="Minimum 6 caractères"
										minLength={6}
										required
									/>
								</label>

								<Button type="submit" disabled={creatingAdmin}>
									{creatingAdmin ? 'Création...' : 'Créer superadmin'}
								</Button>
							</form>

							{adminMessage && <div className="admin-dashboard-note">{adminMessage}</div>}
							<p className="admin-dashboard-profile">Connecté en tant que: {profile?.email || 'superadmin'}</p>
						</CardContent>
					</Card>

					<Card className="admin-dashboard-card admin-dashboard-card-wide">
						<CardContent className="admin-dashboard-card-content">
							<div className="admin-dashboard-kpis">
								<div className="admin-dashboard-kpi">
									<span>Total</span>
									<strong>{counters.all}</strong>
								</div>
								<div className="admin-dashboard-kpi pending">
									<span>En attente</span>
									<strong>{counters.pending}</strong>
								</div>
								<div className="admin-dashboard-kpi validated">
									<span>Validés</span>
									<strong>{counters.validated}</strong>
								</div>
								<div className="admin-dashboard-kpi refused">
									<span>Refusés</span>
									<strong>{counters.refused}</strong>
								</div>
							</div>

							<div className="admin-dashboard-section-head">
								<h2>Validation des garages</h2>
								<div className="admin-dashboard-filters">
									<button
										type="button"
										className={filter === 'pending' ? 'active' : ''}
										onClick={() => setFilter('pending')}
									>
										En attente ({counters.pending})
									</button>
									<button
										type="button"
										className={filter === 'validated' ? 'active' : ''}
										onClick={() => setFilter('validated')}
									>
										Validés ({counters.validated})
									</button>
									<button
										type="button"
										className={filter === 'refused' ? 'active' : ''}
										onClick={() => setFilter('refused')}
									>
										Refusés ({counters.refused})
									</button>
									<button
										type="button"
										className={filter === 'all' ? 'active' : ''}
										onClick={() => setFilter('all')}
									>
										Tous ({counters.all})
									</button>
								</div>
							</div>

							{displayedGarages.length === 0 ? (
								<div className="admin-dashboard-empty">Aucun garage à afficher.</div>
							) : (
								<div className="admin-dashboard-garage-list">
									{garageModerationLocalOnly && (
										<div className="admin-dashboard-note">
											La validation/refus fonctionne actuellement en mode local uniquement, car la route backend de moderation garage est absente.
										</div>
									)}
									{displayedGarages.map((garage) => (
										<article
											id={`admin-garage-${garage.idGarage}`}
											key={garage.idGarage}
											className={`admin-dashboard-garage-card ${String(highlightedGarageId) === String(garage.idGarage) ? 'active' : ''}`}
										>
											<div className="admin-dashboard-garage-main">
												<h3>{garage.nomGarage}</h3>
												<p>{garage.emailGarage}</p>
												<p>{garage.telephoneGarage}</p>
												<p>{garage.adresseGarage}</p>
											</div>

											<div className="admin-dashboard-garage-actions">
												<span className={`admin-dashboard-status ${getGarageStatus(garage) === 'validated' ? 'ok' : getGarageStatus(garage) === 'refused' ? 'refused' : 'ko'}`}>
													{getGarageStatus(garage) === 'validated' ? 'Validé' : getGarageStatus(garage) === 'refused' ? 'Refusé' : 'En attente'}
												</span>
												<div className="admin-dashboard-garage-buttons">
													<button type="button" onClick={() => handleGarageValidation(garage.idGarage, true)}>
														<CheckCircle2 size={16} /> Accepter
													</button>
													<button type="button" className="danger" onClick={() => handleGarageValidation(garage.idGarage, false)}>
														<XCircle size={16} /> Refuser
													</button>
												</div>
											</div>
										</article>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</section>

				<section className="admin-dashboard-grid admin-catalog-grid">
					<Card className="admin-dashboard-card">
						<CardContent className="admin-dashboard-card-content">
							<h2><FolderTree size={18} /> Categories</h2>
							<form onSubmit={handleAddCategory} className="admin-dashboard-form">
								<label>
									Nom de categorie
									<input
										type="text"
										value={newCategoryName}
										onChange={(e) => setNewCategoryName(e.target.value)}
										placeholder="Ex: Freinage"
										required
									/>
								</label>
								<Button type="submit">Ajouter categorie</Button>
							</form>

							<div className="admin-categories-list">
								{categories.map((category) => (
									<button
										key={category.id}
										type="button"
										className={`admin-category-item ${selectedCategoryId === category.id ? 'active' : ''}`}
										onClick={() => setSelectedCategoryId(category.id)}
									>
										{category.name}
									</button>
								))}
							</div>

							<div className="admin-category-actions">
								<button type="button" onClick={handleEditCategory} disabled={!selectedCategoryId || catalogLoading}>
									<Pencil size={15} /> Modifier categorie
								</button>
								<button type="button" className="danger" onClick={handleDeleteCategory} disabled={!selectedCategoryId || catalogLoading}>
									<Trash2 size={15} /> Supprimer categorie
								</button>
							</div>
						</CardContent>
					</Card>

					<Card className="admin-dashboard-card admin-dashboard-card-wide">
						<CardContent className="admin-dashboard-card-content">
							<h2><Wrench size={18} /> Prestations de la categorie</h2>
							<form onSubmit={handleAddPrestation} className="admin-dashboard-form">
								<label>
									Nom prestation
									<input
										type="text"
										value={newPrestation.name}
										onChange={(e) => setNewPrestation((prev) => ({ ...prev, name: e.target.value }))}
										placeholder="Ex: Changement plaquettes"
										required
									/>
								</label>
								<label>
									Description
									<input
										type="text"
										value={newPrestation.description}
										onChange={(e) => setNewPrestation((prev) => ({ ...prev, description: e.target.value }))}
										placeholder="Description de la prestation"
										required
									/>
								</label>
								<label>
									Duree
									<input
										type="text"
										value={newPrestation.duration}
										onChange={(e) => setNewPrestation((prev) => ({ ...prev, duration: e.target.value }))}
										placeholder="Ex: 45 min"
										required
									/>
								</label>
								<Button type="submit" disabled={!selectedCategoryId || catalogLoading}>Ajouter prestation</Button>
							</form>

							{!selectedCategoryId ? (
								<div className="admin-dashboard-empty">Selectionnez une categorie.</div>
							) : (
								<div className="admin-prestations-list">
									{(prestationsByCategory[selectedCategoryId] || []).map((prestation, index) => (
										<div key={prestation.id || `${prestation.name}-${index}`} className="admin-prestation-item">
											<div className="admin-prestation-main">
												<strong>{prestation.name}</strong>
												<span>{prestation.description || 'Sans description'}</span>
												<span>Duree: {prestation.duration || 'Non renseignee'}</span>
													{!prestation.id && (
														<span className="admin-prestation-warning">ID absent depuis l API: edition/suppression indisponibles.</span>
													)}
											</div>
											<div className="admin-prestation-actions">
													<button type="button" onClick={() => handleEditPrestation(prestation)} disabled={!prestation.id} title={!prestation.id ? 'Action indisponible: identifiant absent' : ''}>
													<Pencil size={15} /> Modifier
												</button>
													<button type="button" className="danger" onClick={() => handleDeletePrestation(prestation)} disabled={!prestation.id} title={!prestation.id ? 'Action indisponible: identifiant absent' : ''}>
													<Trash2 size={15} /> Supprimer
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</section>
			</motion.div>
		</div>
	);
};

export default AdminDashboard;
