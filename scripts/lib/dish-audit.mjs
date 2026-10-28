import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {isVerified,availability,categories,tastes,dayKey,isPublished} from '../../dist/menu-query.js';
import {restaurantById,areas} from '../../dist/venue-registry.js';
import {evidenceFields,hasFieldEvidence,fieldEvidenceProblems,sourceProblems,searchKey} from '../../dist/food-model.js';
import {menuStatistics} from '../../dist/catalog-stats.js';
const text=v=>typeof v==='string'&&v.trim();
const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v),validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function auditMenu(records,{root,asOf=new Date(),manifest=[],allowTestData=false}={}){
 if(!Array.isArray(records))return {errors:['菜库必须是数组'],items:[],counts:{},total:0};
 const groups=new Map(),names=new Map(),errors=[],items=[],ids=new Set(),images=new Set(),hashes=new Set(),imageIds=new Set(),knownAreas=new Set(areas.map(a=>a.id)),assets=new Map(manifest.map(a=>[a.id,a]));
 for(const d of records){const problems=[];if(!object(d)){errors.push('餐品记录必须是对象');continue;}
  const id=d.id??'未知ID',fail=message=>problems.push(message),v=object(d.verification)?d.verification:{},evidence=Array.isArray(v.evidence)?v.evidence:[];
  if(typeof d.id!=='string'||!/^dish-[a-z0-9-]+$/.test(d.id)||ids.has(d.id))fail('餐品ID缺失、格式无效或重复');ids.add(d.id);
  if(d.dataVersion!==3||typeof d.dishGroupId!=='string'||!/^group-[a-z0-9-]+$/.test(d.dishGroupId))fail('缺少v3数据版本或稳定菜名分组');
  if(!d.name||!d.canonicalName||searchKey(d.name)!==searchKey(d.canonicalName)||!Array.isArray(d.aliases)||d.aliases.some(x=>typeof x!=='string'))fail('名称、规范名或别名无效');
  if(Array.isArray(d.aliases)&&d.aliases.some(alias=>searchKey(alias)!==searchKey(d.name))&&!hasFieldEvidence(d,'aliases'))fail('非文字格式变体的别名必须有独立来源依据');
  if(!categories.includes(d.category)||!['single','combo','self-select','unknown'].includes(d.servingForm))fail('分类或供餐形式无效');
  if(d.inspiration){const i=d.inspiration;if(!object(i)||!['published','draft','archived'].includes(i.status))fail('灵感发布状态无效');else if(i.status==='published'&&(!isPublished(d)||!text(i.summary)||!validDate(i.editedAt)||!Array.isArray(i.searchAliases)||i.searchAliases.some(x=>!text(x))||i.flavorTags.some(t=>!tastes.includes(t)||t==='未标注')))fail('已发布灵感缺少完整的编辑参考信息');}
  if(!Array.isArray(d.components)||d.components.some(c=>!object(c)||typeof c.name!=='string'||!c.name.trim()))fail('组合部分结构无效');
  else if(d.servingForm==='combo'&&d.components.length<2)fail('组合餐必须包含名称明确的全部部分');
  else if(d.servingForm!=='combo'&&d.components.length)fail('单品或自选餐不能虚构固定组合');
  if(!Array.isArray(d.mealTypes)||d.mealTypes.some(m=>!['breakfast','lunch','dinner'].includes(m)))fail('餐次结构无效；未知应为空数组');
  if(!Array.isArray(d.tastes)||d.tastes.some(t=>!tastes.includes(t)||t==='未标注')||!Array.isArray(d.ingredients)||d.ingredients.some(x=>typeof x!=='string'))fail('口味或配料无效；未知应为空数组');
  if(d.price!==null&&(!object(d.price)||!Number.isFinite(d.price.amount)||d.price.amount<0||d.price.currency!=='CNY'||!text(d.price.unit)))fail('价格格式无效；未知应为null');
  if(!['pending','verified','review','disabled','conflict'].includes(v.status))fail('核实状态无效');
  if(d.areaId!==null&&!knownAreas.has(d.areaId))fail('生活区标识无效');const venue=restaurantById.get(d.restaurantId);
  if(d.restaurantId&&(!venue||venue.areaId!==d.areaId||venue.name!==d.restaurant))fail('具体餐厅、名称与生活区不对应');
  for(const field of evidenceFields){const claim=d.fieldEvidence?.[field];if(!object(claim)||!['known','unknown'].includes(claim.status)||!Array.isArray(claim.evidenceIds))fail(field+'缺少字段证据状态');
   else if(claim.status==='known')for(const problem of fieldEvidenceProblems(d,field,{now:asOf,allowTestData}))fail(field+'：'+problem);
   if(claim?.status==='unknown'&&field!=='restaurant'&&(Array.isArray(d[field])?d[field].length:d[field]!==null))fail(field+'未知时不能保留推断值');
  }
  const groupName=searchKey(d.canonicalName);if(groups.has(d.dishGroupId)&&groups.get(d.dishGroupId)!==groupName)fail('同一分组不能对应不同规范菜名');if(names.has(groupName)&&names.get(groupName)!==d.dishGroupId)fail('同一规范菜名必须使用同一分组');groups.set(d.dishGroupId,groupName);names.set(groupName,d.dishGroupId);
  if(v.conflicts!==undefined&&!Array.isArray(v.conflicts))fail('来源争议结构无效');
  const evidenceIds=new Set();for(const e of evidence){if(!object(e)||!e.id||evidenceIds.has(e.id)){fail('证据ID缺失或重复');continue;}evidenceIds.add(e.id);}
  if(d.testOnly&&!allowTestData)fail('隔离测试数据禁止写入正式菜库');
  if(v.status==='verified'){
   const checkTime=new Date((v.checkedAt>v.validFrom?v.checkedAt:v.validFrom)+'T12:00:00+08:00');
   if(![v.checkedAt,v.validFrom,v.validUntil].every(validDate)||v.validFrom>v.validUntil||v.checkedAt>dayKey(asOf))fail('核实日期或有效范围无效');
   if(!Number.isFinite(checkTime.getTime())||!isVerified(d,checkTime))fail('身份核实依据不完整或存在未解决冲突');
   const basis=v.validityBasis,menuEvidence=evidence.find(e=>e?.id===(basis?.evidenceId??basis?.menuEvidenceId));
   for(const problem of sourceProblems(d,menuEvidence,{now:asOf,allowTestData}))fail('身份期限依据：'+problem);
   if(basis?.kind==='semester'){const calendar=evidence.find(e=>e?.id===basis.calendarEvidenceId);for(const problem of sourceProblems(d,calendar,{now:asOf,calendar:true,allowTestData}))fail('校历依据：'+problem);}
  }
  let hash=null,bytes=0;
  if(d.image!==null&&typeof d.image!=='string')fail('主图必须为路径字符串或null');
  if(typeof d.image==='string'&&d.image){if(!d.imageId||imageIds.has(d.imageId))fail('图片ID缺失或复用');imageIds.add(d.imageId);if(images.has(d.image))fail('跨餐品复用图片');images.add(d.image);
   if(root){const target=path.resolve(root,'dist',d.image),base=path.resolve(root,'dist')+path.sep;if(!target.startsWith(base))fail('图片路径超出静态目录');else if(!fs.existsSync(target))fail('图片文件缺失');else{const data=fs.readFileSync(target);bytes=data.length;hash=crypto.createHash('sha256').update(data).digest('hex');if(bytes>200000)fail('主图超过200KB');if(hashes.has(hash))fail('图片内容重复');hashes.add(hash);const a=assets.get(d.id);if(d.thumbnail){const expected=d.image.replace(/\.webp$/,'-thumb.webp');if(d.thumbnail!==expected)fail('缩略图必须是本条主图的独立派生路径');else{const thumb=path.resolve(root,'dist',d.thumbnail);if(!thumb.startsWith(base)||!fs.existsSync(thumb))fail('缩略图不存在或路径无效');else{const thumbHash=crypto.createHash('sha256').update(fs.readFileSync(thumb)).digest('hex');if(a?.thumbnail?.path!==d.thumbnail||a?.thumbnail?.sha256!==thumbHash||a?.thumbnail?.derivedFrom!==hash)fail('缩略图与主图的派生记录不一致');}}}if(v.status==='verified'&&a?.contentReview?.status==='needs-correction-before-use')fail('素材包含不对应内容，上架前需独立重做');if(!a||a.path!==d.image||a.sha256!==hash||a.status!=='reviewed'||!a.qualityChecks?.includes('visual-content-reviewed'))fail('缺少对应素材复核记录');}}
  }else if(d.imageId||d.thumbnail)fail('空图片不能关联其他素材或缩略图');
  const missing=evidenceFields.filter(f=>!hasFieldEvidence(d,f,asOf));if(!evidence.length)missing.push('identity-evidence');
  items.push({id,name:d.name,dishGroupId:d.dishGroupId,areaId:d.areaId,restaurantId:d.restaurantId??null,status:availability(d,asOf),verification:v,fieldEvidence:d.fieldEvidence,imageId:d.imageId??null,image:d.image??null,sha256:hash,bytes,missing,problems});errors.push(...problems.map(p=>id+': '+p));
 }
 const safe=records.filter(object),statistics=menuStatistics(safe,asOf);
 return {checkedAt:dayKey(asOf),total:records.length,counts:statistics.counts,statistics,errors,items};
}
