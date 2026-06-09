# CHANGELOG

## [1.1.0] - 2026-06-09

### CHANGEMENTS EFFECTUÉS DANS LE CODE

---

## Backend

### `utils/logger.js` — Nouveau fichier
- Ajout de Winston comme système de journalisation centralisé
- Logs écrits dans `logs/error.log` (niveau error) et `logs/combined.log` (tous niveaux)
- Affichage coloré dans la console en mode développement uniquement
- Remplacement de tous les `console.log` / `console.error` par `logger.info`, `logger.warn`, `logger.error`

### `server.js`
- Ajout de `helmet` pour sécuriser les headers HTTP
- Ajout de `cookie-parser` pour lire les cookies HTTPOnly
- Ajout de `express-rate-limit` sur les routes `/api/auth` (20 tentatives / 15 min) pour bloquer les attaques brute-force
- `credentials: true` sur la config CORS (obligatoire pour les cookies cross-origin)
- Remplacement du `console.log` de démarrage par `logger.info`

### `authController.js`
- Ajout de la validation des entrées avec **Joi** sur `login` et `register`
- Le token JWT est désormais placé dans un **cookie HTTPOnly, secure, sameSite: strict** au lieu d'être renvoyé dans le body (protection XSS)
- Ajout de la fonction `logout` qui efface le cookie
- Suppression de tous les `console.log` / `console.error`, remplacés par `debug` + `logger`

### `authMiddleware.js`
- Lecture du token depuis `req.cookies.token` au lieu du header `Authorization` (aligné avec le cookie HTTPOnly)
- Suppression des `console.log` / `console.error`, remplacés par `logger.warn`
- Messages d'erreur plus explicites (`Token manquant`, `Token invalide ou expiré`)

### `orderController.js`
- Ajout de la validation **Joi** sur `createOrder` (items, shippingAddress, paymentMethod, shippingMethod)
- Ajout de la validation **Joi** sur `updateOrderStatus` (statuts autorisés explicitement)
- `deleteOrder` implémenté (était vide) avec `findByIdAndDelete` et gestion d'erreur
- `validateOrder` fait désormais un vrai `findByIdAndUpdate` en base (était un simple `res.json`)
- Email de notification extrait en variable d'environnement `NOTIFY_EMAIL` (suppression de l'email en dur)
- Suppression de tout le code commenté (ancienne version de `createOrder`)
- Suppression de tous les `console.log` / `console.error`, remplacés par `debug` + `logger`
- Notifications dans un `try/catch` isolé pour ne pas bloquer la réponse principale

### `adminController.js`
- Ajout de la validation **Joi** sur `updateOrderStatus` et `updateProductStock`
- Vérification `findById` avant update (retourne 404 si non trouvé)
- Notifications dans des `try/catch` isolés
- Suppression de tous les `console.log`, remplacés par `debug` + `logger`

### `productController.js`
- Ajout de la validation **Joi** sur `updateProductStock`
- Ajout d'un `try/catch` sur `getProducts` (était sans gestion d'erreur)
- Suppression des `console.log` / `console.error`, remplacés par `debug` + `logger`

### `routes/authRoutes.js`
- Ajout de la route `POST /logout`

---

## Gateway

### `gateway/server.js`
- Remplacement du `console.log` par Winston

### `gateway/routes/notifi.js`
- Correction du `proxyReqPathResolver` : `req.originalUrl` causait un double chemin `/notify/notify`, remplacé par `() => '/notify'`

### `gateway/routes/stock.js`
- Même correction : `() => '/update-stock'`

### `gateway/routes/auth.js`
- Même correction : `() => '/auth'`

---

## Service de notification

### `notifi/server.js`
- Remplacement de tous les `console.log` / `console.error` par Winston
- Ajout de la validation des champs requis (`to`, `subject`, `text`) avec retour 400
- Suppression des credentials affichés dans les logs au démarrage

---

## Frontend

### `services/api.js`
- Création d'une instance axios centralisée avec `withCredentials: true`
- Suppression des `console.log` et de la lecture du token depuis `localStorage`
- Suppression du header `Authorization: Bearer` (le cookie est transmis automatiquement)

### `services/adminApi.js`
- Même refonte : instance axios avec `withCredentials: true`
- Suppression de tous les `localStorage.getItem('token')`
- Suppression des `console.error` et `try/catch` inutiles (les erreurs remontent aux composants)

### `pages/Login.js`
- Le token n'est **plus stocké dans `localStorage`** (vulnérable aux attaques XSS)
- Ajout de `{ withCredentials: true }` sur l'appel axios
- Remplacement des `alert()` par un état `error` affiché dans l'interface
- Ajout d'un état `loading` avec bouton désactivé pendant la requête
- Ajout de `autoComplete` sur les champs

### `pages/Register.js`
- Même refonte que Login : suppression des `console.error`, `alert()` remplacés par état `error`
- Redirection vers `/login` avec message de succès via `state` React Router
- Ajout de `autoComplete` sur les champs

### `pages/Order.js`
- Remplacement des `alert()` par un état `error` affiché dans l'interface
- Suppression du `console.error`
- Ajout d'un état `loading` avec bouton désactivé pendant la requête
- Redirection vers `/` avec message de succès après confirmation

### `pages/Admin.js`
- Remplacement du `console.error` par un état `error` affiché dans l'interface
- Chargement des commandes et produits en parallèle avec `Promise.all`
- Validation du stock : vérification que la valeur est un entier positif avant envoi

### `pages/ProductList.js`
- Ajout d'un `try/catch` sur le chargement des produits
- Suppression du `console.log` commenté
- Correction de la `key` : `product.id` → `product._id` (identifiant MongoDB)

### `components/ProtectedRoute.js`
- Vérification de `username` dans `localStorage` au lieu de `token` (le token étant dans un cookie HTTPOnly non accessible en JS)

### `components/AdminRoute.js`
- Même correction : vérification de `username` + `role`

### `components/Navbar.js`
- Suppression de la dépendance à `localStorage.getItem('token')`
- `handleLogout` simplifié : suppression de `username` et `role` du localStorage + redirection
- Suppression de l'import `axios` inutile

### `components/ShippingMethodSelection.js`
- Correction du warning React : `value={shippingMethod || ''}` au lieu de `null`
- Ajout d'une option par défaut `<option value="" disabled>`

---

## Variables d'environnement

### `.env` backend
- Renommage de `REACT_APP_GATEWAY_URL` → `GATEWAY_URL` (le préfixe `REACT_APP_` est réservé à Create React App et ignoré par Node.js)
- Ajout de `NOTIFY_EMAIL` pour ne plus avoir d'adresse email en dur dans le code
- Ajout de `NODE_ENV=development`

---

## Dépendances ajoutées

```bash
# Backend
npm install joi winston helmet express-rate-limit cookie-parser

# Gateway & services
npm install winston
```