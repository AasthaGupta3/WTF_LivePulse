import s from './Spinner.module.css';
export default function Spinner({size=24,center=false}) {
  return <div className={center?s.center:s.inline}><span className={s.spin} style={{width:size,height:size}}/></div>;
}
