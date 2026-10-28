import {dishes,dishById,mealNames,restaurants,tastes,categories,dayKey,defaultFilters,isVerified,getCandidates,weekStart,addDays,availability,canonical} from './menu-query.js';
import {restaurantLabels,isRecommendable,knownValues,suggestedTastes} from './menu-query.js';
import {dietAssessment} from './nutrition.js';
export {dishes,dishById,mealNames,restaurants,tastes,categories,dayKey,defaultFilters,isVerified,isPublished,isRecommendable,getCandidates,weekStart,addDays,availability,canonical,mealForTime,knownValues,hasFieldEvidence,suggestedMeals,suggestedTastes} from './menu-query.js';
export function recommend(filters,state={},options={}){
 const {count=1,now=new Date(),random=Math.random,records=dishes,excludeIds=[]}=options,lookup=new Map(records.map(d=>[d.id,d])),all=getCandidates(filters,state,now,records).filter(d=>isRecommendable(d,filters.meal,now)),excludedNames=new Set(excludeIds.map(id=>lookup.get(id)).filter(Boolean).map(canonical));
 let pool=all.filter(d=>!excludeIds.includes(d.id)&&!excludedNames.has(canonical(d)));
 const recent=new Set((state.recentRecommendations??[]).map(id=>lookup.get(id)).filter(Boolean).map(canonical));
 const eaten=new Set((state.history??[]).map(e=>canonical(lookup.get(e.dishId)??{name:e.snapshot?.name??e.dishId}))),selected=[],reasons={},usedCategories=new Set();let repeated=false;
 while(pool.length&&selected.length<count){
  const fresh=pool.filter(d=>!recent.has(canonical(d)));let eligible=fresh.length?fresh:pool;if(!fresh.length)repeated=true;
  const mode=state.preferences?.exploration??'steady',preferred=eligible.filter(d=>mode==='new'?!eaten.has(canonical(d)):state.favorites?.includes(d.id)||(state.ratings?.[d.id]??0)>=4);if(preferred.length)eligible=preferred;
  const liked=eligible.filter(d=>suggestedTastes(d).some(t=>state.preferences?.likedTastes?.includes(t)));if(liked.length)eligible=liked;
  const diverse=eligible.filter(d=>!usedCategories.has(d.category));if(diverse.length)eligible=diverse;
  const assessments=eligible.map(d=>({dish:d,...dietAssessment(d,state,records)}));if(assessments.some(a=>a.active)){const best=Math.max(...assessments.map(a=>a.score));eligible=assessments.filter(a=>a.score===best).map(a=>a.dish);}
  const dish=eligible[Math.min(eligible.length-1,Math.max(0,Math.floor(random()*eligible.length)))];
  reasons[dish.id]=[!recent.has(canonical(dish))?'最近三次没选过':'当前候选较少，允许再次推荐',mode==='new'&&!eaten.has(canonical(dish))?'饭本里还没尝试过':state.favorites?.includes(dish.id)?'从你的收藏里选出':(state.ratings?.[dish.id]??0)>=4?'你给过较高评分':null,suggestedTastes(dish).some(t=>state.preferences?.likedTastes?.includes(t))?'符合你的口味偏好':null,...dietAssessment(dish,state,records).notes].filter(Boolean);
  selected.push(dish);usedCategories.add(dish.category);pool=pool.filter(d=>canonical(d)!==canonical(dish));
 }
 return {dishes:selected,reasons,repeated,count:all.length};
}
export function generatePlan(state,filters,{start=weekStart(),now=new Date(),random=Math.random,records=dishes}={}){
 const slots={...state.plan},working={...state,recentRecommendations:[...(state.recentRecommendations??[])]};let empty=0,repeated=0;
 for(let day=0;day<7;day++)for(const meal of Object.keys(mealNames)){
  const date=addDays(start,day),key=date+':'+meal;if(slots[key]?.locked)continue;
  if(date<dayKey(now)){slots[key]=slots[key]??{date,meal,dishId:null,locked:false,notice:'过去日期不自动安排'};if(!slots[key].dishId)empty++;continue;}
  const slotTime=new Date(date+'T12:00:00+08:00');
  const result=recommend({...filters,meal},working,{now:slotTime,random,records}),dish=result.dishes[0];slots[key]={date,meal,dishId:dish?.id??null,locked:false,notice:dish?(result.repeated?'候选较少，本周允许重复':''):'当前条件没有适合这餐的主餐灵感'};
  if(dish)working.recentRecommendations=[...working.recentRecommendations,dish.id].slice(-3);else empty++;if(result.repeated)repeated++;
 }return {slots,empty,repeated};
}
