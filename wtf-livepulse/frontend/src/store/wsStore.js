import { create } from 'zustand';
const WS_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:3001') + '/ws';

export const useWsStore = create((set, get) => ({
  socket: null, status: 'disconnected', lastEvent: null,
  connect() {
    if (get().status==='connected'||get().status==='connecting') return;
    set({status:'connecting'});
    const ws = new WebSocket(WS_URL);
    ws.onopen    = () => { set({socket:ws,status:'connected'}); };
    ws.onmessage = (e) => { try { set({lastEvent:JSON.parse(e.data)}); } catch{} };
    ws.onclose   = () => { set({socket:null,status:'disconnected'}); setTimeout(()=>get().connect(),3000); };
    ws.onerror   = () => ws.close();
  },
  subscribe(gymId)   { const {socket,status}=get(); if(status==='connected'&&socket) socket.send(JSON.stringify({action:'subscribe',gym_id:gymId})); },
  unsubscribe(gymId) { const {socket,status}=get(); if(status==='connected'&&socket) socket.send(JSON.stringify({action:'unsubscribe',gym_id:gymId})); },
}));
