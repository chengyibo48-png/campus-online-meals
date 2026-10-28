import {defaultFilters,mealNames,restaurants,tastes,categories} from './meal-engine.js';
export function readRoute(hash,defaults=defaultFilters()){
 const raw=hash.replace(/^#\/?/,''),[path,query='']=raw.split('?'),params=new URLSearchParams(query),view=['draw','menu','restaurants','mine'].includes(path)?path:'draw';
 const filters={...defaults,restaurants:[],tastes:[...(defaults.tastes??[])],categories:[...(defaults.categories??[])]};
 if(params.has('meal')&&Object.hasOwn(mealNames,params.get('meal')))filters.meal=params.get('meal');
 for(const key of ['tastes','categories'])if(params.has(key))filters[key]=params.getAll(key).filter(Boolean).map(v=>v.slice(0,100));
 const legacyRestaurantFilters=params.has('restaurants')?params.getAll('restaurants').filter(Boolean).map(v=>v.slice(0,100)):[];
 if(params.has('q'))filters.query=params.get('q').slice(0,100);if(params.has('favorites'))filters.favoritesOnly=params.get('favorites')==='1';
 return {view,filters,legacyRestaurantFilters,menuAllMeals:view==='menu'&&(params.get('scope')==='all'||!params.has('meal')),menuMainOnly:view==='menu'&&params.get('main')==='1',dishId:params.get('dish'),tab:['today','profile','plan','favorites','history','settings'].includes(params.get('tab'))?params.get('tab'):'today'};
}
export function routeUrl(view,filters,extra={}){
 const p=new URLSearchParams();if(filters){p.set('meal',filters.meal);for(const key of ['tastes','categories']){if(!filters[key]?.length)p.set(key,'');else filters[key].forEach(v=>p.append(key,v));}p.set('q',filters.query??'');p.set('favorites',filters.favoritesOnly?'1':'0');}
 for(const [key,v] of Object.entries(extra))if(v)p.set(key,v);return '#/'+view+(p.size?'?'+p.toString():'');
}
