"use client";
import { ShoppingBag } from "lucide-react";
import { useCart, useData } from "@/lib/store";
import { cartCount, resolveCart } from "@/lib/pricing";
import { useUI } from "./AppProviders";
import { Logo } from "./ui";

export function Header() {
  const { openCart } = useUI();
  const data = useData();
  const cart = useCart();
  const count = cartCount(resolveCart(cart, data));
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-white">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Logo dark size={36} />
        <button type="button" onClick={openCart}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-mustard px-4 text-sm font-bold text-ink transition-colors hover:bg-yellow-400"
          aria-label={"Корзина, товаров: " + count}>
          <ShoppingBag className="size-4" aria-hidden="true" />
          <span>Корзина</span>
          <span className="border-l border-ink/20 pl-2 tabular-nums">{count}</span>
        </button>
      </div>
    </header>
  );
}
