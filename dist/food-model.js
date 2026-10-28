// Shared evidence rules: each cited source must independently support its claim.
export const evidenceFields=['restaurant','mealTypes','tastes','price','ingredients'];
export const normalizeLabel=value=>String(value??'').normalize('NFKC').replace(/\s*\+\s*/g,'+').replace(/\s+/g,' ').trim();
export const searchKey=value=>normalizeLabel(value).replace(/\s/g,'').toLocaleLowerCase('zh-CN');
export const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const text=v=>typeof v==='string'&&!!v.trim();
const today=now=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
const evidenceList=d=>Array.isArray(d?.verification?.evidence)?d.verification.evidence:[];
export const hasOpenConflict=d=>d?.verification?.status==='conflict'||(Array.isArray(d?.verification?.conflicts)?d.verification.conflicts:[]).some(c=>c?.status!=='resolved');
export function validSourceUrl(value,{allowTestData=false}={}){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!!u.hostname&&(allowTestData||!(u.hostname==='invalid'||u.hostname.endsWith('.invalid')));}catch{return false;}
}
export function sourceProblems(d,e,{now=new Date(),calendar=false,allowTestData=d?.testOnly===true}={}){
 const errors=[],v=d?.verification??{},limit=today(now),fail=message=>errors.push(message);
 if(!e||typeof e!=='object'||Array.isArray(e))return ['证据必须为对象'];
 if(!text(e.id))fail('缺少证据ID');
 if(!validSourceUrl(e.url,{allowTestData}))fail('来源须为无账号密码的公开HTTPS原网址');
 if(!text(e.publisher)||!text(e.locator))fail('缺少发布者或正文/图片定位');
 if(!validDate(e.publishedAt)||!validDate(e.accessedAt)||e.publishedAt>e.accessedAt||e.accessedAt>limit)fail('来源发布或访问日期无效');
 if(calendar){if(e.kind!=='academic-calendar')fail('期限依据须为学校校历');return errors;}
 if(!['official-menu','window-photo'].includes(e.kind))fail('须为官方菜单或带日期地点的窗口菜单照片');
 if(!validDate(v.checkedAt)||v.checkedAt>limit||!text(e.confirmedBy)||e.confirmedAt!==v.checkedAt||e.accessedAt>v.checkedAt)fail('来源确认日期或确认标识无效');
 if(!d.restaurantId||e.restaurantId!==d.restaurantId||![d.name,d.canonicalName,...(Array.isArray(d.aliases)?d.aliases:[])].includes(e.menuItemName))fail('菜名与具体餐厅不对应');
 if(e.kind==='window-photo'&&(!validDate(e.capturedAt)||e.capturedAt>e.publishedAt||!text(e.location)))fail('窗口菜单照片缺少可核对的拍摄日期或具体地点');
 return errors;
}
const covers=(v,range)=>validDate(v?.validFrom)&&validDate(v?.validUntil)&&v.validFrom<=v.validUntil&&validDate(range?.from)&&validDate(range?.until)&&range.from<=v.validFrom&&range.until>=v.validUntil;
export function evidenceHasValidity(d,e,now=new Date()){
 const v=d?.verification,b=v?.validityBasis;
 if(covers(v,e?.validRange))return true;
 if(b?.kind!=='semester'||!text(e?.term))return false;
 const calendar=evidenceList(d).find(x=>x?.id===b.calendarEvidenceId);
 return !!(calendar&&!sourceProblems(d,calendar,{now,calendar:true}).length&&calendar.term===e.term&&covers(v,calendar.validRange));
}
export function hasValidityEvidence(d,now=new Date()){
 const b=d?.verification?.validityBasis;
 if(!b||!['source-explicit','semester'].includes(b.kind))return false;
 const menu=evidenceList(d).find(e=>e?.id===(b.kind==='source-explicit'?b.evidenceId:b.menuEvidenceId));
 if(!menu||sourceProblems(d,menu,{now}).length)return false;
 if(b.kind==='source-explicit')return covers(d.verification,menu.validRange);
 const calendar=evidenceList(d).find(e=>e?.id===b.calendarEvidenceId);
 return !!(text(menu.term)&&calendar&&menu.term===calendar.term&&!sourceProblems(d,calendar,{now,calendar:true}).length&&covers(d.verification,calendar.validRange));
}
export function fieldEvidenceProblems(d,field,{now=new Date(),allowTestData=d?.testOnly===true}={}){
 const claim=d?.fieldEvidence?.[field],evidence=evidenceList(d),ids=claim?.evidenceIds;
 if(claim?.status!=='known'||!Array.isArray(ids)||!ids.length)return ['没有已知字段证据引用'];
 const errors=[];
 if(new Set(ids).size!==ids.length)errors.push('字段证据引用重复');
 for(const id of ids){const matches=evidence.filter(e=>e?.id===id);if(matches.length!==1){errors.push('字段引用的证据缺失或ID不唯一：'+id);continue;}
  const e=matches[0];errors.push(...sourceProblems(d,e,{now,allowTestData}).map(message=>id+'：'+message));
  if(!Array.isArray(e.fields)||!e.fields.includes(field))errors.push(id+'：未覆盖字段'+field);
  if(!evidenceHasValidity(d,e,now))errors.push(id+'：本条字段证据缺少覆盖期限依据');
 }
 return errors;
}
export const hasFieldEvidence=(d,field,now=new Date())=>fieldEvidenceProblems(d,field,{now}).length===0;
export const knownValues=(d,field,now=new Date())=>hasFieldEvidence(d,field,now)&&Array.isArray(d[field])?d[field]:[];
export const fieldSummary=(d,now=new Date())=>Object.fromEntries(evidenceFields.map(field=>[field,hasFieldEvidence(d,field,now)?'known':'unknown']));
