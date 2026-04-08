import s from './Badge.module.css';
export default function Badge({label,color='default'}) {
  return <span className={`${s.badge} ${s[color]}`}>{label}</span>;
}
