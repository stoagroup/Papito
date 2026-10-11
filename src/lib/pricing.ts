import type { AppData, CartLine, Product, Promotion } from "./types";
import { phoneDigits } from "./format";

export function canOrderProduct(product: Product) {
  return product.available && !product.pricePending && Number.isFinite(product.price) && product.price > 0;
}

export function findPromo(data: AppData, kind: Promotion["kind"]) {
  return data.promotions.find((p) => p.kind === kind);
}

/** Активное «предложение дня», если позиция существует и доступна. */
export function getDailyDeal(data: AppData) {
  const promo = findPromo(data, "daily");
  if (!promo || !promo.active || promo.discountPercent <= 0) return null;
  const product = data.products.find((p) => p.id === promo.productIds[0] && canOrderProduct(p));
  if (!product) return null;
  return { promo, product };
}

export function productPrice(product: Product, data: AppData) {
  const deal = getDailyDeal(data);
  if (deal && deal.product.id === product.id) {
    const price = Math.round(product.price * (1 - deal.promo.discountPercent / 100));
    return { price, oldPrice: product.price };
  }
  return { price: product.price, oldPrice: null as number | null };
}

export function getCombo(data: AppData) {
  const promo = findPromo(data, "combo");
  if (!promo) return null;
  const products = promo.productIds
    .map((id) => data.products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
  const regular = products.reduce((s, p) => s + p.price, 0);
  const ready =
    promo.active &&
    products.length >= 2 &&
    products.length === promo.productIds.length &&
    products.every(canOrderProduct) &&
    promo.comboPrice !== null &&
    promo.comboPrice > 0;
  return { promo, products, regular, price: promo.comboPrice ?? 0, ready };
}

export type ResolvedLine = {
  key: string;
  kind: CartLine["kind"];
  refId: string;
  qty: number;
  name: string;
  image: string;
  unitPrice: number;
  oldUnitPrice: number | null;
  details: string[];
};

/** Сопоставляет строки корзины с актуальным меню. Удалённые/недоступные позиции отбрасываются. */
export function resolveCart(cart: CartLine[], data: AppData): ResolvedLine[] {
  const lines: ResolvedLine[] = [];
  for (const line of cart) {
    if (line.kind === "product") {
      const p = data.products.find((x) => x.id === line.refId);
      if (!p || !canOrderProduct(p)) continue;
      const { price, oldPrice } = productPrice(p, data);
      lines.push({ ...line, name: p.name, image: p.image, unitPrice: price, oldUnitPrice: oldPrice, details: [] });
    } else {
      const combo = getCombo(data);
      if (!combo || !combo.ready || combo.promo.id !== line.refId) continue;
      lines.push({
        ...line,
        name: combo.promo.title,
        image: combo.promo.image,
        unitPrice: combo.price,
        oldUnitPrice: combo.regular > combo.price ? combo.regular : null,
        details: combo.products.map((p) => p.name),
      });
    }
  }
  return lines;
}

export const cartSubtotal = (lines: ResolvedLine[]) => lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
export const cartCount = (lines: ResolvedLine[]) => lines.reduce((s, l) => s + l.qty, 0);

/** Скидка на первый заказ: по номеру телефона среди заказов этой демоверсии. */
export function firstOrderDiscount(data: AppData, phone: string, subtotal: number) {
  const promo = findPromo(data, "first-order");
  if (!promo || !promo.active || promo.discountPercent <= 0) return null;
  const digits = phoneDigits(phone);
  if (digits.length !== 11) return { eligible: null as boolean | null, amount: 0, percent: promo.discountPercent };
  const used = data.orders.some((o) => phoneDigits(o.phone) === digits);
  return {
    eligible: !used,
    amount: used ? 0 : Math.round((subtotal * promo.discountPercent) / 100),
    percent: promo.discountPercent,
  };
}
