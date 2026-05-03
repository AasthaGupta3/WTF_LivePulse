require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);
const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
const weightedSample = (items, weights) => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
};
const daysAgo = (days) => { const d = new Date(); d.setDate(d.getDate() - days); return d; };

const HOURLY_WEIGHTS = [
  0.2,0.1,0.1,0.1,0.2,0.5,
  2.0,3.5,3.0,1.5,1.0,1.0,
  2.0,1.5,1.0,1.2,1.5,3.0,
  4.0,3.5,2.5,1.5,0.8,0.4,
];
const pickHour = () => weightedSample(Array.from({ length: 24 }, (_, i) => i), HOURLY_WEIGHTS);
const DAY_WEIGHTS = [1.2,1.4,1.5,1.5,1.6,1.8,1.3];

const FIRST_NAMES = ['Aarav','Aditi','Aisha','Akira','Alejandro','Amara','Amit','Ananya','Arjun','Aria','Bella','Benjamin','Carlos','Chloe','Daniel','Deepa','Elena','Ethan','Fatima','Felix','Gabriela','Hannah','Ibrahim','Ishaan','Jasmine','Jordan','Kavya','Kenji','Laura','Liam','Maya','Michael','Nadia','Neha','Omar','Olivia','Priya','Raj','Rahul','Riya','Samuel','Sara','Siddharth','Sofia','Tanvi','Thomas','Uma','Victor','Vikram','Zara'];
const LAST_NAMES  = ['Sharma','Patel','Singh','Kumar','Verma','Gupta','Joshi','Mehta','Nair','Reddy','Chen','Wang','Liu','Zhang','Li','Kim','Park','Lee','Tanaka','Yamamoto','Rodriguez','Martinez','Garcia','Lopez','Hernandez','Smith','Johnson','Brown','Davis','Wilson','Müller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Schulz','Hoffmann'];
const CITIES       = ['Mumbai','Delhi','Bengaluru','Hyderabad','Chennai','Pune','Kolkata','Ahmedabad','Jaipur','Surat'];
const GYM_PREFIXES = ['FitZone','IronHouse','Peak','PowerHouse','ProFit','Core','Flex','Pulse','Velocity','Surge'];
const GYM_SUFFIXES = ['Gym','Fitness','Studio','Athletics','Training','Performance','Club','Wellness'];
const PLAN_PRICES  = { monthly:[999,1299,1499,1999], quarterly:[2499,2999,3499], annual:[7999,9999,11999] };

function generateGym(index) {
  const city = CITIES[index % CITIES.length];
  return {
    name: `${sample(GYM_PREFIXES)} ${sample(GYM_SUFFIXES)} ${city}`,
    city, address: `${rand(1,500)} ${sample(['Main Street','MG Road','Brigade Road','Park Avenue','Station Road','Link Road'])}`,
    capacity: rand(80, 300), status: 'active',
    opens_at: sample(['05:30','06:00','06:30']), closes_at: sample(['21:00','22:00','23:00']),
  };
}

function generateMember(gymId) {
  const firstName = sample(FIRST_NAMES), lastName = sample(LAST_NAMES);
  const planType   = weightedSample(['monthly','quarterly','annual'],[0.5,0.3,0.2]);
  const memberType = Math.random() < 0.35 ? 'renewal' : 'new';
  const status     = weightedSample(['active','inactive','frozen'],[0.75,0.18,0.07]);
  const joinedDaysAgo = rand(1, 365);
  const joined     = daysAgo(joinedDaysAgo);
  const planDays   = {monthly:30,quarterly:90,annual:365}[planType];
  const expiresAt  = new Date(joined); expiresAt.setDate(expiresAt.getDate() + planDays + rand(-5,10));
  return {
    gym_id: gymId, name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${rand(1,999)}@example.com`,
    phone: `+91${rand(7000000000,9999999999)}`, plan_type: planType, member_type: memberType,
    status, joined_at: joined.toISOString(), plan_expires_at: expiresAt.toISOString(),
  };
}

function generateCheckin(gymId, memberId, date) {
  const hour = pickHour(), minute = rand(0,59);
  const checkedIn = new Date(date); checkedIn.setHours(hour, minute, rand(0,59), 0);
  const durationMin = weightedSample([30,45,60,75,90,105,120],[0.08,0.22,0.30,0.20,0.12,0.05,0.03]);
  const checkedOut = new Date(checkedIn.getTime() + durationMin * 60 * 1000);
  return { gym_id: gymId, member_id: memberId, checked_in: checkedIn.toISOString(), checked_out: checkedOut.toISOString() };
}

function generatePayment(memberId, gymId, planType, memberType, paidAt) {
  const prices = PLAN_PRICES[planType];
  const amount  = +(sample(prices) * randFloat(0.95,1.05)).toFixed(2);
  return { member_id: memberId, gym_id: gymId, amount, plan_type: planType, payment_type: memberType, paid_at: paidAt };
}

async function insertGyms(client, gyms) {
  const ids = [];
  for (const g of gyms) {
    const { rows } = await client.query(
      `INSERT INTO gyms (name,city,address,capacity,status,opens_at,closes_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [g.name,g.city,g.address,g.capacity,g.status,g.opens_at,g.closes_at],
    );
    ids.push(rows[0].id);
  }
  return ids;
}

