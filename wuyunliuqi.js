// ========== 五运六气计算引擎 ==========

const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// 天干化五运
const GAN_YUN_MAP = {
  '甲':{yun:'土',taiGuo:true}, '己':{yun:'土',taiGuo:false},
  '乙':{yun:'金',taiGuo:false},'庚':{yun:'金',taiGuo:true},
  '丙':{yun:'水',taiGuo:true}, '辛':{yun:'水',taiGuo:false},
  '丁':{yun:'木',taiGuo:false},'壬':{yun:'木',taiGuo:true},
  '戊':{yun:'火',taiGuo:true}, '癸':{yun:'火',taiGuo:false},
};

// 地支 → 司天/在泉
const ZHI_SITIAN_MAP = {
  '子':'少阴君火','午':'少阴君火',
  '丑':'太阴湿土','未':'太阴湿土',
  '寅':'少阳相火','申':'少阳相火',
  '卯':'阳明燥金','酉':'阳明燥金',
  '辰':'太阳寒水','戌':'太阳寒水',
  '巳':'厥阴风木','亥':'厥阴风木',
};
const ZAI_QUAN_MAP = {
  '子':'阳明燥金','午':'阳明燥金',
  '丑':'太阳寒水','未':'太阳寒水',
  '寅':'厥阴风木','申':'厥阴风木',
  '卯':'少阴君火','酉':'少阴君火',
  '辰':'太阴湿土','戌':'太阴湿土',
  '巳':'少阳相火','亥':'少阳相火',
};

const SAN_YIN_SAN_YANG = ['厥阴风木','少阴君火','太阴湿土','少阳相火','阳明燥金','太阳寒水'];
const ZHU_QI_LIST = ['厥阴风木','少阴君火','少阳相火','太阴湿土','阳明燥金','太阳寒水'];

// 六气时段 (月/日)
const QI_BOUNDARIES = [
  { name:'初之气', idx:0, sM:1,sD:20, eM:3,eD:20 },
  { name:'二之气', idx:1, sM:3,sD:21, eM:5,eD:20 },
  { name:'三之气', idx:2, sM:5,sD:21, eM:7,eD:22 },
  { name:'四之气', idx:3, sM:7,sD:23, eM:9,eD:22 },
  { name:'五之气', idx:4, sM:9,sD:23, eM:11,eD:21 },
  { name:'终之气', idx:5, sM:11,sD:22, eM:1,eD:19 },
];

// 六气 → 五行
const QI_WUXING = {
  '厥阴风木':'木','少阴君火':'火','少阳相火':'火',
  '太阴湿土':'土','阳明燥金':'金','太阳寒水':'水',
};

// 运气气候倾向描述
const QI_PATTERN_DESC = {
  '厥阴风木':{ evil:'风', tend:'多风，气温波动大，易发过敏、关节痛、头痛', organ:'肝' },
  '少阴君火':{ evil:'热', tend:'偏热，易心烦失眠、口舌生疮、血压波动', organ:'心' },
  '少阳相火':{ evil:'暑', tend:'炎热，易高热中暑、口渴烦躁、皮肤疮疡', organ:'心' },
  '太阴湿土':{ evil:'湿', tend:'多雨潮湿，易困倦乏力、食欲不振、腹胀腹泻', organ:'脾' },
  '阳明燥金':{ evil:'燥', tend:'干燥少雨，易干咳咽痒、皮肤干裂、便秘', organ:'肺' },
  '太阳寒水':{ evil:'寒', tend:'寒冷，易感冒畏寒、关节冷痛、心脑血管病发', organ:'肾' },
};

// 五行 → 脏腑/药膳方向
const WUXING_ADVICE = {
  '木':{ zang:'肝', fu:'胆', foods:['枸杞','菊花','白芍','桑叶','天麻'], avoid:'辛辣、酒' },
  '火':{ zang:'心', fu:'小肠', foods:['莲子','百合','麦冬','竹叶','黄连'], avoid:'辛辣、煎炸、羊肉、酒' },
  '土':{ zang:'脾', fu:'胃', foods:['薏米','茯苓','白术','陈皮','山药'], avoid:'生冷、甜腻、肥甘' },
  '金':{ zang:'肺', fu:'大肠', foods:['沙参','玉竹','麦冬','雪梨','蜂蜜'], avoid:'辛辣、烧烤、干燥食品' },
  '水':{ zang:'肾', fu:'膀胱', foods:['肉桂','干姜','杜仲','核桃','山药'], avoid:'生冷、寒凉、冰饮' },
};

// 气候区 → 描述
const CLIMATE_DESC = {
  '华南暖湿':{ base:'常年温热潮湿', riskAdd:'外感多夹湿，湿热互结' },
  '华东湿热':{ base:'四季分明偏湿', riskAdd:'梅雨季湿气尤重' },
  '华中湿热':{ base:'夏热冬冷潮湿', riskAdd:'寒湿交替，脾胃易伤' },
  '西南阴湿':{ base:'多雾少阳潮湿', riskAdd:'寒湿入骨，风湿高发' },
  '华北干燥':{ base:'干燥多风少雨', riskAdd:'燥邪伤肺，皮肤易干' },
  '东北寒燥':{ base:'冬季严寒漫长', riskAdd:'寒邪直中，阳虚多见' },
  '西北干寒':{ base:'干旱少雨寒冷', riskAdd:'寒燥叠加，肺肾同伤' },
  '青藏高寒':{ base:'高寒缺氧干燥', riskAdd:'气虚血瘀，寒凝经脉' },
};

// ========== 干支计算 ==========
function getGanZhi(year) {
  return {
    gan: TIAN_GAN[(year - 4) % 10],
    zhi: DI_ZHI[(year - 4) % 12],
    ganZhi: TIAN_GAN[(year - 4) % 10] + DI_ZHI[(year - 4) % 12],
  };
}

