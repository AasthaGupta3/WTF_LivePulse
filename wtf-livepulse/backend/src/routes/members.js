const router = require('express').Router();
const pool   = require('../db/pool');

router.get('/', async (req, res, next) => {
  const { gym_id, status, page=1, limit=50 } = req.query;
  const conditions=[], values=[];
  if (gym_id) { conditions.push(`gym_id=$${values.length+1}`); values.push(gym_id); }
  if (status)  { conditions.push(`status=$${values.length+1}`);  values.push(status); }
  const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Number(page)-1)*Number(limit);
  try {
    const { rows }      = await pool.query(`SELECT * FROM members ${where} ORDER BY created_at DESC LIMIT $${values.length+1} OFFSET $${values.length+2}`,[...values,limit,offset]);
    const { rows: cnt } = await pool.query(`SELECT COUNT(*) FROM members ${where}`,values);
    res.json({ data:rows, total:Number(cnt[0].count), page:Number(page), limit:Number(limit) });
  } catch(err){next(err);}
});

router.get('/churn-risk', async (req, res, next) => {
  const { gym_id, days=14 } = req.query;
  const conditions=[`m.status='active'`,`(m.last_checkin_at IS NULL OR m.last_checkin_at<NOW()-INTERVAL '${Number(days)} days')`];
  const values=[];
  if (gym_id) { conditions.push(`m.gym_id=$1`); values.push(gym_id); }
  try {
    const { rows } = await pool.query(
      `SELECT m.*,g.name AS gym_name,NOW()-m.last_checkin_at AS days_since_checkin FROM members m JOIN gyms g ON g.id=m.gym_id WHERE ${conditions.join(' AND ')} ORDER BY m.last_checkin_at ASC NULLS FIRST LIMIT 200`,values);
    res.json(rows);
  } catch(err){next(err);}
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT m.*,g.name AS gym_name FROM members m JOIN gyms g ON g.id=m.gym_id WHERE m.id=$1`,[req.params.id]);
    if (!rows.length) return res.status(404).json({error:'Member not found'});
    res.json(rows[0]);
  } catch(err){next(err);}
});

router.post('/', async (req, res, next) => {
  const { gym_id,name,email,phone,plan_type,member_type,plan_expires_at } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO members (gym_id,name,email,phone,plan_type,member_type,plan_expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [gym_id,name,email,phone,plan_type,member_type||'new',plan_expires_at]);
    res.status(201).json(rows[0]);
  } catch(err){next(err);}
});

router.patch('/:id', async (req, res, next) => {
  const allowed=['name','email','phone','plan_type','member_type','status','plan_expires_at'];
  const fields=Object.keys(req.body).filter(k=>allowed.includes(k));
  if (!fields.length) return res.status(400).json({error:'No valid fields'});
  const sets=fields.map((f,i)=>`${f}=$${i+2}`).join(', ');
  const values=fields.map(f=>req.body[f]);
  try {
    const { rows } = await pool.query(`UPDATE members SET ${sets} WHERE id=$1 RETURNING *`,[req.params.id,...values]);
    if (!rows.length) return res.status(404).json({error:'Member not found'});
    res.json(rows[0]);
  } catch(err){next(err);}
});

module.exports = router;
