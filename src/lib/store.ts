"use client";

import { useSyncExternalStore } from "react";
import { createInitialData, initialPromotions } from "@/data/initialData";
import type { AppData, CartLine, Category, Order, OrderStatus, Product, Promotion, Settings } from "./types";
import { uid } from "./format";

/**
 * Клиентское хранилище демо-версии: одно состояние для меню, акций,
 * заказов и корзины. Сохраняется в localStorage и синхронизируется
 * между вкладками через событие `storage` (сайт ↔ панель кухни).
 */

const DATA_KEY = "papito:data:v1";
const CART_KEY = "papito:cart:v1";

const serverData = createInitialData();
const serverCart: CartLine[] = [];

let data: AppData = serverData;
let cart: CartLine[] = serverCart;
let loaded = false;
const listeners = new Set<() => void>();
const errorListeners = new Set<(message: string) => void>();

function normalize(raw: unknown): AppData {
  const base = createInitialData();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<AppData>;
  const products = Array.isArray(r.products) ? r.products : [];
  const promotions = initialPromotions.map((def) => {
    const saved = Array.isArray(r.promotions) ? r.promotions.find((p) => p.kind === def.kind) : undefined;
    return saved ? { ...def, ...saved } : structuredClone(def);
  });
  return {
    version: 1,
    testMenuInitialized: true,
    categories: Array.isArray(r.categories) ? r.categories : [],
    products: !r.testMenuInitialized && products.length === 0 ? base.products : products,
    promotions,
    settings: {
      ...base.settings,
      ...(r.settings ?? {}),
      stageSeconds: { ...base.settings.stageSeconds, ...(r.settings?.stageSeconds ?? {}) },
    },
    orders: Array.isArray(r.orders) ? r.orders : [],
    orderSeq: typeof r.orderSeq === "number" ? r.orderSeq : base.orderSeq,
  };
}

function read<T>(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    const msg = "Не удалось сохранить данные в браузере — возможно, переполнено хранилище (слишком большие фото).";
    errorListeners.forEach((l) => l(msg));
    return false;
  }
}

const emit = () => listeners.forEach((l) => l());

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const savedData = read<Partial<AppData>>(DATA_KEY);
  data = normalize(savedData);
  if (!savedData || !(savedData as Partial<AppData>).testMenuInitialized) {
    write(DATA_KEY, data);
  }
  const savedCart = read(CART_KEY);
  cart = Array.isArray(savedCart) ? (savedCart as CartLine[]) : [];
  window.addEventListener("storage", (e) => {
    if (e.key === DATA_KEY) {
      data = normalize(read(DATA_KEY));
      emit();
    } else if (e.key === CART_KEY) {
      const c = read(CART_KEY);
      cart = Array.isArray(c) ? (c as CartLine[]) : [];
      emit();
    } else if (e.key === null) {
      data = normalize(read(DATA_KEY));
      cart = [];
      emit();
    }
  });
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function onPersistError(listener: (message: string) => void) {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
}

export function useData(): AppData {
  return useSyncExternalStore(
    subscribe,
    () => (ensureLoaded(), data),
    () => serverData,
  );
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(
    subscribe,
    () => (ensureLoaded(), cart),
    () => serverCart,
  );
}

const noopSubscribe = () => () => {};
/** false во время серверного рендера и гидратации — для состояний загрузки. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function getData() {
  ensureLoaded();
  return data;
}

function updateData(fn: (d: AppData) => AppData) {
  ensureLoaded();
  const next = fn(data);
  const ok = write(DATA_KEY, next);
  if (ok) {
    data = next;
    emit();
  }
  return ok;
}

function updateCart(fn: (c: CartLine[]) => CartLine[]) {
  ensureLoaded();
  cart = fn(cart);
  write(CART_KEY, cart);
  emit();
}

/* ---------- Меню ---------- */

export function addCategory(name: string) {
  const category: Category = { id: uid(), name: name.trim() };
  updateData((d) => ({ ...d, categories: [...d.categories, category] }));
  return category;
}

export function renameCategory(id: string, name: string) {
  updateData((d) => ({ ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, name: name.trim() } : c)) }));
}

