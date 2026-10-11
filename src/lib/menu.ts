import type { Product } from "./types";

/** Поиск и категория применяются одновременно; null означает «Все». */
export function filterMenuProducts(products: Product[], categoryId: string | null, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("ru");
  return products.filter((product) =>
    (categoryId === null || product.categoryId === categoryId) &&
    `${product.name} ${product.description}`.toLocaleLowerCase("ru").includes(normalizedQuery),
  );
}
