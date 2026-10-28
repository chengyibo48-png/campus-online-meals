import {dayKey,addDays} from './meal-engine.js';
import {escapeText as esc,icon} from './assets.js';

export function shiftMonth(month,offset){
 const [year,m]=month.split('-').map(Number);
 const next=new Date(Date.UTC(year,m-1+offset,1));
 return next.toISOString().slice(0,7);
}
export function monthDays(month){
 const first=month+'-01',start=addDays(first,-((new Date(first+'T12:00:00+08:00').getUTCDay()+6)%7));
 return Array.from({length:42},(_,i)=>addDays(start,i));
}
export function calendarMarkup(month,history,selected='',today=dayKey()){
 const counts=new Map();for(const e of history)counts.set(e.date,(counts.get(e.date)??0)+1);
 return `<section class="calendar" aria-label="实际用餐月历"><div class="calendar-header"><button class="icon-button" data-action="calendar-prev" aria-label="上个月">${icon('arrow')}</button><h3 aria-live="polite">${Number(month.slice(0,4))}年${Number(month.slice(5))}月</h3><button class="icon-button" data-action="calendar-next" aria-label="下个月">${icon('arrow')}</button><button class="text-button" data-action="calendar-today">回到本月</button></div><div class="calendar-weekdays" aria-hidden="true">${['一','二','三','四','五','六','日'].map(d=>`<span>${d}</span>`).join('')}</div><div class="calendar-grid">${monthDays(month).map(date=>{const count=counts.get(date)??0;return `<button data-action="calendar-day" data-value="${date}" class="calendar-day ${date.startsWith(month)?'':'outside'} ${count?'has-meal':''}" aria-pressed="${selected===date}" ${date===today?'aria-current="date"':''} aria-label="${esc(date)}，${count?count+'次实际用餐':'无用餐记录'}"><span>${Number(date.slice(-2))}</span><small>${count?count+'餐':''}</small></button>`;}).join('')}</div><p class="small muted">圆点标记实际吃过的日期，计划和决定不计入。</p></section>`;
}
