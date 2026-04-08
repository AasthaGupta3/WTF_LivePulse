const router = require('express').Router();
const pool   = require('../db/pool');

router.get('/', async (req, res, next) => {
  const { gym_id, from, to, page=1, limit=50 } = req.query;
  const conditions=[], values=[];
  if (gym_id) { conditions.push(`p.gym_id=$${values.length+1}`); values.push(gym_id); }
  if (from)   { conditions.push(`p.paid_at>=$${values.length+1}`); values.push(from); }
  if (to)     { conditions.push(`p.paid_at<=$${values.length+1}`); values.push(to); }
  const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Number(page)-1)*Number(limit);
  try {
    const { rows }      = await pool.query(`SELECT p.*,m.name AS member_name,g.name AS gym_name FROM payments p JOIN members m ON m.id=p.member_id JOIN gyms g ON g.id=p.gym_id ${where} ORDER BY p.paid_at DESC LIMIT $${values.length+1} OFFSET $${values.length+2}`,[...values,limit,offset]);
    const { rows: cnt } = await pool.query(`SELECT COUNT(*) FROM payments p ${where}`,values);
    res.json({ data:rows, total:Number(cnt[0].count), page:Number(page), limit:Number(limit) });
  } catch(err){next(err);}
});

router.get('/summary', async (req, res, next) => {
  const { gym_id, period='day' } = req.query;
  const trunc = {day:'day',week:'week',month:'month'}[period]||'day';
  const conditions=[], values=[];
  if (gym_id) { conditions.push(`gym_id=$1`); values.push(gym_id); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const { rows } = await pool.query(
      `SELECT DATE_TRUNC('${trunc}',paid_at) AS period,COUNT(*) AS transactions,SUM(amount) AS total_revenue,
              COUNT(*) FILTER (WHERE payment_type='new') AS new_members,COUNT(*) FILTER (WHERE payment_type='renewal') AS renewals,
              SUM(amount) FILTER (WHERE payment_type='new') AS new_revenue,SUM(amount) FILTER (WHERE payment_type='renewal') AS renewal_revenue
       FROM payments ${where} GROUP BY 1 ORDER BY 1 DESC LIMIT 90`,values);
    res.json(rows);
  } catch(err){next(err);}
});

router.post('/', async (req, res, next) => {
  const { member_id,gym_id,amount,plan_type,payment_type,notes } = req.body;
  try {
    const { rows } = await pool.query(`INSERT INTO payments (member_id,gym_id,amount,plan_type,payment_type,notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,[member_id,gym_id,amount,plan_type,payment_type||'new',notes]);
    res.status(201).json(rows[0]);
  } catch(err){next(err);}
});

module.exports = router;
