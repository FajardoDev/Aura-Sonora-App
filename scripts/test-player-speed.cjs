const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync('presentation/components/AudioPlayer.tsx', 'utf8');
const tree = ts.createSourceFile('AudioPlayer.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(tree) === 'useEffect' && node.arguments[0]?.getText(tree).includes('player.setPlaybackRate')) callback = node.arguments[0].getText(tree);
  ts.forEachChild(node, visit);
}
visit(tree); assert.ok(callback);
const calls = [];
const context = { player: { shouldCorrectPitch: false, setPlaybackRate: rate => calls.push(rate) },
  type: 'podcast', streamUrl: 'episode.mp3', status: {isLoaded: true}, playbackRate: 1, setIsSpeedModalVisible() {} };
vm.createContext(context);
const js = ts.transpileModule(`globalThis.apply = ${callback};`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
vm.runInContext(js, context);
for (const rate of [1, 1.25, 1.5, 2]) { context.playbackRate = rate; context.apply(); }
assert.deepEqual(calls, [1, 1.25, 1.5, 2]); assert.equal(context.player.shouldCorrectPitch, true);
console.log('PASS podcast rates apply to the existing native player with pitch correction');
context.type = 'radio'; context.playbackRate = 2; context.apply(); assert.equal(calls.at(-1), 1);
console.log('PASS changing to radio always restores normal playback speed');
const count = calls.length; context.status.isLoaded = false; context.apply(); assert.equal(calls.length, count);
context.status.isLoaded = true; context.streamUrl = null; context.apply(); assert.equal(calls.length, count);
console.log('PASS unloaded or absent streams never call native rate controls');
