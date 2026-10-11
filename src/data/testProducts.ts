import type { Product } from "@/lib/types";

/** Временные позиции для проверки меню и корзины. Можно заменить или удалить весь список. */
export const testProducts: Product[] = [
  {
    id: "test-papito-burger",
    name: "Papito Burger",
    description: "Бургер с говяжьей котлетой, сыром, свежими овощами и соусом.",
    price: 349,
    image: "/images/test-burger.jpg",
    categoryId: "burgers",
    portion: "",
    tags: [],
    available: true,
    createdAt: 0,
    isTest: true,
  },
  {
    id: "test-fries",
    name: "Картофель фри",
    description: "Золотистый картофель с хрустящей корочкой и щепоткой соли.",
    price: 129,
    image: "/images/test-fries.jpg",
    categoryId: "snacks",
    portion: "",
    tags: [],
    available: true,
    createdAt: 0,
    isTest: true,
  },
  {
    id: "test-papito-combo",
    name: "Комбо Papito",
    description: "Бургер, картофель фри и два соуса в одном наборе.",
    price: 499,
    image: "/images/test-combo.jpg",
    categoryId: "boxes",
    portion: "",
    tags: [],
    available: true,
    createdAt: 0,
    isTest: true,
  },
];
