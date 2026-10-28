// Stable identities describe places, not current food availability.
export const areas=[{id:'juyuan',name:'菊园'},{id:'songyuan',name:'松园'},{id:'liuyuan',name:'柳园'},{id:'heyuan',name:'荷园'}];
export const restaurantRegistry=[
 {id:'qiusuiyuan',areaId:'juyuan',name:'秋穗园餐厅'},
 {id:'jinggeyuan',areaId:'songyuan',name:'竞舸园餐厅'},
 {id:'juyingyuan',areaId:'liuyuan',name:'聚英园餐厅'},
 {id:'fenghuayuan',areaId:'liuyuan',name:'风华园餐厅'},
 {id:'heyuan-1',areaId:'heyuan',name:'荷园一餐厅'},
 {id:'heyuan-2',areaId:'heyuan',name:'荷园二餐厅'}
];
export const restaurantById=new Map(restaurantRegistry.map(v=>[v.id,v]));
export const commercialStreet={id:'main-campus-commercial-street',kind:'district',areaId:'heyuan',name:'主校区商业街',location:'荷园生活区附近；2025年指南记载为荷六与荷一之间',description:'食物之外，也装着校园的日常。商业街是餐饮小吃与生活服务街区，具体商户和营业情况请到现场确认。',source:'https://www7.zzu.edu.cn/yxwz/zzzd.htm',sourceTitle:'郑州大学迎新网：住在郑大',historicalSource:'https://www5.zzu.edu.cn/mkszy/info/1018/6272.htm',checkedAt:'2026-10-23'};
export const placeRegistry=[...restaurantRegistry.map(v=>({...v,kind:'restaurant'})),commercialStreet];
