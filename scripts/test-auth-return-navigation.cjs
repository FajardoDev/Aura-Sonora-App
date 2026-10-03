// Reproduces the real AuthLayout back handler against React Navigation's stack router.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

(async () => {
  const { StackRouter, StackActions } = await import('@react-navigation/routers');
  const options = { routeNames: ['(tabs)', 'auth'], routeParamList: {}, routeGetIdList: {} };
  const jsx = (type, props) => ({ type, props });
  function fixture(destination, coldAuth = false) {
    const stack = StackRouter({ initialRouteName: coldAuth ? 'auth' : '(tabs)' });
    let state = stack.getInitialState(options);
    const tabsKey = coldAuth ? null : state.routes[0].key;
    const dispatch = action => { state = stack.getStateForAction(state, action, options); };
    if (!coldAuth) dispatch(StackActions.push('auth'));
    const calls = [];
    let lastRoute = destination;
    const router = {
      replace: path => { calls.push(['replace', path]); dispatch(StackActions.replace('(tabs)')); },
      dismissTo: path => { calls.push(['dismissTo', path]); dispatch(StackActions.popTo('(tabs)')); },
    };
    const Stack = Object.assign(() => {}, { Screen: () => {} });
    const mocks = {
      'react/jsx-runtime': { jsx, jsxs: jsx },
      '@/presentation/auth/store/useAuthStore': { useAuthStore: { getState: () => ({ lastRoute,
        clearLastRoute: () => { lastRoute = undefined; return Promise.resolve(); } }) } },
      '@/presentation/auth/hooks/useAuthNavigation': { getAuthReturnRoute: route => route || '/home' },
      '@/presentation/components/PlayerBackground': { PlayerBackground: () => {} },
      '@/presentation/theme/components/themed-text': { default: () => {} },
      '@/presentation/theme/hooks/use-theme-color': { useThemeColor: () => '#000' },
      '@expo/vector-icons': { Ionicons: () => {} },
      'expo-router': { Stack, useRouter: () => router, usePathname: () => '/auth/login' },
      nativewind: { useColorScheme: () => ({ colorScheme: 'dark' }) },
      'react-native': { Platform: { OS: 'android' }, Pressable: 'Pressable', View: 'View' },
    };
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync('app/auth/_layout.tsx', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, require: name => {
      if (!(name in mocks)) throw Error('Unexpected dependency: ' + name);
      return mocks[name];
    } });
    const layout = module.exports.default();
    layout.props.screenOptions.headerLeft().props.onPress();
    return { state, tabsKey, calls, lastRoute };
  }
  for (const source of ['/radio-station/disco-106', '/home', '/podcast/12-y-2']) {
    const f = fixture(source);
    assert.equal(f.state.routes.length, 1, 'Returning from login must not create a second tabs/player tree');
    assert.equal(f.state.routes[0].key, f.tabsKey, 'The existing tabs/player must stay mounted');
    assert.equal(f.calls[0][1], source);
    assert.equal(f.lastRoute, undefined);
    console.log('PASS guest login cancellation preserves existing tabs/player: ' + source);
  }
  for (const source of ['/favorites', '/library/history', '/library/notifications']) {
    const f = fixture(source);
    assert.equal(f.calls[0][1], '/home');
    assert.equal(f.state.routes.length, 1);
    assert.equal(f.state.routes[0].key, f.tabsKey);
    console.log('PASS private destination returns to guest Home without another player: ' + source);
  }
  const direct = fixture('/home', true);
  assert.equal(direct.state.routes.length, 1);
  assert.equal(direct.state.routes[0].name, '(tabs)');
  console.log('PASS direct login entry falls back to one tabs/player tree');
  // Execute each screen's actual success handler, including its awaited auth calls.
  async function successfulAuth(file, handler, destination, coldAuth = false) {
    const stack = StackRouter({ initialRouteName: coldAuth ? 'auth' : '(tabs)' });
    let state = stack.getInitialState(options);
    const tabsKey = coldAuth ? null : state.routes[0].key;
    if (!coldAuth) state = stack.getStateForAction(state, StackActions.push('auth'), options);
    let cleared = false;
    const calls = [];
    const router = {
      replace: path => { calls.push(path); state = stack.getStateForAction(state, StackActions.replace('(tabs)'), options); },
      dismissTo: path => { calls.push(path); state = stack.getStateForAction(state, StackActions.popTo('(tabs)'), options); },
    };
    const source = fs.readFileSync(file, 'utf8');
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let declaration;
    const visit = node => {
      if (ts.isVariableDeclaration(node) && node.name.getText(parsed) === handler) declaration = node;
      ts.forEachChild(node, visit);
    };
    visit(parsed);
    assert.ok(declaration, 'Actual submission handler must exist');
    const code = ts.transpileModule('const submit = ' + declaration.initializer.getText(parsed) + '; submit;', {
      compilerOptions: { target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const submit = vm.runInNewContext(code, { router, form: { fullName: 'Test', email: 'test@example.invalid', password: 'test' },
      login: async () => true, register: async () => true,
      getLastRoute: async () => destination,
      clearLastRoute: async () => { cleared = true; },
      getAuthReturnRoute: route => route || '/home', setIsPosting: () => {},
      Alert: { alert: () => { throw Error('Unexpected authentication error'); } },
    });
    await submit();
    assert.equal(state.routes.length, 1, 'Successful auth must not create another tabs/player tree');
    if (!coldAuth) assert.equal(state.routes[0].key, tabsKey, 'Successful auth must preserve the existing player owner');
    assert.equal(calls[0], destination || '/home');
    assert.equal(cleared, true);
  }
  for (const [file, handler] of [['app/auth/login/index.tsx', 'onLogin'], ['app/auth/register/index.tsx', 'handleRegister']]) {
    for (const destination of ['/radio-station/disco-106', '/podcast/12-y-2', '/favorites']) {
      await successfulAuth(file, handler, destination);
      console.log('PASS successful ' + handler + ' keeps original tabs/player: ' + destination);
    }
    await successfulAuth(file, handler, undefined, true);
    console.log('PASS successful ' + handler + ' from direct auth entry creates only one tabs/player');
  }

})().catch(error => { console.error(error.message); process.exitCode = 1; });
