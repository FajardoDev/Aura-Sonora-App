const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { QueryClient, QueryObserver } = require('@tanstack/react-query');

const sourcePath = 'core/radio-podcast/actions/radio-podcast/hooks/useToggleFavorite.ts';
const source = process.env.FAVORITE_TEST_SOURCE
  ? fs.readFileSync(process.env.FAVORITE_TEST_SOURCE, 'utf8')
  : fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const catalogKey = ['radioStations', 'infinite', ''];
const searchKey = ['radioStations', 'infinite', 'disco'];
const payload = { type: 'radio', radioStationId: 'internal-disco', radioSlug: 'disco-106' };
const seed = () => ({ pages: [
  { stations: [{ id: 'other', slug: 'other', isFavorite: false }], currentPage: 1, totalPages: 2 },
  { stations: [{ id: payload.radioStationId, slug: payload.radioSlug, isFavorite: false }], currentPage: 2, totalPages: 2 },
], pageParams: [1, 2] });
function fixture() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  client.setQueryData(catalogKey, seed());
  client.setQueryData(searchKey, seed());
  let resolveRequest, rejectRequest, notifyStarted, requests = 0;
  const started = new Promise(resolve => { notifyStarted = resolve; });
  const request = new Promise((resolve, reject) => { resolveRequest = resolve; rejectRequest = reject; });
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, console: { log() {}, warn() {}, error() {} },
    require: name => {
      if (name === '@tanstack/react-query') return {
        useQueryClient: () => client, useMutation: options => options,
      };
      if (name.endsWith('post-toggle-favorites.action')) return {
        togglefavorite: async value => { assert.deepEqual(value, payload); requests++; notifyStarted(); return request; },
      };
      throw new Error(`Unexpected runtime import: ${name}`);
    },
  });
  const mutation = client.getMutationCache().build(client, module.exports.useToggleFavorite());
  return { client, mutation, started, resolveRequest, rejectRequest, requests: () => requests };
}
function isFavorite(client, key) {
  return client.getQueryData(key).pages[1].stations[0].isFavorite;
}
(async () => {
  let f = fixture();
  try {
    let notifyRefresh, resolveRefresh;
    const refreshing = new Promise(resolve => { notifyRefresh = resolve; });
    const refreshed = new Promise(resolve => { resolveRefresh = resolve; });
    const observer = new QueryObserver(f.client, {
      queryKey: catalogKey, staleTime: Infinity,
      queryFn: () => { notifyRefresh(); return refreshed; },
    });
    const unsubscribe = observer.subscribe(() => {});
    const done = f.mutation.execute(payload);
    await f.started;
    assert.equal(f.mutation.state.status, 'pending');
    assert.equal(isFavorite(f.client, catalogKey), true, 'Catalog must change before POST resolves');
    assert.equal(isFavorite(f.client, searchKey), true, 'Cached searches must change too');
    assert.deepEqual(f.client.getQueryData(catalogKey).pageParams, [1, 2]);
    assert.equal(f.client.getQueryData(catalogKey).pages[0].stations[0].isFavorite, false);
    f.resolveRequest({ isFavorite: true });
    await refreshing;
    assert.equal(f.mutation.state.status, 'pending', 'Button must remain busy until catalog refresh completes');
    const serverData = seed(); serverData.pages[1].stations[0].isFavorite = true;
    resolveRefresh(serverData); await done; unsubscribe();
    assert.equal(f.requests(), 1);
    assert.equal(isFavorite(f.client, catalogKey), true);
    console.log('PASS immediate favorite in catalog/search, stable internal ID, pagination intact, one POST');
  } finally { f.client.clear(); }

  f = fixture();
  try {
    const done = f.mutation.execute(payload);
    const failure = assert.rejects(done, /Network unavailable/);
    await f.started;
    // Another station changes while the first request is in flight.
    f.client.setQueryData(catalogKey, data => ({ ...data, pages: data.pages.map(page => ({
      ...page, stations: page.stations.map(station => station.id === 'other'
        ? { ...station, isFavorite: true } : station),
    })) }));
    f.rejectRequest(new Error('Network unavailable')); await failure;
    assert.equal(isFavorite(f.client, catalogKey), false);
    assert.equal(isFavorite(f.client, searchKey), false);
    assert.equal(f.client.getQueryData(catalogKey).pages[0].stations[0].isFavorite, true);
    console.log('PASS failed POST rolls back only the tapped station, preserving concurrent changes');
  } finally { f.client.clear(); }

  f = fixture();
  try {
    const done = f.mutation.execute(payload);
    const failure = assert.rejects(done, /Network unavailable/);
    await f.started; f.client.clear();
    f.rejectRequest(new Error('Network unavailable')); await failure;
    assert.equal(f.client.getQueryData(catalogKey), undefined);
    console.log('PASS rollback does not recreate a cache cleared during logout');
  } finally { f.client.clear(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
