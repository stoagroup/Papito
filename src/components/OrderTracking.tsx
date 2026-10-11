"use client";

import Link from "next/link";
import { ArrowLeft, Check, Clock, SearchX } from "lucide-react";
import { STATUS_ORDER, orderProgress, useData, useHydrated } from "@/lib/store";
import { formatOrderNumber, formatPrice, formatTime, plural } from "@/lib/format";
import { StatusIcon, paymentLabel, statusLabel, statusText } from "@/lib/statuses";
import { btnPrimary, useNow } from "./ui";

export function OrderTracking({ orderId }: { orderId: string }) {
  const data = useData();
  const hydrated = useHydrated();
  const now = useNow(500);
  const order = data.orders.find((o) => o.id === orderId);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-8 pb-20 sm:px-6" aria-busy="true">
        <div className="skeleton h-72 rounded-xl" />
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 pt-12 pb-24 text-center">
        <SearchX className="size-14 text-orange" />
        <h1 className="mt-5 font-display text-3xl font-black">Заказ не найден</h1>
        <p className="mt-3 text-ink/60">Возможно, он был удалён на панели кухни или данные демо сброшены в этом браузере.</p>
        <Link href="/#menu" className={`${btnPrimary} mt-8`}>
          Вернуться в меню
        </Link>
      </div>
    );
  }

  const { progress } = orderProgress(order, data.settings, now);
  const idx = STATUS_ORDER.indexOf(order.status);
  const ready = order.status === "ready";
  const etaMin = ready ? 0 : Math.max(1, Math.ceil(order.estimateMinutes * (1 - progress)));
  const paused = order.pausedAt !== null;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 pb-20 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 transition hover:text-ink">
        <ArrowLeft className="size-4" /> На главную
      </Link>

      <section className="relative mt-4 overflow-hidden rounded-xl bg-cream-2 p-6 text-ink sm:p-10">

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <span className={`relative flex size-20 shrink-0 items-center justify-center rounded-xl transition-colors duration-500 sm:size-24 ${ready ? "bg-mustard" : "bg-orange"} ${ready || paused ? "" : "animate-pulse-ring"}`}>
              <span key={order.status} className="animate-pop"><StatusIcon status={order.status} fulfillment={order.fulfillment} className="size-10 sm:size-12" /></span>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink/55">Заказ {formatOrderNumber(order.number)} · {order.fulfillment === "delivery" ? "Доставка" : "Самовывоз"}</p>
              <h1 key={order.status} className="mt-1 animate-fade-up font-display text-2xl leading-tight font-bold sm:text-3xl">
                {statusLabel(order.status, order.fulfillment)}
              </h1>
              <p className="mt-2 max-w-md text-ink/65">{statusText(order.status, order.fulfillment)}</p>
            </div>
          </div>

          <div className="shrink-0 rounded-xl bg-ink/[0.07] px-6 py-4 ring-1 ring-cream/10 lg:text-right">
            <p className="flex items-center gap-2 text-sm text-ink/55 lg:justify-end">
              <Clock className="size-4" /> {ready ? "Время ожидания" : "Ориентировочно осталось"}
            </p>
            <p className="font-display text-2xl font-bold tabular-nums">
              {ready ? "Готово" : `~${etaMin} ${plural(etaMin, "минута", "минуты", "минут")}`}
            </p>

            {!ready && !order.autoAdvance && <p className="mt-1 text-xs text-ink/45">Статус меняет кухня вручную</p>}
          </div>
        </div>

        {/* Прогресс */}
        <div className="relative mt-10">
          <div className="flex justify-between text-sm font-bold">
            <span>Прогресс приготовления</span>
            <span className="tabular-nums">{Math.round(progress * 100)}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-ink/10">
            <div
              className={`relative h-full rounded-full transition-[width] duration-700 ease-out ${ready ? "bg-mustard" : "bg-mustard"}`}
              style={{ width: `${Math.max(3, progress * 100)}%` }}
            >
              {!ready && !paused && <div className="skeleton absolute inset-0 opacity-40 mix-blend-overlay" />}
            </div>
          </div>
        </div>

        {/* Временная шкала */}
        <ol className="relative mt-10 grid gap-5 sm:grid-cols-4 sm:gap-3">
          {STATUS_ORDER.map((s, i) => {
            const done = i < idx || ready;
            const current = i === idx && !ready;
            const at = order.history[s];
            return (
              <li key={s} className="relative flex gap-4 sm:flex-col sm:gap-3">
                {i < STATUS_ORDER.length - 1 && (
                  <>
                    <span className="absolute top-12 left-6 h-[calc(100%-1.75rem)] w-0.5 bg-ink/10 sm:top-6 sm:left-12 sm:h-0.5 sm:w-[calc(100%-2.25rem)]" />
                    <span
                      className={`absolute top-12 left-6 h-[calc(100%-1.75rem)] w-0.5 origin-top bg-orange transition-transform duration-700 sm:top-6 sm:left-12 sm:h-0.5 sm:w-[calc(100%-2.25rem)] sm:origin-left ${
                        i < idx || ready ? "scale-100" : "scale-y-0 sm:scale-x-0 sm:scale-y-100"
                      }`}
                    />
                  </>
                )}
                <span
                  className={`relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-500 ${
                    done ? "bg-orange text-ink" : current ? "scale-110 bg-white text-ink ring-2 ring-mustard" : "bg-ink/10 text-ink/40"
                  }`}
                >
                  {done && s !== "ready" ? <Check className="size-6" /> : <StatusIcon status={s} fulfillment={order.fulfillment} className="size-6" />}
                </span>
                <div>
                  <p className={`font-bold ${done || current ? "text-ink" : "text-ink/40"}`}>
                    {i + 1}. {statusLabel(s, order.fulfillment)}
                  </p>
                  <p className="text-sm text-ink/45 tabular-nums">{at ? formatTime(at) : current ? "сейчас" : "ожидается"}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <p className="mt-5 text-sm text-ink/60">Демонстрационный заказ. Статус обновляется в этом браузере.</p>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <section className="rounded-xl bg-white p-6 ring-1 ring-ink/5 sm:p-7">
          <h2 className="font-display text-lg font-bold">Состав заказа</h2>
          <ul className="mt-4 divide-y divide-ink/5">
            {order.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold break-words">
                    {it.name} <span className="text-ink/40">× {it.qty}</span>
                  </p>
                  {it.details && <p className="text-sm text-ink/50">{it.details.join(" · ")}</p>}
                </div>
                <span className="shrink-0 font-semibold tabular-nums">{formatPrice(it.unitPrice * it.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-dashed border-ink/15 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink/60">Сумма</dt><dd className="tabular-nums">{formatPrice(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between text-brand"><dt>{order.discountLabel}</dt><dd className="tabular-nums">−{formatPrice(order.discount)}</dd></div>}
            {order.fulfillment === "delivery" && <div className="flex justify-between"><dt className="text-ink/60">Доставка</dt><dd className="tabular-nums">{order.deliveryFee ? formatPrice(order.deliveryFee) : "бесплатно"}</dd></div>}
            <div className="flex items-end justify-between pt-2"><dt className="font-bold">Итого</dt><dd className="font-display text-2xl font-black tabular-nums">{formatPrice(order.total)}</dd></div>
          </dl>
        </section>

        <section className="rounded-xl bg-white p-6 ring-1 ring-ink/5 sm:p-7">
          <h2 className="font-display text-lg font-bold">Детали</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ["Имя", order.customerName],
              ["Телефон", order.phone],
              ["Получение", order.fulfillment === "delivery" ? `Доставка: ${order.address}` : "Самовывоз"],
              ["Оплата", paymentLabel[order.payment]],
              ["Оформлен", formatTime(order.createdAt)],
              ...(order.comment ? [["Комментарий", order.comment]] : []),
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-ink/45">{k}</dt>
                <dd className="font-semibold break-words">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
