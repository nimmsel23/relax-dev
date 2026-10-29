import { create } from 'zustand'

/**
 * Zustand store for Physio Timeline simulation state
 */
export const usePhysioStore = create((set) => ({
  // Events (coffee, meal, nicotine, THC)
  events: [],
  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, { ...event, id: Date.now() }],
    })),
  removeEvent: (id) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
    })),
  updateEvent: (id, updates) =>
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),
  clearEvents: () => set({ events: [] }),

  // Context (fasted, sleepDebt, stressLevel, circadianPhase)
  context: {
    fasted: false,
    sleepDebt: 0,
    stressLevel: 0,
    circadianPhase: 'morning',
  },
  updateContext: (updates) =>
    set((state) => ({
      context: { ...state.context, ...updates },
    })),

  // Simulation parameters
  horizonMinutes: 480,
  resolution: 1,
  setHorizonMinutes: (minutes) => set({ horizonMinutes: minutes }),
  setResolution: (res) => set({ resolution: res }),

  // Simulation result
  simulationResult: null,
  setSimulationResult: (result) => set({ simulationResult: result }),
  clearSimulationResult: () => set({ simulationResult: null }),

  // Loading/error states
  isLoading: false,
  error: null,
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}))
