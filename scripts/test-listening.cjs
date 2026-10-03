const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports,
    require: name => dependencies[name] || require(name), console, queueMicrotask, setTimeout }, { filename: file });
  return module.exports;
}
const model = load('presentation/listening/listening-model.ts');
const radio = i => ({ kind: 'radio', radioId: `r${i}`, slug: `radio-${i}`, title: `Radio ${i}`, artwork: '', stream: 'https://example.com/radio', radioid: `${i}`, categories: ['Pop'], locations: ['Santo Domingo'] });
const episode = i => ({ kind: 'podcast', podcastId: 'podcast-1', podcastSlug: 'podcast-one', podcastTitle: 'Podcast One', episodeId: `e${i}`, episodeSlug: `episode-${i}`, title: `Episode ${i}`, artwork: '', stream: 'https://example.com/episode.mp3', categories: ['News'] });
const sample = (playing, position = 0, duration = 1000, buffering = false) => ({ loaded: true, playing, position, duration, buffering });

test('radio rejects short taps and buffering; qualifies only 15 seconds of native playing time', () => {
  const writes = [];
  const session = new model.ListeningSession(radio(1), (...args) => writes.push(args));
  for (let t = 0; t < 10; t++) session.sample(sample(true), t * 1000);
  session.sample(sample(false), 10000);
  assert.equal(writes.length, 0);
  for (let t = 11; t <= 40; t++) session.sample(sample(true, 0, 0, true), t * 1000);
  assert.equal(writes.length, 0);
  for (let t = 41; t <= 56; t++) session.sample(sample(true), t * 1000);
  assert.equal(writes.length, 1);
});
test('radio pause/resume starts a new qualified listen without duplicating history', () => {
  let profile = model.EMPTY_PROFILE;
  const session = new model.ListeningSession(radio(1), (_, __, now) => { profile = model.upsertRadio(profile, radio(1), now); });
  for (let t = 0; t <= 15; t++) session.sample(sample(true), t * 1000);
  session.sample(sample(false), 16000);
  for (let t = 17; t <= 32; t++) session.sample(sample(true), t * 1000);
  assert.equal(profile.radios.length, 1);
  assert.equal(profile.radios[0].playedAt, 32000);
});
test('seeks and wall-clock gaps alone never create podcast history', () => {
  const writes = [];
  const session = new model.ListeningSession(episode(1), (...args) => writes.push(args));
  session.sample(sample(true, 0), 0);
  session.sample(sample(true, 500), 1000);
  session.sample(sample(true, 501), 60000);
  session.flush(60000);
  assert.equal(writes.length, 0);
});
test('podcast records after real progress, throttles checkpoints and flushes pause/switch', () => {
  const writes = [];
  const session = new model.ListeningSession(episode(1), (...args) => writes.push(args));
  for (let t = 0; t <= 24; t++) session.sample(sample(true, t), t * 1000);
  assert.equal(writes.length, 2); // qualification at 5; next checkpoint at 15
  session.sample(sample(false, 24.5), 25000);
  assert.equal(writes.length, 3);
  assert.equal(writes[2][0], 24.5);
  session.flush(26000);
  assert.equal(writes.length, 3);
});
test('completion criterion handles short and long episodes without premature completion', () => {
  assert.equal(model.isEpisodeComplete(0, 45), false);
  assert.equal(model.isEpisodeComplete(30, 45), false);
  assert.equal(model.isEpisodeComplete(43, 45), true);
  assert.equal(model.isEpisodeComplete(940, 1000), true);
  assert.equal(model.isEpisodeComplete(899, 1000), false);
  assert.equal(model.isEpisodeComplete(50, 0), false);
});
test('completion is persisted immediately and does not cause writes on every sample', () => {
  const writes = [];
  const session = new model.ListeningSession(episode(1), (...args) => writes.push(args));
  for (let t = 0; t <= 9; t++) session.sample(sample(true, 930 + t), t * 1000);
  session.sample(sample(true, 940), 10000);
  assert.equal(writes.length, 2);
  for (let t = 11; t <= 18; t++) session.sample(sample(true, 930 + t), t * 1000);
  assert.equal(writes.length, 2);
});
test('history is bounded, deduplicated, and returning items move to the front', () => {
  let profile = model.EMPTY_PROFILE;
  for (let i = 0; i < 35; i++) profile = model.upsertRadio(profile, radio(i), i);
  assert.equal(profile.radios.length, 20);
  profile = model.upsertRadio(profile, radio(20), 99);
  assert.equal(profile.radios.length, 20);
  assert.equal(profile.radios[0].radioId, 'r20');
  for (let i = 0; i < 45; i++) profile = model.upsertEpisode(profile, episode(i), 10, 1000, i + 100, true);
  assert.equal(profile.episodes.length, 30);
  profile = model.upsertEpisode(profile, episode(20), 120, 1000, 200, true);
  assert.equal(profile.episodes[0].position, 120);
  assert.equal(profile.episodes[0].episodeId, 'e20');
});
test('recommendations rank categories before location, exclude self and duplicates, and cap at five', () => {
  const seed = { id: 'seed', slug: 'seed', categories: ['POP'], locations: ['Santo Domingo'] };
  const items = [{ ...seed }, ...Array.from({ length: 8 }, (_, i) => ({ id: `${i}`, slug: `s${i}`, categories: i === 0 ? [] : ['pop'], locations: i === 0 ? ['Santo Domingo'] : [] }))];
  const ranked = model.rankRelated(seed, [...items, ...items]);
  assert.equal(ranked.length, 5);
  assert.equal(new Set(ranked.map(r => r.id)).size, 5);
  assert.ok(!ranked.some(r => r.id === 'seed' || r.id === '0'));
});
test('missing categories use meaningful location or trusted related results, otherwise hide', () => {
  const seed = { id: 'seed', slug: 'seed' };
  const items = [{ id: 'other', slug: 'other' }];
  assert.equal(model.rankRelated(seed, items).length, 0);
  assert.equal(model.rankRelated(seed, items, new Set(['other'])).length, 1);
  assert.equal(model.rankRelated({ ...seed, locations: ['SD'] }, [{ ...items[0], locations: ['sd'] }]).length, 1);
});
test('AsyncStorage survives restart; guest and account progress remain isolated; account cache is bounded', async () => {
  const memory = new Map();
  const adapter = { getItem: async key => memory.get(key) || null,
    setItem: async (key, value) => { memory.set(key, value); }, removeItem: async key => { memory.delete(key); } };
  const deps = { '@react-native-async-storage/async-storage': { default: adapter }, './listening-model': model, './guest-history-sync': load('presentation/listening/guest-history-sync.ts') };
  const first = load('presentation/listening/useListeningStore.ts', deps);
  await first.listeningReady();
  first.useListeningStore.getState().recordRadio('guest', radio(1), 1);
  first.useListeningStore.getState().recordEpisode('guest', episode(1), 123, 1000, 2, true);
  for (let i = 0; i < 5; i++) first.useListeningStore.getState().recordEpisode(`user:${i}`, episode(1), i + 200, 1000, i + 3, true);
  await first.flushListeningStorage();
  const second = load('presentation/listening/useListeningStore.ts', deps);
  await second.listeningReady();
  const profiles = second.useListeningStore.getState().profiles;
  assert.equal(profiles.guest.episodes[0].position, 123);
  assert.equal(profiles['user:4'].episodes[0].position, 204);
  assert.equal(Object.keys(profiles).length, 4);
  assert.equal(profiles.guest.radios.length, 1);
  assert.equal(profiles['user:4'].radios.length, 0);
});
