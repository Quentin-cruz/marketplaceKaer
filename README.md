# Kaer Seller

Marketplace B2B dédiée aux professionnels de l'équitation. Achat, vente et échange de matériel équestre entre entreprises vérifiées.

---

## Stack technique

| Côté | Technologie |
|------|-------------|
| Frontend | HTML / CSS / JavaScript vanilla |
| Backend | Node.js + Express.js |
| Base de données | MySQL 8 (Laragon + phpMyAdmin) |
| Auth | JWT (cookie httpOnly) + bcrypt |
| Upload | Multer (images locales) |

---

## Lancer le projet

### Prérequis

- [Node.js](https://nodejs.org) installé
- [Laragon](https://laragon.org) avec MySQL démarré

### Installation

```bash
cd back
npm install
```

Créer un fichier `.env` dans `back/` :

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=kaer_seller
JWT_SECRET=une_chaine_secrete
JWT_EXPIRES_IN=7d
PORT=3001
```

Importer le schéma SQL dans phpMyAdmin, puis démarrer :

```bash
node server.js
```

L'application est accessible sur [http://localhost:3001](http://localhost:3001).

---

## Structure du projet

```
marketplaceKaer/
├── index.html              ← Connexion / Inscription
├── marketplace.html        ← Catalogue avec filtres
├── product.html            ← Fiche produit détaillée
├── publier.html            ← Créer / modifier une annonce
├── mes-annonces.html       ← Annonces du compte connecté
├── mes-achats.html         ← Historique d'achats
├── favoris.html            ← Annonces mises en favoris
├── messages.html           ← Messagerie entre utilisateurs
├── profil.html             ← Profil personnel (éditable)
├── profil-vendeur.html     ← Profil public d'un vendeur
├── style.css               ← Design system partagé
├── auth-guard.js           ← Auth + navbar + notifications
└── back/
    ├── server.js
    ├── db.js
    ├── upload.js
    ├── middleware/
    │   └── auth.js         ← Vérification JWT
    └── routes/
        ├── auth.js         ← Inscription, connexion, profil
        ├── produits.js     ← CRUD annonces + upload photos
        ├── messages.js     ← Messagerie
        ├── users.js        ← Profil public vendeur
        ├── avis.js         ← Système d'avis / notes
        └── favoris.js      ← Favoris
```

---

## Schéma de base de données

```sql
users
  id, raison_sociale, siret, email, password_hash,
  prenom, nom, date_naissance, telephone, ville, bio,
  region, created_at

produits
  id, seller_id, titre, description, categorie,
  prix_ht, etat, region, images (JSON),
  caracteristiques (JSON), created_at

messages
  id, from_id, to_id, produit_id, contenu, lu, created_at

avis
  id, vendeur_id, auteur_id, note, commentaire, created_at

favoris
  id, user_id, produit_id, created_at
```

---

## Fonctionnalités

- **Authentification** — inscription avec SIRET, connexion, session JWT 7 jours
- **Catalogue** — filtres par catégorie, état, région, recherche textuelle, tri
- **Annonces** — création avec photos (max 5), caractéristiques dynamiques par catégorie, modification, suppression
- **Fiche produit** — galerie photos, caractéristiques, produits similaires, question directe au vendeur
- **Messagerie** — conversations entre utilisateurs, badge de notifications
- **Profil** — informations personnelles éditables, bio
- **Profil vendeur public** — annonces, avis, bio, localisation
- **Avis** — notation 1 à 5 étoiles avec commentaire, un avis par vendeur
- **Favoris** — ajout/retrait depuis le catalogue et les fiches produit

---

## Régions disponibles

Bretagne · Normandie · Pays de la Loire
