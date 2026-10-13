import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadModule(path, browser = {}, cache = new Map()) {
  if (cache.has(path)) return cache.get(path)
  const module = { exports: {} }
  cache.set(path, module.exports)
  const output = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const localRequire = (specifier) => {
    if (!specifier.startsWith('.')) return require(specifier)
    const candidate = resolve(dirname(path), specifier)
    const file = [candidate, `${candidate}.ts`, `${candidate}.tsx`].find(existsSync)
    return loadModule(file, browser, cache)
  }
  new Function('require', 'module', 'exports', 'window', 'document', 'MutationObserver', output)(localRequire, module, module.exports, browser.window, browser.document, browser.MutationObserver)
  return module.exports
}

const routes = loadModule(resolve(root, 'src/app/routing.ts'))
test('known routes, trailing slashes and unknown project URLs remain distinct', () => {
  for (const path of ['/', '/profile', '/projects', '/atlas', '/robotics', '/awards', '/projects/growth-atlas']) {
    assert.equal(routes.normalizeRoute(path), path)
    if (path !== '/') assert.equal(routes.normalizeRoute(`${path}/`), path)
  }
  assert.equal(routes.normalizeRoute('/projects/missing'), '/404')
  assert.equal(routes.normalizeRoute('/missing'), '/404')
  assert.match(routes.routeTitle('/projects/growth-atlas'), /Interactive Growth Atlas/)
  assert.match(routes.routeTitle('/404'), /not found/i)
})

function fixture() {
  let frame = null
  let change = null
  let disconnected = false
  let pending = false
  let route = '/'
  const calls = []
  const main = { dataset: { routePath: '/' }, querySelector: () => pending, focus: () => calls.push('focus') }
  const section = { offsetHeight: 5200, getBoundingClientRect: () => ({ top: -100 }), querySelector: () => ({ offsetHeight: 700 }) }
  const nodes = { 'main-content': main, root: {}, contact: { dataset: { scrollEnd: 'true' }, parentElement: section } }
  const browser = {
    window: {
      get location() { return { pathname: route } }, scrollY: 100, innerHeight: 740,
      setTimeout: () => 1, clearTimeout: () => {}, requestAnimationFrame: (fn) => { frame = fn; return 1 }, cancelAnimationFrame: () => { frame = null },
      scrollTo: (options) => calls.push(options),
    },
    document: { getElementById: (id) => nodes[id] },
    MutationObserver: class { constructor(fn) { change = fn } observe() {} disconnect() { disconnected = true } },
  }
  const { restoreView } = loadModule(resolve(root, 'src/app/scroll.ts'), browser)
  return { restoreView, calls, main, nodes, tick: () => { const fn = frame; frame = null; fn?.() }, mutate: () => change?.(), setPending: (value) => { pending = value }, setRoute: (value) => { route = value }, get disconnected() { return disconnected } }
}

test('contact deep link reaches the end of the sticky scene using its actual mobile height', () => {
  const f = fixture()
  f.restoreView('contact', 0, true)
  f.tick()
  assert.deepEqual(f.calls, [{ top: 4500, behavior: 'instant' }, 'focus'])
  assert(f.disconnected)
})
test('restoration waits for the new route and lazy content instead of scrolling the outgoing page', () => {
  const f = fixture()
  f.setRoute('/projects')
  f.restoreView('', 840, true)
  f.tick()
  assert.equal(f.calls.length, 0)
  f.main.dataset.routePath = '/projects'
  f.setPending(true)
  f.mutate(); f.tick()
  assert.equal(f.calls.length, 0)
  f.setPending(false)
  f.mutate(); f.tick()
  assert.deepEqual(f.calls, [{ top: 840, behavior: 'instant' }, 'focus'])
})
test('a superseded navigation cannot move the visitor after cancellation', () => {
  const f = fixture()
  const stop = f.restoreView('contact', 0, true)
  stop(); f.mutate(); f.tick()
  assert.equal(f.calls.length, 0)
  assert(f.disconnected)
})
