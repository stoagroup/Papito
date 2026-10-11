import { Bike, ChefHat, ClipboardCheck, Package, ShoppingBag } from "lucide-react";
import type { Fulfillment, OrderStatus, PaymentMethod } from "./types";

export function statusLabel(status: OrderStatus, fulfillment: Fulfillment) {
  switch (status) {
    case "accepted":
      return "Заказ принят";
    case "cooking":
      return "Заказ готовится";
    case "packing":
      return "Упаковка заказа";
    case "ready":
      return fulfillment === "delivery" ? "Передан курьеру" : "Готов к выдаче";
  }
}

export function statusText(status: OrderStatus, fulfillment: Fulfillment) {
  switch (status) {
    case "accepted":
      return "Повар получил ваш заказ и проверяет состав.";
    case "cooking":
      return "Мясо на гриле, овощи нарезаны — собираем ваши блюда.";
    case "packing":
      return "Упаковываем, чтобы всё доехало горячим и аккуратным.";
    case "ready":
      return fulfillment === "delivery" ? "Курьер забрал заказ и уже в пути." : "Можно забирать на кассе — назовите номер заказа.";
  }
}

/** Иконка этапа как статичный компонент (не создаётся во время рендера). */
export function StatusIcon({ status, fulfillment, className }: { status: OrderStatus; fulfillment: Fulfillment; className?: string }) {
  switch (status) {
    case "accepted":
      return <ClipboardCheck className={className} />;
    case "cooking":
      return <ChefHat className={className} />;
    case "packing":
      return <Package className={className} />;
    case "ready":
      return fulfillment === "delivery" ? <Bike className={className} /> : <ShoppingBag className={className} />;
  }
}

export const statusTone: Record<OrderStatus, string> = {
  accepted: "bg-sky-100 text-sky-800",
  cooking: "bg-orange/15 text-[#b4520a]",
  packing: "bg-mustard/25 text-[#7a5a00]",
  ready: "bg-emerald-100 text-emerald-800",
};

export const paymentLabel: Record<PaymentMethod, string> = {
  "card-on-receipt": "Картой при получении",
  cash: "Наличными",
  "online-demo": "Онлайн (демо, без списания)",
};
