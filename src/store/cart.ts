import { create } from "zustand";

export type CartItem = {
  menuId: number;
  name: string;
  price: number;
  qty: number;
  note: string;
};

type CartState = {
  items: CartItem[];
  add: (menu: { id: number; name: string; price: number }) => void;
  inc: (menuId: number) => void;
  dec: (menuId: number) => void;
  setNote: (menuId: number, note: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>((set) => ({
  items: [],

  add: (menu) =>
    set((state) => {
      const exist = state.items.find((i) => i.menuId === menu.id);
      if (exist) {
        return {
          items: state.items.map((i) =>
            i.menuId === menu.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          { menuId: menu.id, name: menu.name, price: menu.price, qty: 1, note: "" },
        ],
      };
    }),

  inc: (menuId) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.menuId === menuId ? { ...i, qty: i.qty + 1 } : i
      ),
    })),

  dec: (menuId) =>
    set((state) => ({
      items: state.items
        .map((i) => (i.menuId === menuId ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0),
    })),

  setNote: (menuId, note) =>
    set((state) => ({
      items: state.items.map((i) => (i.menuId === menuId ? { ...i, note } : i)),
    })),

  clear: () => set({ items: [] }),
}));