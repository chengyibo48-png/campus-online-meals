import {prepareBatch,sourceHash} from './lib/menu-batch.mjs';
import {dayKey} from '../dist/meal-engine.js';
import fs from 'node:fs';import path from 'node:path';import {auditMenu} from './lib/menu-audit.mjs';
const root=path.resolve(import.meta.dirname,'..'),menuPath=path.join(root,'dist/data/menu.json'),records=JSON.parse(fs.readFileSync(menuPath,'utf8')),args=process.argv.slice(2),option=k=>args[args.indexOf(k)+1],asOf=new Date((args.includes('--as-of')?option('--as-of'):dayKey())+'T12:00:00+08:00');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'review/asset-manifest.json'),'utf8'));
if(args[0]==='template'){
 const d=records.find(d=>d.id===option('--id'));if(!d)throw Error('请选择既有稳定ID；新条目需人工指定新的唯一ID。');const out=option('--out');if(!out||fs.existsSync(out))throw Error('必须指定尚不存在的 --out 文件');
 const draft={...d,restaurantId:null,verification:{status:'pending',checkedAt:null,validFrom:null,validUntil:null,validityBasis:null,conflicts:[],evidence:[{id:'',kind:'official-menu',url:'',title:'',publisher:'',publishedAt:null,accessedAt:null,capturedAt:null,location:null,validRange:null,term:null,fields:[],locator:'',restaurantId:null,menuItemName:d.name,confirmedBy:'',confirmedAt:null}]}};
 fs.writeFileSync(out,JSON.stringify(draft,null,2)+'\n');console.log('已创建待核实模板；不会自动提升为已核实。');
}else{
 let next=records;if(args[0]==='apply-batch'){const result=prepareBatch(records,JSON.parse(fs.readFileSync(option('--file'),'utf8')),{baseSha256:sourceHash(fs.readFileSync(menuPath,'utf8')),root,asOf,manifest});next=result.records;}if(args[0]==='apply'){
  const draft=JSON.parse(fs.readFileSync(option('--file'),'utf8'));next=prepareBatch(records,{kind:'zhengda-menu-batch',version:1,baseSha256:sourceHash(fs.readFileSync(menuPath,'utf8')),records:[draft]},{baseSha256:sourceHash(fs.readFileSync(menuPath,'utf8')),root,asOf,manifest}).records;
 }
 const result=auditMenu(next,{root,asOf,manifest});
 if(result.errors.length){console.error(result.errors.join('\n'));process.exitCode=1;}
 else if(['apply','apply-batch'].includes(args[0])){const temp=menuPath+'.tmp';fs.writeFileSync(temp,JSON.stringify(next,null,2)+'\n');fs.renameSync(temp,menuPath);console.log('校验通过，已写入本地菜库。仍需构建、素材验收和发布。');}
 else if(args[0]==='check'){
  const output=path.join(root,'review/menu-release-audit.json');fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({checkedAt:result.checkedAt,total:result.total,counts:result.counts,independentImages:result.items.filter(x=>x.sha256).length,errors:result.errors.length}));
 }else throw Error('用法：template --id ID --out FILE | check [--as-of YYYY-MM-DD] | apply --file FILE | apply-batch --file FILE [--as-of YYYY-MM-DD]');
}
