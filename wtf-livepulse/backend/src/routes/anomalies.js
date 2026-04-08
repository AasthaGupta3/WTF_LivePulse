const router = require('express').Router();
const pool   = require('../db/pool');

router.get('/', async (req, res, next) => {
  const { gym_id, resolved } = req.query;
  const conditions=[], values=[];
  if (gym_id)   { conditions.push(`a.gym_id=$${values.length+1}`); values.push(gym_id); }
  if (resolved !== undefined) { conditions.push(`a.resolved=$${values.length+1}`); values.push(resolved==='true'); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const { rows } = await pool.query(`SELECT a.*,g.name AS gym_name FROM anomalies a JOIN gyms g ON g.id=a.gym_id ${where} ORDER BY a.detected_at DESC LIMIT 200`,values);
    res.json(rows);
  } catch(err){next(err);}
});

router.patch('/:id/resolve', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`UPDATE anomalies SET resolved=TRUE,resolved_at=NOW() WHERE id=$1 RETURNING *`,[req.params.id]);
    if (!rows.length) return res.status(404).json({error:'Anomaly not found'});
    res.json(rows[0]);
  } catch(err){next(err);}
});

router.patch('/:id/dismiss', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`UPDATE anomalies SET dismissed=TRUE WHERE id=$1 RETURNING *`,[req.params.id]);
    if (!rows.length) return res.status(404).json({error:'Anomaly not found'});
    res.json(rows[0]);
  } catch(err){next(err);}
});

module.exports = router;
