export const fmtCurrency = (n) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
export const fmtNumber   = (n) => new Intl.NumberFormat('en-IN').format(n);
export const fmtPct      = (n) => `${Number(n).toFixed(1)}%`;
export const fmtTime     = (iso) => iso ? new Intl.DateTimeFormat('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true}).format(new Date(iso)) : '—';
export const fmtDate     = (iso) => iso ? new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric'}).format(new Date(iso)) : '—';
export const fmtDateTime = (iso) => iso ? new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:true}).format(new Date(iso)) : '—';
export const fmtDuration = (min) => { if (min==null) return '—'; const h=Math.floor(min/60),m=Math.round(min%60); return h>0?`${h}h ${m}m`:`${m}m`; };
export const fmtRelative = (iso) => { if (!iso) return 'Never'; const diff=Date.now()-new Date(iso).getTime(),mins=Math.floor(diff/60000); if(mins<1)return 'Just now'; if(mins<60)return `${mins}m ago`; const hrs=Math.floor(mins/60); if(hrs<24)return `${hrs}h ago`; return `${Math.floor(hrs/24)}d ago`; };
export const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
