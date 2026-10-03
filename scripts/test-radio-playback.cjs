// Run with node scripts/test-radio-playback.cjs. No native audio or network needed.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname,
  '../presentation/radio/playback/RadioPlaybackController.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject });
const { RadioPlaybackController } = exportsObject;

function fixture() {
  let time = 0;
  let state;
  let playing = false;
  const sources = [];
  const player = {
    currentStatus: { playing: false, isLoaded: false, isBuffering: true,
      playbackState: 'buffering', currentTime: 0 },
    pause() { this.currentStatus.playing = false; },
    play() {},
    replace(source) { sources.push(source); this.currentStatus = {
      playing: false, isLoaded: false, isBuffering: true,
      playbackState: 'buffering', currentTime: 0 }; },
  };
  const controller = new RadioPlaybackController(player, value => { state = value; },
    value => { playing = value; }, () => time);
  return { controller, player, sources, get state() { return state; },
    get playing() { return playing; },
    advance(ms) { time += ms; controller.tick(); },
    ready(position = 1) { player.currentStatus = { playing: true, isLoaded: true,
      isBuffering: false, playbackState: 'ready', currentTime: position }; },
  };
}

const tests = {
  'valid stream and metadata updates do not replace audio'() {
    const f = fixture(); f.controller.select('https://radio.test/live', true);
    f.ready(); f.advance(1000); assert.equal(f.playing, true);
    assert.equal(f.state.isConnecting, false);
    f.ready(2); f.advance(1000); assert.equal(f.sources.length, 1);
  },
  'broken stream stops after exactly two automatic retries'() {
    const f = fixture(); f.controller.select('https://radio.test/broken', true);
    for (let i = 0; i < 3; i++) {
      f.player.currentStatus.playbackState = 'idle'; f.advance(2000);
      assert.equal(f.playing, false);
      if (i < 2) { f.advance(1799); assert.equal(f.sources.length, i + 1); f.advance(1); }
    }
    assert.equal(f.sources.length, 3); assert.equal(f.state.retryCount, 2);
    assert.ok(f.state.playbackError); assert.equal(f.state.isConnecting, false);
    f.advance(60000); assert.equal(f.sources.length, 3);
  },
  'timeout and stalled playback fail'() {
    const f = fixture(); f.controller.select('https://radio.test/live', true);
    f.advance(20000); assert.equal(f.state.retryCount, 1);
    f.advance(1800); f.ready(); f.advance(1000);
    f.advance(20000); assert.equal(f.state.retryCount, 2);
  },
  'native failed state, invalid URL and thrown native error'() {
    const f = fixture(); f.controller.select('invalid url', true);
    assert.equal(f.state.retryCount, 1); assert.equal(f.sources.length, 0);
    f.advance(1800); f.advance(1800); assert.ok(f.state.playbackError);
    const g = fixture(); g.player.replace = () => { throw Error('native'); };
    g.controller.select('https://radio.test/live', true); assert.equal(g.state.retryCount, 1);
    const h = fixture(); h.controller.select('https://radio.test/live', true);
    h.player.currentStatus.playbackState = 'failed'; h.advance(1000);
    assert.equal(h.state.retryCount, 1);
  },
  'switch during retry discards old work and resets budget'() {
    const f = fixture(); f.controller.select('https://radio.test/old', true);
    f.advance(20000); f.controller.select('https://radio.test/new', true);
    f.ready(); f.advance(2000); assert.equal(f.state.retryCount, 0);
    assert.equal(f.playing, true); assert.deepEqual(f.sources, ['https://radio.test/old', 'https://radio.test/new']);
  },
  'manual retry recovers and clears error'() {
    const f = fixture(); f.controller.select('invalid', true);
    f.advance(1800); f.advance(1800); assert.ok(f.state.playbackError);
    f.controller.retry(); assert.equal(f.state.playbackError, null);
    // Same valid URL temporarily fails, then recovers on manual retry.
    const g = fixture(); g.controller.select('https://radio.test/live', true);
    for (let i = 0; i < 3; i++) { g.advance(20000); if (i < 2) g.advance(1800); }
    assert.ok(g.state.playbackError); g.controller.retry(); g.ready(); g.advance(1000);
    assert.equal(g.playing, true); assert.equal(g.state.playbackError, null);
    assert.equal(g.state.retryCount, 0);
  },
  'manual and external pause cancel errors; external resume preserves source'() {
    const f = fixture(); f.controller.select('https://radio.test/live', true);
    f.advance(20000); f.controller.request(false); f.advance(60000);
    assert.equal(f.sources.length, 1); assert.equal(f.state.playbackError, null);
    f.controller.request(true); f.ready(); f.advance(1000);
    f.player.currentStatus.playing = false; f.advance(1000);
    assert.equal(f.playing, false); assert.equal(f.state.isConnecting, false);
    f.ready(2); f.advance(1000); assert.equal(f.playing, true); assert.equal(f.sources.length, 1);
  },
  'intermittent recoveries do not create an infinite retry loop'() {
    const f = fixture(); f.controller.select('https://radio.test/live', true);
    for (let i = 0; i < 3; i++) {
      f.ready(i + 1); f.advance(1000);
      f.player.currentStatus.playbackState = 'failed'; f.advance(1000);
      if (i < 2) f.advance(1800);
    }
    assert.ok(f.state.playbackError); f.advance(60000); assert.equal(f.sources.length, 3);
  },
  'cleanup cancels pending work without accessing native player'() {
    const f = fixture(); f.controller.select('https://radio.test/live', true);
    f.advance(20000); f.controller.dispose(); f.advance(60000);
    assert.equal(f.sources.length, 1);
  },
};
for (const [name, test] of Object.entries(tests)) {
  test(); console.log(`PASS ${name}`);
}
