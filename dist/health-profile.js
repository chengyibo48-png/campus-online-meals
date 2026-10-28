// Optional local-only reference profile; no clinical diagnoses or calorie prescriptions.
export const activityLabels={light:'日常活动较少',moderate:'规律走动或运动',active:'活动较多'};
export const goalLabels={balanced:'均衡饮食',weight:'体重管理',sport:'支持运动'};
const optionalNumber=(value,min,max)=>value===null||value===undefined||value===''?null:typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max?value:null;
export function normalizeProfile(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 return {heightCm:optionalNumber(value.heightCm,100,230),weightKg:optionalNumber(value.weightKg,25,350),ageYears:optionalNumber(value.ageYears,1,110),activity:Object.hasOwn(activityLabels,value.activity)?value.activity:'light',goal:Object.hasOwn(goalLabels,value.goal)?value.goal:'balanced',generalAdult:value.generalAdult===true,enabled:value.enabled===true,measuredAt:/^\d{4}-\d{2}-\d{2}$/.test(value.measuredAt??'')&&Number.isFinite(Date.parse(value.measuredAt))?value.measuredAt:null};
}
export function validateProfile(value){
 const profile=normalizeProfile(value);if(!profile)throw Error('身体资料结构无效');
 for(const [key,min,max,label] of [['heightCm',100,230,'身高'],['weightKg',25,350,'体重'],['ageYears',1,110,'年龄']]){
  const n=value[key];if(n!==null&&n!==undefined&&n!==''&&(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max))throw Error(`${label}请填写${min}—${max}之间的数值，或留空`);
 }
 if(value.ageYears!==null&&value.ageYears!==undefined&&value.ageYears!==''&&!Number.isInteger(value.ageYears))throw Error('年龄请填写整数周岁，或留空');
 if(value.measuredAt!==null&&value.measuredAt!==undefined&&value.measuredAt!==''){const v=value.measuredAt;if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T12:00:00Z'))||new Date(v+'T12:00:00Z').toISOString().slice(0,10)!==v)throw Error('测量日期无效');}
 return profile;
}
export const canPersonalize=profile=>!!(profile?.enabled&&profile.generalAdult&&profile.ageYears>=18&&profile.ageYears<65);
export function bmiReference(profile){
 if(!profile||!profile.generalAdult||profile.ageYears<18||profile.ageYears>=65||!profile.heightCm||!profile.weightKg)return null;
 const raw=profile.weightKg/(profile.heightCm/100)**2;
 return {value:Math.round(raw*10)/10,label:raw<18.5?'低于成人参考范围':raw<24?'位于成人参考范围':raw<28?'高于成人参考范围':'高于成人参考范围',note:'BMI是体重参考指标，不能单独判断健康或诊断。',source:'https://www.nhc.gov.cn/xcs/c100122/202503/27b26d397f4941ff8ff3846ef40026ee.shtml'};
}
