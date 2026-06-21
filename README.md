marketplaceKaer/
├── front/          ← tes fichiers HTML/CSS actuels
├── back/
│   ├── server.js
│   ├── routes/
│   │   ├── auth.js       ← register, login, logout
│   │   ├── produits.js   ← CRUD annonces
│   │   └── messages.js   ← messagerie vendeur/acheteur
│   ├── middleware/
│   │   └── auth.js       ← vérif JWT
│   └── db.js             ← connexion MySQL
└── package.json


users      → id, raison_sociale, siret, email, password_hash, region, created_at
produits   → id, seller_id, titre, description, categorie, prix_ht, etat, region, created_at
messages   → id, from_id, to_id, produit_id, contenu, lu, created_at
