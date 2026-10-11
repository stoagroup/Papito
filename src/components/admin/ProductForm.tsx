"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Product, ProductTag } from "@/lib/types";
import { addCategory, saveProduct, useData } from "@/lib/store";
import { useUI } from "../AppProviders";
import { useEscape } from "../CartDrawer";
import { ProductCard, TAG_META } from "../ProductCard";
import { btnPrimary, inputCls } from "../ui";
import { ImagePicker } from "./ImagePicker";

const NEW_CAT = "__new";

export function ProductForm({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const data = useData();
  const { toast } = useUI();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [portion, setPortion] = useState(product?.portion ?? "");
  const [categoryId, setCategoryId] = useState(product ? (data.categories.some((c) => c.id === product.categoryId) ? product.categoryId : "") : (data.categories[0]?.id ?? ""));
  const [newCategory, setNewCategory] = useState("");
  const [image, setImage] = useState(product?.image ?? "");
  const [tags, setTags] = useState<ProductTag[]>(product?.tags ?? []);
  const [available, setAvailable] = useState(product?.available ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEscape(true, onClose);

  const priceNum = Number(price.replace(",", "."));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Название — минимум 2 символа.";
    if (!Number.isFinite(priceNum) || priceNum <= 0) errs.price = "Укажите цену больше нуля.";
    if (categoryId === NEW_CAT && newCategory.trim().length < 2) errs.category = "Введите название новой категории.";
    if (categoryId && categoryId !== NEW_CAT && !data.categories.some((c) => c.id === categoryId)) errs.category = "Категория удалена. Выберите другую категорию.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const catId = categoryId === NEW_CAT ? addCategory(newCategory).id : categoryId;
    const ok = saveProduct({
      id: product?.id,
      name: name.trim(),
      description: description.trim(),
      price: Math.round(priceNum),
      portion: portion.trim(),
      categoryId: catId,
      image,
      tags,
      available,
    });
    if (ok) {
      toast(product ? "Позиция обновлена" : "Позиция добавлена в меню");
      onClose();
    }
  };

  const preview: Product = {
    id: product?.id ?? "preview",
    createdAt: 0,
    name: name || "Название позиции",
    description: description || "Описание появится здесь",
    price: Number.isFinite(priceNum) && priceNum > 0 ? Math.round(priceNum) : 0,
    portion,
    categoryId,
    image,
    tags,
    available,
  };

  const err = (k: string) => (errors[k] ? <p className="mt-1 text-sm font-semibold text-brand">{errors[k]}</p> : null);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="pf-title">
      <button type="button" className="absolute inset-0 animate-fade-in bg-ink/70 backdrop-blur-sm" onClick={onClose} aria-label="Закрыть" />
      <form onSubmit={submit} noValidate className="relative flex max-h-[94dvh] w-full max-w-5xl animate-pop flex-col overflow-hidden rounded-t-[28px] bg-cream sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 sm:px-7">
          <h2 id="pf-title" className="font-display text-xl font-black">{product ? "Редактирование позиции" : "Новая позиция"}</h2>
          <button type="button" onClick={onClose} className="flex size-10 items-center justify-center rounded-full hover:bg-ink/5" aria-label="Закрыть">
            <X className="size-5" />
          </button>
        </div>

        <div className="grid flex-1 gap-6 overflow-y-auto p-5 sm:p-7 lg:grid-cols-[1.2fr_1fr_300px]">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">Название *</span>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
              {err("name")}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">Описание и состав</span>
              <textarea className={`${inputCls} min-h-28 resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={240} />
              <span className="mt-1 block text-right text-xs text-ink/40">{description.length}/240</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold">Цена, ₽ *</span>
                <input className={inputCls} value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" />
                {err("price")}
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold">Вес / объём</span>
                <input className={inputCls} value={portion} onChange={(e) => setPortion(e.target.value)} placeholder="напр. 300 г" maxLength={16} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">Категория</span>
              <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Без категории</option>
                {data.categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value={NEW_CAT}>+ Новая категория…</option>
              </select>
              {categoryId === NEW_CAT && (
                <input className={`${inputCls} mt-2`} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Название категории" maxLength={30} />
              )}
              {err("category")}
            </label>
            <fieldset>
              <legend className="mb-1.5 text-sm font-bold">Метки</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TAG_META) as ProductTag[]).map((t) => {
                  const on = tags.includes(t);
                  return (
                    <button key={t} type="button" aria-pressed={on} onClick={() => setTags((x) => (on ? x.filter((y) => y !== t) : [...x, t]))}
                      className={`rounded-full px-3.5 py-2 text-sm font-bold transition ${on ? TAG_META[t].cls : "bg-white text-ink/60 ring-1 ring-ink/10"}`}>
                      {TAG_META[t].label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-ink/10">
              <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="size-5 accent-orange" />
              <span className="text-sm font-bold">В наличии — можно заказать</span>
            </label>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-bold">Фото</p>
            <ImagePicker value={image} onChange={setImage} />
          </div>

          <div className="hidden lg:block">
            <p className="mb-1.5 text-sm font-bold">Так увидят гости</p>
            <div className="pointer-events-none">
              <ProductCard product={preview} data={data} />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-ink/10 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button type="button" onClick={onClose} className="rounded-full px-6 py-3 font-bold text-ink/60 hover:bg-ink/5">Отмена</button>
          <button type="submit" className={btnPrimary}>{product ? "Сохранить изменения" : "Добавить в меню"}</button>
        </div>
      </form>
    </div>
  );
}
