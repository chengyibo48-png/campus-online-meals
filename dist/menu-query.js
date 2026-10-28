import {areas,restaurantRegistry,restaurantById} from './venue-registry.js';
import {normalizeLabel,searchKey,hasValidityEvidence,hasOpenConflict,hasFieldEvidence,knownValues} from './food-model.js';
export {searchKey,hasValidityEvidence,hasOpenConflict,hasFieldEvidence,knownValues} from './food-model.js';
import {dishes} from './catalog.js';
import {isPublished,suggestedMeals,suggestedTastes,isMainInspiration} from './inspiration-model.js';
export {isPublished,suggestedMeals,suggestedTastes} from './inspiration-model.js';
export {dishes};
export const dishById=new Map(dishes.map(d=>[d.id,d]));
export const mealNames={breakfast:'早餐',lunch:'午餐',dinner:'晚餐'};
export const tastes=['清淡','咸香','香辣','酸甜','酸香','甜口','未标注'];
export const categories=['面食粉类','米饭套餐','饺子馄饨','包点饼类','汤粥','砂锅炖菜','自选套餐','轻食','地方风味','点心','饮品配餐','热炒拌菜','小吃拼餐','饭团三明治','铁板烧烤','炸物小食','甜品水果','其他'];
export const restaurants=[...areas.map(a=>a.name+'餐厅'),...restaurantRegistry.map(v=>v.name)];
export function dayKey(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function mealForTime(now=new Date()){const h=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'numeric',hourCycle:'h23'}).format(now));return h>=5&&h<10?'breakfast':h>=10&&h<16?'lunch':'dinner';}
export const addDays=(day,n)=>new Date(Date.parse(day+'T12:00:00+08:00')+n*86400000).toISOString().slice(0,10);
export function weekStart(day=dayKey()){const weekday=new Date(day+'T12:00:00+08:00').getUTCDay();return addDays(day,-((weekday+6)%7));}
export const canonical=d=>searchKey(d.canonicalName||d.name);
export function isVerified(d,now=new Date()){
 const v=d?.verification,today=dayKey(now);
 const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
 const venue=restaurantById.get(d?.restaurantId);
 return !!(!hasOpenConflict(d)&&venue&&venue.areaId===d.areaId&&venue.name===d.restaurant&&v?.status==='verified'&&hasValidityEvidence(d,now)&&hasFieldEvidence(d,'restaurant',now)&&[v.checkedAt,v.validFrom,v.validUntil].every(validDate)&&v.checkedAt<=today&&v.validFrom<=today&&v.validUntil>=today&&v.validFrom<=v.validUntil);
}
export function availability(d,now=new Date()){if(hasOpenConflict(d))return 'conflict';if(isVerified(d,now))return 'verified';return d?.verification?.status==='verified'?'review':d?.verification?.status??'pending';}
export const isRecommendable=(d,meal,now=new Date())=>isMainInspiration(d,meal);
export function defaultFilters(now=new Date()){return {meal:mealForTime(now),restaurants:[],tastes:[],categories:[],query:'',favoritesOnly:false};}
const any=(selected,values)=>!selected?.length||selected.some(v=>values.includes(v));
export const restaurantLabels=d=>[d.restaurant,(areas.find(a=>a.id===d.areaId)?.name??'')+'餐厅'];
export function getCandidates(filters={},state={},now=new Date(),records=dishes){
 if(filters.restaurants?.length)return []; // Old supplier filters must be explicitly migrated by the route/state boundary.
 const excluded=state.excluded?.date===dayKey(now)?state.excluded.ids:[];
 const terms=normalizeLabel(filters.query).split(/\s+/).filter(Boolean).map(searchKey);
 return records.filter(d=>{
  const taste=suggestedTastes(d);
  const fields=[d.name,d.canonicalName,...(d.aliases??[]),...(d.inspiration?.searchAliases??[]),...(d.components??[]).map(c=>c.name),...taste,d.category].map(searchKey);
  return isPublished(d)&&(!filters.meal||suggestedMeals(d).includes(filters.meal))
   &&any(filters.tastes,taste.length?taste:['未标注'])&&any(filters.categories,[d.category])
   &&(!filters.favoritesOnly||state.favorites?.includes(d.id))&&!excluded?.includes(d.id)
   &&terms.every(term=>fields.some(value=>value.includes(term)));
 });
}
