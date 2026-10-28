import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {dishes,defaultFilters} from '../dist/meal-engine.js';import {createState} from '../dist/personal-state.js';
import {drawMarkup} from '../dist/draw-view.js';import {inspirationDetailMarkup} from '../dist/dish-detail.js';import {recipeSummary} from '../dist/nutrition-view.js';
const state=createState(),filters=defaultFilters();
test('every menu record opens its own substantive introduction, including dishes without an energy estimate',()=>{
 assert.equal(dishes.length,260);assert.equal(new Set(dishes.map(d=>d.inspiration.editorialId)).size,260);
 assert.equal(new Set(dishes.map(d=>d.inspiration.description)).size,252);
 for(const d of dishes){assert(d.inspiration.description.length>=30);assert(d.inspiration.choosingTip.length>=15);const html=inspirationDetailMarkup(d,state,'lunch');assert(html.includes(d.inspiration.description));assert(html.includes(d.inspiration.choosingTip));assert(html.includes('怎么选，怎么搭'));assert(recipeSummary(d,state).includes(d.inspiration.description));assert(!d.inspiration.description.includes('作为一份熟悉的选餐灵感'));}
 const congee=dishes.find(d=>d.name==='皮蛋瘦肉粥');assert(congee.inspiration.description.includes('皮蛋'));assert(congee.inspiration.description.includes('瘦肉'));assert.equal(congee.price,null);assert.deepEqual(congee.ingredients,[]);
});
test('a stale three-choice argument cannot expose withdrawn controls or result cards',()=>{const html=drawMarkup({dish:dishes[0],available:3,total:260,groupCount:252,filters,state,busy:false,reasons:{},drawMode:3,selection:dishes.slice(0,3).map(d=>d.id)}).html;assert(!/三选一|data-mode|candidate|三个都不错|只换这道/.test(html));assert.equal((html.match(/id="resultName"/g)||[]).length,1);assert(html.includes('id="exploration"'));assert(html.includes('data-scene-meal='));});
test('editorial prose stays separate from factual evidence, price, identity and nutrition calculations',()=>{const source=JSON.parse(fs.readFileSync(new URL('../dist/data/menu.json',import.meta.url),'utf8'));for(const d of source){assert.equal(d.inspiration.editorialId,'editorial-'+d.id);assert.equal(d.verification.status,'pending');assert.equal(d.price,null);assert.deepEqual(d.ingredients,[]);}assert.equal(new Set(source.map(d=>d.imageId)).size,260);});
