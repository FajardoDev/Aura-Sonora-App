const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');
const { QueryClient } = require('@tanstack/react-query');
const { create } = require('zustand');
function load(file, deps = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => deps[name] || require(name), console, AbortController, queueMicrotask }, { filename: file });
  return module.exports;
}
const model = load('presentation/listening/listening-model.ts');
const sync = load('presentation/listening/guest-history-sync.ts');
const r1='11111111-1111-4111-8111-111111111111', r2='22222222-2222-4222-8222-222222222222', p1='33333333-3333-4333-8333-333333333333';
const stamp=Date.parse('2025-01-01T10:00:00Z');
const radio=(id, slug=id) => ({kind:'radio', radioId:id, radioid:'provider-'+id, slug, title:'Radio', artwork:'private-art', stream:'https://stream', categories:[], locations:[], playedAt:stamp});
const episode=(id, podcastId=p1) => ({kind:'podcast', episodeId:id, podcastId, podcastSlug:'podcast', playedAt:stamp+1000, position:300, duration:1000, completed:false});
const profile={radios:[radio(r1),radio(r2)],episodes:[episode('e1')],updatedAt:stamp};
const catalog={radios:[],podcasts:[]};
test('two guest radios and one podcast generate exactly the minimal batch with original timestamps',()=>{
  const plan=sync.buildGuestHistorySync(profile,{},'A',catalog);
  assert.equal(plan.payload.radios.length,2);assert.equal(plan.payload.podcasts.length,1);
  assert.equal(plan.payload.radios[0].playedAt,new Date(stamp).toISOString());
  assert.deepEqual(Object.keys(plan.payload.radios[0]).sort(),['playedAt','radioId']);
  assert.deepEqual(Object.keys(plan.payload.podcasts[0]).sort(),['playedAt','podcastId']);
  assert.equal(profile.episodes[0].position,300);
});
test('resolve cached slug/provider IDs, skip unresolved entries, aggregate podcast episodes, cap batch',()=>{
  const input={...profile,radios:[radio('provider','known'),radio('unresolved')],episodes:[episode('e1','legacy'),{...episode('e2','legacy'),playedAt:stamp+2000}]};
  const plan=sync.buildGuestHistorySync(input,{},'A',{radios:[{id:r1,slug:'known',radioid:'provider'}],podcasts:[{id:p1,slug:'podcast'}]});
  assert.equal(plan.payload.radios.length,1);assert.equal(plan.payload.radios[0].radioId,r1);
  assert.equal(plan.payload.podcasts.length,1);assert.equal(plan.payload.podcasts[0].playedAt,new Date(stamp+2000).toISOString());
  const many={...profile,episodes:Array.from({length:30},(_,i)=>episode('e'+i,`${String(i).padStart(8,'0')}-0000-4000-8000-000000000000`))};
  assert.equal(sync.buildGuestHistorySync(many,{},'A',catalog).payload.podcasts.length,20);
});
test('acknowledge only accepted unchanged revisions; retain local progress and allow genuinely new guest listens',()=>{
  const plan=sync.buildGuestHistorySync(profile,{},'A',catalog);
  let marks=sync.updateSyncMarks(profile,{},'A',plan);
  marks=sync.updateSyncMarks(profile,marks,'A',plan,{success:true,radios:[r1,r2],podcasts:[p1]});
  assert.equal(sync.buildGuestHistorySync(profile,marks,'A',catalog).references.length,0);
  assert.equal(sync.buildGuestHistorySync(profile,marks,'B',catalog).references.length,0);
  const next={...profile,radios:[{...profile.radios[0],playedAt:stamp+5000},profile.radios[1]]};
  assert.equal(sync.buildGuestHistorySync(next,marks,'B',catalog).references.length,1);
  const late=sync.updateSyncMarks(next,marks,'A',plan,{success:true,radios:[r1,r2],podcasts:[p1]});
  assert.equal(late['radio:'+r1],undefined);
  assert.equal(profile.episodes[0].position,300);
});
test('failure leaves pending data owned by A; neither B nor user profiles can import it',()=>{
  const plan=sync.buildGuestHistorySync(profile,{},'A',catalog);
  const marks=sync.updateSyncMarks(profile,{},'A',plan);
  assert.equal(sync.buildGuestHistorySync(profile,marks,'A',catalog).references.length,3);
  assert.equal(sync.buildGuestHistorySync(profile,marks,'B',catalog).references.length,0);
  assert.equal(sync.buildGuestHistorySync(model.EMPTY_PROFILE,marks,'B',catalog).references.length,0);
});

