"use client";
import { useState } from "react";
import { useCart, useData, useHydrated } from "@/lib/store";
import { ProductCard } from "./ProductCard";

export function MenuSection() {
  const data = useData();
  const cart = useCart();
  const hydrated = useHydrated();
  const [category, setCategory] = useState<string | null>(null);
  const selected = data.categories.some((c) => c.id === category) ? category : null;
  const products = data.products.filter((p) => selected === null || p.categoryId === selected);
  const lines = new Map(cart.filter((l) => l.kind === "product").map((l) => [l.refId, l]));
  return (
    <section id="menu" className="mx-auto max-w-6xl px-5 pt-8 pb-16 sm:px-8 sm:pt-10" aria-labelledby="menu-title">
      <h1 id="menu-title" className="text-3xl font-extrabold tracking-tight sm:text-4xl">Меню</h1>
      <nav aria-label="Категории меню" className="mt-6 flex gap-2 overflow-x-auto border-b border-ink/10 pb-5">
        {[{ id: null, name: "Все" }, ...data.categories].map((c) => (
          <button key={c.id ?? "all"} type="button" onClick={() => setCategory(c.id)} aria-pressed={selected === c.id}
            className={"min-h-11 shrink-0 rounded-lg px-5 text-sm font-semibold transition-colors " + (selected === c.id ? "bg-mustard text-ink" : "bg-cream-2 text-ink/70 hover:bg-cream-3")}>
            {c.name}
          </button>
        ))}
      </nav>
      {!hydrated ? (
        <p className="py-12 text-sm text-ink/60" role="status">Загрузка меню…</p>
      ) : products.length === 0 ? (
        <div className="mt-6 rounded-xl bg-cream-2 px-6 py-12 text-center" role="status">
          <h2 className="text-lg font-semibold">{selected === null ? "Меню пока пустое" : "В этой категории пока нет блюд"}</h2>
          <p className="mt-2 text-sm text-ink/60">{selected === null ? "Блюда появятся здесь позже." : "Выберите другую категорию."}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => <ProductCard key={product.id} product={product} data={data} line={lines.get(product.id)} />)}
        </div>
      )}
    </section>
  );
}
