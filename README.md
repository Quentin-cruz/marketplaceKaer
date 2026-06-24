# Kaer Seller

Marketplace B2B dédiée aux professionnels de l'équitation. Achat, vente et échange de matériel équestre entre entreprises vérifiées.

---

## Stack technique

| Côté | Technologie |
|------|-------------|
| Frontend | HTML / CSS / JavaScript vanilla |
| Backend | Node.js + Express.js |
| Base de données | MySQL 8 |
| Auth | JWT (cookie httpOnly) + bcrypt |
| Upload | Multer |

---

## Lancer le projet

### Prérequis

- [Node.js](https://nodejs.org) installé
- MySQL démarré (Laragon, WAMP, ou autre)

### Installation

```bash
cd back
npm install
```

Créer un fichier `.env` dans `back/` à partir du `.env.example` fourni séparément, puis démarrer :

```bash
node server.js
```

L'application est accessible sur [http://localhost:3001](http://localhost:3001).

---

## Fonctionnalités

- Authentification professionnelle (SIRET requis)
- Catalogue avec filtres et recherche
- Dépôt et gestion d'annonces avec photos
- Messagerie entre utilisateurs
- Système d'avis et de notation
- Favoris
- Profils vendeurs publics

---

## Régions disponibles

Bretagne · Normandie · Pays de la Loire
