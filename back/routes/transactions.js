const router      = require('express').Router();
const db          = require('../db');
const requireAuth = require('../middleware/auth');

// GET /api/transactions/achats — produits achetés par l'utilisateur connecté
router.get('/achats', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.id AS transaction_id, t.created_at AS achat_date,
              p.id, p.titre, p.categorie, p.prix_ht, p.etat, p.images,
              u.raison_sociale AS vendeur_nom, u.id AS vendeur_id
       FROM transactions t
       JOIN produits p ON t.produit_id  = p.id
       JOIN users    u ON t.vendeur_id  = u.id
       WHERE t.acheteur_id = ?
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/transactions/avec/:userId — vérifie si une transaction existe entre moi et cet utilisateur
router.get('/avec/:userId', requireAuth, async (req, res) => {
  const moi   = req.user.id;
  const autre = parseInt(req.params.userId);
  try {
    const [[row]] = await db.query(
      `SELECT id,
              CASE WHEN acheteur_id = ? THEN 'acheteur' ELSE 'vendeur' END AS mon_role
       FROM transactions
       WHERE (acheteur_id = ? AND vendeur_id = ?) OR (vendeur_id = ? AND acheteur_id = ?)
       LIMIT 1`,
      [moi, moi, autre, moi, autre]
    );
    res.json({
      transactionExiste: !!row,
      monRole: row ? row.mon_role : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/transactions — vendeur marque une annonce comme vendue à un acheteur
router.post('/', requireAuth, async (req, res) => {
  const { produit_id, acheteur_id } = req.body;
  if (!produit_id || !acheteur_id)
    return res.status(400).json({ error: 'produit_id et acheteur_id requis' });

  try {
    // Vérifier que le produit appartient bien au vendeur connecté
    const [rows] = await db.query(
      'SELECT id, vendu FROM produits WHERE id = ? AND seller_id = ?',
      [produit_id, req.user.id]
    );
    if (!rows[0]) return res.status(403).json({ error: 'Non autorisé' });
    if (rows[0].vendu) return res.status(409).json({ error: 'Annonce déjà marquée comme vendue' });

    await db.query(
      'INSERT INTO transactions (produit_id, vendeur_id, acheteur_id) VALUES (?, ?, ?)',
      [produit_id, req.user.id, acheteur_id]
    );
    await db.query('UPDATE produits SET vendu = 1 WHERE id = ?', [produit_id]);

    res.status(201).json({ message: 'Vente enregistrée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
