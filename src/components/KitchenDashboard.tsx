"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Archive, ArchiveRestore, Bike, ChevronLeft, ChevronRight, ClipboardList, Eye, FlaskConical, MessageSquare, Pause, Play, Plus, RotateCcw, Store, Timer, Trash2, Zap,
} from "lucide-react";
import type { Order } from "@/lib/types";
import {
  STATUS_ORDER, archiveOrder, deleteOrder, orderProgress, placeOrder, restartOrder, setOrderAuto, setOrderStatus, togglePause, useData, useHydrated,
} from "@/lib/store";
import { formatOrderNumber, formatPrice, formatTime } from "@/lib/format";
import { StatusIcon, statusLabel } from "@/lib/statuses";
import { useUI } from "./AppProviders";
import { Logo, useNow } from "./ui";

const nextAction: Record<Order["status"], (f: Order["fulfillment"]) => string> = {
  accepted: () => "Готовить",
  cooking: () => "Упаковать",
  packing: (f) => (f === "delivery" ? "Курьеру" : "Готов"),
  ready: () => "",
};

const columnTitle: Record<Order["status"], string> = {
  accepted: "Приняты",
  cooking: "Готовятся",
  packing: "Упаковка",
  ready: "Готовы / у курьера",
};

function OrderTicket({ order, now }: { order: Order; now: number }) {
  const data = useData();
  const idx = STATUS_ORDER.indexOf(order.status);
  const { progress, nextInSec } = orderProgress(order, data.settings, now);
  const mins = Math.floor((now - order.createdAt) / 60000);
  const ready = order.status === "ready";

  return (
    <article className="animate-pop rounded-2xl bg-ink-2 p-4 text-cream ring-1 ring-cream/10">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl font-black">{formatOrderNumber(order.number)}</p>
          <p className="mt-0.5 text-xs text-cream/50 tabular-nums">
            {formatTime(order.createdAt)} · {mins < 1 ? "только что" : `${mins} мин назад`}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${order.fulfillment === "delivery" ? "bg-sky-500/20 text-sky-200" : "bg-emerald-500/20 text-emerald-200"}`}>
          {order.fulfillment === "delivery" ? <Bike className="size-3.5" /> : <Store className="size-3.5" />}
          {order.fulfillment === "delivery" ? "Доставка" : "Самовывоз"}
        </span>
      </header>

      <p className="mt-2 truncate text-sm text-cream/70">{order.customerName} · {order.phone}</p>

      <ul className="mt-3 space-y-1.5 rounded-xl bg-black/25 p-3 text-sm">
        {order.items.map((it, i) => (
          <li key={i}>
            <div className="flex gap-2">
              <span className="font-display font-black text-mustard tabular-nums">{it.qty}×</span>
              <span className="min-w-0 font-semibold break-words">{it.name}</span>
            </div>
            {it.details && <p className="pl-7 text-xs text-cream/45">{it.details.join(" · ")}</p>}
          </li>
        ))}
      </ul>

      {order.comment && (
        <p className="mt-2 flex gap-2 rounded-xl bg-mustard/10 p-2.5 text-xs text-mustard">
          <MessageSquare className="size-4 shrink-0" /> <span className="break-words">{order.comment}</span>
        </p>
      )}

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-cream/50">
          <span className="inline-flex items-center gap-1.5">
            <StatusIcon status={order.status} fulfillment={order.fulfillment} className="size-3.5" /> {statusLabel(order.status, order.fulfillment)}
          </span>
          <span className="tabular-nums">
            {ready ? formatPrice(order.total) : order.autoAdvance ? (order.pausedAt ? "пауза" : `авто · ${nextInSec} с`) : "вручную"}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream/10">
          <div className={`h-full rounded-full transition-[width] duration-700 ${ready ? "bg-emerald-500" : "bg-orange"}`} style={{ width: `${Math.max(3, progress * 100)}%` }} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-black/25 p-1" role="group" aria-label="Статус заказа">
        {STATUS_ORDER.map((s, i) => {
          return (
            <button
              key={s}
              type="button"
              onClick={() => setOrderStatus(order.id, s)}
              title={statusLabel(s, order.fulfillment)}
              aria-label={statusLabel(s, order.fulfillment)}
              aria-pressed={i === idx}
              className={`flex h-9 items-center justify-center rounded-lg transition ${i === idx ? "bg-orange text-white" : i < idx ? "text-orange hover:bg-cream/10" : "text-cream/40 hover:bg-cream/10 hover:text-cream"}`}
            >
              <StatusIcon status={s} fulfillment={order.fulfillment} className="size-4" />
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <button type="button" disabled={idx === 0} onClick={() => setOrderStatus(order.id, STATUS_ORDER[idx - 1])} className="inline-flex h-9 items-center gap-1 rounded-lg bg-cream/10 px-2.5 text-xs font-bold transition hover:bg-cream/20 disabled:opacity-30" aria-label="Предыдущий этап">
          <ChevronLeft className="size-4" />
        </button>
        {!ready ? (
          <button type="button" onClick={() => setOrderStatus(order.id, STATUS_ORDER[idx + 1])} title={statusLabel(STATUS_ORDER[idx + 1], order.fulfillment)} className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg bg-orange px-3 text-xs font-extrabold text-white transition hover:bg-[#ff8a2e]">
            {nextAction[order.status](order.fulfillment)} <ChevronRight className="size-4" />
          </button>
        ) : (
          <button type="button" onClick={() => archiveOrder(order.id)} className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-extrabold text-white transition hover:bg-emerald-500">
            <Archive className="size-4" /> {order.fulfillment === "delivery" ? "Доставлен" : "Выдан"}
          </button>
        )}
        {!ready && (
          <button
            type="button"
            onClick={() => setOrderAuto(order.id, !order.autoAdvance)}
            title={order.autoAdvance ? "Отключить автопереход" : "Включить автопереход по таймеру"}
            className={`inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-bold transition ${order.autoAdvance ? "bg-mustard/20 text-mustard" : "bg-cream/10 text-cream/60 hover:bg-cream/20"}`}
          >
            <Zap className="size-4" /> Авто
          </button>
        )}
        {!ready && order.autoAdvance && (
          <button type="button" onClick={() => togglePause(order.id)} className="inline-flex h-9 items-center rounded-lg bg-cream/10 px-2.5 transition hover:bg-cream/20" aria-label={order.pausedAt ? "Продолжить" : "Пауза"} title={order.pausedAt ? "Продолжить" : "Пауза"}>
            {order.pausedAt ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
        )}
        <Link href={`/order/${order.id}`} className="inline-flex h-9 items-center rounded-lg bg-cream/10 px-2.5 transition hover:bg-cream/20" title="Экран клиента" aria-label="Открыть экран клиента">
          <Eye className="size-4" />
        </Link>
      </div>
    </article>
  );
}

export function KitchenDashboard() {
  const data = useData();
  const hydrated = useHydrated();
  const now = useNow(1000);
  const { toast } = useUI();
  const [showArchive, setShowArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const active = data.orders.filter((o) => !o.archived);
  const archived = data.orders.filter((o) => o.archived);
  const available = data.products.filter((p) => p.available);

  const createTestOrder = () => {
    if (!available.length) return;
    const pool = [...available].sort(() => Math.random() - 0.5).slice(0, Math.min(available.length, 1 + Math.floor(Math.random() * 3)));
    const items = pool.map((p) => ({ name: p.name, qty: 1 + Math.floor(Math.random() * 2), unitPrice: p.price }));
    const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const delivery = Math.random() > 0.5;
    const order = placeOrder({
      customerName: "Тестовый гость",
      phone: "+7 (000) 000-00-00",
      fulfillment: delivery ? "delivery" : "pickup",
      address: delivery ? "Тестовый адрес (демо)" : "",
      comment: "",
      payment: "card-on-receipt",
      items,
      subtotal,
      discount: 0,
      discountLabel: "",
      deliveryFee: delivery ? data.settings.deliveryFee : 0,
      total: subtotal + (delivery ? data.settings.deliveryFee : 0),
      estimateMinutes: data.settings.basePrepMinutes + (delivery ? data.settings.deliveryMinutes : 0),
    });
    if (order) toast(`Тестовый заказ ${formatOrderNumber(order.number)} создан`);
  };

  return (
    <div className="min-h-dvh bg-ink text-cream">
      <header className="sticky top-0 z-30 border-b border-cream/10 bg-ink/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo size={40} />
            <span className="hidden h-8 w-px bg-cream/15 sm:block" />
            <div>
              <h1 className="font-display text-lg leading-tight font-black">Панель кухни</h1>
              <p className="text-xs text-cream/50">Демонстрация · синхронизировано с экраном клиента</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={createTestOrder}
              disabled={!hydrated || !available.length}
              title={available.length ? "Случайный заказ из текущего меню" : "Сначала добавьте позиции в меню"}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-orange px-4 text-sm font-bold text-white transition hover:bg-[#ff8a2e] disabled:opacity-40"
            >
              <Plus className="size-4" /> Тестовый заказ
            </button>
            <Link href="/" className="inline-flex h-10 items-center rounded-full border border-cream/15 px-4 text-sm font-bold transition hover:border-cream/40">
              На сайт
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-dashed border-mustard/30 bg-mustard/[0.06] p-4 text-sm text-cream/70">
          <FlaskConical className="mt-0.5 size-5 shrink-0 text-mustard" />
          <p>
            Это демонстрационный экран: заказы создаются только в этом браузере и не передаются в реальную кухню или службу доставки. Меняйте статусы кнопками на карточке — экран
            клиента обновится сразу, даже в другой вкладке. «Авто» — продвижение этапов по таймеру ({data.settings.stageSeconds.accepted}/{data.settings.stageSeconds.cooking}/
            {data.settings.stageSeconds.packing} с).
          </p>
        </div>

        {!hydrated ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-3xl bg-cream/5" />
            ))}
          </div>
        ) : active.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl bg-ink-2 px-6 py-20 text-center ring-1 ring-cream/10">
            <ClipboardList className="size-14 text-orange" />
            <h2 className="mt-5 font-display text-2xl font-black">Активных заказов нет</h2>
            <p className="mt-2 max-w-md text-cream/60">
              {data.products.length
                ? "Оформите заказ на сайте или создайте тестовый — он появится здесь в колонке «Приняты»."
                : "Меню пока пустое. Добавьте позиции в панели управления, затем оформите заказ на сайте."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {data.products.length ? (
                <>
                  <Link href="/#menu" className="inline-flex h-11 items-center rounded-full bg-orange px-5 font-bold text-white transition hover:bg-[#ff8a2e]">Открыть меню</Link>
                  <button type="button" onClick={createTestOrder} disabled={!available.length} className="inline-flex h-11 items-center gap-2 rounded-full border border-cream/20 px-5 font-bold transition hover:border-cream/50 disabled:opacity-40">
                    <Plus className="size-4" /> Тестовый заказ
                  </button>
                </>
              ) : (
                <Link href="/admin?new=1" className="inline-flex h-11 items-center gap-2 rounded-full bg-orange px-5 font-bold text-white transition hover:bg-[#ff8a2e]">
                  <Plus className="size-4" /> Добавить позицию
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 xl:mx-0 xl:grid xl:grid-cols-4 xl:overflow-visible xl:px-0">
            {STATUS_ORDER.map((s) => {
              const list = active.filter((o) => o.status === s).sort((a, b) => a.createdAt - b.createdAt);
              return (
                <section key={s} className="w-[85vw] max-w-sm shrink-0 snap-start rounded-3xl bg-black/30 p-3 ring-1 ring-cream/5 sm:w-80 xl:w-auto xl:max-w-none">
                  <h2 className="flex items-center justify-between px-2 pt-1 pb-3">
                    <span className="inline-flex items-center gap-2 font-display font-bold">
                      <StatusIcon status={s} fulfillment="pickup" className={`size-5 ${s === "ready" ? "text-emerald-400" : "text-orange"}`} /> {columnTitle[s]}
                    </span>
                    <span className="rounded-full bg-cream/10 px-2.5 py-0.5 text-sm font-bold tabular-nums">{list.length}</span>
                  </h2>
                  <div className="space-y-3">
                    {list.length === 0 && <p className="rounded-2xl border border-dashed border-cream/10 px-3 py-8 text-center text-sm text-cream/35">Пусто</p>}
                    {list.map((o) => (
                      <OrderTicket key={o.id} order={o} now={now} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {hydrated && archived.length > 0 && (
          <section className="mt-8">
            <button type="button" onClick={() => setShowArchive((v) => !v)} className="inline-flex items-center gap-2 font-display font-bold text-cream/70 transition hover:text-cream" aria-expanded={showArchive}>
              <Archive className="size-5" /> Архив ({archived.length}) <ChevronRight className={`size-4 transition ${showArchive ? "rotate-90" : ""}`} />
            </button>
            {showArchive && (
              <div className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-cream/10">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-cream/5 text-cream/50">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Заказ</th>
                      <th className="px-4 py-3 font-semibold">Создан</th>
                      <th className="px-4 py-3 font-semibold">Гость</th>
                      <th className="px-4 py-3 font-semibold">Сумма</th>
                      <th className="px-4 py-3 text-right font-semibold">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream/5">
                    {archived.map((o) => (
                      <tr key={o.id}>
                        <td className="px-4 py-3 font-bold">{formatOrderNumber(o.number)}</td>
                        <td className="px-4 py-3 text-cream/60 tabular-nums">
                          <Timer className="mr-1 inline size-3.5" />
                          {formatTime(o.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-cream/70">{o.customerName}</td>
                        <td className="px-4 py-3 tabular-nums">{formatPrice(o.total)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button type="button" onClick={() => archiveOrder(o.id, false)} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-cream/10 px-2.5 text-xs font-bold hover:bg-cream/20">
                              <ArchiveRestore className="size-3.5" /> Вернуть
                            </button>
                            <button type="button" onClick={() => restartOrder(o.id)} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-cream/10 px-2.5 text-xs font-bold hover:bg-cream/20">
                              <RotateCcw className="size-3.5" /> Заново
                            </button>
                            {confirmDelete === o.id ? (
                              <button type="button" onClick={() => { deleteOrder(o.id); setConfirmDelete(null); }} className="inline-flex h-8 items-center rounded-lg bg-brand px-2.5 text-xs font-bold">
                                Удалить?
                              </button>
                            ) : (
                              <button type="button" onClick={() => setConfirmDelete(o.id)} className="inline-flex h-8 items-center rounded-lg bg-cream/10 px-2.5 hover:bg-brand/60" aria-label="Удалить заказ">
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
