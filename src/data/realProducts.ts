import type { Product } from "@/lib/types";

/** Предоставленное меню. Ноль — служебное значение, не цена продажи. Цены заполняются в /admin. */
export const realProducts: Product[] = [
  { id: "caesar-closed-pizza", name: "Закрытая пицца «Цезарь»", categoryId: "closed-pizza", description: "Курица, томаты, салат, сыр и соус в тесте.", image: "/images/caesar-closed-pizza.png" },
  { id: "cheese-shawarma", name: "Шаурма сырная", categoryId: "shawarma", description: "Курица, овощи, сыр и соус в жёлтом лаваше.", image: "/images/cheese-shawarma.png" },
  { id: "chicken-burger", name: "Чикен бургер", categoryId: "burgers", description: "Котлета, сыр, овощи и соус в кунжутной булочке.", image: "/images/chicken-burger.png" },
  { id: "chicken-box", name: "Бокс с курицей", categoryId: "shashlik", description: "Курица, картофель фри, лаваш, свежие овощи и соус.", image: "/images/chicken-box.png" },
  { id: "classic-doner", name: "Донер классический", categoryId: "doner", description: "Курица, томаты, огурцы, салат и соус в поджаренной лепёшке.", image: "/images/classic-doner.png" },
  { id: "chicken-hot-dog", name: "Хот-дог с курицей", categoryId: "hot-dog", description: "Сосиска, овощи и горчичный соус в мягкой булочке.", image: "/images/chicken-hot-dog.png" },
  { id: "milkshake", name: "Молочный коктейль", categoryId: "drinks", description: "Молочный напиток в стакане с трубочкой.", image: "/images/milkshake.png" },
].map((product) => ({ ...product, price: 0, pricePending: true, available: true, portion: "", tags: [], createdAt: 0 }));
