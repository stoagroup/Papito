"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Check, ChefHat, Download, Eye, EyeOff, FolderPlus, LayoutGrid, Pencil, Plus, RotateCcw, Search, Settings, Tag, Trash2, Upload, UtensilsCrossed,
} from "lucide-react";
import type { Product, Promotion } from "@/lib/types";
import {
  addCategory, clearOrders, deleteCategory, deleteProduct, exportData, importData, moveCategory, renameCategory, resetAll, toggleProductAvailability, updatePromotion,
  updateSettings, useData, useHydrated,
} from "@/lib/store";
import { getCombo } from "@/lib/pricing";
import { filterMenuProducts } from "@/lib/menu";
import { formatPrice } from "@/lib/format";
import { categoryPresets } from "@/data/initialData";
import { useUI } from "../AppProviders";
import { FoodImage, Logo, btnPrimary, inputCls } from "../ui";
import { ProductForm } from "./ProductForm";
import { ImagePicker } from "./ImagePicker";

export type Tab = "products" | "categories" | "promotions" | "settings";

const tabs: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "products", label: "Позиции", icon: UtensilsCrossed },
  { id: "categories", label: "Категории", icon: LayoutGrid },
  { id: "promotions", label: "Акции", icon: Tag },
  { id: "settings", label: "Настройки", icon: Settings },
];

const card = "rounded-[24px] bg-white p-5 ring-1 ring-ink/5 sm:p-6";

/* ---------------- Позиции ---------------- */

