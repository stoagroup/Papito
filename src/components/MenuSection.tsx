"use client";
import { useState } from "react";
import { useCart, useData, useHydrated } from "@/lib/store";
import { ProductCard } from "./ProductCard";
import { filterMenuProducts } from "@/lib/menu";
import { inputCls } from "./ui";

export function MenuSection() {
  const data = useData();
  const cart = useCart();
  const hydrated = useHydrated();
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const selected = data.categories.some((c) => c.id === category) ? category : null;
  const products = filterMenuProducts(data.products, selected, query);
  const lines = new Map(cart.filter((l) => l.kind === "product").map((l) => [l.refId, l]));
  return (
    <section id="menu" className="mx-auto max-w-6xl px-5 pt-8 pb-16 sm:px-8 sm:pt-10" aria-labelledby="menu-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 id="menu-title" className="text-3xl font-extrabold tracking-tight sm:text-4xl">Меню</h1>
        <label className="w-full sm:w-72">
          <span className="sr-only">Поиск по меню</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Найти блюдо" className={inputCls} />
        </label>
      </div>
      <nav aria-label="Категории меню" className="mt-6 flex w-full min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain border-b border-ink/10 px-1 pt-1 pb-5">
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
          <h2 className="text-lg font-semibold">{query.trim() ? "Ничего не найдено" : selected === null ? "Меню пока пустое" : "В этой категории пока нет блюд"}</h2>
          <p className="mt-2 text-sm text-ink/60">{query.trim() ? "Измените запрос или выберите другую категорию." : selected === null ? "Блюда появятся здесь позже." : "Выберите другую категорию."}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => <ProductCard key={product.id} product={product} data={data} line={lines.get(product.id)} />)}
        </div>
      )}
    </section>
  );
}
