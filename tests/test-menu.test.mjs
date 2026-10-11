import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the actual store against isolated browser storage, without a new test dependency.
function createStore(storage = new Map()) {
  const cache = new Map();
  const context = vm.createContext({
    structuredClone, crypto, Date, Intl, console,
    window: {
      localStorage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      },
      addEventListener() {},
    },
  });
  function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const requireModule = (name) => {
      if (name === 'react') return { useSyncExternalStore: (_subscribe, snapshot) => snapshot() };
      const target = name.startsWith('@/')
        ? path.join(import.meta.dirname, '../src', name.slice(2))
        : path.resolve(path.dirname(filename), name);
      return load(target + '.ts');
    };
    vm.runInContext('(function(require,module,exports){' + source + '\n})', context)(requireModule, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return {
    store: load(path.join(import.meta.dirname, '../src/lib/store.ts')),
    pricing: load(path.join(import.meta.dirname, '../src/lib/pricing.ts')),
    menu: load(path.join(import.meta.dirname, '../src/lib/menu.ts')),
    storage,
  };
}

test('exactly three test products, local photos and eight requested categories', () => {
  const { store } = createStore();
  const data = store.getData();
  assert.equal(data.products.length, 3);
  assert.equal(JSON.stringify(data.categories.map((c) => c.name)), JSON.stringify(['Бургеры', 'Закуски', 'Напитки', 'Шаурма', 'Закрытая пицца', 'Донер', 'Боксы', 'Хот-дог']));
  assert.equal(JSON.stringify(data.products.map((p) => [p.name, p.price])),
    JSON.stringify([['Papito Burger', 349], ['Картофель фри', 129], ['Комбо Papito', 499]]));
  for (const product of data.products) {
    assert.equal(product.isTest, true);
    assert.ok(data.categories.some((c) => c.id === product.categoryId));
    assert.ok(product.description.length > 0);
    assert.ok(fs.statSync(path.join(import.meta.dirname, '../public', product.image)).size > 10000);
  }
});

test('cart add, quantity, totals, persistence, removal and clearing', () => {
  const { store, pricing, storage } = createStore();
  const total = () => pricing.cartSubtotal(pricing.resolveCart(store.useCart(), store.getData()));
  for (const product of store.getData().products) store.addToCart('product', product.id);
  assert.equal(total(), 977);
  store.addToCart('product', 'test-papito-burger');
  assert.equal(total(), 1326);
  assert.equal(store.useCart().length, 3);
  const reloaded = createStore(storage);
  assert.equal(reloaded.pricing.cartSubtotal(reloaded.pricing.resolveCart(reloaded.store.useCart(), reloaded.store.getData())), 1326);
  const burger = store.useCart().find((line) => line.refId === 'test-papito-burger');
  store.setCartQty(burger.key, 1);
  assert.equal(total(), 977);
  store.setCartQty(burger.key, 0);
  assert.equal(total(), 628);
  store.removeFromCart(store.useCart().find((line) => line.refId === 'test-fries').key);
  assert.equal(total(), 499);
  store.clearCart();
  assert.equal(total(), 0);
});

test('old empty menu is seeded once; deleted test products stay deleted', () => {
  const storage = new Map([['papito:data:v1', JSON.stringify({ version: 1, products: [], orders: [], orderSeq: 321 })]]);
  const { store } = createStore(storage);
  assert.equal(store.getData().products.length, 3);
  assert.equal(store.getData().orderSeq, 321);
  for (const product of [...store.getData().products]) store.deleteProduct(product.id);
  assert.equal(createStore(storage).store.getData().products.length, 0);
});

test('existing menu edits are preserved during migration', () => {
  const original = createStore().store.getData();
  original.products = [original.products[0]];
  original.products[0].price = 350;
  delete original.testMenuInitialized;
  const storage = new Map([['papito:data:v1', JSON.stringify(original)]]);
  const data = createStore(storage).store.getData();
  assert.equal(data.products.length, 1);
  assert.equal(data.products[0].price, 350);
});

