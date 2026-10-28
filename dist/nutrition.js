import {canPersonalize} from './health-profile.js';
import {nutritionFoods} from './nutrition-foods.js';
export const ingredientFood=item=>nutritionFoods[item.foodId]??item;
export const nutritionSource='https://www.nhc.gov.cn/sps/c100088/202505/6b7a718abd4848e8a3e98fc561a8858b.shtml';
export function estimateEnergy(recipe){
 if(!recipe||recipe.status!=='reviewed'||!Array.isArray(recipe.ingredients)||!recipe.ingredients.length||!Number.isFinite(recipe.servings)||recipe.servings<=0)return null;
 let low=0,high=0;
 for(const item of recipe.ingredients){const food=ingredientFood(item);if(!food.sourceId||!food.sourceUrl?.startsWith('https://fdc.nal.usda.gov/')||!['raw','cooked','as-served'].includes(item.state)||item.state!==food.state||!Number.isFinite(food.kcalPer100g)||food.kcalPer100g<0||!Array.isArray(item.grams)||item.grams.length!==2||!item.grams.every(Number.isFinite)||item.grams[0]<0||item.grams[1]<item.grams[0])return null;low+=item.grams[0]*food.kcalPer100g/100;high+=item.grams[1]*food.kcalPer100g/100;}
 return {low:Math.floor(low/recipe.servings/10)*10,high:Math.ceil(high/recipe.servings/10)*10,unit:'千卡/参考份'};
}
export const energyLabel=recipe=>{const value=estimateEnergy(recipe);return value?`${value.low}–${value.high} 千卡`:'暂无可靠估算';};
export function dietAssessment(dish,state={},records=[]){
 const recipe=dish?.referenceRecipe,notes=[],tags=recipe?.foodGroups??[];let score=0;
 if(!canPersonalize(state.profile))return {score,notes,active:false};
 if(!recipe||recipe.status!=='reviewed')return {score,notes:['参考配方资料不足，可向窗口确认搭配'],active:true};
 if(tags.includes('vegetables')){score+=1;notes.push('常见搭配含蔬菜，可按实际份量再补足');}else notes.push('可另外搭配一份蔬菜');
 if(tags.includes('whole-grain')){score+=2;notes.push('含杂粮参考搭配，增加谷物种类');}
 if(state.profile.goal==='sport'||state.profile.activity==='active'){if(tags.includes('protein')){score+=2;notes.push('含蛋、肉或豆类参考搭配，适合与主食一起选');}else notes.push('可搭配鸡蛋、豆制品或其他蛋白质食物');}
 const previous=(state.history??[]).slice(0,3).map(e=>records.find(d=>d.id===e.dishId)).filter(Boolean);
 if(recipe?.method?.includes('炸')&&(state.profile.goal==='weight'||previous.some(d=>d.referenceRecipe?.method?.includes('炸')))){score-=2;notes.push('近期可少选连续油炸，换一道蒸煮主食');}
 if(!recipe||recipe.status!=='reviewed')notes.push('参考配方资料不足，不能判断完整搭配');
 return {score,notes:[...new Set(notes)].slice(0,3),active:true};
}
