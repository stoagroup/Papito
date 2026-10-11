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
    storage,
  };
}

test('exactly three test products, local photos and no extra categories', () => {
  const { store } = createStore();
  const data = store.getData();
  assert.equal(data.products.length, 3);
  assert.equal(data.categories.length, 0);
  assert.equal(JSON.stringify(data.products.map((p) => [p.name, p.price])),
    JSON.stringify([['Papito Burger', 349], ['Картофель фри', 129], ['Комбо Papito', 499]]));
  for (const product of data.products) {
    assert.equal(product.isTest, true);
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
