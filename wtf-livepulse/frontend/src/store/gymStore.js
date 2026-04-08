import { create } from 'zustand';
import { api } from '../lib/api.js';

export const useGymStore = create((set) => ({
  gyms: [], selected: null, loading: false, error: null,
  async fetchGyms() {
    set({loading:true,error:null});
    try { set({gyms:await api.get('/gyms'),loading:false}); }
    catch(err) { set({error:err.message,loading:false}); }
  },
  async fetchGym(id) {
    set({loading:true,error:null});
    try { set({selected:await api.get(`/gyms/${id}`),loading:false}); }
    catch(err) { set({error:err.message,loading:false}); }
  },
  setSelected(gym) { set({selected:gym}); },
}));
