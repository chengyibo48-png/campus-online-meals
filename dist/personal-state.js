import {dishes,dishById,dayKey,defaultFilters,isVerified,isRecommendable,mealNames} from './meal-engine.js';
import {normalizeProfile,validateProfile} from './health-profile.js';
export const STORAGE_KEY='zhengda-meal-cards.v4',PREVIOUS_KEY='zhengda-meal-cards.v3',V2_KEY='zhengda-meal-cards.v2',LEGACY_KEY='zhengda-meal-cards.v1';
const clone=v=>JSON.parse(JSON.stringify(v)),text=(s,n=100)=>typeof s==='string'?s.slice(0,n):'';
const list=a=>Array.isArray(a)?[...new Set(a.filter(x=>typeof x==='string').map(x=>x.slice(0,100)))].slice(0,1000):[];
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s,meal=s=>Object.hasOwn(mealNames,s);
const snapshot=(id,fallback)=>{const d=dishById.get(id);return {name:text(fallback?.name||d?.name||'已移除餐品'),restaurant:text(fallback?.restaurant||d?.restaurant||'餐厅资料待核实')};};
export function createState(now=new Date()){return {version:4,revision:0,updatedAt:now.toISOString(),profile:null,feedback:{sound:false,haptics:false},favorites:[],excluded:{date:dayKey(now),ids:[]},preferences:{...defaultFilters(now),day:dayKey(now),exploration:'steady',likedTastes:[],frequentRestaurants:[],legacyRestaurantFilters:[],legacyFrequentRestaurants:[],catalogMode:'inspiration'},recentRecommendations:[],decisions:{},history:[],ratings:{},collections:[{id:'default',name:'想吃的',ids:[]}],plan:{}};}
export function normalizeState(value,now=new Date()){
 if(!value||![2,3,4].includes(value.version))throw Error('不支持的数据版本');const s=createState(now),today=dayKey(now);s.revision=Number.isSafeInteger(value.revision)?value.revision:0;s.updatedAt=text(value.updatedAt,40)||s.updatedAt;s.profile=value.profile==null?null:validateProfile(value.profile);s.feedback={sound:value.feedback?.sound===true,haptics:value.feedback?.haptics===true};
 s.favorites=list(value.favorites);s.excluded.ids=value.excluded?.date===today?list(value.excluded.ids):[];
 const p=value.preferences??{};s.preferences={...s.preferences,restaurants:[],tastes:list(p.tastes),categories:list(p.categories),favoritesOnly:!!p.favoritesOnly,exploration:p.exploration==='new'?'new':'steady',likedTastes:list(p.likedTastes),frequentRestaurants:[],legacyRestaurantFilters:list([...(p.legacyRestaurantFilters??[]),...(p.restaurants??[])]),legacyFrequentRestaurants:list([...(p.legacyFrequentRestaurants??[]),...(p.frequentRestaurants??[])])};
 if(p.day===today){s.preferences.meal=meal(p.meal)?p.meal:s.preferences.meal;s.preferences.query=text(p.query);}
 s.recentRecommendations=Array.isArray(value.recentRecommendations)?value.recentRecommendations.filter(id=>typeof id==='string').slice(-3):[];
 const entry=e=>e&&typeof e.id==='string'&&typeof e.dishId==='string'&&date(e.date)&&meal(e.meal)&&Number.isFinite(Date.parse(e.chosenAt));
 const clean=e=>({id:text(e.id,200),dishId:text(e.dishId),date:e.date,meal:e.meal,chosenAt:e.chosenAt,eatenAt:Number.isFinite(Date.parse(e.eatenAt))?e.eatenAt:null,snapshot:snapshot(e.dishId,e.snapshot)});
 s.history=Array.isArray(value.history)?value.history.filter(e=>entry(e)&&Number.isFinite(Date.parse(e.eatenAt))).map(clean).filter((e,i,a)=>a.findIndex(x=>x.id===e.id)===i).sort((a,b)=>Date.parse(b.eatenAt)-Date.parse(a.eatenAt)).slice(0,200):[];
 for(const e of Object.values(value.decisions??{}))if(entry(e)&&e.date===today)s.decisions[e.date+':'+e.meal]=clean(e);
 for(const [id,r] of Object.entries(value.ratings??{}))if(Number.isInteger(r)&&r>=1&&r<=5&&id.length<=100)s.ratings[id]=r;
 const collections=Array.isArray(value.collections)?value.collections.filter(c=>c&&typeof c.id==='string'&&typeof c.name==='string').slice(0,30).map(c=>({id:text(c.id),name:text(c.name,30)||'收藏夹',ids:list(c.ids)})):[];
 s.collections=[{id:'default',name:'想吃的',ids:s.favorites},...collections.filter((c,i,a)=>c.id!=='default'&&a.findIndex(x=>x.id===c.id)===i)];
 for(const x of Object.values(value.plan??{}).slice(-210))if(x&&date(x.date)&&meal(x.meal))s.plan[x.date+':'+x.meal]={date:x.date,meal:x.meal,dishId:typeof x.dishId==='string'?text(x.dishId):null,locked:!!x.locked,notice:text(x.notice,150)};
 return s;
}
export function migrateV1(old,now=new Date()){
 if(old?.version!==1)throw Error('无法读取旧版饭本');const s=createState(now),p=old.preferences??{};
 s.favorites=list(old.favorites);s.excluded=old.excluded??s.excluded;s.recentRecommendations=old.recentRecommendations??[];s.history=old.history??[];s.decisions=old.decisions??{};
 s.preferences={...s.preferences,day:p.day,meal:p.meal,query:p.query,restaurants:p.restaurant&&p.restaurant!=='全部'?[p.restaurant]:[],tastes:p.taste&&p.taste!=='不限'?[p.taste]:[]};return normalizeState(s,now);
}
export function loadState(storage,now=new Date()){
 try{const raw=storage.getItem(STORAGE_KEY);if(raw)return {state:normalizeState(JSON.parse(raw),now),raw,warning:''};const old=storage.getItem(PREVIOUS_KEY)??storage.getItem(V2_KEY)??storage.getItem(LEGACY_KEY);if(!old)return {state:createState(now),raw:null,warning:''};
  const parsed=JSON.parse(old),state=parsed.version===1?migrateV1(parsed,now):normalizeState(parsed,now),serialized=JSON.stringify(state);const checked=normalizeState(JSON.parse(serialized),now);if(JSON.stringify(checked)!==serialized)throw Error('迁移校验失败');try{storage.setItem(STORAGE_KEY,serialized);return {state,raw:serialized,warning:'饭本已升级至v4，旧数据原样保留。身体资料默认留空；旧餐厅筛选仅保留备份。',migrated:true};}catch{return {state,raw:null,readOnly:true,warning:'旧饭本已载入本次会话，原始数据未改动。无法保存新版，请先导出备份。'};}
 }catch{return {state:createState(now),raw:null,readOnly:true,warning:'本地数据无法安全读取或迁移，原始数据已保留。本次使用临时饭本，可先导出备份。'};}
}
export function saveState(storage,state,expectedRaw){try{if(expectedRaw!==undefined&&storage.getItem(STORAGE_KEY)!==expectedRaw)return {ok:false,conflict:true};const raw=JSON.stringify(state);storage.setItem(STORAGE_KEY,raw);return {ok:true,raw};}catch{return {ok:false,warning:'无法保存到浏览器，本次会话仍可用。请导出备份。'};}}
export function reduceState(previous,action,now=new Date(),records=dishes){
 const s=normalizeState(previous,now),lookup=new Map(records.map(d=>[d.id,d])),d=lookup.get(action.dishId),today=dayKey(now),key=action.key??today+':'+action.meal;
 switch(action.type){
 case 'profile':s.profile=validateProfile(action.value);break;
 case 'clear-profile':s.profile=null;break;
 case 'feedback':s.feedback={sound:action.value?.sound===true,haptics:action.value?.haptics===true};break;
 case 'preferences':s.preferences={...s.preferences,...action.values,day:today};break;
 case 'favorite':if(d||s.favorites.includes(action.dishId)){const removing=s.favorites.includes(action.dishId);s.favorites=removing?s.favorites.filter(id=>id!==action.dishId):[...s.favorites,action.dishId];if(removing)for(const c of s.collections)c.ids=c.ids.filter(id=>id!==action.dishId);}break;
 case 'exclude':if(d&&!s.excluded.ids.includes(d.id))s.excluded.ids.push(d.id);break;
 case 'restore':s.excluded.ids=s.excluded.ids.filter(id=>id!==action.dishId);break;
 case 'restore-all':s.excluded.ids=[];break;
 case 'recommended':s.recentRecommendations=[...s.recentRecommendations,...(Array.isArray(action.ids)?action.ids.filter(id=>typeof id==='string'):[])].slice(-3);break;
 case 'decide':if(isRecommendable(d,action.meal,now)){const k=today+':'+action.meal;if(s.decisions[k]?.dishId!==d.id)s.decisions[k]={id:k+':'+now.getTime(),dishId:d.id,date:today,meal:action.meal,chosenAt:now.toISOString(),eatenAt:null,snapshot:{name:d.name,restaurant:d.restaurant}};}break;
 case 'cancel-decision':delete s.decisions[key];break;
 case 'eaten':{const e=s.decisions[key];if(e&&!e.eatenAt){e.eatenAt=now.toISOString();s.history=[clone(e),...s.history.filter(x=>x.id!==e.id)].slice(0,200);}break;}
 case 'delete-history':s.history=s.history.filter(e=>e.id!==action.id);break;
 case 'restore-history':if(action.entry&&!s.history.some(e=>e.id===action.entry.id))s.history=[action.entry,...s.history].slice(0,200);break;
 case 'rate':if(action.rating===0)delete s.ratings[action.dishId];else if(Number.isInteger(action.rating)&&action.rating>=1&&action.rating<=5)s.ratings[action.dishId]=action.rating;break;
 case 'collection-create':if(s.collections.length<30&&text(action.name,30).trim())s.collections.push({id:'folder-'+now.getTime(),name:text(action.name,30).trim(),ids:[]});break;
 case 'collection-add':{const c=s.collections.find(c=>c.id===action.collectionId);if(c&&d&&!c.ids.includes(d.id))c.ids.push(d.id);if(c&&d&&!s.favorites.includes(d.id))s.favorites.push(d.id);break;}
 case 'collection-remove':{const c=s.collections.find(c=>c.id===action.collectionId);if(c)c.ids=c.ids.filter(id=>id!==action.dishId);break;}
 case 'collection-delete':s.collections=s.collections.filter(c=>c.id!==action.collectionId||c.id==='default');break;
 case 'plan-set':s.plan=action.slots;break;
 case 'plan-lock':if(s.plan[key])s.plan[key].locked=!s.plan[key].locked;break;
 case 'plan-replace':if(isRecommendable(d,action.meal,now)&&date(action.date)&&isRecommendable(d,action.meal,new Date(action.date+'T12:00:00+08:00')))s.plan[action.date+':'+action.meal]={date:action.date,meal:action.meal,dishId:d.id,locked:s.plan[action.date+':'+action.meal]?.locked??false,notice:''};break;
 case 'clear':return createState(now);
 }s.collections[0].ids=[...s.favorites];s.revision++;s.updatedAt=now.toISOString();return s;
}
export function parseImport(raw,now=new Date()){
 if(typeof raw!=='string'||raw.length>2_000_000)throw Error('文件过大，请使用小于2MB的饭本JSON');const value=JSON.parse(raw);
 const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 if(!object(value))throw Error('备份必须是饭本JSON对象，未修改现有饭本。');
 if(value.app&&value.app!=='zhengda-meal-cards')throw Error('这不是郑大饭本备份。');
 const data=Object.hasOwn(value,'state')?value.state:value;
 if(!object(data)||![1,2,3,4].includes(data.version))throw Error('不支持的数据版本或结构，未修改现有饭本。');
 if(data.profile!==undefined&&data.profile!==null)validateProfile(data.profile);
 for(const key of ['favorites','history','recentRecommendations'])if(!Array.isArray(data[key]))throw Error('备份缺少有效的 '+key+' 列表，不能替换现有饭本。');
 for(const key of ['preferences','decisions','excluded'])if(!object(data[key]))throw Error('备份缺少有效的 '+key+' 对象，不能替换现有饭本。');
 if(!Array.isArray(data.excluded.ids)||!date(data.excluded.date))throw Error('当天排除数据结构无效。');
 if(data.version>=2){for(const key of ['ratings','plan'])if(!object(data[key]))throw Error('备份的 '+key+' 结构无效。');if(!Array.isArray(data.collections))throw Error('收藏夹结构无效。');}
 const state=data.version===1?migrateV1(data,now):normalizeState(data,now);
 const before=data.favorites.length+data.history.length+Object.keys(data.decisions).length+Object.keys(data.plan??{}).length+Object.keys(data.ratings??{}).length;
 const valid=state.favorites.length+state.history.length+Object.keys(state.decisions).length+Object.keys(state.plan).length+Object.keys(state.ratings).length;
 const ignored=Math.max(0,before-valid),unknown=state.favorites.filter(id=>!dishById.has(id)).length+state.history.filter(e=>!dishById.has(e.dishId)).length;
 if(before>0&&valid===0)throw Error('备份中的记录均无效或已过期，拒绝覆盖现有饭本。');
 return {state,hasProfile:data.profile!==undefined&&data.profile!==null,counts:{valid,ignored,unknown},summary:`${state.favorites.length} 道收藏、${state.history.length} 条用餐记录、${Object.keys(state.plan).length} 个计划餐次。有效 ${valid} 项，忽略 ${ignored} 项，无法识别餐品 ${unknown} 项（保留历史摘要）${data.profile?'；包含身体资料，需另行确认是否覆盖':''}`};
}
export function exportBook(state,{includeProfile=false,now=new Date()}={}){const safe=clone(normalizeState(state,now));if(!includeProfile)safe.profile=null;return {app:'zhengda-meal-cards',exportedAt:now.toISOString(),includesProfile:includeProfile&&!!safe.profile,state:safe};}
export function prepareImportedBook(current,incoming,{mode='merge',includeProfile=false,now=new Date()}={}){const next=mode==='merge'?mergeStates(current,incoming,now):normalizeState(incoming,now);next.profile=includeProfile?normalizeProfile(incoming.profile):normalizeProfile(current.profile);return next;}
export function mergeStates(current,incoming,now=new Date()){
 const a=normalizeState(current,now),b=normalizeState(incoming,now);a.favorites=list([...a.favorites,...b.favorites]);a.history=[...a.history,...b.history].filter((e,i,all)=>all.findIndex(x=>x.id===e.id)===i).sort((x,y)=>Date.parse(y.eatenAt)-Date.parse(x.eatenAt)).slice(0,200);
 for(const c of b.collections){const existing=a.collections.find(x=>x.id===c.id);if(existing)existing.ids=list([...existing.ids,...c.ids]);else if(a.collections.length<30)a.collections.push(c);}
 a.plan={...b.plan,...a.plan};a.decisions={...b.decisions,...a.decisions};a.ratings={...b.ratings,...a.ratings};a.excluded.ids=list([...a.excluded.ids,...b.excluded.ids]);a.revision++;a.updatedAt=now.toISOString();a.collections[0].ids=a.favorites;return a;
}
