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