// ========== 年格局 ==========
function getYearPattern(year) {
  const gz = getGanZhi(year);
  const yun = GAN_YUN_MAP[gz.gan];
  const siTian = ZHI_SITIAN_MAP[gz.zhi];
  const zaiQuan = ZAI_QUAN_MAP[gz.zhi];
  return {
    year, ganZhi: gz.ganZhi,
    suiYun: yun.yun + (yun.taiGuo ? '运太过' : '运不及'),
    siTian, zaiQuan,
    yunWuXing: yun.yun,
  };
}

// ========== 六气客气推算 ==========
function getKeQiList(siTian) {
  const idx = SAN_YIN_SAN_YANG.indexOf(siTian);
  const ke = [];
  ke[2] = siTian;
  for (let i = 1; i <= 5; i++) {
    ke[(2 + i) % 6] = SAN_YIN_SAN_YANG[(idx + i) % 6];
  }
  return ke;
}

// ========== 判断当前六气步 ==========
function getCurrentQi(date) {
  if (!date) date = new Date();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  for (let i = 0; i < QI_BOUNDARIES.length; i++) {
    const q = QI_BOUNDARIES[i];
    if (i < 5) {
      if ((m === q.sM && d >= q.sD) || (m === q.eM && d <= q.eD) || (m > q.sM && m < q.eM)) return q;
    } else {
      // 终之气跨年
      if ((m === q.sM && d >= q.sD) || m === 12 || (m === q.eM && d <= q.eD)) return q;
    }
  }
  return QI_BOUNDARIES[0];
}

// ========== 完整当前五运六气 ==========
function getCurrentWYLQ(date) {
  if (!date) date = new Date();
  const year = date.getFullYear();
  const pattern = getYearPattern(year);
  const qi = getCurrentQi(date);
  const keQiList = getKeQiList(pattern.siTian);
  const zhuQi = ZHU_QI_LIST[qi.idx];
  const keQi = keQiList[qi.idx];
  const zhuWx = QI_WUXING[zhuQi];
  const keWx = QI_WUXING[keQi];

  return {
    pattern,
    currentQi: {
      index: qi.idx,
      name: qi.name,
      zhuQi, keQi,
      zhuWx, keWx,
      zhuInfo: QI_PATTERN_DESC[zhuQi],
      keInfo: QI_PATTERN_DESC[keQi],
      dateRange: (() => {
        const ey = qi.idx === 5 ? year + 1 : year;
        return `${year}/${qi.sM}/${qi.sD} — ${ey}/${qi.eM}/${qi.eD}`;
      })(),
    },
    allQi: QI_BOUNDARIES.map((q, i) => ({
      name: q.name,
      zhuQi: ZHU_QI_LIST[i],
      keQi: keQiList[i],
      zhuWx: QI_WUXING[ZHU_QI_LIST[i]],
      keWx: QI_WUXING[keQiList[i]],
      dateRange: (() => {
        const ey = q.idx === 5 ? year + 1 : year;
        return `${year}/${q.sM}/${q.sD} — ${ey}/${q.eM}/${q.eD}`;
      })(),
    })),
  };
}

// 邪气 → 五行
const EVIL_WUXING = { '风':'木','热':'火','暑':'火','湿':'土','燥':'金','寒':'水' };

// ========== 运气 vs 天气 对照分析 ==========
function analyzeQiVsWeather(wylq, weather, climateZone) {
  const keInfo = wylq.currentQi.keInfo;
  const keWx = wylq.currentQi.keWx;
  const zhuWx = wylq.currentQi.zhuWx;
  const climateInfo = CLIMATE_DESC[climateZone] || { base:'', riskAdd:'' };

  const alerts = [];
  const temp = weather.temp;
  const hum = weather.humidity;

  if (keInfo.evil === '寒' && temp > 15) alerts.push('客气偏寒但实际偏暖，"应寒反温"，易发温病，注意疏风散热');
  if (keInfo.evil === '热' && temp < 10) alerts.push('客气偏热但实际偏冷，"应热反寒"，寒热错杂，注意保暖兼清内热');
  if (keInfo.evil === '湿' && hum < 50) alerts.push('客气偏湿但实际偏燥，湿不显而燥先见，需润燥兼顾');
  if (keInfo.evil === '燥' && hum > 75) alerts.push('客气偏燥但实际偏湿，"燥从湿化"，需化湿为先');

  if (climateZone && climateZone.includes('湿') && keInfo.evil === '湿') alerts.push('本地气候本就多湿，当前运气叠加湿邪，双重加临，务必健脾祛湿');
  if (climateZone && climateZone.includes('燥') && keInfo.evil === '燥') alerts.push('本地气候本就偏燥，当前运气叠加燥邪，润肺生津为要');
  if (climateZone && climateZone.includes('寒') && keInfo.evil === '寒') alerts.push('本地气候本就偏寒，运气寒邪叠加，温阳散寒为第一要务');

  if (keWx === '火' && zhuWx === '水') alerts.push('客火主水，上热下寒，注意引火归元，忌单纯清热或温补');
  if (keWx === '水' && zhuWx === '火') alerts.push('客水主火，外寒内热，注意散外寒清内热，忌闭门留寇');

  const foodWx = EVIL_WUXING[keInfo.evil] || '木';
  return {
    dominantEvil: keInfo.evil,
    tendency: keInfo.tend,
    climateNote: climateInfo.riskAdd,
    alerts: alerts.length > 0 ? alerts : ['运气与天气基本吻合，按常规调养即可'],
    adviceFoods: WUXING_ADVICE[foodWx]?.foods || [],
  };
}
