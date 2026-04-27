import { create } from "zustand";

interface CartState {
  itemCount: number;
  setCount: (count: number) => void;
  increment: () => void;
  decrement: (by?: number) => void;
  reset: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  itemCount: 0,
  setCount: (count) => set({ itemCount: count }),
  increment: () => set((s) => ({ itemCount: s.itemCount + 1 })),
  decrement: (by = 1) =>
    set((s) => ({ itemCount: Math.max(0, s.itemCount - by) })),
  reset: () => set({ itemCount: 0 }),
}));
