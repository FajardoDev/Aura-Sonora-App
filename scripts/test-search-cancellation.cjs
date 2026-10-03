const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const axios = require('axios');

const source = fs.readFileSync('core/api/radioPodcastApi.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
let onError;
const logs = [], alerts = [];
const client = { interceptors: {
  request: { use() {} }, response: { use: (_, callback) => { onError = callback; } },
} };
const moduleObject = { exports: {} };
vm.runInNewContext(compiled, {
  module: moduleObject, exports: moduleObject.exports,
  process: { env: { EXPO_PUBLIC_API_URL: 'https://test.invalid/api', EXPO_PUBLIC_STAGE: 'test' } },
  console: { log: value => logs.push(value), warn: value => logs.push(value) },
  require: name => {
    if (name === 'axios') return { default: { create: () => client, isCancel: axios.isCancel, Cancel: axios.Cancel } };
    if (name === 'react-native') return { Platform: { OS: 'android' }, Alert: { alert: (...args) => alerts.push(args) } };
    if (name.endsWith('secure-storage.adapter')) return { SecureStorageAdapter: {} };
    if (name.endsWith('checkNetworkStatus')) return {};
    throw new Error(`Unexpected import: ${name}`);
  },
});
(async () => {
  logs.length = 0;
  const searchCancellation = new axios.CanceledError('canceled');
  await assert.rejects(onError(searchCancellation), error => error === searchCancellation);
  assert.equal(logs.length, 0);
  assert.equal(alerts.length, 0);
  console.log('PASS normal search cancellation is silent and preserves the original error');
  const offline = new axios.Cancel('Sin conexión a Internet');
  await assert.rejects(onError(offline), error => error === offline);
  assert.deepEqual(logs, ['🌐 Petición cancelada: offline']);
  const timeout = { code: 'ECONNABORTED' };
  await assert.rejects(onError(timeout), error => error === timeout);
  assert.equal(alerts.length, 1);
  console.log('PASS real offline and timeout handling remain intact');
})().catch(error => { console.error(error); process.exitCode = 1; });
