import {escapeText as esc,icon,imageMarkup} from './assets.js';
import {suggestedTastes,inspirationSummary} from './inspiration-model.js';
import {mealNames,dayKey} from './menu-query.js';
import {recipeSummary} from './nutrition-view.js';

// There is one result throughout the UI; no hidden multi-draw mode or candidates.
export function drawMarkup({dish:d,available,total,groupCount,filters,state,busy,reasons,phase='idle'}){
 const decision=d&&state.decisions[dayKey()+':'+filters.meal],same=!!d&&decision?.dishId===d.id;
 const drawText=busy?'正在挑选…':'换个灵感';
 const actions=`<div class="main-actions" id="mainActions"><button id="drawBtn" data-action="draw" class="button primary" ${!available||busy?'disabled':''}>${icon('shuffle')}${d?drawText:'选一餐'}</button>${d?`<button data-action="decide" data-id="${d.id}" class="button ticket-button" ${same||busy?'disabled':''}>${icon('check')}${same?'本餐已决定':decision?'替换本餐':'就吃这个'}</button>`:'<button class="button secondary" data-action="clear-filters">清除筛选</button>'}</div>`;
 const html=`<div class="mode-bar"><label class="mode-label"><span>选餐偏好</span><select id="exploration" aria-label="推荐偏好"><option value="steady" ${state.preferences.exploration==='steady'?'selected':''}>稳妥一点</option><option value="new" ${state.preferences.exploration==='new'?'selected':''}>尝点新的</option></select></label></div>
 <div class="hero" data-long-name="${(d?.name.length??0)>10}" data-draw-phase="${phase}" aria-busy="${busy}">
  <div class="food-stage" data-scene-meal="${filters.meal}">
   <span class="window-light" aria-hidden="true"></span><span class="scene-stamp">${icon('bowl')}${mealNames[filters.meal]}饭票</span>
   <div class="table-mat" aria-hidden="true"></div><div class="food-contact-shadow" aria-hidden="true"></div>
   <div class="dish-on-table">${d?imageMarkup({...d,thumbnail:null},{lazy:false}):`<div class="empty-plate">${icon('bowl')}<span>给新的口味留个位置</span></div>`}</div>
   <div class="reveal-ticket" aria-hidden="true"><span>下一餐</span><strong>揭开你的饭票</strong>${icon('bowl')}</div><span class="scene-caption">餐品示意</span>
  </div>
  <div class="story"><div class="meal-kicker"><span class="small-dot"></span>${mealNames[filters.meal]}，留给喜欢的味道</div>
   <h2 id="resultName">${d?esc(d.name):'暂时没有合适的一餐'}</h2><p class="intro">${d?esc(inspirationSummary(d)):'试试减少筛选，或恢复今天跳过的餐品。'}</p>
   ${d?`<div class="tags"><span class="tag category-tag">${esc(d.category)}</span>${suggestedTastes(d).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><p class="recommend-note">${icon('check')}${esc((reasons[d.id]??['给今天一个新的选餐灵感'])[0])}</p><div class="result-toolbar"><button class="text-button favorite-button" aria-pressed="${state.favorites.includes(d.id)}" data-action="favorite" data-id="${d.id}">${icon('heart')}${state.favorites.includes(d.id)?'已收藏':'先收藏'}</button><button class="text-button" data-action="exclude" data-id="${d.id}">今天跳过</button><button class="text-button" data-action="detail" data-id="${d.id}">菜品详情</button></div>`:''}
   ${actions}<p class="under-actions">餐品示意，供应未核对。决定后，吃过再记一笔。</p>${d?recipeSummary(d,state):''}
   ${same?`<div class="decision-hint">${decision.eatenAt?'已经记进你的饭本':'这一餐安排好啦'}${!decision.eatenAt?`<button class="text-button" data-action="eaten" data-key="${dayKey()+':'+filters.meal}">我吃过了 ${icon('check')}</button>`:''}</div>`:''}
  </div>
 </div>
 <div class="draw-bottom"><div><strong>${groupCount}</strong><span>种不同菜名，慢慢挑喜欢的</span></div><a href="#/menu?scope=all">逛完整菜单 ${icon('arrow')}</a><span class="small muted">${total}份灵感 · 每条独立示意图</span></div>`;
 return {html,floating:`<button class="button primary" data-action="draw" ${!available||busy?'disabled':''}>${icon('shuffle')}${drawText}</button>${d?`<button class="button ticket-button" data-action="decide" data-id="${d.id}" ${same||busy?'disabled':''}>${same?'本餐已决定':'就吃这个'}</button>`:''}`};
}
