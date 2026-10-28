import fs from 'node:fs';import crypto from 'node:crypto';
const folder=new URL('../dist/',import.meta.url),files=fs.readdirSync(folder).filter(f=>/\.(js|css|html|webmanifest)$/.test(f)&&f!=='sw.js').sort();
const hash=crypto.createHash('sha256');for(const file of files)hash.update(fs.readFileSync(new URL('../dist/'+file,import.meta.url)));
const target=new URL('../dist/sw.js',import.meta.url);let source=fs.readFileSync(target,'utf8');const core=['./',...files.filter(f=>f!=='index.html').map(f=>'./'+f),'./icons/app.svg','./icons/app-192.png','./icons/app-512.png'];source=source.replace(/const CORE=\[[^\]]*\];/,`const CORE=${JSON.stringify(core)};`);hash.update(source.replace(/const VERSION='[^']+'/,'const VERSION=\'content-version\''));
const version='campus-v2-'+hash.digest('hex').slice(0,12);fs.writeFileSync(target,source.replace(/const VERSION='[^']+'/,'const VERSION=\''+version+'\''));console.log('Offline version '+version);