export function moveCategory(id: string, dir: -1 | 1) {
  updateData((d) => {
    const list = [...d.categories];
    const i = list.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return d;
    [list[i], list[j]] = [list[j], list[i]];
    return { ...d, categories: list };
  });
}

/** Удаляет категорию; позиции переносятся в `moveTo` или удаляются, если он не задан. */
export function deleteCategory(id: string, moveTo: string | null) {
  updateData((d) => {
    const products = moveTo
      ? d.products.map((p) => (p.categoryId === id ? { ...p, categoryId: moveTo } : p))
      : d.products.filter((p) => p.categoryId !== id);
    return { ...d, categories: d.categories.filter((c) => c.id !== id), products, promotions: cleanupPromos(d.promotions, products) };
  });
}

export function saveProduct(input: Omit<Product, "id" | "createdAt"> & { id?: string }) {
  return updateData((d) => {
    if (input.id) {
      return { ...d, products: d.products.map((p) => (p.id === input.id ? { ...p, ...input, id: p.id } : p)) };
    }
    const product: Product = { ...input, id: uid(), createdAt: Date.now() };
    return { ...d, products: [...d.products, product] };
  });
}

export function toggleProductAvailability(id: string) {
  updateData((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? { ...p, available: !p.available } : p)) }));
}

export function deleteProduct(id: string) {
  updateData((d) => {
    const products = d.products.filter((p) => p.id !== id);
    return { ...d, products, promotions: cleanupPromos(d.promotions, products) };
  });
  updateCart((c) => c.filter((l) => !(l.kind === "product" && l.refId === id)));
}

function cleanupPromos(promos: Promotion[], products: Product[]) {
  const ids = new Set(products.map((p) => p.id));
  return promos.map((p) => ({ ...p, productIds: p.productIds.filter((id) => ids.has(id)) }));
}

