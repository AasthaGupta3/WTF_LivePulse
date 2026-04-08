import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout    from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Gyms      from './pages/Gyms.jsx';
import GymDetail from './pages/GymDetail.jsx';
import Members   from './pages/Members.jsx';
import Checkins  from './pages/Checkins.jsx';
import Payments  from './pages/Payments.jsx';
import Anomalies from './pages/Anomalies.jsx';
import { useWsStore } from './store/wsStore.js';

export default function App() {
  const connect = useWsStore(s=>s.connect);
  useEffect(()=>{ connect(); },[connect]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="gyms"      element={<Gyms />} />
          <Route path="gyms/:id"  element={<GymDetail />} />
          <Route path="members"   element={<Members />} />
          <Route path="checkins"  element={<Checkins />} />
          <Route path="payments"  element={<Payments />} />
          <Route path="anomalies" element={<Anomalies />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
