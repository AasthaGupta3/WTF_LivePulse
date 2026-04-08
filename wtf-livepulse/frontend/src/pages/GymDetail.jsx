import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../lib/api.js';
import { fmtCurrency, fmtNumber, DAYS } from '../lib/format.js';
import PageHeader from '../components/PageHeader.jsx';
import KpiCard    from '../components/KpiCard.jsx';
import Spinner    from '../components/Spinner.jsx';
import s from './GymDetail.module.css';

export default function GymDetail() {
  const { id } = useParams();
  const [gym,     setGym]     = useState(null);
  const [hourly,  setHourly]  = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    Promise.all([
      api.get(`/gyms/${id}`),
      api.get(`/checkins/hourly?gym_id=${id}&days=30`),
      api.get(`/dashboard/revenue-trend?gym_id=${id}&days=30`),
    ]).then(([g,h,r])=>{ setGym(g); setHourly(h); setRevenue(r); }).finally(()=>setLoading(false));
  },[id]);

  if (loading) return <Spinner center />;
  if (!gym)    return <div className="text-red">Gym not found</div>;

  return (
    <div className="fade-in">
      <PageHeader
        title={gym.name}
        subtitle={`${gym.city} · ${gym.address}`}
        actions={<Link to="/gyms" className="btn btn-ghost">← Back</Link>}
      />
      <div className={s.kpiRow}>
        <KpiCard label="Capacity"   value={fmtNumber(gym.capacity)}    color="blue"   icon="🏠" />
        <KpiCard label="Status"     value={gym.status}                  color={gym.status==='active'?'green':'yellow'} />
        <KpiCard label="Opens"      value={gym.opens_at}                color="default" />
        <KpiCard label="Closes"     value={gym.closes_at}               color="default" />
      </div>
      <div className={s.charts}>
        <div className="card">
          <h3 className={s.title}>Hourly Check-in Distribution (30d)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourly} margin={{top:4,right:8,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" tickFormatter={h=>`${h}:00`} tick={{fill:'var(--text-muted)',fontSize:11}} />
              <YAxis tick={{fill:'var(--text-muted)',fontSize:11}} />
              <Tooltip contentStyle={{background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:6,fontSize:12}} />
              <Bar dataKey="count" fill="var(--accent)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className={s.title}>Revenue Trend (30d)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenue} margin={{top:4,right:8,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tickFormatter={v=>v?.slice(5,10)} tick={{fill:'var(--text-muted)',fontSize:11}} />
              <YAxis tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} tick={{fill:'var(--text-muted)',fontSize:11}} />
              <Tooltip contentStyle={{background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:6,fontSize:12}} formatter={v=>[fmtCurrency(v),'Revenue']} />
              <Bar dataKey="revenue" fill="var(--blue)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
