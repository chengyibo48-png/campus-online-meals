import test from 'node:test';
import assert from 'node:assert/strict';
import {fixtures,now} from './fixtures.mjs';
import {hasFieldEvidence,fieldEvidenceProblems,knownValues,sourceProblems} from '../dist/food-model.js';
import {isVerified,isRecommendable,getCandidates,recommend,defaultFilters} from '../dist/meal-engine.js';
import {createState} from '../dist/personal-state.js';
import {verifiedDetailMarkup} from '../dist/dish-detail.js';
import {auditMenu} from '../scripts/lib/menu-audit.mjs';
const copy=x=>structuredClone(x),first=fixtures[0],filters={...defaultFilters(now),meal:'lunch'};
function separateField(field,patch={}){
 const d=copy(first),source={...d.verification.evidence[0],id:'separate-'+field,fields:[field],...patch};
 d.verification.evidence.push(source);d.fieldEvidence[field]={status:'known',evidenceIds:[source.id]};return d;
}
test('each field source needs its own publisher, real dates, locator, safe URL and matching identity',()=>{
 for(const patch of [{publisher:''},{publishedAt:'2026-02-30'},{accessedAt:'2099-01-01'},{publishedAt:'2026-02-01'},{locator:''},{url:'https://account:secret@example.org/menu'},{url:'http://example.org/menu'},{restaurantId:'wrong'},{menuItemName:'another dish'}]){
  const d=separateField('tastes',patch);assert(isVerified(d,now));assert(!hasFieldEvidence(d,'tastes',now));assert.deepEqual(knownValues(d,'tastes',now),[]);assert(auditMenu([d],{asOf:now,allowTestData:true}).errors.some(e=>e.includes('tastes')));
 }
});
test('a qualified identity menu cannot lend its dates or period to a different meal source',()=>{
 for(const patch of [{validRange:null},{validRange:{from:'2026-01-01',until:'2026-10-20'}},{publisher:''},{accessedAt:'2026-10-22'}]){
  const d=separateField('mealTypes',patch);assert(isVerified(d,now));assert(!hasFieldEvidence(d,'mealTypes',now));assert.equal(knownValues(d,'mealTypes',now).length,0);
 }
});
test('every cited field reference must qualify; valid extra sources cannot mask missing or duplicate references',()=>{
 const d=separateField('mealTypes');assert(isRecommendable(d,'lunch',now));d.fieldEvidence.mealTypes.evidenceIds.push('missing');assert(!hasFieldEvidence(d,'mealTypes',now));
 d.fieldEvidence.mealTypes.evidenceIds=['separate-mealTypes','separate-mealTypes'];assert(fieldEvidenceProblems(d,'mealTypes',{now}).some(x=>x.includes('重复')));
 d.fieldEvidence.mealTypes.evidenceIds=['separate-mealTypes'];d.verification.evidence.push(copy(d.verification.evidence.at(-1)));assert(!hasFieldEvidence(d,'mealTypes',now));
});
test('a source covering a different field cannot supply taste or price facts',()=>{
 const d=separateField('price',{fields:['restaurant']});d.price={amount:12,currency:'CNY',unit:'份'};assert(!hasFieldEvidence(d,'price',now));const html=verifiedDetailMarkup(d,createState(now),'lunch');assert(!html.includes('12元/份'));assert(html.includes('尚未确认'));
});
test('semester evidence requires an independently dated calendar and matching term for every field',()=>{
 const d=copy(first),id=d.verification.evidence[0].id;d.verification.validFrom='2026-09-07';d.verification.validUntil='2027-01-17';
 d.verification.validityBasis={kind:'semester',menuEvidenceId:id,calendarEvidenceId:'calendar'};d.verification.evidence[0].validRange=null;d.verification.evidence[0].term='2026-autumn';
 d.verification.evidence.push({id:'calendar',kind:'academic-calendar',url:'https://example.invalid/calendar',publisher:'Synthetic calendar',publishedAt:'2026-01-01',accessedAt:'2026-01-01',locator:'first semester',term:'2026-autumn',validRange:{from:'2026-09-07',until:'2027-01-17'}});
 assert(isVerified(d,now));for(const patch of [{publisher:''},{accessedAt:'2099-01-01'},{term:'2025-autumn'},{validRange:{from:'2026-09-07',until:'2026-10-20'}}]){const bad=copy(d);Object.assign(bad.verification.evidence[1],patch);assert(!isVerified(bad,now));}
 const different=copy(d),source={...different.verification.evidence[0],id:'other-meal-menu',fields:['mealTypes'],term:'2025-autumn'};different.verification.evidence.push(source);different.fieldEvidence.mealTypes.evidenceIds=[source.id];assert(isVerified(different,now));assert(!hasFieldEvidence(different,'mealTypes',now));
});
test('window-menu photos require actual capture date and concrete location in addition to publication',()=>{
 const d=copy(first),source=d.verification.evidence[0];source.kind='window-photo';assert(sourceProblems(d,source,{now}).length);source.capturedAt='2026-01-01';source.location='Synthetic test restaurant, menu board';assert(isRecommendable(d,'lunch',now));source.capturedAt='2026-01-02';assert(!isVerified(d,now));
});
test('a new inspiration uses explicitly edited suggested meals independently of verified meal facts and supports image-free fallback',()=>{
 const d=copy(first);d.id='dish-synthetic-new-record';d.name=d.canonicalName='Synthetic new dish';d.dishGroupId='group-synthetic-new';d.aliases=[];d.mealTypes=['breakfast'];d.inspiration={...d.inspiration,suggestedMeals:['breakfast']};d.image=d.imageId=d.thumbnail=null;d.testOnly=false;delete d.legacy;
 for(const e of d.verification.evidence){e.url='https://example.org/synthetic-menu';e.menuItemName=d.name;}
 assert.equal(auditMenu([d],{asOf:now}).errors.length,0);assert(isRecommendable(d,'breakfast',now));assert(!isRecommendable(d,'lunch',now));assert.equal(recommend({...filters,meal:'breakfast'},createState(now),{now,records:[d]}).dishes[0].id,d.id);assert(verifiedDetailMarkup(d,createState(now),'breakfast').includes('暂缺图片'));
});
test('test placeholder domains cannot qualify a production record even when another public source exists',()=>{
 const d=copy(first);d.testOnly=false;d.verification.evidence.push({...d.verification.evidence[0],id:'other',url:'https://example.org/synthetic-other'});assert(!isVerified(d,now));assert(auditMenu([d],{asOf:now}).errors.length);
});
