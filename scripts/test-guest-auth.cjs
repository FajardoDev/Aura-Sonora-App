// Run with node scripts/test-guest-auth.cjs. No device, credentials or backend needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { QueryClient } = require('@tanstack/react-query');
const root = path.resolve(__dirname, '..');

function load(file, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => {
    if (!(name in mocks)) throw new Error('Unexpected dependency: ' + name);
    return mocks[name];
  } });
  return exports;
}

function fixture() {
  const storage = new Map();
  const queryClient = new QueryClient();
  let checks = 0, notificationResets = 0;
  let check = async () => ({ accessToken: 'renewed', user: { id: 'existing-user' } });
  const create = () => (initializer) => {
    let state;
    const set = (value) => { state = { ...state, ...value }; };
    state = initializer(set, () => state);
    const store = (selector) => selector ? selector(state) : state;
    store.getState = () => state;
    store.setState = set;
    return store;
  };
  const secure = {
    getItem: async (key) => storage.get(key) ?? null,
    setItem: async (key, value) => { storage.set(key, value); },
    removeItem: async (key) => { storage.delete(key); },
  };
  const { useAuthStore: store } = load('presentation/auth/store/useAuthStore.ts', {
    '@/core/auth/actions/auth-actions': {
      authCheckStatus: async () => { checks++; return check(); },
      authLogin: async () => ({ accessToken: 'local-token', user: { id: 'existing-user' } }),
      register: async () => ({ accessToken: 'registered-token', user: { id: 'new-user' } }),
    },
    '@/core/query-client/queryClient': { queryClient },
    '@/helpers/adapters/secure-storage.adapter': { SecureStorageAdapter: secure },
    '@/presentation/radio/store/useAudioPlayerStore': { useAudioPlayerStore: { getState: () => ({ clearStream() {} }) } },
    '@/presentation/radio-podcast/stores/notifications.store': { useNotificationStore: { getState: () => ({ reset() { notificationResets++; } }) } },
    '@/presentation/radio/store/useFavoritesStore': { useFavoritesStore: { setState() {} } },
    'expo-secure-store': { getItemAsync: secure.getItem, deleteItemAsync: secure.removeItem },
    axios: { default: { isAxiosError: (error) => error.isAxiosError === true } },
    zustand: { create },
  });
  return { store, storage, queryClient, get checks() { return checks; }, get resets() { return notificationResets; }, setCheck(value) { check = value; } };
}

async function main() {
  let f = fixture();
  await f.store.getState().checkStatus();
  assert.equal(f.checks, 0);
  assert.equal(f.store.getState().status, 'unauthenticated');
  assert.equal(f.store.getState().user, undefined);
  console.log('PASS no token: guest without check-status or fabricated user');

  f = fixture(); f.storage.set('accessToken', 'stored');
  await Promise.all([f.store.getState().checkStatus(), f.store.getState().checkStatus()]);
  assert.equal(f.checks, 1);
  assert.equal(f.store.getState().status, 'authenticated');
  assert.equal(f.storage.get('accessToken'), 'renewed');
  console.log('PASS stored JWT: one restoration and renewed session');

  f = fixture(); f.queryClient.setQueryData(['favorites'], ['private']);
  assert.equal(await f.store.getState().login('test@example.invalid', 'test'), true);
  assert.equal(f.queryClient.getQueryData(['favorites']), undefined);
  assert.equal(f.store.getState().user.id, 'existing-user');
  f.queryClient.setQueryData(['history'], ['private']);
  await f.store.getState().logout();
  assert.equal(f.store.getState().status, 'unauthenticated');
  assert.equal(f.storage.has('accessToken'), false);
  assert.equal(f.queryClient.getQueryData(['history']), undefined);
  assert.equal(f.resets, 2);
  console.log('PASS login/logout: effective cache and personal state cleared');

  f = fixture(); f.storage.set('accessToken', 'stored');
  f.setCheck(async () => { throw new Error('Offline'); });
  await f.store.getState().checkStatus();
  assert.equal(f.store.getState().status, 'unauthenticated');
  assert.equal(f.storage.get('accessToken'), 'stored');
  console.log('PASS network failure: guest access preserves stored credential');

  f = fixture(); f.storage.set('accessToken', 'expired');
  f.setCheck(async () => { throw { isAxiosError: true, response: { status: 401 } }; });
  await f.store.getState().checkStatus();
  assert.equal(f.storage.has('accessToken'), false);
  console.log('PASS expired JWT: guest mode removes invalid credential');

  f = fixture(); f.storage.set('accessToken', 'stored');
  let complete, signalStarted;
  const started = new Promise((resolve) => { signalStarted = resolve; });
  f.setCheck(() => new Promise((resolve) => { complete = resolve; signalStarted(); }));
  const restoring = f.store.getState().checkStatus();
  await started;
  await f.store.getState().logout();
  complete({ accessToken: 'late-token', user: { id: 'existing-user' } });
  await restoring;
  assert.equal(f.store.getState().status, 'unauthenticated');
  assert.equal(f.storage.has('accessToken'), false);
  console.log('PASS late restoration cannot undo logout');

  const navigation = [];
  const { useAuthNavigation, getAuthReturnRoute } = load('presentation/auth/hooks/useAuthNavigation.ts', {
    'expo-router': { usePathname: () => '/podcast/example', useRouter: () => ({ push: (value) => navigation.push(value), replace: (value) => navigation.push(value) }) },
    '../store/useAuthStore': { useAuthStore: f.store },
  });
  assert.equal(useAuthNavigation().requireAuth(), false);
  assert.equal(navigation[0].params.returnTo, '/podcast/example');
  assert.equal(f.store.getState().lastRoute, '/podcast/example');
  assert.equal(getAuthReturnRoute('//external.invalid'), '/home');
  assert.equal(getAuthReturnRoute('/auth/login'), '/home');
  console.log('PASS protected action returns to its internal source after login');

  f = fixture();
  let requests = 0, resolveInbox;
  const { useNotificationStore: inbox } = load('presentation/radio-podcast/stores/notifications.store.ts', {
    '@/core/api/radioPodcastApi': { radioPodcastApi: {
      get: () => { requests++; return new Promise((resolve) => { resolveInbox = resolve; }); },
      patch: async () => { requests++; },
    } },
    '@/presentation/auth/store/useAuthStore': { useAuthStore: f.store },
    '@react-native-async-storage/async-storage': { default: { removeItem: async () => {} } },
    zustand: require('zustand'),
  });
  await inbox.getState().fetchNotifications();
  await inbox.getState().markAllAsRead();
  assert.equal(requests, 0);
  console.log('PASS guest inbox does not fetch or mutate personal notifications');
  await f.store.getState().login('test@example.invalid', 'test');
  const fetching = inbox.getState().fetchNotifications();
  await f.store.getState().chageStatus('another-session', { id: 'another-user' });
  inbox.getState().reset();
  resolveInbox({ data: { data: [{ id: 'private-old-inbox', isRead: false }], meta: { unread: 1 } } });
  await fetching;
  assert.equal(inbox.getState().notifications.length, 0);
  assert.equal(inbox.getState().unreadCount, 0);
  console.log('PASS old inbox response cannot enter another session');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
