import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { fmtDate, fmtRelative } from '../lib/format.js';
import PageHeader from '../components/PageHeader.jsx';
import Spinner    from '../components/Spinner.jsx';
import Badge      from '../components/Badge.jsx';
import s from './Members.module.css';

const STATUS_COLOR = { active:'green', inactive:'red', frozen:'yellow' };
const PLAN_COLOR   = { monthly:'blue', quarterly:'purple', annual:'green' };

export default function Members() {
  const [members, setMembers]   = useState([]);
  const [total,   setTotal]     = useState(0);
  const [page,    setPage]      = useState(1);
  const [status,  setStatus]    = useState('');
  const [loading, setLoading]   = useState(true);
  const LIMIT = 50;

  async function load(p=1, st=status) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:p, limit:LIMIT });
      if (st) params.set('status', st);
      const res = await api.get(`/members?${params}`);
      setMembers(res.data); setTotal(res.total); setPage(p);
    } finally { setLoading(false); }
  }

  useEffect(()=>{ load(1); },[status]);

  return (
    <div className="fade-in">
      <PageHeader title="Members" subtitle={`${total.toLocaleString()} total`}
        actions={
          <select className={s.filter} value={status} onChange={e=>{setStatus(e.target.value);}}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="frozen">Frozen</option>
          </select>
        }
      />
      {loading ? <Spinner center /> : (
        <>
          <div className={`card ${s.tableWrap}`}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Name</th><th>Plan</th><th>Status</th>
                  <th>Joined</th><th>Expires</th><th>Last Check-in</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m=>(
                  <tr key={m.id}>
                    <td>
                      <div className={s.memberName}>{m.name}</div>
                      <div className={s.memberEmail}>{m.email}</div>
                    </td>
                    <td><Badge label={m.plan_type} color={PLAN_COLOR[m.plan_type]} /></td>
                    <td><Badge label={m.status}    color={STATUS_COLOR[m.status]} /></td>
                    <td className="mono">{fmtDate(m.joined_at)}</td>
                    <td className="mono">{fmtDate(m.plan_expires_at)}</td>
                    <td className="mono text-secondary">{fmtRelative(m.last_checkin_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={s.pagination}>
            <button className="btn btn-ghost" disabled={page<=1} onClick={()=>load(page-1)}>← Prev</button>
            <span className="text-secondary mono">Page {page} of {Math.ceil(total/LIMIT)}</span>
            <button className="btn btn-ghost" disabled={page*LIMIT>=total} onClick={()=>load(page+1)}>Next →</button>
          </div>
        </>
      )}
    </div>
  );
}
