const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const moduleFixture = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('presentation/radio/playback/SleepTimer.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
vm.runInNewContext(code, { exports: moduleFixture.exports, module: moduleFixture, Date, setTimeout, clearTimeout });
const { SleepTimer } = moduleFixture.exports;
function fixture() {
  let now = 0, volume = 0.7, pauses = 0, latest = null, id = 0;
  const queue = new Map();
  const timer = new SleepTimer({
    now: () => now, getVolume: () => volume, setVolume: v => { volume = v; },
    pause: () => { pauses++; }, onChange: value => { latest = value; },
    schedule: (fn, delay) => { const handle = ++id; queue.set(handle, { fn, at: now + delay }); return handle; },
    unschedule: handle => queue.delete(handle),
  });
  return { timer, queue, volume: () => volume, pauses: () => pauses, latest: () => latest,
    jump: time => { now = time; },
    advance: time => {
      let next;
      while ((next = [...queue].sort((a,b) => a[1].at-b[1].at).find(([, task]) => task.at <= time))) {
        queue.delete(next[0]); now = next[1].at; next[1].fn();
      }
      now = time;
    },
  };
}
let f = fixture();
f.timer.start(5); assert.equal(f.latest(), 5);
f.advance(60_000); assert.equal(f.latest(), 4);
f.advance(300_000); assert.equal(f.pauses(), 0); assert.equal(f.latest(), 0);
f.advance(300_800); assert.ok(f.volume() < 0.7 && f.volume() > 0);
f.advance(301_500); assert.equal(f.pauses(), 1); assert.equal(f.volume(), 0.7); assert.equal(f.latest(), null);
f.advance(600_000); assert.equal(f.pauses(), 1);
console.log('PASS expiration fades, pauses once and restores actual hardware volume');
f = fixture(); f.timer.start(10); f.jump(185_000); f.timer.refresh(); assert.equal(f.latest(), 7);
f.jump(700_000); f.timer.refresh(); assert.equal(f.pauses(), 1); assert.equal(f.latest(), null);
console.log('PASS elapsed background time does not extend the deadline; late wake pauses immediately');
f = fixture(); f.timer.start(5); f.advance(300_600); f.timer.cancel(); assert.equal(f.volume(), 0.7); f.advance(900_000); assert.equal(f.pauses(), 0);
console.log('PASS cancel during fade restores volume and prevents pause');
f = fixture(); f.timer.start(5); f.advance(300_600); f.timer.start(10); assert.equal(f.volume(), 0.7); assert.equal(f.latest(), 10); f.advance(600_000); assert.equal(f.pauses(), 0); f.advance(902_100); assert.equal(f.pauses(), 1);
console.log('PASS replacing an active timer removes the old deadline and fade');
f = fixture(); f.timer.start(5); f.timer.dispose(); assert.equal(f.queue.size, 0); f.advance(900_000); assert.equal(f.pauses(), 0);
console.log('PASS unmount cleans scheduled callbacks');
let released = false, cleanupClock = 0;
const nativeCleanup = new SleepTimer({ getVolume: () => 0.5, setVolume: () => { if (released) throw Error('released player'); }, pause() {}, onChange() {}, now: () => cleanupClock, schedule: () => 1, unschedule() {} });
nativeCleanup.start(1); cleanupClock = 60_100; nativeCleanup.refresh(); released = true; assert.doesNotThrow(() => nativeCleanup.dispose());
console.log('PASS unmount never accesses a released native player');
f = fixture(); f.timer.start(NaN); f.timer.start(0); f.timer.start(-5); assert.equal(f.queue.size, 0);
console.log('PASS invalid timer durations are ignored');
