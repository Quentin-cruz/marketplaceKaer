-- Kaer Seller — Schéma base de données
-- À exécuter dans PHPMyAdmin sur la base "kaer_seller"

CREATE TABLE IF NOT EXISTS users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  raison_sociale  VARCHAR(255) NOT NULL,
  siret           CHAR(14)     NOT NULL UNIQUE,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  region          VARCHAR(100) DEFAULT NULL,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produits (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id   INT UNSIGNED NOT NULL,
  titre       VARCHAR(255) NOT NULL,
  description TEXT,
  categorie   VARCHAR(100) NOT NULL,
  prix_ht     DECIMAL(10,2),
  etat        ENUM('neuf','occasion','reconditionne') NOT NULL DEFAULT 'neuf',
  region      VARCHAR(100),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  from_id     INT UNSIGNED NOT NULL,
  to_id       INT UNSIGNED NOT NULL,
  produit_id  INT UNSIGNED,
  contenu     TEXT NOT NULL,
  lu          TINYINT(1) DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (to_id)      REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE SET NULL
);
