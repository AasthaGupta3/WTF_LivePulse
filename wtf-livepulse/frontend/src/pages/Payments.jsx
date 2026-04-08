import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { api } from '../lib/api.js';
import { fmtCurrency, fmtDateTime } from '../lib/format.js';
import PageHeader from '../components/PageHeader.jsx';
import Spinner    from '../components/Spinner.jsx';
import Badge      from '../components/Badge.jsx';
import s from './Payments.module.css';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [summary,  setSummary]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);

  useEffect(()=>{
    Promise.all([api.get('/payments?limit=50'), api.get('/payments/summary?period=day')])
      .then(([p, s])=>{ setPayments(p.data); setTotal(p.total); setSummary(s.slice(0,30).reverse()); })
      .finally(()=>setLoading(false));
  },[]);

  if (loading) return <Spinner center />;

  return (
    <div className="fade-in">
      <PageHeader title="Revenue" subtitle={`${total.toLocaleString()} total transactions`} />
      <div className="card" style={{marginBottom:20}}>
        <h3 className={s.title}>Daily Revenue – New vs Renewal (30d)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={summary} margin={{top:4,right:8,bottom:0,left:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="period" tickFormatter={v=>v?.slice(5,10)} tick={{fill:'var(--text-muted)',fontSize:11}} />
            <YAxis tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} tick={{fill:'var(--text-muted)',fontSize:11}} />
            <Tooltip contentStyle={{background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:6,fontSize:12}} formatter={v=>[fmtCurrency(v)]} />
            <Legend wrapperStyle={{fontSize:12}} />
            <Bar dataKey="new_revenue"     name="New"     stackId="a" fill="var(--accent)" radius={[0,0,0,0]} />
            <Bar dataKey="renewal_revenue" name="Renewal" stackId="a" fill="var(--blue)"   radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className={`card ${s.tableWrap}`}>
        <table className={s.table}>
          <thead><tr><th>Member</th><th>Gym</th><th>Amount</th><th>Plan</th><th>Type</th><th>Date</th></tr></thead>
          <tbody>
            {payments.map(p=>(
              <tr key={p.id}>
                <td className={s.name}>{p.member_name}</td>
                <td className="text-secondary">{p.gym_name}</td>
                <td className="mono text-green">{fmtCurrency(p.amount)}</td>
                <td><Badge label={p.plan_type}    color="blue" /></td>
                <td><Badge label={p.payment_type} color={p.payment_type==='new'?'green':'yellow'} /></td>
                <td className="mono text-secondary">{fmtDateTime(p.paid_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
