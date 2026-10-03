const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { QueryClient, InfiniteQueryObserver } = require('@tanstack/react-query');
const axios = require('axios');
const modules = {
  useGlobalSearch: 'presentation/hooks/useGlobalSearch.ts',
  usePodcasts: 'presentation/podcast/hooks/usePodcasts.ts',
  useRadioStation: 'presentation/radio/hooks/useRadioStation.ts',
  'get-radio.action': 'core/radio-podcast/actions/radio/get-radio.action.ts',
  'get-podcast.action': 'core/radio-podcast/actions/podcast/get-podcast.action.ts',
  GlobalSearchResults: 'presentation/components/GlobalSearchResults.tsx',
};
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const requests = [], observers = [], loaded = new Map();
  let slot = 0;
  function load(key) {
    if (loaded.has(key)) return loaded.get(key);
    const module = { exports: {} };
    const compiled = ts.transpileModule(fs.readFileSync(modules[key], 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    vm.runInNewContext(compiled, { module, exports: module.exports, console: { log() {} }, require: name => {
      const dependency = name.split('/').pop();
      if (modules[dependency]) return load(dependency);
      if (name === 'axios') return axios;
      if (name === 'react') return { useMemo: fn => fn() };
      if (name === '@tanstack/react-query') return {
        keepPreviousData: data => data,
        useInfiniteQuery: options => {
          const index = slot++;
          if (!observers[index]) {
            const observer = new InfiniteQueryObserver(client, options);
            observers[index] = { observer, unsubscribe: observer.subscribe(() => {}) };
          } else observers[index].observer.setOptions(options);
          return observers[index].observer.getCurrentResult();
        },
      };
      if (name.endsWith('radioPodcastApi')) return { radioPodcastApi: { get: (url, options) => {
        const request = { url, options, aborted: false };
        requests.push(request);
        return new Promise((resolve, reject) => {
          request.resolve = data => resolve({ data }); request.reject = reject;
          options.signal.addEventListener('abort', () => {
            request.aborted = true; reject(new axios.CanceledError('canceled'));
          });
        });
      } } };
      // Rendering is checked on Android; this test exercises the real row builder.
      return {};
    } });
    loaded.set(key, module.exports); return module.exports;
  }
  const render = query => { slot = 0; return load('useGlobalSearch').useGlobalSearch(query); };
  const rows = (result, waiting = false) => load('GlobalSearchResults').buildSearchRows(result, waiting);
  const fetchWithSignal = (media, signal) => media === 'radio'
    ? load('get-radio.action').fetchRadioStations(1, 21, 'cancelada', signal)
    : load('get-podcast.action').fetchPodcasts(1, 21, 'cancelada', signal);
  return { requests, render, rows, fetchWithSignal, dispose: () => { observers.forEach(entry => entry.unsubscribe()); client.clear(); } };
}
const items = prefix => Array.from({ length: 9 }, (_, index) => ({ id: `${prefix}-${index}`, slug: `${prefix}-${index}` }));
(async () => {
  const f = fixture();
  try {
    f.render(''); await tick(); assert.equal(f.requests.length, 0);
    f.render('disco'); await tick(); assert.equal(f.requests.length, 2);
    f.render('disco'); await tick(); assert.equal(f.requests.length, 2, 'Rendering must not refetch');
    const radio = f.requests.find(request => request.url === '/radio-station');
    const podcast = f.requests.find(request => request.url === '/podcastrd');
    assert.equal(radio.options.params.search, 'disco');
    assert.equal(podcast.options.params.search, 'disco');
    radio.resolve({ stations: [...items('radio'), ...items('radio')], totalItems: 9, currentPage: 1, totalPages: 1 });
    await tick(); let result = f.render('disco'); let rows = f.rows(result);
    assert.equal(result.radios.length, 6);
    assert.equal(new Set(result.radios.map(item => item.id)).size, 6);
    assert.equal(rows.filter(row => row.kind === 'radios').length, 2);
    assert.ok(rows.some(row => row.key === 'podcast-loading'));
    console.log('PASS blank search sends no requests; rerenders reuse cache; radios appear while podcasts are loading');
    podcast.reject(new Error('offline')); await tick(); result = f.render('disco'); rows = f.rows(result);
    assert.ok(rows.some(row => row.key === 'podcast-error'));
    assert.ok(rows.some(row => row.kind === 'radios'));
    assert.equal(f.rows(result, true).length, 1, 'Typing a new term must hide old results');
    console.log('PASS independent error/loading, six unique previews, old results hidden during debounce');
    f.render('pop'); await tick(); const previous = f.requests.slice(-2);
    f.render('baladas'); await tick(); assert.ok(previous.every(request => request.aborted));
    result = f.render('baladas'); assert.equal(result.radios.length, 0);
    assert.equal(result.podcasts.length, 0);
    const current = f.requests.slice(-2);
    f.render(''); await tick(); assert.ok(current.every(request => request.aborted));
    assert.equal(f.requests.length, 6, 'Clearing must not request the entire catalogs');
    console.log('PASS changing/clearing search aborts obsolete requests and never exposes previous-term results');
    f.render('episodio'); await tick();
    const latest = f.requests.slice(-2);
    latest.find(request => request.url === '/radio-station').resolve({ stations: [], totalItems: 0, currentPage: 1, totalPages: 1 });
    latest.find(request => request.url === '/podcastrd').resolve({ podcast: [...items('podcast'), ...items('podcast')], meta: { totalItems: 9, currentPage: 1, totalPages: 1 } });
    await tick(); result = f.render('episodio'); rows = f.rows(result);
    assert.equal(result.podcasts.length, 6);
    assert.equal(rows.filter(row => row.kind === 'podcasts').length, 2);
    assert.ok(rows.some(row => row.key === 'radio-empty'));
    assert.ok(rows.some(row => row.key === 'podcast-heading' && row.total === 9));
    f.render('episodio'); await tick(); assert.equal(f.requests.length, 8);
    console.log('PASS podcast preview deduplicates/limits cards, supports Ver todos and radio empty state, without refetch');
    f.render('sinresultados'); await tick();
    const emptyRequests = f.requests.slice(-2);
    emptyRequests.find(request => request.url === '/radio-station').resolve({ stations: [], totalItems: 0, currentPage: 1, totalPages: 0 });
    // The actual API returns `data: []`, rather than `podcast: []`, for no matches.
    emptyRequests.find(request => request.url === '/podcastrd').resolve({
      data: [], meta: { totalItems: 0, currentPage: 1, totalPages: 0 }, message: 'No matches',
    });
    await tick(); result = f.render('sinresultados'); rows = f.rows(result);
    assert.equal(result.podcasts.length, 0);
    assert.ok(rows.some(row => row.key === 'podcast-empty'));
    console.log('PASS actual empty-search response does not crash Home');
    f.render('incompletos'); await tick();
    const incomplete = f.requests.slice(-2);
    incomplete.find(request => request.url === '/radio-station').resolve({ stations: [null, undefined, {}, ...items('radio')], totalItems: 9, currentPage: 1, totalPages: 1 });
    incomplete.find(request => request.url === '/podcastrd').resolve({ podcast: [null, undefined, {}, ...items('podcast')], meta: { totalItems: 9, currentPage: 1, totalPages: 1 } });
    await tick(); result = f.render('incompletos'); rows = f.rows(result);
    assert.equal(result.radios.length, 6);
    assert.equal(result.podcasts.length, 6);
    assert.equal(new Set(result.podcasts.map(item => item.id)).size, 6);
    console.log('PASS invalid entries are omitted, preserving valid previews and stable IDs');
    for (const media of ['radio', 'podcast']) {
      const controller = new AbortController();
      const request = f.fetchWithSignal(media, controller.signal);
      const failure = assert.rejects(request, error => axios.isCancel(error));
      controller.abort(); await failure;
    }
    console.log('PASS radio/podcast actions preserve cancellation instead of converting it into a search error');
  } finally { f.dispose(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
