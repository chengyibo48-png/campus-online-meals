import {readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const dishes=JSON.parse(readFileSync(path.join(root,'dist/data/menu.json'),'utf8'));
const fit=JSON.parse(readFileSync(path.join(root,'dist/data/image-fit.json'),'utf8'));for(const d of dishes){if(fit[d.id]){const {scale,x,y}=fit[d.id];d.imageFit={scale,x,y};}delete d.meal;delete d.taste;delete d.nutrition;delete d.legacy;}
if(new Set(dishes.map(d=>d.id)).size!==dishes.length||new Set(dishes.filter(d=>d.image).map(d=>d.image)).size!==dishes.filter(d=>d.image).length||new Set(dishes.filter(d=>d.imageId).map(d=>d.imageId)).size!==dishes.filter(d=>d.imageId).length)throw Error('Each menu record must have an independent identity and image');
for(const d of dishes){if(!d.canonicalName||!Array.isArray(d.mealTypes)||!d.verification)throw Error('Missing v2 menu metadata: '+d.id);}
writeFileSync(path.join(root,'dist/catalog.js'),'// Generated from data/menu.json; compact runtime records, independent dish assets.\nexport const dishes = '+JSON.stringify(dishes)+';\n');
console.log(`Built ${dishes.length} stable menu records with verification metadata.`);
