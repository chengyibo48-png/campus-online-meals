import crypto from 'node:crypto';import {auditMenu} from './menu-audit.mjs';
export const sourceHash=raw=>crypto.createHash('sha256').update(raw).digest('hex');
export function prepareBatch(records,batch,{baseSha256,...options}={}){
 if(typeof baseSha256!=='string'||!/^[a-f0-9]{64}$/.test(baseSha256)||batch?.kind!=='zhengda-menu-batch'||batch.version!==1||batch.baseSha256!==baseSha256)throw Error('草稿版本或基线已变化，请重新载入工作台后合并，未修改原菜库。');
 if(!Array.isArray(batch.records)||!batch.records.length||batch.records.length>1000)throw Error('批量草稿必须有1至1000条记录。');
 const ids=new Set(),next=structuredClone(records);
 for(const entry of batch.records){if(!entry||typeof entry.id!=='string'||ids.has(entry.id))throw Error('草稿ID缺失或重复。');ids.add(entry.id);const index=next.findIndex(d=>d.id===entry.id);
  if(index>=0){const old=next[index];if(entry.imageId!==old.imageId&&entry.image)throw Error('旧记录图片标识不能替换；若需重做素材，先完成独立素材人工复核。');if(JSON.stringify(entry.legacy)!==JSON.stringify(old.legacy))throw Error('不能覆盖旧版原始资料。');next[index]=entry;}else next.push(entry);
 }
 const audit=auditMenu(next,options);if(audit.errors.length)throw Error(audit.errors.join('\n'));
 return {records:next,audit,changedIds:[...ids]};
}
