export type Category = {
  id: string;
  name: string;
};

export type Product = {
  /** Временная тестовая позиция, не часть окончательного меню. */
  isTest?: boolean;
  id: string;
  name: string;
  description: string;
  price: number;
  /** Цена ещё не задана: служебный ноль не показывается и не допускается к заказу. */
  pricePending?: boolean;
  categoryId: string;
  /** Путь к фото, URL или data:URL загруженного файла. Пустая строка — фирменная заглушка. */
  image: string;
  /** Вес / объём, свободный текст: «320 г», «0,5 л». */
  portion: string;
  tags: ProductTag[];
  available: boolean;
  createdAt: number;
};

export type ProductTag = "hit" | "new" | "spicy" | "veg";

export type PromoKind = "combo" | "first-order" | "daily";

export type Promotion = {
  id: string;
  kind: PromoKind;
  title: string;
  description: string;
  image: string;
  active: boolean;
  /** combo: состав набора; daily: одна позиция дня. */
  productIds: string[];
  /** combo: специальная цена набора. */
  comboPrice: number | null;
  /** first-order и daily: размер скидки в процентах. */
  discountPercent: number;
};

export type Settings = {
  deliveryFee: number;
  /** Длительность этапов симуляции, секунды. */
  stageSeconds: Record<"accepted" | "cooking" | "packing", number>;
  /** Ориентир для «реального» времени ожидания, минуты. */
  basePrepMinutes: number;
  deliveryMinutes: number;
};

export type OrderStatus = "accepted" | "cooking" | "packing" | "ready";

export type Fulfillment = "pickup" | "delivery";

export type PaymentMethod = "card-on-receipt" | "cash" | "online-demo";

export type OrderItem = {
  name: string;
  qty: number;
  unitPrice: number;
  /** Для комбо — перечень входящих позиций. */
  details?: string[];
};

export type Order = {
  id: string;
  number: number;
  createdAt: number;
  customerName: string;
  phone: string;
  fulfillment: Fulfillment;
  address: string;
  comment: string;
  payment: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountLabel: string;
  deliveryFee: number;
  total: number;
  estimateMinutes: number;
  status: OrderStatus;
  /** Время входа в каждый достигнутый этап. */
  history: Partial<Record<OrderStatus, number>>;
  /** Точка отсчёта текущего этапа для симуляции (сдвигается при паузе). */
  stageStartedAt: number;
  autoAdvance: boolean;
  /** Пауза симуляции: момент постановки на паузу. */
  pausedAt: number | null;
  archived: boolean;
};

export type AppData = {
  version: 1;
  /** Не восстанавливать тестовое меню после его удаления пользователем. */
  testMenuInitialized?: boolean;
  /** Однократное добавление стандартных категорий с сохранением пользовательских изменений. */
  menuCategoriesInitialized?: boolean;
  realMenuInitialized?: boolean;
  categories: Category[];
  products: Product[];
  promotions: Promotion[];
  settings: Settings;
  orders: Order[];
  orderSeq: number;
};

export type CartLine = {
  key: string;
  kind: "product" | "combo";
  /** id позиции меню или id акции-комбо. */
  refId: string;
  qty: number;
};
