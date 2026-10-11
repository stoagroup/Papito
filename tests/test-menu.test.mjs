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

test('three test products and seven supplied products with nine categories', () => {
  const { store } = createStore();
  const data = store.getData();
  assert.equal(data.products.length, 10);
  assert.equal(JSON.stringify(data.categories.map((c) => c.name)), JSON.stringify(['Бургеры', 'Закуски', 'Напитки', 'Шаурма', 'Закрытая пицца', 'Донер', 'Боксы', 'Хот-дог', 'Шашлык']));
  assert.equal(JSON.stringify(data.products.filter((p) => p.isTest).map((p) => [p.name, p.price])),
    JSON.stringify([['Papito Burger', 349], ['Картофель фри', 129], ['Комбо Papito', 499]]));
  for (const product of data.products) {
    assert.equal(Boolean(product.isTest) || product.pricePending, true);
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
  assert.equal(store.getData().products.length, 10);
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
  assert.equal(menu.filterMenuProducts(products, null, '').length, 10);
  assert.equal(menu.filterMenuProducts(products, 'burgers', '  PAPITO  ')[0].id, 'test-papito-burger');
  assert.equal(menu.filterMenuProducts(products, 'snacks', 'хрустящей')[0].id, 'test-fries');
  assert.equal(menu.filterMenuProducts(products, 'snacks', 'бургер').length, 0);
  assert.equal(menu.filterMenuProducts(products, 'drinks', '').length, 1);
  assert.equal(menu.filterMenuProducts(products, null, 'нет такого блюда').length, 0);
  assert.equal(menu.filterMenuProducts(products, null, ' ').length, 10);
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
  assert.equal(menu.filterMenuProducts(data.products, null, '').length, 10);
  assert.equal(createStore(storage).store.getData().categories.length, 10);
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
  assert.equal(JSON.stringify(store.getData().products.filter((p) => p.isTest).map((p) => p.categoryId)), JSON.stringify(['burgers', 'snacks', 'boxes']));
  store.saveProduct({ ...store.getData().products[0], categoryId: '' });
  store.renameCategory('snacks', 'Закуски Papito');
  store.deleteCategory('drinks', null);
  const data = createStore(storage).store.getData();
  assert.equal(data.products[0].categoryId, '');
  assert.equal(data.categories.length, 8);
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

test('supplied products have valid PNGs, correct categories and no invented prices', () => {
  const { store } = createStore();
  const expected = {
    'caesar-closed-pizza': 'closed-pizza', 'cheese-shawarma': 'shawarma', 'chicken-burger': 'burgers',
    'chicken-box': 'shashlik', 'classic-doner': 'doner', 'chicken-hot-dog': 'hot-dog', milkshake: 'drinks',
  };
  const products = store.getData().products.filter((p) => !p.isTest);
  assert.equal(products.length, 7);
  for (const p of products) {
    assert.equal(p.categoryId, expected[p.id]);
    assert.equal(p.pricePending, true);
    assert.equal(p.price, 0);
    assert.equal(p.image, '/images/' + p.id + '.png');
    const bytes = fs.readFileSync(path.join(import.meta.dirname, '../public', p.image));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.ok(bytes.readUInt32BE(16) > 300);
    assert.ok(bytes.readUInt32BE(20) > 200);
  }
});

test('price confirmation enables cart and survives reload; pending items cannot be ordered', () => {
  const { store, pricing, storage } = createStore();
  const product = store.getData().products.find((p) => p.id === 'chicken-burger');
  store.addToCart('product', product.id);
  assert.equal(store.useCart().length, 0);
  assert.equal(pricing.resolveCart([{ key: 'stale', kind: 'product', refId: product.id, qty: 1 }], store.getData()).length, 0);
  // Test-only confirmation value, never written to the application's initial menu.
  store.saveProduct({ ...product, price: 200, pricePending: false });
  store.addToCart('product', product.id, 2);
  const reloaded = createStore(storage);
  assert.equal(reloaded.pricing.cartSubtotal(reloaded.pricing.resolveCart(reloaded.store.useCart(), reloaded.store.getData())), 400);
  store.saveProduct({ ...product, price: 0, pricePending: true });
  assert.equal(pricing.resolveCart(store.useCart(), store.getData()).length, 0);
});

test('real menu migration preserves existing prices, avoids duplicate names and respects later deletion', () => {
  const original = createStore().store.getData();
  delete original.realMenuInitialized;
  original.products = original.products.filter((p) => p.isTest);
  original.products.push({ ...original.products[0], id: 'existing-burger', name: 'Чикен бургер', price: 250, isTest: false });
  original.categories = original.categories.filter((c) => c.id !== 'shashlik');
  const storage = new Map([['papito:data:v1', JSON.stringify(original)]]);
  const { store } = createStore(storage);
  const data = store.getData();
  assert.equal(data.products.length, 10);
  const burger = data.products.find((p) => p.name === 'Чикен бургер');
  assert.equal(burger.id, 'existing-burger');
  assert.equal(burger.price, 250);
  assert.equal(burger.image, '/images/chicken-burger.png');
  assert.ok(data.categories.some((c) => c.id === 'shashlik'));
  store.deleteProduct('classic-doner');
  const reloaded = createStore(storage).store.getData();
  assert.equal(reloaded.products.length, 9);
  assert.equal(reloaded.products.some((p) => p.id === 'classic-doner'), false);
});
