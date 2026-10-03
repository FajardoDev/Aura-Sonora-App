const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { QueryClient, QueryObserver } = require('@tanstack/react-query');
const compiled = ts.transpileModule(fs.readFileSync('presentation/components/PlayerFavoriteButton.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
}).outputText;
const jsx = (type, props) => ({ type, props });
async function fixture(type = 'radio', authenticated = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let auth = { status: authenticated ? 'authenticated' : 'unauthenticated', user: authenticated ? { id: 'user-1' } : undefined };
  let pathname = '/home', effects = [], effectIndex = 0, reads = 0, favorite = false, login = 0, close = 0, mutation;
  const observers = new Map();
  const requests = [];
  let onForeground;
  const slug = type === 'radio' ? 'disco-106' : '12-y-2';
  const fetch = async () => {
    reads++;
    const entity = { id: 'internal-id', slug, isFavorite: favorite };
    return type === 'radio' ? { data: entity } : { podcast: entity };
  };
  const authStore = selector => selector(auth); authStore.getState = () => auth;
  const env = { module: { exports: {} }, console, require: name => {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react') return { useEffect: (fn, deps) => {
      const i = effectIndex++; const previous = effects[i];
      if (!previous || deps.some((value, index) => value !== previous[index])) { effects[i] = deps; fn(); }
    } };
    if (name === '@tanstack/react-query') return { useQueryClient: () => client, useQuery: options => {
      const key = JSON.stringify(options.queryKey);
      let entry = observers.get(key);
      if (!entry) {
        const observer = new QueryObserver(client, options);
        entry = { observer, unsubscribe: observer.subscribe(() => {}) }; observers.set(key, entry);
      } else entry.observer.setOptions(options);
      const result = entry.observer.getCurrentResult();
      const refetch = result.refetch;
      // React Query exposes a stable refetch function; observe promises only to await completion.
      if (!entry.refetch) entry.refetch = options => { const promise = refetch(options); requests.push(promise); return promise; };
      return { ...result, refetch: entry.refetch };
    } };
    if (name.endsWith('fetch-podcastBy-id')) return { fetchPodcastById: fetch };
    if (name.endsWith('get-radio-by-slug.action')) return { fetchRadioStationsBySlug: fetch };
    if (name.endsWith('useToggleFavorite')) return { useToggleFavorite: () => ({ isPending: false, mutate: (payload, callbacks) => { mutation = { payload, callbacks }; } }) };
    if (name.endsWith('useAuthNavigation')) return { useAuthNavigation: () => ({ status: auth.status, requireAuth: () => { login++; return false; } }) };
    if (name.endsWith('useAuthStore')) return { useAuthStore: authStore };
    if (name === 'expo-router') return { usePathname: () => pathname };
    if (name === '@expo/vector-icons') return { Ionicons: 'Icon' };
    if (name === 'react-native') return { TouchableOpacity: 'Button', ActivityIndicator: 'Loading', Alert: { alert() {} }, AppState: { addEventListener: (_, callback) => { onForeground = callback; return { remove() {} }; } } };
    throw Error(`Unexpected import ${name}`);
  } };
  env.exports = env.module.exports; vm.runInNewContext(compiled, env);
  const render = () => { effectIndex = 0; return env.module.exports.PlayerFavoriteButton({type, slug, visible: true, beforeLogin: () => { close++; }}); };
  const flush = async () => { await Promise.all(requests); };
  return { client, slug, render, flush, reads: () => reads, login: () => login, close: () => close,
    setFavorite: value => { favorite = value; }, route: value => { pathname = value; }, mutation: () => mutation, foreground: () => onForeground?.("active"),
    dispose: () => { for (const {unsubscribe} of observers.values()) unsubscribe(); client.clear(); },
  };
}
(async () => {
  let f = await fixture('radio', false);
  try {
    const button = f.render(); await f.flush(); assert.equal(f.reads(), 0);
    button.props.onPress(); assert.equal(f.login(), 1); assert.equal(f.close(), 1); assert.equal(f.mutation(), undefined);
    console.log('PASS guest favorite closes full-screen view and requests login, without favorite/detail requests');
  } finally { f.dispose(); }
  for (const type of ['radio', 'podcast']) {
    f = await fixture(type);
    try {
      f.render(); await f.flush(); let button = f.render();
      assert.equal(f.reads(), 1, 'Opening must deduplicate initial query and refresh');
      assert.equal(button.props.accessibilityState.selected, false);
      f.setFavorite(true); f.route('/favorites'); f.render(); await f.flush();
      f.route('/home'); f.render(); await f.flush(); button = f.render();
      assert.equal(button.props.accessibilityState.selected, true, 'Favorite changed elsewhere must refresh on return');
      button.props.onPress(); const { payload, callbacks } = f.mutation();
      assert.equal(payload.type, type);
      assert.equal(payload[type === 'radio' ? 'radioStationId' : 'podcastId'], 'internal-id');
      assert.equal(payload[type === 'radio' ? 'radioSlug' : 'podcastSlug'], f.slug);
      const key = [type === 'radio' ? 'radioStation' : 'podcast', f.slug];
      const original = f.client.getQueryData(key);
      f.client.setQueryData(key, type === 'radio' ? { data: {...original.data, isFavorite: false} } : { podcast: {...original.podcast, isFavorite: false} });
      callbacks.onError(); button = f.render();
      assert.equal(button.props.accessibilityState.selected, true, 'Failed mutation must restore favorite');
      f.setFavorite(false); f.foreground(); await f.flush(); button = f.render();
      assert.equal(button.props.accessibilityState.selected, false, 'Foregrounding must revalidate the current favorite');
      console.log(`PASS ${type}: refresh on navigation and foreground, stable identity payload and rollback`);
    } finally { f.dispose(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
