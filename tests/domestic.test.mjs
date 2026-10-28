import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {buildDomestic} from '../scripts/build-domestic.mjs';
import {loadWeather} from '../dist/weather.js';

test('removed weather leaves only the city and never contacts a provider',async()=>{
 const original=globalThis.fetch;let requests=0;
 globalThis.fetch=async()=>{requests++;throw Error('No external network allowed');};
 try{const element={replaceChildren(){}};assert.equal(await loadWeather(element),false);assert.equal(requests,0);assert.equal(element.textContent,'郑州');assert(!element.textContent.includes('加载'));}finally{globalThis.fetch=original;}
});

test('domestic release retains all 260 images and IDs but excludes source, data dumps and personal files',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'zhengda-domestic-test-')),out=path.join(parent,'public');
 const result=await buildDomestic(out),report=JSON.parse(fs.readFileSync(result.reportPath,'utf8'));
 assert.equal(result.records,260);assert.equal(result.nameGroups,252);assert.equal(result.independentImages,260);
 assert.equal(report.files.filter(f=>/^assets\/dishes\/.*(?<!-thumb)\.webp$/.test(f.file)).length,260);
 assert(report.files.every(f=>!/(?:^|\/)(?:review|tests|scripts|data|\.git|\.openai)(?:\/|$)/.test(f.file)));
 assert(report.files.every(f=>!/^\./.test(f.file)&&!/(?:\.json|\.txt|\.zip)$/.test(f.file)));
 const html=fs.readFileSync(path.join(out,'index.html'),'utf8'),app=fs.readFileSync(path.join(out,'app.js'),'utf8'),sw=fs.readFileSync(path.join(out,'sw.js'),'utf8');
 assert(html.includes('domestic-static'));assert(html.includes('host-compat.js'));assert(html.includes('host-compat.css'));assert(!html.includes('天气加载中'));assert(app.includes('更换网址不会自动搬迁收藏和历史'));
 assert(sw.includes(result.offlineVersion));assert(!sw.includes("const VERSION='campus-v2-"));assert(sw.includes('campus-v2-|campus-cn-'));
 const listeners={},deleted=[],kept=[result.offlineVersion+'-shell',result.offlineVersion+'-images','another-app-shell'],names=['campus-v2-previous-shell','campus-cn-previous-shell',...kept];let activation;
 vm.runInNewContext(sw,{self:{addEventListener:(name,fn)=>listeners[name]=fn,clients:{claim:async()=>{}}},caches:{keys:async()=>names,delete:async name=>deleted.push(name)}});
 listeners.activate({waitUntil:p=>activation=p});await activation;
 assert.deepEqual(deleted,['campus-v2-previous-shell','campus-cn-previous-shell']);assert(kept.every(n=>!deleted.includes(n)));
 const originalCatalog=fs.readFileSync(new URL('../dist/catalog.js',import.meta.url));assert.deepEqual(fs.readFileSync(path.join(out,'catalog.js')),originalCatalog);
 assert.equal(report.platformVerified,false);assert.equal(report.domesticNetworkVerified,false);
 // Deliberately retain temporary test output; never recursively remove a computed Windows path.
});

test('release refuses to overwrite an existing directory or original site',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'zhengda-output-test-'));fs.writeFileSync(path.join(parent,'keep.txt'),'user-owned');
 await assert.rejects(buildDomestic(parent),/not empty/);assert.equal(fs.readFileSync(path.join(parent,'keep.txt'),'utf8'),'user-owned');
 await assert.rejects(buildDomestic(path.resolve('dist')),/separate/);await assert.rejects(buildDomestic('relative-output'),/absolute/);
});