export function updatePromotion(id: string, patch: Partial<Promotion>) {
  updateData((d) => ({ ...d, promotions: d.promotions.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
}

export function updateSettings(patch: Partial<Settings>) {
  updateData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
}

export function exportData() {
  return JSON.stringify(getData(), null, 2);
}

export function importData(json: string) {
  const parsed = JSON.parse(json);
  return updateData(() => normalize(parsed));
}

export function resetAll() {
  updateData(() => createInitialData());
  updateCart(() => []);
}

/* ---------- Корзина ---------- */

export function addToCart(kind: CartLine["kind"], refId: string, qty = 1) {
  updateCart((c) => {
    const existing = c.find((l) => l.kind === kind && l.refId === refId);
    if (existing) return c.map((l) => (l === existing ? { ...l, qty: Math.min(99, l.qty + qty) } : l));
    return [...c, { key: uid(), kind, refId, qty }];
  });
}

export function setCartQty(key: string, qty: number) {
  updateCart((c) => (qty <= 0 ? c.filter((l) => l.key !== key) : c.map((l) => (l.key === key ? { ...l, qty: Math.min(99, qty) } : l))));
}

export function removeFromCart(key: string) {
  updateCart((c) => c.filter((l) => l.key !== key));
}

export function clearCart() {
  updateCart(() => []);
}

/* ---------- Заказы и симуляция ---------- */

export const STATUS_ORDER: OrderStatus[] = ["accepted", "cooking", "packing", "ready"];

export function placeOrder(input: Omit<Order, "id" | "number" | "createdAt" | "status" | "history" | "stageStartedAt" | "autoAdvance" | "pausedAt" | "archived">) {
  const now = Date.now();
  let created: Order | null = null;
  const ok = updateData((d) => {
    const order: Order = {
      ...input,
      id: uid(),
      number: d.orderSeq + 1,
      createdAt: now,
      status: "accepted",
      history: { accepted: now },
      stageStartedAt: now,
      autoAdvance: true,
      pausedAt: null,
      archived: false,
    };
    created = order;
    return { ...d, orderSeq: d.orderSeq + 1, orders: [order, ...d.orders] };
  });
  return ok ? (created as Order | null) : null;
}

function patchOrder(id: string, fn: (o: Order) => Order) {
  updateData((d) => ({ ...d, orders: d.orders.map((o) => (o.id === id ? fn(o) : o)) }));
}

/** Ручная смена статуса (панель кухни). */
export function setOrderStatus(id: string, status: OrderStatus) {
  const now = Date.now();
  patchOrder(id, (o) => {
    const idx = STATUS_ORDER.indexOf(status);
    const history: Order["history"] = {};
    STATUS_ORDER.forEach((s, i) => {
      if (i < idx) history[s] = o.history[s] ?? now;
    });
    history[status] = o.status === status ? (o.history[status] ?? now) : now;
    return { ...o, status, history, stageStartedAt: now, pausedAt: o.pausedAt ? now : null };
  });
}

export function setOrderAuto(id: string, autoAdvance: boolean) {
  patchOrder(id, (o) => ({ ...o, autoAdvance, stageStartedAt: autoAdvance ? Date.now() : o.stageStartedAt, pausedAt: null }));
}

export function togglePause(id: string) {
  const now = Date.now();
  patchOrder(id, (o) =>
    o.pausedAt
      ? { ...o, pausedAt: null, stageStartedAt: o.stageStartedAt + (now - o.pausedAt) }
      : { ...o, pausedAt: now },
  );
}

export function restartOrder(id: string) {
  const now = Date.now();
  patchOrder(id, (o) => ({
    ...o,
    status: "accepted",
    history: { accepted: now },
    stageStartedAt: now,
    autoAdvance: true,
    pausedAt: null,
    archived: false,
  }));
}

export function archiveOrder(id: string, archived = true) {
  patchOrder(id, (o) => ({ ...o, archived }));
}

export function deleteOrder(id: string) {
  updateData((d) => ({ ...d, orders: d.orders.filter((o) => o.id !== id) }));
}

export function clearOrders() {
  updateData((d) => ({ ...d, orders: [] }));
}

/**
 * Продвигает этапы по таймеру. Время перехода детерминировано
 * (начало этапа + длительность), поэтому несколько открытых вкладок
 * приходят к одному и тому же результату.
 */
export function tickSimulation(now: number) {
  const d = getData();
  let changed = false;
  const orders = d.orders.map((o) => {
    if (!o.autoAdvance || o.pausedAt || o.status === "ready" || o.archived) return o;
    let status: OrderStatus = o.status;
    let started = o.stageStartedAt;
    const history = { ...o.history };
    while (status !== "ready") {
      const dur = d.settings.stageSeconds[status as Exclude<OrderStatus, "ready">] * 1000;
      if (now - started < dur) break;
      started += dur;
      status = STATUS_ORDER[STATUS_ORDER.indexOf(status) + 1];
      history[status] = started;
    }
    if (status === o.status) return o;
    changed = true;
    return { ...o, status, history, stageStartedAt: started };
  });
  if (changed) updateData((x) => ({ ...x, orders: x.orders.map((o) => orders.find((n) => n.id === o.id) ?? o) }));
}

/** Прогресс заказа 0..1 и оставшиеся секунды демо-симуляции. */
export function orderProgress(o: Order, settings: Settings, now: number) {
  if (o.status === "ready") return { progress: 1, stageProgress: 1, remainingSec: 0, nextInSec: 0 };
  const stages = ["accepted", "cooking", "packing"] as const;
  const durs = stages.map((s) => settings.stageSeconds[s]);
  const total = durs.reduce((a, b) => a + b, 0);
  const idx = stages.indexOf(o.status as (typeof stages)[number]);
  const ref = o.pausedAt ?? now;
  const elapsed = Math.max(0, Math.min(durs[idx], (ref - o.stageStartedAt) / 1000));
  const done = durs.slice(0, idx).reduce((a, b) => a + b, 0) + elapsed;
  return {
    progress: Math.min(0.99, done / total),
    stageProgress: elapsed / durs[idx],
    remainingSec: Math.max(0, Math.ceil(total - done)),
    nextInSec: Math.max(0, Math.ceil(durs[idx] - elapsed)),
  };
}
