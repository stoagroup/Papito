"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import type { AppData, CartLine, Product } from "@/lib/types";
import { addToCart, setCartQty } from "@/lib/store";
import { productPrice } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { useUI } from "./AppProviders";
import { FoodImage } from "./ui";

export const TAG_META: Record<Product["tags"][number], { label: string; cls: string }> = {
  hit: { label: "Хит", cls: "bg-ink text-white" },
  new: { label: "Новинка", cls: "bg-mustard text-ink" },
  spicy: { label: "Острое", cls: "bg-orange text-ink" },
  veg: { label: "Без мяса", cls: "bg-cream-2 text-ink" },
};

export function ProductCard({ product, data, line, highlighted }: { product: Product; data: AppData; line?: CartLine; highlighted?: boolean }) {
  const { toast } = useUI();
  const { price, oldPrice } = productPrice(product, data);

  const add = () => {
    addToCart("product", product.id);
    toast(`«${product.name}» в корзине`);
  };

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ${
        highlighted ? "ring-2 ring-orange" : "ring-ink/10"
      } ${product.available ? "" : "opacity-70"}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <FoodImage src={product.image} alt={product.name} className="size-full" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {oldPrice !== null && <span className="rounded-full bg-mustard px-2.5 py-1 text-xs font-extrabold text-ink shadow">Предложение дня</span>}
          {product.tags.map((t) => (
            <span key={t} className={`rounded-full px-2.5 py-1 text-xs font-bold shadow ${TAG_META[t].cls}`}>
              {TAG_META[t].label}
            </span>
          ))}
        </div>
        {!product.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/55">
            <span className="rounded-full bg-cream px-4 py-2 text-sm font-bold text-ink">Временно нет в наличии</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-tight font-bold break-words text-ink">{product.name}</h3>
          {product.portion && <span className="mt-0.5 shrink-0 rounded-full bg-cream-2 px-2.5 py-1 text-xs font-bold text-ink/60">{product.portion}</span>}
        </div>
        {product.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed break-words text-ink/60">{product.description}</p>}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="leading-none">
            {oldPrice !== null && <div className="mb-1 text-sm font-semibold text-ink/40 line-through">{formatPrice(oldPrice)}</div>}
            <div className={`font-display text-2xl font-black ${oldPrice !== null ? "text-brand" : "text-ink"}`}>{formatPrice(price)}</div>
          </div>

          {line ? (
            <div className="flex items-center gap-1 rounded-full bg-ink p-1 text-cream">
              <button
                type="button"
                onClick={() => setCartQty(line.key, line.qty - 1)}
                className="flex size-9 items-center justify-center rounded-full transition hover:bg-cream/15"
                aria-label="Уменьшить количество"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-6 text-center font-bold tabular-nums">{line.qty}</span>
              <button
                type="button"
                onClick={() => setCartQty(line.key, line.qty + 1)}
                className="flex size-9 items-center justify-center rounded-full bg-orange text-ink transition hover:bg-yellow-400"
                aria-label="Увеличить количество"
              >
                <Plus className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={add}
              disabled={!product.available}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-orange px-5 text-sm font-extrabold text-ink transition hover:bg-yellow-400 disabled:pointer-events-none disabled:bg-ink/20"
            >
              <ShoppingBag className="size-4" /> В корзину
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
