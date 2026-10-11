"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { onPersistError, tickSimulation } from "@/lib/store";
import { CartDrawer } from "./CartDrawer";
import { CheckoutModal } from "./CheckoutModal";
import { ActiveOrderPill } from "./ActiveOrderPill";

type Toast = { id: number; text: string; tone: "success" | "error" };
export type MenuFocus = { ids: string[]; label: string } | null;

type UIContextValue = {
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  checkoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  menuFocus: MenuFocus;
  setMenuFocus: (f: MenuFocus) => void;
  toast: (text: string, tone?: Toast["tone"]) => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI вне AppProviders");
  return ctx;
}

/** Двигает этапы демо-заказов по таймеру, пока открыта любая страница приложения. */
function SimulationEngine() {
  useEffect(() => {
    tickSimulation(Date.now());
    const t = window.setInterval(() => tickSimulation(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [menuFocus, setMenuFocus] = useState<MenuFocus>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const toast = useCallback((text: string, tone: Toast["tone"] = "success") => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  useEffect(() => onPersistError((m) => toast(m, "error")), [toast]);

  const value = useMemo<UIContextValue>(
    () => ({
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      checkoutOpen,
      openCheckout: () => {
        setCartOpen(false);
        setCheckoutOpen(true);
      },
      closeCheckout: () => setCheckoutOpen(false),
      menuFocus,
      setMenuFocus,
      toast,
    }),
    [cartOpen, checkoutOpen, menuFocus, toast],
  );

  return (
    <UIContext.Provider value={value}>
      <SimulationEngine />
      {children}
      <CartDrawer />
      <CheckoutModal />
      <ActiveOrderPill />
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-md animate-pop items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-2xl ${
              t.tone === "success" ? "bg-ink text-cream" : "bg-brand text-white"
            }`}
          >
            {t.tone === "success" ? <CheckCircle2 className="size-5 shrink-0 text-mustard" /> : <AlertTriangle className="size-5 shrink-0" />}
            <span>{t.text}</span>
            <button
              type="button"
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
              className="ml-1 rounded-full p-1 opacity-60 transition hover:opacity-100"
              aria-label="Закрыть уведомление"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </UIContext.Provider>
  );
}
