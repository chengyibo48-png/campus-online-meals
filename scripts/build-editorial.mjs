import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),file=path.join(root,'dist/data/menu.json');
const menu=JSON.parse(fs.readFileSync(file,'utf8')),entries=new Map();
for(const line of fs.readFileSync(path.join(root,'review/dish-editorial-v4.txt'),'utf8').trim().split(/\r?\n/)){
 const fields=line.split('|');if(fields.length!==3)throw Error('Invalid editorial row');
 const [name,description,choosingTip]=fields;
 if(entries.has(name)||description.length<30||choosingTip.length<15)throw Error('Missing or duplicate dish-specific copy: '+name);
 entries.set(name,{description,choosingTip});
}
for(const d of menu){const article=entries.get(d.name);if(!article)throw Error('Dish has no independent introduction: '+d.id+' '+d.name);d.inspiration={...d.inspiration,summary:article.description.split('。')[0]+'。',description:article.description,choosingTip:article.choosingTip,editorialId:'editorial-'+d.id,editorialVersion:1};}
const names=new Set(menu.map(d=>d.name));for(const name of entries.keys())if(!names.has(name))throw Error('Orphaned editorial: '+name);
fs.writeFileSync(file,JSON.stringify(menu,null,2)+'\n');
fs.writeFileSync(path.join(root,'review/dish-editorial-audit.json'),JSON.stringify({records:menu.length,differentNames:names.size,covered:menu.length,uncovered:[],editorialIds:menu.map(d=>({id:d.id,name:d.name,editorialId:d.inspiration.editorialId,descriptionLength:d.inspiration.description.length,choosingTipLength:d.inspiration.choosingTip.length}))},null,2)+'\n');
console.log(JSON.stringify({editorialRecords:menu.length,independentNamedArticles:entries.size,missing:0}));