async function fixture(post, legacy = false) {
  const client=new QueryClient();
  const auth=create(()=>({status:'unauthenticated',user:undefined,accessToken:undefined}));
  const memory=new Map();
  const storage={getItem:async k=>memory.get(k)||null,setItem:async(k,v)=>{memory.set(k,v)},removeItem:async k=>{memory.delete(k)}};
  const listening=load('presentation/listening/useListeningStore.ts',{
    '@react-native-async-storage/async-storage':{default:storage},'./listening-model':model,'./guest-history-sync':sync});
  await listening.listeningReady();
  const state=listening.useListeningStore.getState();
  state.recordRadio('guest',legacy ? radio('legacy','known') : radio(r1),stamp);state.recordRadio('guest',radio(r2),stamp);
  if (legacy) client.setQueryData(['radioStations','infinite'], {pages:[{stations:[{id:r1,slug:'known',radioid:'provider-legacy',radioname:'Radio'}]}]});
  state.recordEpisode('guest',episode('e1'),300,1000,stamp+1000,true);
  // This account history must never be sent.
  state.recordRadio('user:A',radio('44444444-4444-4444-8444-444444444444'),stamp);
  const requests=[];let cleanup,refresh=0;
  client.invalidateQueries=async()=>{refresh++};
  const api={post:async(url,body,config)=>{
    const headers={Authorization:'Bearer '+auth.getState().accessToken};
    config.transformRequest[0](body,headers);
    requests.push({url,body,signal:config.signal});
    return post?post(body,config):{data:{success:true,radios:body.radios.map(r=>r.radioId),podcasts:body.podcasts.map(p=>p.podcastId)}};
  }};
  const hook=load('presentation/listening/useGuestHistorySync.ts',{
    react:{useEffect:fn=>{cleanup=fn()}},'@/core/query-client/queryClient':{queryClient:client},
    '@/core/api/radioPodcastApi':{radioPodcastApi:api},'@/presentation/auth/store/useAuthStore':{useAuthStore:auth},
    './catalog-cache':load('presentation/listening/catalog-cache.ts'),'./guest-history-sync':sync,'./listening-model':model,
    './useListeningStore':listening,
  });
  hook.useGuestHistorySync();
  const settle=()=>new Promise(resolve=>setImmediate(resolve));
  const login=id=>auth.setState({status:'authenticated',user:{id},accessToken:'token-'+id});
  const logout=()=>auth.setState({status:'unauthenticated',user:undefined,accessToken:undefined});
  return {client,auth,listening,requests,login,logout,settle,refresh:()=>refresh,close:()=>{cleanup();client.clear()},memory};
}
test('real observer dispatches once after login; repeated renders/store notifications and next login do not resend',async()=>{
  const f=await fixture();try{
    await f.settle();assert.equal(f.requests.length,0);
    f.login('A');await f.settle();await f.listening.flushListeningStorage();
    assert.equal(f.requests.length,1);assert.equal(f.requests[0].body.radios.length,2);assert.equal(f.requests[0].body.podcasts.length,1);
    assert.equal(f.refresh(),1);assert.equal(f.listening.useListeningStore.getState().profiles.guest.episodes[0].position,300);
    f.auth.setState({lastRoute:'/home'});await f.settle();assert.equal(f.requests.length,1);
    f.logout();f.login('A');await f.settle();assert.equal(f.requests.length,1);
    const persisted=JSON.parse(f.memory.get('aura-listening-v1'));assert.equal(Object.keys(persisted.state.guestSyncMarks).length,3);
  }finally{f.close()}
});
test('network failure never invalidates Home or loses history; next same-account login retries one batch',async()=>{
  let fail=true;const f=await fixture(async body=>{if(fail)throw Error('offline');return {data:{success:true,radios:body.radios.map(r=>r.radioId),podcasts:body.podcasts.map(p=>p.podcastId)}}});
  try{f.login('A');await f.settle();assert.equal(f.requests.length,1);assert.equal(f.refresh(),0);
    assert.equal(f.listening.useListeningStore.getState().profiles.guest.radios.length,2);
    f.logout();f.login('B');await f.settle();assert.equal(f.requests.length,1);
    fail=false;f.logout();f.login('A');await f.settle();assert.equal(f.requests.length,2);assert.equal(f.refresh(),1);
  }finally{f.close()}
});
test('account change aborts inflight sync; late A response cannot acknowledge data or refresh B cache',async()=>{
  let finish;const f=await fixture(()=>new Promise(resolve=>{finish=resolve}));
  try{f.login('A');await f.settle();assert.equal(f.requests.length,1);
    f.login('B');await f.settle();assert.equal(f.requests[0].signal.aborted,true);assert.equal(f.requests.length,1);
    finish({data:{success:true,radios:[r1,r2],podcasts:[p1]}});await f.settle();assert.equal(f.refresh(),0);
    assert.equal(f.listening.useListeningStore.getState().guestSyncMarks['radio:'+r1].syncedAt,undefined);
  }finally{f.close()}
});

test('catalog identities survive the auth QueryClient clear without extra resolution requests',async()=>{
  const f=await fixture(undefined,true);try{f.client.clear();f.login('A');await f.settle();
    assert.equal(f.requests.length,1);assert.equal(f.requests[0].body.radios.length,2);assert.ok(f.requests[0].body.radios.some(r=>r.radioId===r1));
  }finally{f.close()}
});
