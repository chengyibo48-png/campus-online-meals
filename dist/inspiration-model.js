// Editorial suggestions are separate from verified restaurant facts.
export const roles={main:'主餐灵感',side:'配菜小食',dessert:'甜点时间',drink:'饮品'};
const meals=['breakfast','lunch','dinner'];
export const isPublished=d=>!!(d&&d.inspiration?.status==='published'&&typeof d.name==='string'&&d.name.trim()&&Object.hasOwn(roles,d.inspiration.mealRole)&&Array.isArray(d.inspiration.suggestedMeals)&&d.inspiration.suggestedMeals.every(m=>meals.includes(m))&&Array.isArray(d.inspiration.flavorTags)&&d.inspiration.flavorTags.every(t=>typeof t==='string'&&t.trim()));
export const suggestedMeals=d=>isPublished(d)?[...new Set(d.inspiration.suggestedMeals)]:[];
export const suggestedTastes=d=>isPublished(d)?[...new Set(d.inspiration.flavorTags.filter(t=>typeof t==='string'))]:[];
export const inspirationSummary=d=>isPublished(d)?d.inspiration.summary??'从今天想吃的口味出发。':'';
export const isMainInspiration=(d,meal)=>isPublished(d)&&d.inspiration.mealRole==='main'&&meals.includes(meal)&&suggestedMeals(d).includes(meal)&&d.mealSuitability?.kind!=='accompaniment'&&(d.mealSuitability?.kind!=='breakfast-staple'||meal==='breakfast');
