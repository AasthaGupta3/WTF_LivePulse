import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../lib/api.js';
import { fmtCurrency, fmtNumber, fmtDate } from '../lib/format.js';
import KpiCard    from '../components/KpiCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Spinner    from '../components/Spinner.jsx';
import OccupancyBar from '../components/OccupancyBar.jsx';
import { useWsStore } from '../store/wsStore.js';
import s from './Dashboard.module.css';

export default function Dashboard() {
  const [overview,   setOverview]   = useState(null);
  const [trend,      setTrend]      = useState([]);
  const [leaderboard,setLeaderboard]= useState([]);
  const [loading,    setLoading]    = useState(true);
  const lastEvent = useWsStore(st=>st.lastEvent);

  async function load() {
    try {
      const [ov, tr, lb] = await Promise.all([
        api.get('/dashboard/overview'),
        api.get('/dashboard/revenue-trend?days=30'),
        api.get('/dashboard/gym-leaderboard'),
      ]);
      setOverview(ov); setTrend(tr); setLeaderboard(lb);
    } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); },[]);

  // Refresh overview on live WS events
  useEffect(()=>{
    if (lastEvent?.type==='CHECKIN'||lastEvent?.type==='CHECKOUT') {
      api.get('/dashboard/overview').then(setOverview);
    }
  },[lastEvent]);

  if (loading) return <Spinner center />;

  return (
    <div className="fade-in">
      <PageHeader title="Dashboard" subtitle="Real-time gym network overview" />

      <div className={s.kpiGrid}>
        <KpiCard label="Live Occupancy"    value={fmtNumber(overview.live_occupancy)}     color="green"  icon="📡" />
        <KpiCard label="Today's Check-ins" value={fmtNumber(overview.today_checkins)}     color="blue"   icon="✅" />
        <KpiCard label="Today's Revenue"   value={fmtCurrency(overview.today_revenue)}    color="yellow" icon="💰" />
        <KpiCard label="Active Members"    value={fmtNumber(overview.active_members)}     color="purple" icon="👥" />
        <KpiCard label="Churn Risk"        value={fmtNumber(overview.churn_risk_members)} color="red"    icon="⚠️" sub="No visit in 14 days" />
        <KpiCard label="Active Anomalies"  value={fmtNumber(overview.active_anomalies)}   color={overview.active_anomalies>0?'red':'green'} icon="🚨" />
      </div>

      <div className={s.bottom}>
        <div className={`card ${s.chartCard}`}>
          <h3 className={s.sectionTitle}>Revenue – Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend} margin={{top:4,right:8,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tickFormatter={v=>fmtDate(v).slice(0,6)} tick={{fill:'var(--text-muted)',fontSize:11}} />
              <YAxis tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} tick={{fill:'var(--text-muted)',fontSize:11}} />
              <Tooltip
                contentStyle={{background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:6,fontSize:12}}
                formatter={(v)=>[fmtCurrency(v),'Revenue']}
                labelFormatter={fmtDate}
              />
              <Line type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={`card ${s.leaderboardCard}`}>
          <h3 className={s.sectionTitle}>Gym Leaderboard – Today</h3>
          <div className={s.leaderList}>
            {leaderboard.map((gym,i)=>(
              <div key={gym.id} className={s.leaderRow}>
                <span className={`${s.rank} mono`}>#{i+1}</span>
                <div className={s.gymInfo}>
                  <span className={s.gymName}>{gym.name}</span>
                  <OccupancyBar current={Number(gym.live_occupancy)} capacity={Number(gym.capacity)} />
                </div>
                <span className={`${s.rev} mono`}>{fmtCurrency(gym.today_revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