test('category and search intersect, including descriptions, spaces and case', () => {
  const { store, menu } = createStore();
  const products = store.getData().products;
  assert.equal(menu.filterMenuProducts(products, null, '').length, 3);
  assert.equal(menu.filterMenuProducts(products, 'burgers', '  PAPITO  ')[0].id, 'test-papito-burger');
  assert.equal(menu.filterMenuProducts(products, 'snacks', 'хрустящей')[0].id, 'test-fries');
  assert.equal(menu.filterMenuProducts(products, 'snacks', 'бургер').length, 0);
  assert.equal(menu.filterMenuProducts(products, 'drinks', '').length, 0);
  assert.equal(menu.filterMenuProducts(products, null, 'нет такого блюда').length, 0);
  assert.equal(menu.filterMenuProducts(products, null, ' ').length, 3);
});

test('legacy categories are preserved and matching names reuse existing IDs', () => {
  const original = createStore().store.getData();
  delete original.menuCategoriesInitialized;
  original.categories = [{ id: 'legacy-burger', name: 'Бургеры' }, { id: 'legacy-other', name: 'Старый раздел' }];
  original.products[0].categoryId = '';
  original.products[1].categoryId = 'legacy-other';
  original.products[2].categoryId = 'removed-category';
  const storage = new Map([['papito:data:v1', JSON.stringify(original)]]);
  const { store, menu } = createStore(storage);
  const data = store.getData();
  assert.equal(data.categories.filter((c) => c.name === 'Бургеры').length, 1);
  assert.equal(data.products[0].categoryId, 'legacy-burger');
  assert.equal(data.products[1].categoryId, 'legacy-other');
  assert.equal(data.products[2].categoryId, '');
  assert.equal(menu.filterMenuProducts(data.products, null, '').length, 3);
  assert.equal(createStore(storage).store.getData().categories.length, 9);
});

test('old empty menu uses existing category IDs for newly seeded products', () => {
  const storage = new Map([['papito:data:v1', JSON.stringify({ categories: [{ id: 'old-burgers', name: 'Бургеры' }], products: [] })]]);
  const data = createStore(storage).store.getData();
  assert.equal(data.products[0].categoryId, 'old-burgers');
});

test('missing category remains visible in All; migration and reload do not duplicate categories', () => {
  const original = createStore().store.getData();
  delete original.menuCategoriesInitialized;
  original.categories = [];
  for (const p of original.products) delete p.categoryId;
  const storage = new Map([['papito:data:v1', JSON.stringify(original)]]);
  const { store } = createStore(storage);
  assert.equal(JSON.stringify(store.getData().products.map((p) => p.categoryId)), JSON.stringify(['burgers', 'snacks', 'boxes']));
  store.saveProduct({ ...store.getData().products[0], categoryId: '' });
  store.renameCategory('snacks', 'Закуски Papito');
  store.deleteCategory('drinks', null);
  const data = createStore(storage).store.getData();
  assert.equal(data.products[0].categoryId, '');
  assert.equal(data.categories.length, 7);
  assert.equal(data.categories.find((c) => c.id === 'snacks').name, 'Закуски Papito');
});

test('admin category changes persist without changing cart totals or order status logic', () => {
  const { store, pricing, storage } = createStore();
  const product = store.getData().products[0];
  store.addToCart('product', product.id, 2);
  assert.equal(store.saveProduct({ ...product, categoryId: 'boxes' }), true);
  const reloaded = createStore(storage);
  assert.equal(reloaded.store.getData().products[0].categoryId, 'boxes');
  const items = pricing.resolveCart(store.useCart(), store.getData());
  assert.equal(pricing.cartSubtotal(items), 698);
  const order = store.placeOrder({
    customerName: 'Тест', phone: '+7 (900) 000-00-00', fulfillment: 'pickup', address: '', comment: '',
    payment: 'cash', items: items.map((item) => ({ name: item.name, qty: item.qty, unitPrice: item.unitPrice })),
    subtotal: 698, discount: 0, discountLabel: '', deliveryFee: 0, total: 698, estimateMinutes: 15,
  });
  assert.ok(order);
  store.setOrderStatus(order.id, 'cooking');
  assert.equal(store.getData().orders[0].status, 'cooking');
  assert.equal(store.getData().orders[0].total, 698);
});