function ProductsTab({ onEdit }: { onEdit: (p: Product | null) => void }) {
  const data = useData();
  const { toast } = useUI();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [confirm, setConfirm] = useState<string | null>(null);
  const catName = new Map(data.categories.map((c) => [c.id, c.name]));
  const list = filterMenuProducts(data.products, cat === "all" ? null : cat, q);

  if (data.products.length === 0) {
    return (
      <div className={`${card} flex flex-col items-center py-16 text-center`}>
        <span className="flex size-20 items-center justify-center rounded-full bg-cream-2">
          <UtensilsCrossed className="size-9 text-orange" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-black">Меню пока пустое</h2>
        <p className="mt-2 max-w-md text-ink/60">Добавьте первую позицию: название, фото, описание и цену. Категорию можно создать прямо в форме.</p>
        <button type="button" onClick={() => onEdit(null)} className={`${btnPrimary} mt-6`}>
          <Plus className="size-5" /> Добавить первую позицию
        </button>
      </div>
    );
  }

  return (
    <div className={card}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink/40" />
          <input className={`${inputCls} py-2.5 pl-10`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по названию и описанию" aria-label="Поиск позиций" />
        </label>
        <select className={`${inputCls} py-2.5 sm:w-56`} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Фильтр по категории">
          <option value="all">Все категории</option>
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <ul className="mt-5 divide-y divide-ink/5">
        {list.length === 0 && <li className="py-10 text-center text-ink/50">Ничего не найдено</li>}
        {list.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-4 py-3 sm:flex-nowrap">
            <FoodImage src={p.image} alt={p.name} className="size-16 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{p.name}</p>
              <p className="truncate text-sm text-ink/50">
                {catName.get(p.categoryId) ?? "Без категории"}
                {p.portion && ` · ${p.portion}`}
              </p>
            </div>
            <span className="font-display font-black tabular-nums">{formatPrice(p.price)}</span>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => toggleProductAvailability(p.id)} title={p.available ? "Скрыть из продажи" : "Вернуть в продажу"}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold ${p.available ? "bg-emerald-50 text-emerald-700" : "bg-ink/5 text-ink/50"}`}>
                {p.available ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                <span className="hidden sm:inline">{p.available ? "В наличии" : "Нет"}</span>
              </button>
              <button type="button" onClick={() => onEdit(p)} className="inline-flex size-9 items-center justify-center rounded-lg bg-ink/5 hover:bg-ink/10" aria-label={`Редактировать «${p.name}»`}>
                <Pencil className="size-4" />
              </button>
              {confirm === p.id ? (
                <button type="button" onClick={() => { deleteProduct(p.id); setConfirm(null); toast("Позиция удалена"); }} className="inline-flex h-9 items-center rounded-lg bg-brand px-3 text-xs font-bold text-white">
                  Удалить?
                </button>
              ) : (
                <button type="button" onClick={() => setConfirm(p.id)} className="inline-flex size-9 items-center justify-center rounded-lg bg-ink/5 text-ink/60 hover:bg-brand/10 hover:text-brand" aria-label={`Удалить «${p.name}»`}>
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Категории ---------------- */

function CategoriesTab() {
  const data = useData();
  const { toast } = useUI();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [removing, setRemoving] = useState<{ id: string; moveTo: string } | null>(null);
  const existing = new Set(data.categories.map((c) => c.name.toLowerCase()));
  const presets = categoryPresets.filter((p) => !existing.has(p.toLowerCase()));
  const count = (id: string) => data.products.filter((p) => p.categoryId === id).length;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    addCategory(name);
    setName("");
    toast("Категория добавлена");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className={card}>
        <h2 className="font-display text-lg font-bold">Категории меню</h2>
        <p className="mt-1 text-sm text-ink/55">Порядок здесь — порядок разделов на сайте.</p>
        {data.categories.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-ink/15 px-4 py-10 text-center text-ink/50">Категорий пока нет — добавьте первую справа.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.categories.map((c, i) => (
              <li key={c.id} className="rounded-2xl bg-cream/60 p-3 ring-1 ring-ink/5">
                <div className="flex items-center gap-2">
                  {editing?.id === c.id ? (
                    <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); if (editing.name.trim().length >= 2) { renameCategory(c.id, editing.name); setEditing(null); } }}>
                      <input className={`${inputCls} py-2`} value={editing.name} onChange={(e) => setEditing({ id: c.id, name: e.target.value })} autoFocus maxLength={30} aria-label="Название категории" />
                      <button type="submit" className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange text-white" aria-label="Сохранить"><Check className="size-4" /></button>
                    </form>
                  ) : (
                    <p className="min-w-0 flex-1 truncate font-bold">
                      {c.name} <span className="ml-1 text-sm font-semibold text-ink/40">{count(c.id)}</span>
                    </p>
                  )}
                  <button type="button" disabled={i === 0} onClick={() => moveCategory(c.id, -1)} className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-ink/5 disabled:opacity-25" aria-label="Выше"><ArrowUp className="size-4" /></button>
                  <button type="button" disabled={i === data.categories.length - 1} onClick={() => moveCategory(c.id, 1)} className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-ink/5 disabled:opacity-25" aria-label="Ниже"><ArrowDown className="size-4" /></button>
                  {editing?.id !== c.id && (
                    <button type="button" onClick={() => setEditing({ id: c.id, name: c.name })} className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-ink/5" aria-label="Переименовать"><Pencil className="size-4" /></button>
                  )}
                  <button type="button" onClick={() => setRemoving({ id: c.id, moveTo: data.categories.find((x) => x.id !== c.id)?.id ?? "" })} className="inline-flex size-9 items-center justify-center rounded-lg text-ink/50 hover:bg-brand/10 hover:text-brand" aria-label="Удалить категорию"><Trash2 className="size-4" /></button>
                </div>
                {removing?.id === c.id && (
                  <div className="mt-3 space-y-2 rounded-xl bg-white p-3 text-sm ring-1 ring-brand/20">
                    {count(c.id) > 0 ? (
                      <>
                        <p className="font-semibold">В категории {count(c.id)} поз. Что с ними сделать?</p>
                        <select className={`${inputCls} py-2`} value={removing.moveTo} onChange={(e) => setRemoving({ id: c.id, moveTo: e.target.value })}>
                          {data.categories.filter((x) => x.id !== c.id).map((x) => (
                            <option key={x.id} value={x.id}>Перенести в «{x.name}»</option>
                          ))}
                          <option value="">Удалить вместе с категорией</option>
                        </select>
                      </>
                    ) : (
                      <p className="font-semibold">Удалить пустую категорию?</p>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { deleteCategory(c.id, removing.moveTo || null); setRemoving(null); toast("Категория удалена"); }} className="rounded-lg bg-brand px-3 py-2 font-bold text-white">Удалить</button>
                      <button type="button" onClick={() => setRemoving(null)} className="rounded-lg px-3 py-2 font-bold text-ink/60 hover:bg-ink/5">Отмена</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-5">
        <form onSubmit={add} className={card}>
          <h2 className="font-display text-lg font-bold">Новая категория</h2>
          <div className="mt-4 flex gap-2">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" maxLength={30} aria-label="Название новой категории" />
            <button type="submit" disabled={name.trim().length < 2} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-orange px-4 font-bold text-white disabled:opacity-40">
              <FolderPlus className="size-4" /> Добавить
            </button>
          </div>
        </form>
        {presets.length > 0 && (
          <div className={card}>
            <h2 className="font-display text-lg font-bold">Быстрый старт</h2>
            <p className="mt-1 text-sm text-ink/55">Типовые разделы для стритфуда — только названия, без блюд.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {presets.map((p) => (
                <button key={p} type="button" onClick={() => { addCategory(p); toast(`Категория «${p}» добавлена`); }} className="inline-flex items-center gap-1.5 rounded-full bg-cream-2 px-3.5 py-2 text-sm font-bold transition hover:bg-cream-3">
                  <Plus className="size-3.5" /> {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Акции ---------------- */

function PromoEditor({ promo }: { promo: Promotion }) {
  const data = useData();
  const [open, setOpen] = useState(false);
  const combo = promo.kind === "combo" ? getCombo(data) : null;
  const set = (patch: Partial<Promotion>) => updatePromotion(promo.id, patch);
  const kindLabel = { combo: "Комбо", "first-order": "Первый заказ", daily: "Предложение дня" }[promo.kind];

  return (
    <div className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wider text-orange uppercase">{kindLabel}</p>
          <h3 className="font-display text-lg font-bold break-words">{promo.title}</h3>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={promo.active} onChange={(e) => set({ active: e.target.checked })} className="size-5 accent-orange" />
          Активна
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-bold">Заголовок</span>
            <input className={inputCls} value={promo.title} onChange={(e) => set({ title: e.target.value })} maxLength={50} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">Описание</span>
            <textarea className={`${inputCls} min-h-20`} value={promo.description} onChange={(e) => set({ description: e.target.value })} maxLength={200} />
          </label>

          {promo.kind === "combo" && combo && (
            <>
              <fieldset>
                <legend className="mb-1 text-sm font-bold">Состав набора (минимум 2)</legend>
                {data.products.length === 0 ? (
                  <p className="text-sm text-ink/50">Сначала добавьте позиции в меню.</p>
                ) : (
                  <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl bg-cream/60 p-2">
                    {data.products.map((p) => {
                      const on = promo.productIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white">
                          <input type="checkbox" checked={on} className="size-4 accent-orange"
                            onChange={() => set({ productIds: on ? promo.productIds.filter((x) => x !== p.id) : [...promo.productIds, p.id] })} />
                          <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                          <span className="text-ink/50 tabular-nums">{formatPrice(p.price)}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>
              <label className="block">
                <span className="mb-1 block text-sm font-bold">Цена комбо, ₽</span>
                <input className={inputCls} inputMode="numeric" value={promo.comboPrice ?? ""} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); set({ comboPrice: v ? Number(v) : null }); }} placeholder={combo.regular ? `по отдельности ${combo.regular}` : ""} />
                {combo.regular > 0 && (
                  <span className={`mt-1 block text-xs font-semibold ${promo.comboPrice && promo.comboPrice < combo.regular ? "text-emerald-700" : "text-ink/50"}`}>
                    По отдельности: {formatPrice(combo.regular)}
                    {promo.comboPrice && promo.comboPrice < combo.regular ? ` · выгода ${formatPrice(combo.regular - promo.comboPrice)}` : ""}
                  </span>
                )}
              </label>
              <p className={`rounded-xl px-3 py-2 text-sm font-semibold ${combo.ready ? "bg-emerald-50 text-emerald-700" : "bg-mustard/20 text-[#7a5a00]"}`}>
                {combo.ready ? "Комбо показывается на сайте и доступно для заказа." : "Комбо не готово: нужно ≥2 доступных позиции и цена."}
              </p>
            </>
          )}

          {promo.kind === "daily" && (
            <label className="block">
              <span className="mb-1 block text-sm font-bold">Позиция дня</span>
              <select className={inputCls} value={promo.productIds[0] ?? ""} onChange={(e) => set({ productIds: e.target.value ? [e.target.value] : [] })}>
                <option value="">— не выбрана —</option>
                {data.products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} · {formatPrice(p.price)}</option>
                ))}
              </select>
            </label>
          )}

          {(promo.kind === "daily" || promo.kind === "first-order") && (
            <label className="block">
              <span className="mb-1 block text-sm font-bold">Скидка, %</span>
              <input className={inputCls} inputMode="numeric" value={promo.discountPercent} onChange={(e) => set({ discountPercent: Math.min(90, Number(e.target.value.replace(/\D/g, "")) || 0) })} />
            </label>
          )}
        </div>

        <div>
          <span className="mb-1 block text-sm font-bold">Фото карточки</span>
          {open ? (
            <ImagePicker value={promo.image} onChange={(v) => set({ image: v })} />
          ) : (
            <button type="button" onClick={() => setOpen(true)} className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl">
              <FoodImage src={promo.image} alt={promo.title} className="size-full" />
              <span className="absolute inset-0 flex items-center justify-center bg-ink/0 font-bold text-white opacity-0 transition group-hover:bg-ink/50 group-hover:opacity-100">Сменить фото</span>
            </button>
          )}
          {promo.kind === "daily" && <p className="mt-2 text-xs text-ink/50">Если у позиции дня есть своё фото, на сайте показывается оно.</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Настройки ---------------- */

function NumberField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (n: number) => void; suffix: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold">{label}</span>
      <div className="relative">
        <input className={`${inputCls} pr-14`} inputMode="numeric" value={value} onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)} />
        <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-ink/45">{suffix}</span>
      </div>
    </label>
  );
}

function SettingsTab() {
  const data = useData();
  const { toast } = useUI();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const s = data.settings;
  const setStage = (k: keyof typeof s.stageSeconds, v: number) => updateSettings({ stageSeconds: { ...s.stageSeconds, [k]: Math.max(1, Math.min(600, v)) } });

  const download = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `papito-menu-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (f: File | undefined) => {
    if (!f) return;
    try {
      importData(await f.text());
      toast("Данные импортированы");
    } catch {
      toast("Файл не похож на экспорт Papito", "error");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className={card}>
        <h2 className="font-display text-lg font-bold">Заказы и доставка</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <NumberField label="Стоимость доставки" value={s.deliveryFee} onChange={(n) => updateSettings({ deliveryFee: n })} suffix="₽" />
          <NumberField label="Базовое приготовление" value={s.basePrepMinutes} onChange={(n) => updateSettings({ basePrepMinutes: n })} suffix="мин" />
          <NumberField label="Время в пути курьера" value={s.deliveryMinutes} onChange={(n) => updateSettings({ deliveryMinutes: n })} suffix="мин" />
        </div>
        <p className="mt-3 text-xs text-ink/50">0 ₽ — доставка бесплатная. Минуты используются для ориентировочного времени ожидания на экране клиента.</p>

        <h2 className="mt-8 font-display text-lg font-bold">Скорость демо-симуляции</h2>
        <p className="mt-1 text-sm text-ink/55">Сколько секунд длится каждый этап при автоматическом продвижении.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <NumberField label="Принят" value={s.stageSeconds.accepted} onChange={(n) => setStage("accepted", n)} suffix="с" />
          <NumberField label="Готовится" value={s.stageSeconds.cooking} onChange={(n) => setStage("cooking", n)} suffix="с" />
          <NumberField label="Упаковка" value={s.stageSeconds.packing} onChange={(n) => setStage("packing", n)} suffix="с" />
        </div>
      </div>

      <div className={card}>
        <h2 className="font-display text-lg font-bold">Данные демо</h2>
        <p className="mt-1 text-sm text-ink/55">Всё хранится в localStorage этого браузера. Экспортируйте меню в файл, чтобы перенести его на другое устройство.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-cream hover:bg-ink-3">
            <Download className="size-4" /> Экспорт JSON
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-cream-2 px-4 py-3 text-sm font-bold hover:bg-cream-3">
            <Upload className="size-4" /> Импорт JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </div>
        <div className="mt-8 space-y-3 border-t border-ink/10 pt-6">
          <button type="button" disabled={!data.orders.length} onClick={() => { clearOrders(); toast("Заказы удалены"); }} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ring-1 ring-ink/15 hover:bg-ink/5 disabled:opacity-40">
            <ChefHat className="size-4" /> Удалить все заказы ({data.orders.length})
          </button>
          {confirmReset ? (
            <div className="rounded-xl bg-brand/10 p-3 text-sm">
              <p className="font-semibold text-brand">Удалить меню, категории, заказы и настройки акций? Отменить нельзя.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => { resetAll(); setConfirmReset(false); toast("Демо сброшено"); }} className="rounded-lg bg-brand px-3 py-2 font-bold text-white">Да, сбросить</button>
                <button type="button" onClick={() => setConfirmReset(false)} className="rounded-lg px-3 py-2 font-bold text-ink/60 hover:bg-ink/5">Отмена</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmReset(true)} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-brand ring-1 ring-brand/30 hover:bg-brand/5">
              <RotateCcw className="size-4" /> Сбросить демо полностью
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Панель ---------------- */

export function AdminPanel({ initialTab = "products", openNew = false }: { initialTab?: Tab; openNew?: boolean }) {
  const data = useData();
  const hydrated = useHydrated();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [editing, setEditing] = useState<Product | null | undefined>(openNew ? null : undefined);

  useEffect(() => {
    // убираем ?new=1 / ?tab=…, чтобы перезагрузка не открывала форму повторно
    if (window.location.search) window.history.replaceState(null, "", "/admin");
  }, []);

  const stats = useMemo(
    () => [
      { label: "Позиций", value: data.products.length },
      { label: "В наличии", value: data.products.filter((p) => p.available).length },
      { label: "Категорий", value: data.categories.length },
      { label: "Заказов", value: data.orders.length },
    ],
    [data],
  );

  return (
    <div className="min-h-dvh bg-cream">
      <header className="sticky top-0 z-30 bg-ink text-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo size={40} />
            <span className="hidden h-8 w-px bg-cream/15 sm:block" />
            <h1 className="font-display text-lg font-black">Управление меню</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/kitchen" className="inline-flex h-10 items-center gap-2 rounded-full border border-cream/15 px-4 text-sm font-bold hover:border-cream/40">
              <ChefHat className="size-4" /> Кухня
            </Link>
            <Link href="/#menu" className="inline-flex h-10 items-center rounded-full bg-orange px-4 text-sm font-bold text-white hover:bg-[#ff8a2e]">
              Смотреть сайт
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-4 ring-1 ring-ink/5">
              <p className="text-sm text-ink/50">{s.label}</p>
              <p className="font-display text-3xl font-black tabular-nums">{hydrated ? s.value : "—"}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
            {tabs.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${tab === t.id ? "bg-ink text-cream" : "text-ink/60 hover:bg-ink/5 hover:text-ink"}`}>
                <t.icon className="size-4" /> {t.label}
              </button>
            ))}
          </div>
          {tab === "products" && hydrated && data.products.length > 0 && (
            <button type="button" onClick={() => setEditing(null)} className={`${btnPrimary} py-3`}>
              <Plus className="size-5" /> Добавить позицию
            </button>
          )}
        </div>

        <div className="mt-5">
          {!hydrated ? (
            <div className="skeleton h-72 rounded-[24px]" aria-busy="true" />
          ) : tab === "products" ? (
            <ProductsTab onEdit={setEditing} />
          ) : tab === "categories" ? (
            <CategoriesTab />
          ) : tab === "promotions" ? (
            <div className="space-y-5">
              {data.promotions.map((p) => (
                <PromoEditor key={p.id} promo={p} />
              ))}
            </div>
          ) : (
            <SettingsTab />
          )}
        </div>
        <p className="mt-8 text-center text-xs text-ink/40">Панель управления демо-версии: изменения сохраняются только в этом браузере и сразу видны на сайте и панели кухни.</p>
      </main>

      {editing !== undefined && hydrated && <ProductForm key={editing?.id ?? "new"} product={editing} onClose={() => setEditing(undefined)} />}
    </div>
  );
}
