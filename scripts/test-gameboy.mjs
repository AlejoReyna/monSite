import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const exports = {};
vm.runInNewContext(ts.transpileModule(read('../src/lib/gameboy/save.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
const { parseGoldBackup, GOLD_ROM_SHA256, GAME_KEYS } = exports;
const presentation = {};
vm.runInNewContext(ts.transpileModule(read('../src/lib/gameboy/presentation.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: presentation });
const { parseGameBoyCase, createGameFullscreen } = presentation;
const library = {};
vm.runInNewContext(ts.transpileModule(read('../src/lib/gameboy/library.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: library });
const cartridgeModule = await import('data:text/javascript;base64,' + Buffer.from(read('../public/gameboy/cartridge.js')).toString('base64'));
const backup = () => ({ format: 'monsite-gold-cartridge', version: 1, rom: GOLD_ROM_SHA256,
  savedAt: '2026-10-13T12:00:00.000Z', sram: Buffer.alloc(32768, 0x42).toString('base64'), rtc: Buffer.alloc(8, 0x12).toString('base64') });

test('cartridge backups retain the entire SRAM and separate RTC, without using a save state', () => {
  const value = backup();
  assert.deepEqual(JSON.parse(JSON.stringify(parseGoldBackup(JSON.stringify(value)))), value);
  for (const change of [{rom:'wrong'}, {version:2}, {sram:'AA=='}, {rtc:'AA=='}, {sram:'%'.repeat(43692)}, {savedAt:'bad'}, {format:'save-state'}]) {
    assert.throws(() => parseGoldBackup(JSON.stringify({...value,...change})));
  }
  assert.throws(() => parseGoldBackup('null'));
  assert.throws(() => parseGoldBackup('x'.repeat(100001)));
});

test('the shipped ROM is byte-identical to its fixed backup identity and has MBC3 + RTC + battery', () => {
  const rom = readFileSync(new URL('../public/games/pokemon-gold.gbc', import.meta.url));
  assert.equal(rom.length, 2097152);
  assert.equal(createHash('sha256').update(rom).digest('hex'), GOLD_ROM_SHA256);
  assert.equal(rom[0x147], 0x10);
  assert.equal(rom[0x149], 3); // 32 KiB SRAM
  let checksum = 0;
  for (let i=0x134; i<=0x14c; i++) checksum = (checksum - rom[i] - 1) & 255;
  assert.equal(checksum, rom[0x14d]);
});

test('all official precompiled resources still match the manifest', () => {
  const manifest = JSON.parse(read('../public/emulatorjs/4.2.3/manifest.json'));
  for (const [path, expected] of Object.entries(manifest)) {
    const bytes = readFileSync(new URL('../public/emulatorjs/4.2.3/data/' + path, import.meta.url));
    assert.equal(bytes.length, expected.bytes, path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.sha256, path);
  }
});

test('physical key mapping excludes the final Konami A and supports both Select keys', () => {
  assert.equal(GAME_KEYS.KeyX,'x'); assert.equal(GAME_KEYS.KeyZ,'z');
  assert.equal(GAME_KEYS.ShiftLeft,'Shift'); assert.equal(GAME_KEYS.ShiftRight,'Shift');
  assert.equal(GAME_KEYS.KeyA, undefined);
});

test('the initial console renders a single selectable Gold game, without booting a ROM or showing removed branding/footer', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  let language = 'es';
  const component = {};
  const componentRequire = module => {
    if (module === '@/components/lang-context') return {useLanguage: () => ({language})};
    if (module === '@/lib/gameboy/save') return exports;
    if (module === '@/lib/gameboy/presentation') return presentation;
    if (module === '@/lib/gameboy/library') return library;
    if (module.endsWith('.module.css')) return {__esModule:true,default:new Proxy({}, {get:(_,key)=>String(key)})};
    return require(module);
  };
  vm.runInNewContext(ts.transpileModule(read('../src/components/v2/gameboy-player.tsx'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop:true },
  }).outputText, {exports:component, require:componentRequire});
  for (const locale of ['es','en']) {
    language = locale;
    const html = renderToStaticMarkup(React.createElement(component.default,{onExit:()=>{}}));
    assert.match(html, locale === 'es' ? /Elige un juego/ : /Choose a game/);
    assert.equal((html.match(/data-launch-game=/g) ?? []).length,1);
    assert.match(html,/data-launch-game="pokemon-gold"/);
    assert.doesNotMatch(html,/<iframe|<details|GAME BOY|DOT MATRIX|GOLD EDITION|PHONES|id="game-save-menu"/);
  }
});

function harness({ standalone = false, native, mirror, imported, captureFails = false } = {}) {
  const events = []; const messages = []; const listeners = new Map();
  const intervals = new Map(); let intervalId = 0; const appended = []; const restored = [];
  const local = new Map();
  if (mirror) local.set('monsite.gold.cartridge.v1', JSON.stringify(mirror));
  if (imported) local.set('monsite.gold.cartridge.v1.restore', JSON.stringify(imported));
  const parent = { postMessage: (message, origin) => messages.push({...message,origin}) };
  const document = {
    querySelectorAll: () => Object.values(context.EJS_Buttons).filter(button => button?.displayName).map(button => ({
      textContent: button.displayName,
      closest: () => ({click() {
        button.callback?.();
        if (button.displayName === 'gold-save') void context.EJS_onSaveSave({save: new Uint8Array(32768)});
        if (button.displayName === 'gold-snapshot') context.EJS_onSaveState({state: new Uint8Array(180000)});
      }}),
    })),
    getElementById: id => { assert.equal(id,'game'); return { dispatchEvent: event => events.push(event) }; },
    addEventListener: (type, fn) => listeners.set('document:' + type, fn),
    dispatchEvent: event => events.push(event),
    createElement: type => ({tagName:type}),
    body: {appendChild: element => appended.push(element)},
  };
  const context = vm.createContext({
    document, parent, location:{origin:'http://localhost:3000'},
    localStorage:{getItem:key=>local.get(key)??null,setItem:(key,value)=>local.set(key,value),removeItem:key=>local.delete(key)},
    addEventListener:(type,fn)=>listeners.set(type,fn),
    setInterval:fn=>{intervals.set(++intervalId,fn);return intervalId;},clearInterval:id=>intervals.delete(id),
    KeyboardEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}},
    MouseEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}},
    SAVE_KEY:'monsite.gold.cartridge.v1',
    encode: bytes=>Buffer.from(bytes).toString('base64'),
    captureCartridge: async () => { if (captureFails) throw new Error('RTC unavailable'); return backup(); },
    createCartridgeBackup: cartridgeModule.createCartridgeBackup,
    restoreCartridge: async value => restored.push(value),
    readCartridge: async () => native ?? {},
    Uint8Array, console,
  });
  context.window = context;
  if (standalone) context.parent = context;
  vm.runInContext(read('../public/gameboy/bridge.js').replace(/^import[^\n]+\n/, ''), context);
  const message = (data, source=parent, origin='http://localhost:3000') => listeners.get('message')({source,origin,data:{channel:'gold-host',...data}});
  return {context,events,messages,intervals,appended,restored,local,message,listeners};
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('casing preferences accept the four designs and recover from old or invalid settings', () => {
  for (const casing of ['classic', 'transparent', 'green', 'red']) assert.equal(parseGameBoyCase(casing), casing);
  for (const invalid of [null, undefined, 'purple', '', {}, 1]) assert.equal(parseGameBoyCase(invalid), 'classic');
});

function fullscreenHost({ unavailable = false, rejected = false, deferred = false, existing = null } = {}) {
  const callbacks = new Set(); const modes = []; let exitCount = 0, enterCount = 0, finish;
  const host = {
    fullscreenElement: existing,
    fullscreenEnabled: !unavailable,
    documentElement: {
      async requestFullscreen(options) {
        assert.equal(options.navigationUI,'hide'); enterCount++;
        if (rejected) throw new Error('Denied');
        if (deferred) await new Promise(resolve => { finish = resolve; });
        host.fullscreenElement = host.documentElement; callbacks.forEach(callback => callback());
      },
    },
    async exitFullscreen() { exitCount++; host.fullscreenElement = null; callbacks.forEach(callback => callback()); },
    addEventListener(type, callback) { assert.equal(type,'fullscreenchange'); callbacks.add(callback); },
    removeEventListener(type, callback) { assert.equal(type,'fullscreenchange'); callbacks.delete(callback); },
  };
  const controller = createGameFullscreen(host, mode => modes.push(mode));
  return { host, controller, modes, callbacks, finish: () => finish(), exits: () => exitCount, enters: () => enterCount };
}

test('fullscreen enters on the document root, follows browser Escape exits, and releases listeners', async () => {
  const f = fullscreenHost(); await f.controller.enter();
  assert.equal(f.host.fullscreenElement,f.host.documentElement);
  assert.deepEqual(f.modes,['immersive','native']);
  f.host.fullscreenElement = null; f.callbacks.forEach(callback => callback());
  assert.equal(f.modes.at(-1),'none');
  f.controller.dispose(); assert.equal(f.callbacks.size,0); assert.equal(f.exits(),0);
});

test('unsupported and rejected browser fullscreen keep the immersive mode usable', async () => {
  for (const options of [{unavailable:true}, {rejected:true}]) {
    const f = fullscreenHost(options); await f.controller.enter();
    assert.equal(f.modes.at(-1),'immersive');
    await f.controller.leave(); assert.equal(f.modes.at(-1),'none');
    f.controller.dispose(); assert.equal(f.callbacks.size,0);
  }
});

test('teardown releases owned fullscreen and never exits someone else’s fullscreen session', async () => {
  const owned = fullscreenHost(); await owned.controller.enter(); owned.controller.dispose(); await settle();
  assert.equal(owned.exits(),1); assert.equal(owned.host.fullscreenElement,null);
  const foreign = fullscreenHost({existing:{}}); await foreign.controller.enter();
  await foreign.controller.leave(); foreign.controller.dispose();
  assert.equal(foreign.enters(),0); assert.equal(foreign.exits(),0);
});

test('an in-flight fullscreen request is cleaned up after exiting or unmounting', async () => {
  for (const dispose of [true,false]) {
    const f = fullscreenHost({deferred:true}); const entering = f.controller.enter();
    if (dispose) f.controller.dispose(); else await f.controller.leave();
    f.finish(); await entering;
    assert.equal(f.host.fullscreenElement,null); assert.equal(f.exits(),1);
    assert.equal(f.modes.includes('native'),false);
    f.controller.dispose();
  }
});

test('standalone navigation does not start the game; embedded boot creates exactly one loader', async () => {
  const standalone = harness({standalone:true}); await settle(); assert.equal(standalone.appended.length,0);
  const embedded = harness(); await settle();
  assert.equal(embedded.appended.length,1);
  assert.equal(embedded.appended[0].src,'/emulatorjs/4.2.3/data/loader.js');
  assert.equal(embedded.context.EJS_gameUrl,'/games/pokemon-gold.gbc');
  assert.equal(embedded.context.EJS_threads,false);
  assert.equal(embedded.context.EJS_defaultOptions['save-save-interval'],'0');
});

test('native saves win over stale mirrors; explicit imports restore before loading the engine', async () => {
  const ordinary = harness({native:{sram:new Uint8Array(32768)},mirror:backup()});
  await settle(); assert.equal(ordinary.restored.length,0);
  const fallback = harness({mirror:backup()}); await settle(); assert.equal(fallback.restored.length,1);
  const importing = harness({native:{sram:new Uint8Array(32768)}, imported:backup()});
  await settle(); assert.equal(importing.restored.length,1); assert.equal(importing.appended.length,1);
  assert.equal(importing.local.has('monsite.gold.cartridge.v1.restore'),false);
});

test('input waits for ready, rejects foreign messages, ignores duplicate presses, releases on blur', async () => {
  const h = harness(); await settle();
  h.message({type:'key',key:'x',down:true}); assert.equal(h.events.length,0);
  h.context.EJS_onGameStart();
  h.context.EJS_onGameStart();
  assert.equal(h.intervals.size,1);
  h.message({type:'key',key:'x',down:true},{},'http://localhost:3000');
  h.message({type:'key',key:'x',down:true},undefined,'https://other.test');
  assert.equal(h.events.length,0);
  h.message({type:'key',key:'x',down:true}); h.message({type:'key',key:'x',down:true});
  assert.equal(h.events.length,1); assert.equal(h.events[0].keyCode,88);
  h.listeners.get('blur')(); assert.equal(h.events.length,2); assert.equal(h.events[1].type,'keyup');
  h.message({type:'pause',value:true});
  h.message({type:'key',key:'z',down:true}); assert.equal(h.events.length,2);
  h.message({type:'pause',value:false}); h.message({type:'key',key:'z',down:true}); assert.equal(h.events.length,3);
});

test('exit mutes, releases input, persists cartridge/RTC, stops autosave and acknowledges teardown', async () => {
  const h = harness(); await settle(); h.context.EJS_onGameStart();
  h.message({type:'key',key:'ArrowUp',down:true});
  assert.equal(h.intervals.size,1);
  h.message({type:'stop'}); await settle();
  assert.equal(h.intervals.size,0);
  assert.equal(h.events.at(-1).type,'keyup');
  assert.ok(h.messages.some(message=>message.type==='stopped'));
  const saved = JSON.parse(h.local.get('monsite.gold.cartridge.v1'));
  assert.equal(Buffer.from(saved.rtc,'base64').length,8);
  h.message({type:'key',key:'x',down:true}); assert.equal(h.events.length,2);
});

test('exports requested during an autosave are delivered; large instant states avoid spread overflow', async () => {
  const h = harness(); await settle(); h.context.EJS_onGameStart();
  h.message({type:'save'}); h.message({type:'export'}); await settle();
  assert.equal(h.messages.filter(message=>message.type==='backup').length,1);
  h.message({type:'snapshot'});
  assert.equal(Buffer.from(h.messages.find(message=>message.type==='snapshot').encoded,'base64').length,180000);
});

test('manual export still returns the real cartridge SRAM when browser/RTC persistence fails', async () => {
  const h = harness({captureFails:true}); await settle(); h.context.EJS_onGameStart();
  h.message({type:'export'}); await settle();
  const exported = h.messages.find(message=>message.type==='backup');
  assert.ok(exported);
  const value = parseGoldBackup(exported.backup);
  assert.equal(value.rtc,undefined);
  assert.deepEqual(Buffer.from(value.sram,'base64'),Buffer.alloc(32768));
  assert.ok(h.messages.some(message=>message.type==='storage-error'));
});

test('cartridge backups never invent clock data and remain valid with or without an RTC', () => {
  const sram = new Uint8Array(32768);
  const full = cartridgeModule.createCartridgeBackup(sram,new Uint8Array(8));
  const partial = cartridgeModule.createCartridgeBackup(sram);
  assert.equal(Buffer.from(parseGoldBackup(JSON.stringify(full)).rtc,'base64').length,8);
  assert.equal(parseGoldBackup(JSON.stringify(partial)).rtc,undefined);
  assert.throws(()=>cartridgeModule.createCartridgeBackup(new Uint8Array(2)));
  assert.throws(()=>cartridgeModule.createCartridgeBackup(sram,new Uint8Array(7)));
});

test('cartridge codec handles large binary buffers without changing bytes', async () => {
  const source = read('../public/gameboy/cartridge.js');
  const {encode,decode} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const data = Uint8Array.from({length:200000},(_,i)=>i%256);
  assert.deepEqual(decode(encode(data)),data);
});

const gameBoySite = {};
vm.runInNewContext(ts.transpileModule(read('../src/lib/gameboy/site.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: gameBoySite });

test('the GBA subdomain routes only its root to the standalone console and keeps asset URLs intact', async () => {
  const config = {};
  vm.runInNewContext(ts.transpileModule(read('../next.config.ts'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports: config, process:{cwd:()=>'/project'}, require: name => {
    assert.equal(name, './src/lib/gameboy/site');return gameBoySite;
  } });
  const { matchHas } = require('next/dist/shared/lib/router/utils/prepare-destination');
  const { getPathMatch } = require('next/dist/shared/lib/router/utils/path-match');
  const rules = (await config.default.rewrites()).beforeFiles;
  const route = (host, path) => rules.find(rule => getPathMatch(rule.source)(path) &&
    matchHas({ headers:{host}, cookies:{} }, {}, rule.has))?.destination;
  for (const host of ['gba.alexisrs.dev', 'gba.alexisrs.dev:3000']) {
    assert.equal(gameBoySite.isGameBoyHost(host), true);
    assert.equal(route(host, '/'), '/gba');
    for (const path of ['/gba','/gameboy/frame.html','/emulatorjs/4.2.3/data/loader.js','/_next/static/chunk.js']) {
      assert.equal(route(host,path), undefined);
    }
  }
  for (const host of ['alexisrs.dev','www.alexisrs.dev','localhost:3000','gbaXalexisrsXdev','gba.alexisrs.dev.example.com']) {
    assert.equal(gameBoySite.isGameBoyHost(host),false);
    assert.equal(route(host,'/'),undefined);
  }
  assert.equal(gameBoySite.isGameBoyHost(null),false);
});

test('the GBA host serves only the console and redirects every other page to its root', () => {
  const { resolveGameBoyRedirect } = gameBoySite;
  for (const host of ['gba.alexisrs.dev', 'gba.alexisrs.dev:3000']) {
    assert.equal(resolveGameBoyRedirect(host, '/'), null);
    assert.equal(resolveGameBoyRedirect(host, '/gba'), null);
    for (const path of ['/blog', '/historia', '/weddings/cindy-jorge', '/es', '/en']) {
      assert.equal(resolveGameBoyRedirect(host, path), '/');
    }
    for (const path of ['/api/save', '/_next/static/chunk.js', '/gameboy/frame.html']) {
      assert.equal(resolveGameBoyRedirect(host, path), null);
    }
  }
  for (const host of ['alexisrs.dev', 'www.alexisrs.dev', null, undefined]) {
    assert.equal(resolveGameBoyRedirect(host, '/blog'), null);
    assert.equal(resolveGameBoyRedirect(host, '/'), null);
  }
});

test('the middleware redirects non-console GBA pages to the subdomain root', () => {
  const redirected = [];
  const NextResponse = {
    next: () => ({ action: 'next' }),
    redirect: url => { redirected.push(url.pathname + url.search); return { action: 'redirect' }; },
  };
  const middlewareModule = {};
  const request = (host, pathname) => ({
    headers: { get: name => (name === 'host' ? host : null) },
    nextUrl: { pathname, clone() { return { pathname, search: '?ref=portfolio' }; } },
  });
  vm.runInNewContext(ts.transpileModule(read('../src/middleware.ts'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports: middlewareModule, require: name => {
    if (name === 'next/server') return { NextResponse };
    if (name === './lib/gameboy/site') return gameBoySite;
    return require(name);
  } });
  assert.equal(middlewareModule.middleware(request('gba.alexisrs.dev', '/blog')).action, 'redirect');
  assert.deepEqual(redirected, ['/']);
  assert.equal(middlewareModule.middleware(request('gba.alexisrs.dev', '/')).action, 'next');
  assert.equal(middlewareModule.middleware(request('gba.alexisrs.dev', '/gba')).action, 'next');
  assert.equal(middlewareModule.middleware(request('alexisrs.dev', '/blog')).action, 'next');
  assert.ok(Array.isArray(middlewareModule.config.matcher) && middlewareModule.config.matcher.length > 0);
});

test('the standalone console has its own canonical URL and localized metadata', async () => {
  const page = {};let language='es';
  vm.runInNewContext(ts.transpileModule(read('../src/app/gba/page.tsx'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports:page, URL, require:name=>{
    if(name==='@/components/v2/gameboy-site')return {default:()=>null};
    if(name==='@/lib/gameboy/site')return gameBoySite;
    if(name==='@/lib/request-language')return {getRequestLanguage:async()=>language};
    return require(name);
  } });
  for (language of ['es','en']) {
    const metadata=await page.generateMetadata();
    assert.equal(metadata.alternates.canonical,'https://gba.alexisrs.dev');
    assert.equal(metadata.metadataBase.origin,'https://gba.alexisrs.dev');
    assert.equal(metadata.title.absolute,'Game Boy · Alexis Reyna');
    assert.equal(metadata.openGraph.locale,language==='es'?'es_MX':'en_US');
    assert.match(metadata.description,language==='es'?/Juega/:/Play/);
  }
});

test('the standalone route and rewritten subdomain hide portfolio chrome while the portfolio root retains it', () => {
  const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
  const chrome={};let pathname='/';
  vm.runInNewContext(ts.transpileModule(read('../src/components/app-chrome.tsx'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},
  }).outputText, {exports:chrome,require:name=>{
    if(name==='next/navigation')return {usePathname:()=>pathname};
    if(name==='@/components/v2/navbar-v2')return {default:()=>React.createElement('nav',null,'portfolio-navbar')};
    if(name==='@/components/language-switcher')return {default:()=>null};
    return require(name);
  }});
  const render=hideChrome=>renderToStaticMarkup(React.createElement(chrome.default,{hideChrome},'console'));
  assert.match(render(false),/portfolio-navbar/);
  assert.doesNotMatch(render(true),/portfolio-navbar/);
  pathname='/gba';assert.doesNotMatch(render(false),/portfolio-navbar/);
});
