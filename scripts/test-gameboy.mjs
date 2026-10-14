import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash, webcrypto } from 'node:crypto';
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
const gameBoySite = {};
vm.runInNewContext(ts.transpileModule(read('../src/lib/gameboy/site.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: gameBoySite });
const library = {};
vm.runInNewContext(ts.transpileModule(read('../src/lib/gameboy/library.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: library });
const localRom = {};
vm.runInNewContext(ts.transpileModule(read('../src/lib/gameboy/local-rom.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: localRom, crypto: webcrypto, require: name => { assert.equal(name, './library'); return library; } });
const cartridgeModule = await import('../public/gameboy/cartridge.js');
const backups = await import('../public/gameboy/backups.js');
const backup = () => ({ format: 'monsite-gold-cartridge', version: 1, rom: GOLD_ROM_SHA256,
  savedAt: '2026-10-13T12:00:00.000Z', sram: Buffer.alloc(32768, 0x42).toString('base64'), rtc: Buffer.alloc(8, 0x12).toString('base64') });

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
    for (const path of ['/gba','/gameboy/frame.html','/games/pokemon-gold.gbc','/games/doom.gba','/emulatorjs/4.2.3/data/loader.js','/_next/static/chunk.js']) {
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
    for (const path of ['/api/save', '/_next/static/chunk.js', '/gameboy/frame.html', '/games/doom.gba']) {
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

test('the initial console offers fullscreen and bundled Gold and Doom without booting a ROM', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  let language = 'es';
  const component = {};
  const componentRequire = module => {
    if (module === '@/components/lang-context') return {useLanguage: () => ({language})};
    if (module === '@/lib/gameboy/save') return exports;
    if (module === '@/lib/gameboy/presentation') return presentation;
    if (module === '@/lib/gameboy/library') return library;
    if (module === '@/lib/gameboy/local-rom') return localRom;
    if (module.endsWith('/public/gameboy/backups.js')) return backups;
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
    assert.equal((html.match(/data-launch-game=/g) ?? []).length,library.GAME_LIBRARY.length);
    assert.match(html,/data-launch-game="pokemon-gold"/);
    assert.match(html,new RegExp(`data-launch-game="rom-${library.DOOM_ROM_SHA256}"`));
    assert.match(html,/Doom/);
    assert.match(html, locale === 'es' ? /Abrir ROM/ : /Open ROM/);
    assert.match(html, /type="file" accept="\.gb,\.gbc,\.dmg,\.gba"/);
    const fullscreenButton = html.match(/<button\b[^>]*aria-label="(?:Pantalla completa|Fullscreen)"[^>]*>/)?.[0];
    assert.ok(fullscreenButton, 'fullscreen is available before selecting a game');
    assert.doesNotMatch(fullscreenButton, /\bdisabled=/);
    assert.doesNotMatch(html,/<iframe|<details|GAME BOY|DOT MATRIX|GOLD EDITION|PHONES|id="game-save-menu"/);
  }
});

test('local ROMs retain content identity across filenames, support all GB extensions, and reject bad files before reading', async () => {
  const bytes = readFileSync(new URL('../public/games/pokemon-gold.gbc', import.meta.url));
  const file = name => ({name, size:bytes.length, arrayBuffer:async()=>Uint8Array.from(bytes).buffer});
  for (const name of ['Gold.gb', 'Renamed.GBC', 'Homebrew.dmg']) {
    const game = await localRom.identifyLocalRom(file(name));
    assert.equal(game.id, 'rom-' + GOLD_ROM_SHA256);
    assert.equal(game.title, name.replace(/\.(gb|gbc|dmg)$/i,''));
  }
  const different = Uint8Array.from(bytes); different[0] ^= 1;
  const other = await localRom.identifyLocalRom({...file('Gold.gb'),arrayBuffer:async()=>different.buffer});
  assert.notEqual(other.id, 'rom-' + GOLD_ROM_SHA256);
  for (const [change, reason] of [[{name:'Gold.zip'},'format'], [{size:0},'size'], [{size:8388609},'size']]) {
    await assert.rejects(localRom.identifyLocalRom({...file('Gold.gb'),...change,arrayBuffer:()=>{throw new Error('Must not read');}}), error => error.reason === reason);
  }
  await assert.rejects(localRom.identifyLocalRom({...file('Gold.gb'),arrayBuffer:async()=>new ArrayBuffer(1)}), error=>error.reason==='read');
});

function harness({ standalone = false, native, mirror, imported, captureFails = false, localGame = false, sramBytes = 32768, flushFails = false, flushWait, session, restoreFails = false } = {}) {
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
        if (button.displayName === 'gold-save') void context.EJS_onSaveSave({save: new Uint8Array(sramBytes)});
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
    document, parent, location:{origin:'http://localhost:3000',search:(localGame?'?local=1':'?') + (session ? '&session=' + session : '')}, URLSearchParams,
    localStorage:{getItem:key=>local.get(key)??null,setItem:(key,value)=>local.set(key,value),removeItem:key=>local.delete(key)},
    addEventListener:(type,fn)=>listeners.set(type,fn),
    setInterval:fn=>{intervals.set(++intervalId,fn);return intervalId;},clearInterval:id=>intervals.delete(id),
    KeyboardEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}},
    MouseEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}},
    ...backups, ROM: GOLD_ROM_SHA256, SAVE_KEY:'monsite.gold.cartridge.v1',
    decode: encoded => Uint8Array.from(Buffer.from(encoded, 'base64')),
    encode: bytes=>Buffer.from(bytes).toString('base64'),
    captureCartridge: async () => { if (captureFails) throw new Error('RTC unavailable'); return backup(); },
    createCartridgeBackup: cartridgeModule.createCartridgeBackup,
    restoreCartridge: async value => restored.push(value),
    readCartridge: async () => native ?? {},
    captureGameCartridge: async (bytes, name, identity) => { if (flushWait) await flushWait; if (flushFails) throw new Error('Save unavailable'); return cartridgeModule.createGameCartridgeBackup(bytes, native?.rtc, identity); },
    createGameCartridgeBackup: cartridgeModule.createGameCartridgeBackup,
    restoreGameCartridge: async (value, name, identity) => { if (restoreFails) throw new Error('Restore failed'); restored.push({value,name,identity}); },
    Uint8Array, console,
  });
  context.window = context;
  if (standalone) context.parent = context;
  vm.runInContext(read('../public/gameboy/bridge.js').replace(/^import[^\n]+\n/gm, ''), context);
  const message = (data, source=parent, origin='http://localhost:3000') => listeners.get('message')({source,origin,data:{channel:'gold-host',...data}});
  return {context,events,messages,intervals,appended,restored,local,message,listeners};
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('a local player waits for an authenticated ROM configuration, boots once, and isolates its save identity', async () => {
  const h = harness({localGame:true,mirror:backup(),imported:backup()}); await settle();
  assert.equal(h.appended.length,0);
  const config = {type:'load-rom',url:'blob:http://localhost:3000/local-game',id:'rom-'+'a'.repeat(64)};
  h.message(config,{}); h.message(config,undefined,'https://foreign.test');
  h.message({...config,url:'https://foreign.test/game.gbc'});
  h.message({...config,url:'blob:https://foreign.test/game'});
  h.message({...config,id:'pokemon-gold'});
  await settle(); assert.equal(h.appended.length,0);
  h.message(config); await settle();
  assert.equal(h.appended.length,1);
  assert.equal(h.context.EJS_gameUrl,config.url);
  assert.equal(h.context.EJS_gameName,config.id);
  assert.equal(h.context.EJS_gameID,Number.parseInt('a'.repeat(12),16));
  assert.equal(h.context.EJS_core,'gambatte');
  assert.equal(h.context.EJS_threads,false);
  assert.equal(h.restored.length,0);
  assert.ok(h.local.has('monsite.gold.cartridge.v1.restore'));
  h.message({...config,url:'blob:http://localhost:3000/another',id:'rom-'+'b'.repeat(64)});
  await settle(); assert.equal(h.appended.length,1); assert.equal(h.context.EJS_gameUrl,config.url);
  const gold = harness(); await settle(); gold.message(config);
  assert.equal(gold.context.EJS_gameUrl,'/games/pokemon-gold.gbc');
  const standalone = harness({localGame:true,standalone:true}); await settle();
  assert.equal(standalone.appended.length,0);
});

test('local cartridges export their actual SRAM size and stop cleanly without writing Gold backups', async () => {
  for (const sramBytes of [0,512,8192,32768,131072]) {
    const h = harness({localGame:true,sramBytes,mirror:backup(),captureFails:true});
    h.message({type:'load-rom',url:'blob:http://localhost:3000/local-game',id:'rom-'+'c'.repeat(64)});
    await settle(); h.context.EJS_onGameStart();
    h.message({type:'export'}); await settle();
    const data = h.messages.find(message=>message.type==='game-backup');
    assert.ok(data); assert.equal(Buffer.from(JSON.parse(data.backup).sram,'base64').length,sramBytes);
    assert.equal(h.messages.some(message=>message.type==='backup'||message.type==='storage-error'),false);
    assert.equal(h.local.get('monsite.gold.cartridge.v1'),JSON.stringify(backup()));
    h.message({type:'stop'}); await settle();
    assert.equal(h.intervals.size,0);
    assert.ok(h.messages.some(message=>message.type==='stopped'));
    assert.equal(h.messages.some(message=>message.type==='error'),false);
  }
});

test('local exit waits for the native save flush; a storage failure still allows manual export', async () => {
  let finish;
  const flushWait = new Promise(resolve => { finish = resolve; });
  const h = harness({localGame:true,flushWait});
  const config = {type:'load-rom',url:'blob:http://localhost:3000/local-game',id:'rom-'+'d'.repeat(64)};
  h.message(config); await settle(); h.context.EJS_onGameStart();
  h.message({type:'stop'}); await settle();
  assert.equal(h.messages.some(message=>message.type==='stopped'),false);
  finish(); await settle();
  assert.ok(h.messages.some(message=>message.type==='stopped'));
  const failed = harness({localGame:true,flushFails:true,sramBytes:8192});
  failed.message(config); await settle(); failed.context.EJS_onGameStart();
  failed.message({type:'export'}); await settle();
  assert.ok(failed.messages.some(message=>message.type==='storage-error'));
  assert.equal(Buffer.from(JSON.parse(failed.messages.find(message=>message.type==='game-backup').backup).sram,'base64').length,8192);
});

test('native cartridge reads and flushes use the local ROM path, including carts without an RTC', async () => {
  const previous = globalThis.indexedDB;
  const id = 'rom-'+'e'.repeat(64);
  const sram = new Uint8Array(8192);
  const reads = [];
  globalThis.indexedDB = {open(name, version) {
    assert.equal(name,'/data/saves'); assert.equal(version,21);
    const request = {result:{
      close() {},
      transaction(store, mode) {
        assert.equal(store,'FILE_DATA'); assert.equal(mode,'readonly');
        const transaction = {objectStore() { return {get(path) {
          reads.push(path);
          return {result:path === `/data/saves/${id}.srm` ? {contents:sram} : undefined};
        }}; }};
        queueMicrotask(()=>transaction.oncomplete());
        return transaction;
      },
    }};
    queueMicrotask(()=>request.onsuccess());
    return request;
  }};
  try {
    const files = await cartridgeModule.readCartridge(id);
    assert.equal(files.sram,sram); assert.equal(files.rtc,undefined);
    await cartridgeModule.flushLocalCartridge(sram,id);
    assert.deepEqual(reads,[`/data/saves/${id}.srm`,`/data/saves/${id}.rtc`,`/data/saves/${id}.srm`,`/data/saves/${id}.rtc`]);
    await assert.rejects(cartridgeModule.readCartridge('../pokemon-gold'));
  } finally { globalThis.indexedDB = previous; }
});

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
  assert.equal(Buffer.from(JSON.parse(h.messages.find(message=>message.type==='snapshot').backup).state,'base64').length,180000);
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
  const {encode,decode} = cartridgeModule;
  const data = Uint8Array.from({length:200000},(_,i)=>i%256);
  assert.deepEqual(decode(encode(data)),data);
});

const gbaIdentity = { sha256: 'f'.repeat(64), core: 'mgba', platform: 'gba' };
const gbaConfig = { type: 'load-rom', url: 'blob:http://localhost:3000/gba-game', id: 'rom-' + gbaIdentity.sha256, platform: 'gba', sha256: gbaIdentity.sha256 };

test('GBA ROMs use mGBA, a separate size limit, and filename-independent identity', async () => {
  const bytes = new Uint8Array(16 * 1024);
  const file = name => ({ name, size: bytes.length, arrayBuffer: async () => bytes.buffer });
  const a = await localRom.identifyLocalRom(file('Doom.GBA'));
  const b = await localRom.identifyLocalRom(file('renamed.gba'));
  assert.equal(a.id, b.id); assert.equal(a.core, 'mgba'); assert.equal(a.platform, 'gba');
  assert.equal(a.title, 'Doom'); assert.equal(a.source, 'local');
  let readCalled = false;
  await assert.rejects(localRom.identifyLocalRom({ name:'huge.gba', size:33554433, arrayBuffer:async()=>{readCalled=true;} }), e=>e.reason==='size');
  assert.equal(readCalled,false);
  assert.equal(exports.GBA_KEYS.KeyA,'a'); assert.equal(exports.GBA_KEYS.KeyS,'s');
  assert.equal(exports.GAME_KEYS.KeyA,undefined);
});

test('GBA session waits for authenticated configuration and exposes L/R only on mGBA', async () => {
  const h = harness({session:'session-1'}); await settle(); assert.equal(h.appended.length,0);
  h.message({...gbaConfig,session:'old-session'}); await settle(); assert.equal(h.appended.length,0);
  h.message({...gbaConfig,session:'session-1'}); await settle(); assert.equal(h.appended.length,1);
  assert.equal(h.context.EJS_core,'mgba'); assert.equal(h.context.EJS_controlScheme,'gba');
  assert.equal(h.context.EJS_defaultControls[0][10].value,'a');
  assert.equal(h.context.EJS_defaultControls[0][11].value,'s');
  h.context.EJS_onGameStart(); h.message({type:'key',key:'a',down:true,session:'old-session'});
  assert.equal(h.events.length,0);
  h.message({type:'key',key:'a',down:true,session:'session-1'});
  h.message({type:'key',key:'s',down:true,session:'session-1'});
  assert.deepEqual(h.events.map(e=>e.keyCode),[65,83]);
  assert.ok(h.messages.every(m=>m.session==='session-1'));
});

test('catalog GBA uses the same content identity as its local ROM and rejects unsafe paths', async () => {
  const h = harness({session:'catalog'});
  for (const url of ['https://foreign/game.gba', '/games/../private.gba', '/other/game.gba']) {
    h.message({...gbaConfig,url,session:'catalog'});
  }
  await settle(); assert.equal(h.appended.length,0);
  h.message({...gbaConfig,url:'/games/doom.gba',session:'catalog'});
  await settle(); assert.equal(h.appended.length,1);
  assert.equal(h.context.EJS_gameName,gbaConfig.id);
});

test('generic cartridge backups validate ROM/core/platform, bounded data, and optional clock', () => {
  for (const size of [0,512,8192,65536,131072,131088]) {
    const value = cartridgeModule.createGameCartridgeBackup(new Uint8Array(size),new Uint8Array(16),gbaIdentity);
    assert.equal(backups.encodedSize(backups.parseGameBackup(JSON.stringify(value),gbaIdentity).sram),size);
    for (const change of [{rom:'a'.repeat(64)},{core:'gambatte'},{platform:'gb'},{sram:'!!=='},{version:2},{rtc:''}]) {
      assert.throws(()=>backups.parseGameBackup(JSON.stringify({...value,...change}),gbaIdentity));
    }
  }
  assert.throws(()=>backups.parseGameBackup('null'));
  assert.throws(()=>backups.parseGameBackup(' '.repeat(backups.GAME_BACKUP_LIMIT+1)));
  assert.throws(()=>cartridgeModule.createGameCartridgeBackup(new Uint8Array(backups.MAX_SRAM_BYTES+1),undefined,gbaIdentity));
  const noClock = cartridgeModule.createGameCartridgeBackup(new Uint8Array(512),undefined,gbaIdentity);
  assert.equal(noClock.rtc,undefined);
});

test('state envelopes reject other ROMs, other runtime versions, malformed base64, and oversized states', () => {
  const value = {format:'monsite-game-state',version:1,rom:gbaIdentity.sha256,platform:'gba',core:'mgba',runtime:backups.CORE_RUNTIMES.mgba,savedAt:new Date().toISOString(),state:'AAAA'};
  assert.equal(backups.parseStateBackup(JSON.stringify(value),gbaIdentity).state,'AAAA');
  for (const change of [{rom:'a'.repeat(64)},{runtime:'another-version'},{state:''},{state:'Y=AA'},{state:'===='},{core:'gambatte'}]) {
    assert.throws(()=>backups.parseStateBackup(JSON.stringify({...value,...change}),gbaIdentity));
  }
  assert.throws(()=>backups.parseStateBackup(JSON.stringify({...value,state:Buffer.alloc(backups.MAX_STATE_BYTES+1).toString('base64')}),gbaIdentity));
  assert.equal(backups.encodedSize(Buffer.alloc(backups.MAX_STATE_BYTES).toString('base64')),backups.MAX_STATE_BYTES);
});

test('GBA save failure keeps the stopped engine available for backup and never acknowledges success', async () => {
  const h = harness({localGame:true,flushFails:true}); h.message(gbaConfig); await settle(); h.context.EJS_onGameStart();
  h.message({type:'stop'}); await settle();
  assert.ok(h.messages.some(m=>m.type==='stop-failed')); assert.equal(h.messages.some(m=>m.type==='stopped'),false);
  h.message({type:'export'}); await settle();
  const value=JSON.parse(h.messages.find(m=>m.type==='game-backup').backup);
  assert.equal(value.partial,true); assert.equal(value.rom,gbaIdentity.sha256);
  h.message({type:'pause',value:false}); assert.equal(h.messages.at(-1).type,'paused');
});

test('GBA import restores before loading; invalid or failed restoration never starts an engine', async () => {
  const restore = cartridgeModule.createGameCartridgeBackup(new Uint8Array(512),undefined,gbaIdentity);
  const h = harness({localGame:true}); h.message({...gbaConfig,restore}); await settle();
  assert.equal(h.restored.length,1); assert.equal(h.restored[0].name,gbaConfig.id); assert.equal(h.appended.length,1);
  const bad = harness({localGame:true}); bad.message({...gbaConfig,restore:{...restore,rom:'b'.repeat(64)}}); await settle();
  assert.equal(bad.appended.length,0); assert.equal(bad.restored.length,0);
  const failed = harness({localGame:true,restoreFails:true}); failed.message({...gbaConfig,restore}); await settle();
  assert.equal(failed.appended.length,0); assert.ok(failed.messages.some(m=>m.type==='error'));
});

test('state restore uses the documented startup option and does not invent a cartridge import', async () => {
  const state = {format:'monsite-game-state',version:1,rom:gbaIdentity.sha256,platform:'gba',core:'mgba',runtime:backups.CORE_RUNTIMES.mgba,savedAt:new Date().toISOString(),state:'AAAA'};
  const h=harness({localGame:true}); h.message({...gbaConfig,state}); await settle();
  assert.deepEqual(Array.from(h.context.EJS_loadStateURL),[0,0,0]); assert.equal(h.restored.length,0);
  assert.equal(h.appended.length,1);
});

test('generic restore writes only this ROM and deletes a stale clock when the imported backup has none', async () => {
  const previous=globalThis.indexedDB;
  const records=new Map(); const writes=[];
  globalThis.indexedDB={open(){
    const transaction={objectStore(){return {
      put(record,path){writes.push(path);records.set(path,record);},
      delete(path){writes.push(path);records.delete(path);},
    };}};
    const request={result:{transaction(){queueMicrotask(()=>transaction.oncomplete());return transaction;},close(){}}};
    queueMicrotask(()=>request.onsuccess()); return request;
  }};
  try {
    records.set(`/data/saves/${gbaConfig.id}.rtc`,{contents:new Uint8Array(8)});
    const value=cartridgeModule.createGameCartridgeBackup(new Uint8Array(512),undefined,gbaIdentity);
    await cartridgeModule.restoreGameCartridge(value,gbaConfig.id,gbaIdentity);
    assert.equal(records.get(`/data/saves/${gbaConfig.id}.srm`).contents.length,512);
    assert.equal(records.has(`/data/saves/${gbaConfig.id}.rtc`),false);
    assert.ok(writes.every(path=>path.startsWith(`/data/saves/${gbaConfig.id}.`)));
    await assert.rejects(cartridgeModule.restoreGameCartridge(value,'rom-'+'a'.repeat(64),gbaIdentity));
  } finally {globalThis.indexedDB=previous;}
});

// Executes the real host handlers with deterministic React hooks and DOM
// boundaries. This verifies lifecycle contracts; it is not a browser/WASM test.
function hostHarness({language='es', mobile=false, casing='classic', themeMetas=true}={}) {
  const slots=[]; let cursor=0,dirty=true,tree,frameNode,frameSurface,exits=0,urlCounter=0;
  const messages=[],revoked=[],listeners=new Map(),timers=new Map(); let timerId=0;
  const dependenciesEqual=(a,b)=>a && b && a.length===b.length && a.every((v,i)=>Object.is(v,b[i]));
  const hooks={
    useState(initial){const i=cursor++;if(!slots[i])slots[i]={value:typeof initial==='function'?initial():initial};
      slots[i].setter??=value=>{slots[i].value=typeof value==='function'?value(slots[i].value):value;dirty=true;};
      return [slots[i].value,slots[i].setter];},
    useRef(initial){const i=cursor++;slots[i]??={current:initial};return slots[i];},
    useCallback(fn,deps){const i=cursor++;if(!dependenciesEqual(slots[i]?.deps,deps))slots[i]={fn,deps};return slots[i].fn;},
    useEffect(fn,deps){const i=cursor++;if(!dependenciesEqual(slots[i]?.deps,deps)){
      const cleanup=slots[i]?.cleanup;slots[i]={effect:fn,deps,pending:true,cleanup};
    }},
  };
  hooks.useLayoutEffect=hooks.useEffect;
  const metas=[];
  const canvasStyle=()=>{
    const properties=new Map([['--sequence-theme-color','#0e131a']]);
    return {backgroundColor:'#0e131a',getPropertyValue:key=>properties.get(key)??'',getPropertyPriority:()=>'',
      setProperty:(key,value)=>properties.set(key,value),removeProperty:key=>properties.delete(key)};
  };
  class Element {
    constructor(){this.open=false;this.isConnected=true;this.style={};this.attributes=new Map();}
    focus(){} showModal(){this.open=true;} close(){this.open=false;} click(){}
    getAttribute(key){return this.attributes.get(key)??null;} setAttribute(key,value){this.attributes.set(key,value);}
    removeAttribute(key){this.attributes.delete(key);}
    get content(){return this.getAttribute('content');} set content(value){this.setAttribute('content',value);}
    remove(){const index=metas.indexOf(this);if(index>=0)metas.splice(index,1);}
    closest(){return null;} contains(){return false;} querySelector(){return new Element();}
    addEventListener(type,fn){listeners.set('element:'+type,fn);} removeEventListener(type){listeners.delete('element:'+type);}
  }
  if(themeMetas)for(const media of ['(prefers-color-scheme: light)','(prefers-color-scheme: dark)']){
    const meta=new Element();meta.content='#0e131a';meta.setAttribute('media',media);metas.push(meta);
  }
  const document={activeElement:null,hidden:false,body:{style:{...canvasStyle(),overflow:'auto'}},documentElement:{style:canvasStyle()},fullscreenEnabled:false,
    addEventListener(type,fn){listeners.set('document:'+type,fn);},removeEventListener(type){listeners.delete('document:'+type);},
    createElement(){return new Element();},querySelectorAll:()=>metas,head:{appendChild:meta=>metas.push(meta)},
  };
  const storage=new Map([[presentation.CASE_STORAGE_KEY,casing]]);
  const localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
  const window={location:{origin:'http://localhost:3000'},localStorage,
    matchMedia:()=>mediaQuery,
    getComputedStyle:()=>({getPropertyValue:()=>({classic:'#d5d3c6',green:'#73935b',red:'#bc4e4b',transparent:'#485956'})[tree.props['data-case']]}),
    addEventListener(type,fn){listeners.set(type,fn);},removeEventListener(type){listeners.delete(type);},
    setTimeout(fn,delay){timers.set(++timerId,{fn,delay});return timerId;},clearTimeout(id){timers.delete(id);},
  };
  const mediaQuery={matches:mobile,addEventListener:(type,fn)=>listeners.set('media:'+type,fn),removeEventListener:type=>listeners.delete('media:'+type)};
  const component={};
  const componentRequire=name=>{
    if(name==='react')return hooks;
    if(name==='@/components/lang-context')return {useLanguage:()=>({language})};
    if(name==='@/lib/gameboy/save')return exports;
    if(name==='@/lib/gameboy/library')return library;
    if(name==='@/lib/gameboy/local-rom')return localRom;
    if(name==='@/lib/gameboy/presentation')return presentation;
    if(name.endsWith('/public/gameboy/backups.js'))return backups;
    if(name.endsWith('.module.css'))return {__esModule:true,default:new Proxy({}, {get:(_,key)=>String(key)})};
    return require(name);
  };
  vm.runInNewContext(ts.transpileModule(read('../src/components/v2/gameboy-player.tsx'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},
  }).outputText, {exports:component,require:componentRequire,window,document,localStorage,crypto:webcrypto,
    HTMLElement:Element,Node:Element,URL:{createObjectURL:()=>`blob:http://localhost:3000/file-${++urlCounter}`,revokeObjectURL:url=>revoked.push(url)},
    Blob,Uint8Array,btoa,atob,console});
  function walk(node,fn){if(Array.isArray(node)){node.forEach(child=>walk(child,fn));return;}if(!node?.props)return;
    fn(node);walk(node.props.children,fn);}
  const find=predicate=>{let found;walk(tree,node=>{if(!found&&predicate(node))found=node;});assert.ok(found,'Host element must exist');return found;};
  const render=()=>{
    let turns=0;
    do {
      assert.ok(++turns<10,'Host render settles');dirty=false;cursor=0;
      tree=component.default({onExit}); let nextFrame;
      walk(tree,node=>{
        if(node.type==='iframe'){
          if(frameNode?.props.src!==node.props.src||frameNode?.key!==node.key){
            frameSurface={postMessage(message){messages.push({...message,surface:frameSurface});}};
          }
          nextFrame=node;node.props.ref.current={contentWindow:frameSurface};
        }else if(node.props.ref && !node.props.ref.current)node.props.ref.current=new Element();
      });
      if(!nextFrame&&frameNode)frameNode.props.ref.current=null;
      frameNode=nextFrame;
      for(const slot of slots){if(slot?.pending){slot.pending=false;slot.cleanup?.();slot.cleanup=slot.effect();}}
    }while(dirty);
    return tree;
  };
  const onExit=()=>{exits++;};
  const receive=(data,{surface=frameSurface,origin='http://localhost:3000',session}={})=>{
    const activeSession=frameNode ? new URL(frameNode.props.src,'http://localhost:3000').searchParams.get('session') : '';
    listeners.get('message')?.({source:surface,origin,data:{channel:'gold-player',session:session??activeSession,...data}});render();
  };
  const clickLabel=label=>{find(n=>n.type==='button'&&n.props['aria-label']===label).props.onClick();render();};
  const clickText=text=>{find(n=>n.type==='button'&&n.props.children===text).props.onClick();render();};
  const load=()=>{assert.ok(frameNode);frameNode.props.onLoad();render();};
  const pick=async file=>{
    const input=find(n=>n.type==='input'&&n.props.accept===localRom.ROM_ACCEPT);
    input.props.onChange({currentTarget:{files:[file],value:file.name}});render();
    for(let round=0;!frameNode&&round<50;round++){await new Promise(resolve=>setTimeout(resolve,2));render();}
  };
  const importFile=async file=>{
    const input=find(n=>n.type==='input'&&n.props.accept.startsWith('.json'));
    input.props.onChange({currentTarget:{files:[file],value:file.name}});render();await settle();render();
  };
  const expire=delay=>{for(const [id,timer] of [...timers])if(timer.delay===delay){timers.delete(id);timer.fn();}render();};
  const unmount=()=>{for(const slot of slots)slot?.cleanup?.();};
  render();
  return {render,find,receive,clickLabel,clickText,load,pick,importFile,expire,unmount,messages,revoked,listeners,timers,
    document,metas,
    resizeMobile(matches){mediaQuery.matches=matches;listeners.get('media:change')?.();},
    get frame(){return frameNode;},get surface(){return frameSurface;},get exits(){return exits;},
    key(type,event){listeners.get(type)?.({key:'',target:null,isComposing:false,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){},...event});render();},
  };
}
const hostRom=name=>{const bytes=new Uint8Array(16384);return {name,size:bytes.length,arrayBuffer:async()=>bytes.buffer};};
const jsonFile=(name,value)=>{const text=JSON.stringify(value);return {name,size:text.length,text:async()=>text};};

test('mobile browser chrome follows stored and selected cases, fullscreen, and restores the page on exit', async () => {
  const h=hostHarness({mobile:true,casing:'green'});
  const check=color=>{
    assert.equal(h.document.documentElement.style.backgroundColor,color);
    assert.equal(h.document.body.style.backgroundColor,color);
    assert.equal(h.document.documentElement.style.getPropertyValue('--sequence-theme-color'),color);
    for(const meta of h.metas){assert.equal(meta.content,color);assert.equal(meta.getAttribute('media'),null);}
  };
  check('#73935b');
  for(const [casing,color] of [['classic','#d5d3c6'],['red','#bc4e4b'],['transparent','#485956']]){
    h.clickLabel('Carcasa');
    h.find(n=>n.type==='button'&&n.key===casing&&n.props['aria-pressed']!==undefined).props.onClick();h.render();
    check(color);
  }
  h.clickLabel('Pantalla completa');check('#000000');
  h.clickLabel('Salir de pantalla completa');await settle();h.render();check('#485956');
  h.unmount();
  assert.equal(h.document.documentElement.style.backgroundColor,'#0e131a');
  assert.equal(h.document.body.style.backgroundColor,'#0e131a');
  assert.equal(h.document.documentElement.style.getPropertyValue('--sequence-theme-color'),'#0e131a');
  assert.deepEqual(h.metas.map(meta=>[meta.content,meta.getAttribute('media')]),[
    ['#0e131a','(prefers-color-scheme: light)'],['#0e131a','(prefers-color-scheme: dark)'],
  ]);
  assert.equal(h.listeners.has('media:change'),false);
});

test('desktop chrome stays unchanged and temporary mobile theme metadata is removed on resize or exit', () => {
  const h=hostHarness({themeMetas:false});
  assert.equal(h.metas.length,0);
  assert.equal(h.document.documentElement.style.backgroundColor,'#0e131a');
  h.resizeMobile(true);
  assert.equal(h.metas.length,1);assert.equal(h.metas[0].content,'#d5d3c6');
  h.resizeMobile(false);
  assert.equal(h.metas.length,0);assert.equal(h.document.documentElement.style.backgroundColor,'#0e131a');
  h.resizeMobile(true);h.unmount();
  assert.equal(h.metas.length,0);assert.equal(h.document.documentElement.style.backgroundColor,'#0e131a');
});

test('host keeps the library idle, authenticates Gold startup, and returns only after save acknowledgement', () => {
  const h=hostHarness();assert.equal(h.frame,undefined);assert.equal(h.messages.length,0);
  h.find(n=>n.props['data-launch-game']==='pokemon-gold').props.onClick();h.render();h.load();
  const config=h.messages.find(m=>m.type==='load-rom');assert.equal(config.platform,'gbc');assert.equal(config.saveMode,'gold');
  h.receive({type:'ready'},{session:'previous'});assert.equal(h.find(n=>n.props['aria-label']==='Pausar').props.disabled,true);
  h.receive({type:'ready'});assert.equal(h.find(n=>n.props['aria-label']==='Pausar').props.disabled,false);
  const oldSurface=h.surface;h.clickLabel('Volver a juegos');assert.ok(h.frame);assert.equal(h.exits,0);
  h.receive({type:'stopped'});assert.equal(h.frame,undefined);assert.equal(h.exits,0);
  h.receive({type:'ready'},{surface:oldSurface});assert.equal(h.frame,undefined);
  h.unmount();assert.equal(h.listeners.size,0);assert.equal(h.timers.size,0);
});

test('host local GBA exposes L/R and aggregates simultaneous pointer and keyboard presses', async () => {
  const h=hostHarness();await h.pick(hostRom('doom.gba'));h.load();h.receive({type:'ready'});
  const left=h.find(n=>n.props['data-key']==='a');assert.equal(left.props['aria-label'],'L');
  const buttonTarget={setPointerCapture(){},hasPointerCapture(){return false;}};
  left.props.onPointerDown({preventDefault(){},currentTarget:buttonTarget,pointerId:1});
  h.key('keydown',{code:'KeyA',key:'a'});
  let keys=h.messages.filter(m=>m.type==='key');assert.equal(keys.length,1);assert.equal(keys[0].down,true);
  left.props.onPointerUp({currentTarget:buttonTarget,pointerId:1});
  keys=h.messages.filter(m=>m.type==='key');assert.equal(keys.length,1);
  h.key('keyup',{code:'KeyA',key:'a'});keys=h.messages.filter(m=>m.type==='key');assert.equal(keys.length,2);assert.equal(keys[1].down,false);
  h.unmount();assert.equal(h.revoked.length,1);
});

test('host failed or timed-out saves keep the frame alive until an explicit choice', async () => {
  for(const failure of ['stop-failed','timeout']){
    const h=hostHarness();await h.pick(hostRom('game.gba'));h.load();h.receive({type:'ready'});const surface=h.surface;
    h.clickLabel('Volver a juegos');if(failure==='timeout')h.expire(5000);else h.receive({type:'stop-failed'});
    assert.equal(h.surface,surface);assert.equal(h.exits,0);
    h.clickText('Continuar sin conservar la partida');assert.equal(h.frame,undefined);assert.equal(h.revoked.length,1);
    h.unmount();
  }
});

test('host retry regenerates consumed local URLs and rejects old session notifications', async () => {
  const h=hostHarness();await h.pick(hostRom('game.gba'));h.load();
  const original=h.messages.find(m=>m.type==='load-rom');const originalSurface=h.surface;
  h.receive({type:'error'});h.clickText('Reintentar');h.load();
  const configs=h.messages.filter(m=>m.type==='load-rom');assert.equal(configs.length,2);
  assert.notEqual(configs[0].url,configs[1].url);assert.notEqual(configs[0].session,configs[1].session);
  h.receive({type:'ready'},{surface:originalSurface,session:original.session});
  assert.equal(h.find(n=>n.props['aria-label']==='Pausar').props.disabled,true);
  h.receive({type:'ready'});assert.equal(h.find(n=>n.props['aria-label']==='Pausar').props.disabled,false);
  h.unmount();
});

test('host import requires an explicit restore and waits for the old save before configuring the new frame', async () => {
  const h=hostHarness();await h.pick(hostRom('game.gba'));h.load();h.receive({type:'ready'});
  h.clickLabel('Partida y respaldos');const config=h.messages.find(m=>m.type==='load-rom');
  const identity={sha256:config.sha256,core:'mgba',platform:'gba'};
  const backup=cartridgeModule.createGameCartridgeBackup(new Uint8Array(512),undefined,identity);
  await h.importFile(jsonFile('game.json',backup));assert.equal(h.messages.some(m=>m.type==='stop'),false);
  const oldSurface=h.surface;h.clickText('Restaurar y reiniciar');assert.equal(h.surface,oldSurface);
  h.receive({type:'stopped'});assert.notEqual(h.surface,oldSurface);h.load();
  const imports=h.messages.filter(m=>m.type==='load-rom');assert.equal(imports.length,2);
  assert.deepEqual(JSON.parse(JSON.stringify(imports[1].restore)),backup);
  h.unmount();
});

test('ten host library cycles clean frames, object URLs, listeners and timeouts', async () => {
  const h=hostHarness();
  for(let i=0;i<10;i++){
    await h.pick(hostRom('game.gba'));h.load();h.receive({type:'ready'});
    h.clickLabel('Volver a juegos');h.receive({type:'stopped'});
    assert.equal(h.frame,undefined);assert.equal(h.timers.size,0);
  }
  assert.equal(h.revoked.length,10);h.unmount();assert.equal(h.listeners.size,0);
});

test('host rejects another ROM backup before stopping and allows cancelling a failed import flush', async () => {
  const h=hostHarness();await h.pick(hostRom('game.gba'));h.load();h.receive({type:'ready'});h.clickLabel('Partida y respaldos');
  const config=h.messages.find(m=>m.type==='load-rom');const identity={sha256:config.sha256,core:'mgba',platform:'gba'};
  const wrong=cartridgeModule.createGameCartridgeBackup(new Uint8Array(512),undefined,gbaIdentity);
  await h.importFile(jsonFile('wrong.json',wrong));assert.equal(h.messages.some(m=>m.type==='stop'),false);
  const valid=cartridgeModule.createGameCartridgeBackup(new Uint8Array(512),undefined,identity);
  await h.importFile(jsonFile('right.json',valid));const original=h.surface;
  h.clickText('Restaurar y reiniciar');h.receive({type:'stop-failed'});h.clickText('Cancelar');
  assert.equal(h.surface,original);assert.equal(h.messages.filter(m=>m.type==='load-rom').length,1);
  h.unmount();
});

test('cancelling a timed-out import ignores its late stop acknowledgement and keeps the session', async () => {
  const h=hostHarness();await h.pick(hostRom('game.gba'));h.load();h.receive({type:'ready'});h.clickLabel('Partida y respaldos');
  const config=h.messages.find(m=>m.type==='load-rom');
  const identity={sha256:config.sha256,core:'mgba',platform:'gba'};
  await h.importFile(jsonFile('right.json',cartridgeModule.createGameCartridgeBackup(new Uint8Array(512),undefined,identity)));
  const original=h.surface;const session=h.frame.props.src;
  h.clickText('Restaurar y reiniciar');h.expire(5000);h.clickText('Cancelar');
  h.receive({type:'stopped'});
  assert.equal(h.surface,original);assert.equal(h.frame.props.src,session);
  assert.equal(h.messages.filter(m=>m.type==='load-rom').length,1);
  h.clickLabel('Volver a juegos');h.receive({type:'stopped'});assert.equal(h.frame,undefined);
  h.unmount();
});

test('host accepts a late successful save acknowledgement after the timeout without discarding early', async () => {
  const h=hostHarness();await h.pick(hostRom('game.gba'));h.load();h.receive({type:'ready'});
  h.clickLabel('Volver a juegos');h.expire(5000);assert.ok(h.frame);
  h.receive({type:'stopped'});assert.equal(h.frame,undefined);h.unmount();
});

test('host state import reaches the new frame with runtime and content identity intact', async () => {
  const h=hostHarness();await h.pick(hostRom('game.gba'));h.load();h.receive({type:'ready'});h.clickLabel('Partida y respaldos');
  const config=h.messages.find(m=>m.type==='load-rom');
  const state={format:'monsite-game-state',version:1,rom:config.sha256,platform:'gba',core:'mgba',runtime:backups.CORE_RUNTIMES.mgba,savedAt:new Date().toISOString(),state:'AAAA'};
  await h.importFile(jsonFile('game.state.json',state));h.clickText('Restaurar y reiniciar');h.receive({type:'stopped'});h.load();
  const next=h.messages.filter(m=>m.type==='load-rom').at(-1);assert.equal(next.state.runtime,state.runtime);assert.equal(next.state.rom,config.sha256);
  assert.equal(next.restore,undefined);h.unmount();
});

test('host raw SRAM import is explicit and cannot claim a verified RTC', async () => {
  const h=hostHarness();await h.pick(hostRom('game.gba'));h.load();h.receive({type:'ready'});h.clickLabel('Partida y respaldos');
  const bytes=new Uint8Array(512);await h.importFile({name:'game.sav',size:512,arrayBuffer:async()=>bytes.buffer});
  assert.equal(h.messages.some(m=>m.type==='stop'),false);h.clickText('Restaurar y reiniciar');h.receive({type:'stopped'});h.load();
  const next=h.messages.filter(m=>m.type==='load-rom').at(-1);assert.equal(next.restore.partial,true);assert.equal(next.restore.rtc,undefined);
  assert.equal(backups.encodedSize(next.restore.sram),512);h.unmount();
});

test('Gold raw SRAM export survives a failed clock or browser-storage capture', async () => {
  const h=harness({captureFails:true}); await settle(); h.context.EJS_onGameStart();
  h.message({type:'export-raw'}); await settle();
  const exported=h.messages.find(message=>message.type==='cartridge-save');
  assert.ok(exported,'The actual SRAM remains exportable even when RTC persistence fails');
  assert.equal(Buffer.from(exported.encoded,'base64').length,32768);
  assert.ok(h.messages.some(message=>message.type==='storage-error'));
});

test('an asynchronous native export failure releases busy state so the player can retry', async () => {
  // Block the native button's callback to reproduce a rejection between
  // saveSaveFiles and its screenshot, before EJS_onSaveSave is called.
  const h=harness(); await settle(); h.context.EJS_onGameStart();
  const callback=h.context.EJS_onSaveSave;
  h.context.EJS_onSaveSave=()=>{};
  h.message({type:'export-raw'});
  h.listeners.get('unhandledrejection')();
  assert.ok(h.messages.some(m=>m.type==='storage-error'));
  h.context.EJS_onSaveSave=callback;
  h.message({type:'export-raw'});await settle();
  assert.equal(Buffer.from(h.messages.find(m=>m.type==='cartridge-save').encoded,'base64').length,32768);
});

test('an asynchronous native stop failure never acknowledges save and allows a fresh stop attempt', async () => {
  const h=harness();await settle();h.context.EJS_onGameStart();
  const callback=h.context.EJS_onSaveSave;h.context.EJS_onSaveSave=()=>{};
  h.message({type:'stop'});h.listeners.get('unhandledrejection')();
  assert.ok(h.messages.some(m=>m.type==='stop-failed'));
  assert.equal(h.messages.some(m=>m.type==='stopped'),false);
  h.context.EJS_onSaveSave=callback;
  h.message({type:'stop'});await settle();
  assert.ok(h.messages.some(m=>m.type==='stopped'));
});

test('bundled Doom is an intact GBA cartridge with the same save identity as its local file', async () => {
  const rom=readFileSync(new URL('../public/games/doom.gba',import.meta.url));
  const game=library.GAME_LIBRARY.find(game=>game.title==='Doom');
  assert.ok(game);assert.equal(rom.length,8388608);
  assert.equal(createHash('sha256').update(rom).digest('hex'),library.DOOM_ROM_SHA256);
  assert.equal(game.sha256,library.DOOM_ROM_SHA256);assert.equal(game.id,'rom-'+game.sha256);
  assert.equal(game.core,'mgba');assert.equal(game.platform,'gba');assert.equal(game.saveMode,'cartridge');
  assert.equal(game.romUrl,'/games/doom.gba');assert.equal(rom[0xb2],0x96);
  let checksum=-0x19;for(let offset=0xa0;offset<0xbd;offset++)checksum-=rom[offset];
  assert.equal(checksum&255,rom[0xbd]);assert.equal(rom.subarray(0xac,0xb0).toString('ascii'),'ADME');
  const local=await localRom.identifyLocalRom({name:'Renamed Doom.GBA',size:rom.length,arrayBuffer:async()=>Uint8Array.from(rom).buffer});
  assert.equal(local.id,game.id);assert.equal(local.sha256,game.sha256);assert.equal(local.core,game.core);
});

test('host selects bundled Doom with GBA controls and returns to the library after saving', () => {
  const h=hostHarness();const game=library.GAME_LIBRARY.find(game=>game.title==='Doom');
  h.find(node=>node.props['data-launch-game']===game.id).props.onClick();h.render();h.load();
  const config=h.messages.find(message=>message.type==='load-rom');
  assert.equal(config.url,'/games/doom.gba');assert.equal(config.platform,'gba');
  assert.equal(config.id,game.id);assert.equal(config.sha256,game.sha256);assert.equal(config.saveMode,'cartridge');
  h.receive({type:'ready'});
  assert.equal(h.find(node=>node.props['data-key']==='a').props['aria-label'],'L');
  assert.equal(h.find(node=>node.props['data-key']==='s').props['aria-label'],'R');
  h.clickLabel('Volver a juegos');assert.ok(h.frame);h.receive({type:'stopped'});assert.equal(h.frame,undefined);
  h.unmount();
});
