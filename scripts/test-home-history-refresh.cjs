const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { QueryClient, QueryObserver } = require('@tanstack/react-query');

(async () => {
  async function fixture(enabled) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let latest = 'disco', reads = 0, mutationOptions;
    const fetchHistory = async () => { reads++; return { radios: [{ id: latest }], podcasts: [] }; };
    client.setQueryData(['history', 'home'], { radios: [{ id: 'disco' }], podcasts: [] });
    client.setQueryData(['topStation'], ['catalog-unchanged']);
    const observer = new QueryObserver(client, { queryKey: ['history', 'home'], queryFn: fetchHistory, enabled, staleTime: Infinity });
    const unsubscribe = observer.subscribe(() => {});
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync('core/radio-podcast/actions/radio-podcast/hooks/useRegisterLatestView.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, console, require: name => {
      if (name === '@tanstack/react-query') return { useQueryClient: () => client, useMutation: options => { mutationOptions = options; } };
      if (name === '../actions/register-latest-view.action') return { registerLatestView: async payload => { latest = payload.radioStationId || latest; return { success: true }; } };
      throw Error('Unexpected dependency: ' + name);
    } });
    module.exports.useRegisterLatestView();
    const register = async payload => {
      const mutation = client.getMutationCache().build(client, mutationOptions);
      await mutation.execute(payload);
    };
    return { client, register, close: () => { unsubscribe(); client.clear(); }, reads: () => reads };
  }
  let f = await fixture(true);
  try {
    await f.register({ type: 'radio', radioStationId: 'enamorada' });
    assert.equal(f.client.getQueryData(['history', 'home']).radios[0].id, 'enamorada', 'Home must receive the new seed without leaving the page');
    assert.equal(f.reads(), 1, 'Refresh history once after the registered listen');
    assert.deepEqual(f.client.getQueryData(['topStation']), ['catalog-unchanged']);
    console.log('PASS authenticated Home receives new radio seed without navigation; catalog unchanged');
  } finally { f.close(); }
  f = await fixture(false);
  try {
    await f.register({ type: 'radio', radioStationId: 'enamorada' });
    assert.equal(f.reads(), 0, 'Disabled guest personal history must never be fetched');
    console.log('PASS guest personal history stays disabled');
  } finally { f.close(); }
  f = await fixture(true);
  try {
    await f.register({ type: 'podcast', podcastId: 'podcast' });
    assert.equal(f.reads(), 0, 'This fix is limited to radio history refresh');
    console.log('PASS podcast behavior unchanged');
  } finally { f.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
