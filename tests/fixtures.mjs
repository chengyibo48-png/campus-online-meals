import {readFileSync} from 'node:fs';
import {restaurantRegistry} from '../dist/venue-registry.js';
const fit=JSON.parse(readFileSync(new URL('../dist/data/image-fit.json',import.meta.url),'utf8'));
const source=JSON.parse(readFileSync(new URL('../dist/data/menu.json',import.meta.url),'utf8'));
// Synthetic assertions are isolated from the production catalog and rejected by release validation.
export const fixtures=source.slice(0,32).map((d,i)=>{
 const venue=restaurantRegistry.find(v=>v.areaId===d.areaId)??restaurantRegistry[i%restaurantRegistry.length],evidenceId='qa-evidence-'+i;
 const known={status:'known',evidenceIds:[evidenceId],note:'Synthetic field evidence only'};
 return {...d,inspiration:{...d.inspiration,suggestedMeals:i<28?['breakfast','lunch','dinner']:[d.legacy.meal],flavorTags:i%2?['咸香','香辣']:['清淡'],mealRole:'main'},imageFit:fit[d.id],areaId:venue.areaId,restaurantId:venue.id,restaurant:venue.name,mealTypes:i<28?['breakfast','lunch','dinner']:[d.legacy.meal],tastes:i%2?['咸香','香辣']:['清淡'],category:i%3===0?'汤粥':i%3===1?'米饭套餐':'面食粉类',fieldEvidence:{...d.fieldEvidence,restaurant:{...known},mealTypes:{...known},tastes:{...known}},verification:{status:'verified',checkedAt:'2026-01-01',validFrom:'2026-01-01',validUntil:'2099-12-31',validityBasis:{kind:'source-explicit',evidenceId},conflicts:[],evidence:[{id:evidenceId,kind:'official-menu',url:'https://example.invalid/qa-menu',title:'合成测试证据，不代表真实菜单',publisher:'Isolated test',publishedAt:'2026-01-01',accessedAt:'2026-01-01',validRange:{from:'2026-01-01',until:'2099-12-31'},fields:['restaurant','mealTypes','tastes'],locator:'仅供隔离自动测试',confirmedBy:'synthetic-test',confirmedAt:'2026-01-01',restaurantId:venue.id,menuItemName:d.name}]},testOnly:true};
});
export const now=new Date('2026-10-21T12:00:00+08:00');
