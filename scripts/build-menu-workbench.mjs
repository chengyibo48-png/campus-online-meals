import fs from 'node:fs';import path from 'node:path';import {sourceHash} from './lib/menu-batch.mjs';
const root=path.resolve(import.meta.dirname,'..'),dest=path.join(root,'review/menu-workbench'),raw=fs.readFileSync(path.join(root,'dist/data/menu.json'),'utf8'),records=JSON.parse(raw);
fs.mkdirSync(dest,{recursive:true});fs.cpSync(path.join(root,'tools/menu-workbench'),dest,{recursive:true});fs.copyFileSync(path.join(root,'dist/food-model.js'),path.join(dest,'food-model.js'));
fs.writeFileSync(path.join(dest,'workbench-data.json'),JSON.stringify({baseSha256:sourceHash(raw),records,assets:JSON.parse(fs.readFileSync(path.join(root,'review/dish-image-review.json'),'utf8')).records,report:JSON.parse(fs.readFileSync(path.join(root,'review/dish-cleanup-report.json'),'utf8')),research:JSON.parse(fs.readFileSync(path.join(root,'review/evidence-research.json'),'utf8'))}));
for(const d of records)for(const asset of [d.image,d.thumbnail].filter(Boolean)){const target=path.join(dest,asset);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,'dist',asset),target);}
console.log('Local-only workbench: '+dest+' (never copied into dist or published)');
