const router      = require('express').Router();
const db          = require('../db');
const requireAuth = require('../middleware/auth');

// GET /api/favoris — liste des favoris de l'utilisateur connecté
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.raison_sociale
       FROM favoris f
       JOIN produits p ON f.produit_id = p.id
       JOIN users u    ON p.seller_id  = u.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/favoris/ids — juste les ids des produits favoris (pour cocher les coeurs)
router.get('/ids', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT produit_id FROM favoris WHERE user_id = ?',
      [req.user.id]
    );
    res.json(rows.map(r => r.produit_id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/favoris/:produitId — ajouter / retirer un favori (toggle)
router.post('/:produitId', requireAuth, async (req, res) => {
  try {
    const [existing] = await db.query(
      'SELECT id FROM favoris WHERE user_id = ? AND produit_id = ?',
      [req.user.id, req.params.produitId]
    );
    if (existing.length) {
      await db.query('DELETE FROM favoris WHERE user_id = ? AND produit_id = ?', [req.user.id, req.params.produitId]);
      res.json({ favori: false });
    } else {
      await db.query('INSERT INTO favoris (user_id, produit_id) VALUES (?, ?)', [req.user.id, req.params.produitId]);
      res.json({ favori: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
