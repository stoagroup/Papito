import type { AppData, Order, Promotion } from "@/lib/types";
import { testProducts } from "./testProducts";
import { menuCategories } from "./categories";
import { realProducts } from "./realProducts";

/**
 * Единый источник данных демо-версии.
 *
 * Меню содержит три тестовые позиции и семь предоставленных товаров без подтверждённых цен.
 * Изменения в панели управления (/admin) сохраняются в localStorage браузера.
 * Акции описывают механику, а конкретные блюда и цены к ним
 * привязываются из меню.
 */

export const brandPhotos = [
  { src: "/images/spread-dark.jpg", label: "Ассорти на тёмном фоне" },
  { src: "/images/spread-light.jpg", label: "Ассорти на светлом фоне" },
  { src: "/images/open-chicken.jpg", label: "Курица, овощи, сыр" },
  { src: "/images/open-assorted.jpg", label: "Грибы, ветчина, курица" },
] as const;

export const initialPromotions: Promotion[] = [
  {
    id: "promo-combo",
    kind: "combo",
    title: "Комбо по специальной цене",
    description: "Любимые позиции в одном наборе — выгоднее, чем заказывать по отдельности.",
    image: "/images/spread-light.jpg",
    active: true,
    productIds: [],
    comboPrice: null,
    discountPercent: 0,
  },
  {
    id: "promo-first-order",
    kind: "first-order",
    title: "Скидка на первый заказ",
    description: "Скидка применяется автоматически при оформлении, если по этому номеру телефона ещё не было заказов.",
    image: "/images/open-assorted.jpg",
    active: true,
    productIds: [],
    comboPrice: null,
    discountPercent: 10,
  },
  {
    id: "promo-daily",
    kind: "daily",
    title: "Предложение дня",
    description: "Каждый день одна позиция меню по сниженной цене.",
    image: "/images/open-chicken.jpg",
    active: true,
    productIds: [],
    comboPrice: null,
    discountPercent: 15,
  },
];

/** Тестовые заказы. Пусто: заказы создаются из реального меню через сайт или кнопку на панели кухни. */
export const initialOrders: Order[] = [];

export function createInitialData(): AppData {
  return {
    version: 1,
    testMenuInitialized: true,
    menuCategoriesInitialized: true,
    realMenuInitialized: true,
    categories: structuredClone(menuCategories),
    products: structuredClone([...testProducts, ...realProducts]),
    promotions: structuredClone(initialPromotions),
    settings: {
      deliveryFee: 0,
      stageSeconds: { accepted: 10, cooking: 25, packing: 12 },
      basePrepMinutes: 15,
      deliveryMinutes: 30,
    },
    orders: structuredClone(initialOrders),
    orderSeq: 100,
  };
}

/** Подсказки для быстрого старта — только названия разделов, без блюд. */
export const categoryPresets = menuCategories.map((category) => category.name);
