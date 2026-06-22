const router = require('express').Router();
const db     = require('../db');

// GET /api/users/:id — profil public d'un vendeur
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, raison_sociale, ville, bio, region, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const [stats] = await db.query(
      'SELECT COUNT(*) AS nb_annonces FROM produits WHERE seller_id = ?',
      [req.params.id]
    );
    const [annonces] = await db.query(
      'SELECT id, titre, categorie, prix_ht, etat, region, images, created_at FROM produits WHERE seller_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );

    res.json({ ...rows[0], nb_annonces: stats[0].nb_annonces, annonces });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
