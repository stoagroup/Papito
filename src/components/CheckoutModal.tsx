"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, Bike, CreditCard, Info, Loader2, Smartphone, Store, X } from "lucide-react";
import type { Fulfillment, PaymentMethod } from "@/lib/types";
import { clearCart, placeOrder, useCart, useData } from "@/lib/store";
import { cartCount, cartSubtotal, firstOrderDiscount, resolveCart } from "@/lib/pricing";
import { formatPhone, formatPrice, phoneDigits } from "@/lib/format";
import { useUI } from "./AppProviders";
import { useEscape } from "./CartDrawer";
import { btnPrimary, inputCls } from "./ui";

type Errors = Partial<Record<"name" | "phone" | "address" | "cart", string>>;

const payments: { id: PaymentMethod; label: string; hint: string; icon: typeof CreditCard }[] = [
  { id: "card-on-receipt", label: "Картой при получении", hint: "Терминал у кассира или курьера", icon: CreditCard },
  { id: "cash", label: "Наличными", hint: "Подготовим сдачу", icon: Banknote },
  { id: "online-demo", label: "Онлайн (демо)", hint: "Оплата не проводится", icon: Smartphone },
];

export function CheckoutModal() {
  const { checkoutOpen, closeCheckout, toast } = useUI();
  const router = useRouter();
  const data = useData();
  const cart = useCart();
  const lines = resolveCart(cart, data);
  const subtotal = cartSubtotal(lines);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("card-on-receipt");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  useEscape(checkoutOpen && !submitting, closeCheckout);

  if (!checkoutOpen) return null;

  const first = firstOrderDiscount(data, phone, subtotal);
  const discount = first?.eligible ? first.amount : 0;
  const deliveryFee = fulfillment === "delivery" ? data.settings.deliveryFee : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);
  const items = cartCount(lines);
  const estimate =
    data.settings.basePrepMinutes + Math.min(15, Math.max(0, items - 1) * 2) + (fulfillment === "delivery" ? data.settings.deliveryMinutes : 0);

  const validate = (): Errors => {
    const e: Errors = {};
    if (lines.length === 0) e.cart = "Корзина пуста — добавьте блюда из меню.";
    if (name.trim().length < 2) e.name = "Укажите имя — минимум 2 символа.";
    if (phoneDigits(phone).length !== 11) e.phone = "Введите номер полностью: +7 (XXX) XXX-XX-XX.";
    if (fulfillment === "delivery" && address.trim().length < 5) e.address = "Укажите адрес доставки: улица, дом, квартира.";
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      toast("Проверьте выделенные поля", "error");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    const order = placeOrder({
      customerName: name.trim(),
      phone: formatPhone(phone),
      fulfillment,
      address: fulfillment === "delivery" ? address.trim() : "",
      comment: comment.trim(),
      payment,
      items: lines.map((l) => ({ name: l.name, qty: l.qty, unitPrice: l.unitPrice, details: l.details.length ? l.details : undefined })),
      subtotal,
      discount,
      discountLabel: discount ? `Скидка на первый заказ −${first?.percent}%` : "",
      deliveryFee,
      total,
      estimateMinutes: estimate,
    });
    setSubmitting(false);
    if (!order) {
      toast("Не удалось сохранить заказ. Попробуйте ещё раз.", "error");
      return;
    }
    clearCart();
    closeCheckout();
    setName("");
    setPhone("");
    setAddress("");
    setComment("");
    setErrors({});
    toast("Заказ оформлен в демо-режиме");
    router.push(`/order/${order.id}`);
  };

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p className="mt-1.5 text-sm font-semibold text-brand" role="alert">
        {errors[k]}
      </p>
    ) : null;
  const ring = (k: keyof Errors) => (errors[k] ? "border-brand ring-4 ring-brand/10" : "");

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <button type="button" className="absolute inset-0 animate-fade-in bg-ink/70 " onClick={() => !submitting && closeCheckout()} aria-label="Закрыть" />
      <form
        onSubmit={submit}
        noValidate
        className="relative flex max-h-[94dvh] w-full max-w-4xl animate-pop flex-col overflow-hidden rounded-t-2xl bg-cream  sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 sm:px-8">
          <h2 id="checkout-title" className="font-display text-xl font-black sm:text-2xl">Оформление заказа</h2>
          <button type="button" onClick={closeCheckout} disabled={submitting} className="flex size-10 items-center justify-center rounded-full transition hover:bg-ink/5" aria-label="Закрыть">
            <X className="size-5" />
          </button>
        </div>

        <div className="grid flex-1 overflow-y-auto md:grid-cols-[1.35fr_1fr]">
          <div className="space-y-5 px-5 py-6 sm:px-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold">Имя *</span>
                <input className={`${inputCls} ${ring("name")}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Как к вам обращаться" autoComplete="given-name" maxLength={60} />
                {err("name")}
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold">Телефон *</span>
                <input
                  className={`${inputCls} ${ring("phone")}`}
                  value={phone}
                  onChange={(e) => {
                    const v = e.target.value;
                    let d = phoneDigits(v);
                    // удаление символа маски («)», «-», пробел) должно стирать цифру перед ним
                    if (v.length < phone.length && d === phoneDigits(phone)) d = d.slice(0, -1);
                    setPhone(formatPhone(d));
                  }}
                  placeholder="+7 (900) 000-00-00"
                  inputMode="tel"
                  autoComplete="tel"
                />
                {err("phone")}
              </label>
            </div>

            <fieldset>
              <legend className="mb-1.5 text-sm font-bold">Способ получения</legend>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-cream-2 p-1.5">
                {([
                  ["pickup", "Самовывоз", Store],
                  ["delivery", "Доставка", Bike],
                ] as const).map(([id, label, Icon]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFulfillment(id)}
                    aria-pressed={fulfillment === id}
                    className={`flex items-center justify-center gap-2 rounded-xl py-3 font-bold transition ${fulfillment === id ? "bg-ink text-cream shadow" : "text-ink/60 hover:text-ink"}`}
                  >
                    <Icon className="size-5" /> {label}
                  </button>
                ))}
              </div>
            </fieldset>

            {fulfillment === "delivery" && (
              <label className="block animate-fade-in">
                <span className="mb-1.5 block text-sm font-bold">Адрес доставки *</span>
                <input className={`${inputCls} ${ring("address")}`} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Улица, дом, подъезд, квартира" autoComplete="street-address" maxLength={160} />
                {err("address")}
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">Комментарий</span>
              <textarea className={`${inputCls} min-h-24 resize-y`} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Например: без лука, побольше соуса" maxLength={300} />
            </label>

            <fieldset>
              <legend className="mb-1.5 text-sm font-bold">Оплата</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {payments.map((p) => (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer flex-col gap-1 rounded-2xl border-2 p-3 transition ${payment === p.id ? "border-orange bg-white" : "border-transparent bg-white/60 hover:bg-white"}`}
                  >
                    <input type="radio" name="payment" value={p.id} checked={payment === p.id} onChange={() => setPayment(p.id)} className="sr-only" />
                    <p.icon className={`size-5 ${payment === p.id ? "text-ink" : "text-ink/50"}`} />
                    <span className="text-sm font-bold leading-tight">{p.label}</span>
                    <span className="text-xs text-ink/50">{p.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <aside className="border-t border-ink/10 bg-white px-5 py-6 sm:px-8 md:border-t-0 md:border-l">
            <h3 className="font-display font-bold">Ваш заказ</h3>
            {err("cart")}
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1 text-sm">
              {lines.map((l) => (
                <li key={l.key} className="flex justify-between gap-3">
                  <span className="min-w-0 break-words text-ink/75">
                    {l.name} <span className="text-ink/40">× {l.qty}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatPrice(l.unitPrice * l.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-dashed border-ink/15 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/60">Сумма</dt>
                <dd className="font-semibold tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              {first && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink/60">Скидка на первый заказ</dt>
                  <dd className={`text-right font-semibold tabular-nums ${discount ? "text-brand" : "text-ink/40"}`}>
                    {first.eligible === null ? "по номеру телефона" : first.eligible ? `−${formatPrice(discount)}` : "уже использована"}
                  </dd>
                </div>
              )}
              {fulfillment === "delivery" && (
                <div className="flex justify-between">
                  <dt className="text-ink/60">Доставка</dt>
                  <dd className="font-semibold tabular-nums">{deliveryFee ? formatPrice(deliveryFee) : "бесплатно"}</dd>
                </div>
              )}
              <div className="flex items-end justify-between pt-2">
                <dt className="font-bold">Итого</dt>
                <dd className="font-display text-3xl font-black tabular-nums">{formatPrice(total)}</dd>
              </div>
              <p className="text-xs text-ink/50">Ориентировочно ~{estimate} мин</p>
            </dl>

            <button type="submit" disabled={submitting || lines.length === 0} className={`${btnPrimary} mt-5 w-full py-4 text-lg`}>
              {submitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" /> Оформляем…
                </>
              ) : (
                `Подтвердить · ${formatPrice(total)}`
              )}
            </button>
            <p className="mt-3 flex items-start gap-2 text-xs text-ink/50">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Демо-режим: заказ не отправляется в ресторан, оплата не списывается. Данные остаются в вашем браузере.
            </p>
          </aside>
        </div>
      </form>
    </div>
  );
}
