"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Gift, Minus, Plus, Trash2, X } from "lucide-react";
import { clearCart, removeFromCart, setCartQty, useCart, useData } from "@/lib/store";
import { cartCount, cartSubtotal, findPromo, resolveCart } from "@/lib/pricing";
import { formatPrice, plural } from "@/lib/format";
import { useUI } from "./AppProviders";
import { FoodImage, btnPrimary } from "./ui";

export function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [active, onClose]);
}

export function CartDrawer() {
  const { cartOpen, closeCart, openCheckout } = useUI();
  const data = useData();
  const cart = useCart();
  const lines = resolveCart(cart, data);
  const count = cartCount(lines);
  const subtotal = cartSubtotal(lines);
  const first = findPromo(data, "first-order");

  useEscape(cartOpen, closeCart);

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Корзина">
      <button type="button" className="absolute inset-0 animate-fade-in bg-ink/60 " onClick={closeCart} aria-label="Закрыть корзину" />
      <aside className="absolute top-0 right-0 flex h-full w-full max-w-md animate-slide-in flex-col bg-cream ">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-black">Ваш заказ</h2>
            <p className="text-sm text-ink/55">{count ? `${count} ${plural(count, "позиция", "позиции", "позиций")}` : "Пока пусто"}</p>
          </div>
          <div className="flex items-center gap-1">
            {lines.length > 0 && (
              <button type="button" onClick={clearCart} className="rounded-full px-3 py-2 text-sm font-semibold text-ink/50 transition hover:bg-ink/5 hover:text-brand">
                Очистить
              </button>
            )}
            <button type="button" onClick={closeCart} className="flex size-10 items-center justify-center rounded-full transition hover:bg-ink/5" aria-label="Закрыть корзину">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <h3 className="mt-6 font-display text-xl font-bold">Корзина пуста</h3>
            <p className="mt-2 text-ink/60">Здесь появятся выбранные блюда.</p>
            <Link href="/#menu" onClick={closeCart} className={`${btnPrimary} mt-6`}>
              Перейти в меню
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {lines.map((l) => (
                <li key={l.key} className="flex animate-pop gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/5">
                  <FoodImage src={l.image} alt={l.name} className="size-20 shrink-0 rounded-xl" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold leading-tight break-words">{l.name}</h3>
                      <button type="button" onClick={() => removeFromCart(l.key)} className="-mt-1 -mr-1 shrink-0 rounded-full p-1.5 text-ink/35 transition hover:bg-brand/10 hover:text-brand" aria-label={`Удалить «${l.name}»`}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    {l.details.length > 0 && <p className="mt-0.5 line-clamp-2 text-xs text-ink/50">{l.details.join(" · ")}</p>}
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="flex items-center rounded-full bg-cream-2">
                        <button type="button" onClick={() => setCartQty(l.key, l.qty - 1)} className="flex size-8 items-center justify-center rounded-full transition hover:bg-ink/10" aria-label="Уменьшить">
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold tabular-nums">{l.qty}</span>
                        <button type="button" onClick={() => setCartQty(l.key, l.qty + 1)} className="flex size-8 items-center justify-center rounded-full transition hover:bg-ink/10" aria-label="Увеличить">
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <div className="text-right leading-tight">
                        {l.oldUnitPrice !== null && <div className="text-xs text-ink/40 line-through">{formatPrice(l.oldUnitPrice * l.qty)}</div>}
                        <div className="font-display font-black">{formatPrice(l.unitPrice * l.qty)}</div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-ink/10 bg-white px-5 pt-4 pb-5">
              {first?.active && first.discountPercent > 0 && (
                <p className="mb-3 flex items-start gap-2 rounded-xl bg-mustard/20 px-3 py-2.5 text-sm font-medium">
                  <Gift className="mt-0.5 size-4 shrink-0 text-brand" />
                  Первый заказ? Скидка {first.discountPercent}% применится при оформлении.
                </p>
              )}
              <div className="flex items-end justify-between">
                <span className="text-ink/60">Итого</span>
                <span className="font-display text-3xl font-black tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <button type="button" onClick={openCheckout} className={`${btnPrimary} mt-4 w-full py-4 text-lg`}>
                Оформить заказ
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
