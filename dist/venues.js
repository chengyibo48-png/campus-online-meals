// Verified restaurant identities; not a claim of current dish availability.
export const venues=[
  {
    "area": "柳园",
    "name": "聚英园餐厅 / 风华园餐厅",
    "description": "位于主校区柳园生活区。学校迎新资料说明柳园位于四个生活园区的南端，其西侧设有两个食堂。2026年9月后勤公告再次出现聚英园与风华园。",
    "location": "主校区柳园生活区西侧",
    "filterName": "柳园餐厅",
    "checkedAt": "2026-10-22",
    "source": "https://www7.zzu.edu.cn/hqbzzx/info/1275/2573.htm",
    "sourceTitle": "郑州大学后勤保障部风华园餐厅辅助商户遴选公告"
  },
  {
    "area": "荷园",
    "name": "荷园一餐厅 / 荷园二餐厅",
    "description": "位于主校区荷园生活区。学校2026年暑期通知列明荷园一、二餐厅，荷园项目公司秋季动态确认餐饮部继续开展食品安全管理工作。",
    "location": "主校区荷园生活区",
    "filterName": "荷园餐厅",
    "checkedAt": "2026-10-22",
    "source": "https://www5.zzu.edu.cn/zxhq/info/1037/2658.htm",
    "sourceTitle": "荷园餐厅开展秋季食品安全员专题培训"
  },
  {
    "area": "菊园",
    "name": "秋穗园餐厅",
    "description": "位于主校区菊园生活区。学校迎新资料将菊园定位于中心体育馆与松园之间，2026年暑期后勤通知列明秋穗园一楼。",
    "location": "主校区菊园生活区",
    "filterName": "菊园餐厅",
    "checkedAt": "2026-10-22",
    "source": "https://new.zzu.edu.cn/info/1442/88712.htm",
    "sourceTitle": "2026年暑期后勤服务保障工作安排"
  },
  {
    "area": "松园",
    "name": "竞舸园餐厅",
    "description": "位于主校区松园生活区。学校迎新资料说明松园是四个生活园区中最北侧的区域，其配套设施表列有竞舸园。",
    "location": "主校区松园生活区",
    "filterName": "松园餐厅",
    "checkedAt": "2026-10-22",
    "source": "https://www7.zzu.edu.cn/yxwz/zzzd.htm",
    "sourceTitle": "住在郑大"
  }
];
export const locationClaims=[
  {
    "id": "heyuan-commercial-street-2025",
    "name": "主校区商业街",
    "campus": "郑州大学主校区",
    "area": "荷园",
    "location": "荷园生活园区荷六与荷一之间",
    "sourceId": "historical-guide-2025",
    "sourcePublishedAt": "2025-08-31",
    "accessedAt": "2026-10-22",
    "locator": "Part.3报道篇→商业街段落",
    "status": "historical-location-reference",
    "currentIdentityVerified": false,
    "validRange": null,
    "bindsLegacyDishRecords": false,
    "note": "仅记录该指南所述位置；不确认2026秋具体商户，不把旧库15条商业街餐品直接绑定该地点或任何商户。"
  }
];
export const audit={
  "checkedAt": "2026-10-22",
  "summary": "餐厅位置资料与菜品灵感分开。260条记录作为通用选餐灵感发布；供应核实状态仍如实保留，不代表实时在售。",
  "currentVerifiedDishCount": 0,
  "counts": {
    "verified": 0,
    "pending": 260,
    "review": 0,
    "disabled": 0,
    "conflict": 0
  },
  "statistics": {
    "publishedRecordCount": 260,
    "publishedGroupCount": 252,
    "checkedAt": "2026-10-22",
    "recordCount": 260,
    "groupCount": 252,
    "verifiedRecordCount": 0,
    "verifiedGroupCount": 0,
    "counts": {
      "verified": 0,
      "pending": 260,
      "review": 0,
      "disabled": 0,
      "conflict": 0
    },
    "recommendableByMeal": {
      "breakfast": 65,
      "lunch": 171,
      "dinner": 165
    },
    "unknownFields": {
      "restaurant": 260,
      "mealTypes": 260,
      "tastes": 260,
      "price": 260,
      "ingredients": 260
    },
    "imageCount": 260,
    "imageMissingCount": 0
  },
  "claimsMenuExpansion": false
};
