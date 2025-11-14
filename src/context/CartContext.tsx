import { createContext, useContext, useMemo, useState } from "react";

export type CartItem = { ofertaId: number; nome: string; quantidade: number; preco: number };

const CartContext = createContext<{ items: CartItem[]; add: (i: CartItem) => void; remove: (id: number) => void; updateQty: (id: number, q: number) => void; clear: () => void } | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = (i: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.ofertaId === i.ofertaId);
      if (idx >= 0) { const cp = [...prev]; cp[idx] = { ...cp[idx], quantidade: cp[idx].quantidade + i.quantidade }; return cp; }
      return [...prev, i];
    });
  };
  const remove = (id: number) => setItems((prev) => prev.filter((p) => p.ofertaId !== id));
  const updateQty = (id: number, q: number) => setItems((prev) => prev.map((p) => p.ofertaId === id ? { ...p, quantidade: q } : p));
  const clear = () => setItems([]);

  const value = useMemo(() => ({ items, add, remove, updateQty, clear }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