async function batchInsert(client, table, columns, rows, batchSize=500) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i+batchSize);
    const values = [];
    const placeholders = batch.map((row, ri) => {
      const start = ri * columns.length + 1;
      columns.forEach((_, ci) => values.push(row[columns[ci]]));
      return `(${columns.map((_,ci) => `$${start+ci}`).join(',')})`;
    });
    await client.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders.join(',')}`, values);
  }
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱  Starting Gym Management seed...');
    await client.query('BEGIN');
    await client.query('TRUNCATE anomalies,payments,checkins,members,gyms RESTART IDENTITY CASCADE');

    const gymData = Array.from({length:10},(_,i)=>generateGym(i));
    const gymIds  = await insertGyms(client, gymData);
    console.log(`   ✓ ${gymIds.length} gyms`);

    const TOTAL_MEMBERS = 5000;
    const gymCapacities = gymData.map(g=>g.capacity);
    const totalCap      = gymCapacities.reduce((a,b)=>a+b,0);
    const gymMemberCounts = gymCapacities.map(c=>Math.round((c/totalCap)*TOTAL_MEMBERS));
    gymMemberCounts[0] += TOTAL_MEMBERS - gymMemberCounts.reduce((a,b)=>a+b,0);

    const memberRows = [];
    gymIds.forEach((gymId,gi) => {
      for (let m=0; m<gymMemberCounts[gi]; m++) memberRows.push(generateMember(gymId));
    });
    await batchInsert(client,'members',['gym_id','name','email','phone','plan_type','member_type','status','joined_at','plan_expires_at'],memberRows);
    console.log(`   ✓ ${memberRows.length} members`);

    const { rows: memberIdRows } = await client.query(
      'SELECT id,gym_id,status,joined_at,plan_type,member_type FROM members ORDER BY created_at'
    );

    const checkinRows = [], paymentRows = [];
    for (const m of memberIdRows) paymentRows.push(generatePayment(m.id,m.gym_id,m.plan_type,m.member_type,m.joined_at));

    const activeMembers = memberIdRows.filter(m=>m.status==='active');
    for (const m of activeMembers) {
      const visitsPerWeek = weightedSample([1,2,3,4,5],[0.10,0.25,0.35,0.20,0.10]);
      const visitProbPerDay = visitsPerWeek / 7;
      const joinDate = new Date(m.joined_at);
      for (let daysBack=90; daysBack>=1; daysBack--) {
        const date = daysAgo(daysBack);
        if (date < joinDate) continue;
        const dow = date.getDay();
        if (Math.random() > visitProbPerDay * DAY_WEIGHTS[dow]) continue;
        checkinRows.push(generateCheckin(m.gym_id, m.id, date));
      }
      if (m.plan_type !== 'monthly' && Math.random() < 0.4) {
        paymentRows.push(generatePayment(m.id,m.gym_id,m.plan_type,'renewal',daysAgo(rand(1,60)).toISOString()));
      }
    }
    const inactiveMembers = memberIdRows.filter(m=>m.status!=='active');
    for (const m of inactiveMembers) {
      for (let c=0; c<rand(0,5); c++) checkinRows.push(generateCheckin(m.gym_id,m.id,daysAgo(rand(60,90))));
    }

    console.log(`   Inserting ${checkinRows.length} check-ins...`);
    await batchInsert(client,'checkins',['gym_id','member_id','checked_in','checked_out'],checkinRows,1000);

    console.log(`   Inserting ${paymentRows.length} payments...`);
    await batchInsert(client,'payments',['member_id','gym_id','amount','plan_type','payment_type','paid_at'],paymentRows,1000);

    await client.query(`UPDATE members m SET last_checkin_at=sub.last_ci FROM (SELECT member_id,MAX(checked_in) AS last_ci FROM checkins GROUP BY member_id) sub WHERE m.id=sub.member_id`);
    await client.query('REFRESH MATERIALIZED VIEW gym_hourly_stats');
    await client.query(`INSERT INTO anomalies (gym_id,type,severity,message,resolved,detected_at) VALUES ($1,'zero_checkins','warning','No check-ins for 90 minutes during business hours',false,NOW()-INTERVAL '2 hours'),($2,'capacity_breach','critical','Gym reached 95% capacity',false,NOW()-INTERVAL '30 minutes'),($3,'revenue_drop','warning','Daily revenue down 35% vs same day last week',true,NOW()-INTERVAL '1 day')`,[gymIds[0],gymIds[1],gymIds[2]]);

    await client.query('COMMIT');
    console.log('\n✅  Seed complete!');
    console.log(`   Gyms: ${gymIds.length} | Members: ${memberRows.length} | Checkins: ${checkinRows.length} | Payments: ${paymentRows.length}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌  Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}
seed();
