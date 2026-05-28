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

// ========== 大白话翻译层 ==========

// 客气 → 大白话身体指南
const KEQI_PLAIN = {
  '厥阴风木': {
    headline: '风邪活跃，注意防风护肝',
    bodySignals: ['容易头痛、头晕', '关节酸胀、游走性疼痛', '皮肤容易过敏、发痒', '情绪波动大，容易烦躁'],
    doList: ['出门戴帽子或围巾防风', '避免风口久坐', '晚上11点前睡觉养肝'],
    eatList: ['菊花', '枸杞', '桑叶', '白芍', '芹菜', '菠菜'],
    avoidList: ['辛辣刺激', '酒', '海鲜等发物', '油炸食品'],
    why: '风气通于肝，风邪活跃时肝气容易郁结或上亢',
  },
  '少阴君火': {
    headline: '热气偏盛，注意清心安神',
    bodySignals: ['容易心烦、睡不好', '嘴巴长溃疡、牙龈肿痛', '心慌、心跳快', '脸上容易长痘'],
    doList: ['午间小憩15-30分钟养心', '傍晚散步微微出汗', '睡前不刷手机，帮助入眠'],
    eatList: ['莲子', '百合', '麦冬', '苦瓜', '绿豆'],
    avoidList: ['辛辣', '煎炸烧烤', '羊肉', '酒', '咖啡浓茶'],
    why: '热气通于心，心火偏旺时睡眠和情绪首当其冲',
  },
  '少阳相火': {
    headline: '暑热当令，注意清热解暑',
    bodySignals: ['容易中暑、头晕恶心', '口干舌燥、喝水不解渴', '烦躁易怒', '皮肤长疮长疖'],
    doList: ['避开正午高温出门', '多喝温水，少量多次', '穿透气宽松衣服'],
    eatList: ['绿豆', '冬瓜', '荷叶', '西瓜（适量）', '苦瓜'],
    avoidList: ['大辛大热', '油腻厚味', '烈酒', '冰镇饮料（伤脾胃）'],
    why: '暑热是一年中最旺的火气，身体像被"烤"着，需要内外一起降温',
  },
  '太阴湿土': {
    headline: '湿气困脾，注意健脾祛湿',
    bodySignals: ['身体沉重、懒得动', '食欲差、饭后胀气', '大便粘腻冲不干净', '舌苔厚腻、口黏'],
    doList: ['适当运动出汗排湿', '少吃生冷甜腻', '房间注意通风除湿'],
    eatList: ['薏米', '茯苓', '白术', '陈皮', '冬瓜', '山药'],
    avoidList: ['生冷食物', '甜腻糕点', '肥肉', '冰饮', '牛奶过量'],
    why: '湿气最喜欢"困"住脾胃，脾胃一弱，全身就没劲',
  },
  '阳明燥金': {
    headline: '燥气当道，注意润肺生津',
    bodySignals: ['喉咙干痒、干咳', '皮肤干燥起皮、嘴唇裂', '鼻子干、容易流鼻血', '大便干结'],
    doList: ['室内放加湿器或水盆', '晨起喝一杯温水', '洗澡水温不要太高'],
    eatList: ['沙参', '玉竹', '雪梨', '银耳', '蜂蜜', '麦冬'],
    avoidList: ['辛辣烧烤', '油炸', '炒货干果', '过咸食物'],
    why: '燥气最伤肺和皮肤，身体的"润"都被抽走了，要从内到外补回去',
  },
  '太阳寒水': {
    headline: '寒气逼人，注意温阳保暖',
    bodySignals: ['手脚冰凉、怕冷', '关节冷痛加重', '容易感冒、流清鼻涕', '腰膝酸软、夜尿多'],
    doList: ['热水泡脚20分钟/天', '腰腹和脚踝一定要保暖', '晒太阳15-30分钟补阳气'],
    eatList: ['生姜', '肉桂', '当归', '核桃', '羊肉', '杜仲'],
    avoidList: ['生冷食物', '冰饮', '寒性水果（西瓜、梨）', '空腹喝凉水'],
    why: '寒气最容易伤阳气，尤其是肾阳，身体像被"冻住"了一样',
  },
};

// 主客交互 → 大白话补充
function getMainKeInteractionNote(zhuQi, keQi) {
  const pairs = {
    '厥阴风木+少阴君火': '风助火势，热感比纯热更难受，容易上火+过敏一起来',
    '厥阴风木+太阴湿土': '风湿夹杂，像梅雨天——又闷又沉，关节和脾胃都不舒服',
    '少阴君火+少阳相火': '两火相加，热上加热，特别容易心烦气躁、失眠',
    '少阴君火+阳明燥金': '上面热下面燥，容易口干心烦同时皮肤干燥',
    '少阳相火+太阴湿土': '湿热交蒸，像桑拿天——闷热难耐，容易长痘长疮',
    '少阳相火+阳明燥金': '"秋老虎"天气，又热又干，燥咳+心烦一起来',
    '太阴湿土+太阳寒水': '寒湿困体，又冷又潮，关节痛+胃寒腹泻',
    '阳明燥金+太阳寒水': '干冷交加，皮肤干裂+手脚冰凉，北方冬天典型体感',
  };
  for (let [key, val] of Object.entries(pairs)) {
    const [a, b] = key.split('+');
    if ((zhuQi === a && keQi === b) || (zhuQi === b && keQi === a)) return val;
  }
  return null;
}

// 岁运 → 大白话年度基调
function getSuiYunPlain(suiYun) {
  const map = {
    '木运太过': '今年全年风大温高，肝气偏旺，注意情绪管理和养肝',
    '木运不及': '今年春生之力不足，容易疲劳乏力气短，重在养肝补气',
    '火运太过': '今年全年偏热，心火偏旺，注意清心养神、防中暑',
    '火运不及': '今年阳气偏弱，容易怕冷心慌，重在温补心阳',
    '土运太过': '今年全年偏湿，脾胃负担重，注意健脾祛湿',
    '土运不及': '今年消化能力偏弱，容易腹胀腹泻，重在健脾益气',
    '金运太过': '今年全年偏燥，肺和皮肤容易干燥，注意润肺生津',
    '金运不及': '今年抵抗力偏弱，容易感冒咳嗽，重在补肺固表',
    '水运太过': '今年全年偏寒，肾阳易耗，注意温补肾阳、保暖',
    '水运不及': '今年藏精之力不足，容易腰膝酸软，重在滋补肾阴',
  };
  return map[suiYun] || '';
}

// 气候区 → 大白话体质背景
function getClimatePlain(region) {
  const map = {
    '华南暖湿': '常年湿热，身体底子偏"湿+热"，祛湿是广东人一辈子的功课',
    '华东湿热': '四季分明但偏湿，梅雨季尤其难受，脾胃容易受湿气困扰',
    '华中湿热': '夏热冬冷都带湿，寒湿湿热交替，肠胃要特别关照',
    '西南阴湿': '多雾少太阳，湿气入骨难除，风湿关节问题高发',
    '华北干燥': '干风多雨水少，肺和皮肤常年偏干，润肺是头等大事',
    '东北寒燥': '冬天又长又冷又干，寒燥双杀，阳虚体质的人特别多',
    '西北干寒': '又干又冷，寒燥叠加，比单纯冷或干都更伤身体',
    '青藏高寒': '高海拔缺氧+寒冷，气血运行慢，寒凝血瘀多见',
  };
  return map[region] || '';
}

// 天气 → 大白话对照
function getWeatherPlain(weather, keEvil) {
  const t = weather.temp;
  const h = weather.humidity;
  const parts = [];

  // 温度大白话
  if (t >= 35) parts.push('今天很热（' + t + '°C），注意防暑');
  else if (t >= 28) parts.push('今天偏热（' + t + '°C）');
  else if (t >= 20) parts.push('今天温暖舒适（' + t + '°C）');
  else if (t >= 10) parts.push('今天偏凉（' + t + '°C），注意加衣');
  else if (t >= 0) parts.push('今天冷（' + t + '°C），注意保暖');
  else parts.push('今天很冷（' + t + '°C），务必保暖防冻');

  // 湿度大白话
  if (h >= 80) parts.push('湿度很高（' + h + '%），体感闷湿');
  else if (h >= 60) parts.push('湿度适中（' + h + '%）');
  else parts.push('偏干燥（' + h + '%），注意补水');

  // 与运气的偏差
  const deviation = [];
  if (keEvil === '寒' && t > 15) deviation.push('这阵子按理该偏冷，但实际偏暖——身体容易"上当"，毛孔开了寒气一来就感冒，出门多带件外套');
  if (keEvil === '热' && t < 10) deviation.push('这阵子按理该偏暖，但实际偏冷——寒热错杂最难将息，既要注意保暖，又不能补过头');
  if (keEvil === '湿' && h < 50) deviation.push('这阵子按理该偏湿，但实际偏干——燥和湿的预期相反，润燥为先');
  if (keEvil === '燥' && h > 75) deviation.push('这阵子按理该偏燥，但实际湿气重——湿气把燥掩盖了，化湿比润燥更急');

  return { summary: parts.join(' · '), deviation };
}

// ========== 主函数：生成大白话指南 ==========
function getPlainGuidance(wylq, weather, cityInfo) {
  const qi = wylq.currentQi;
  const p = wylq.pattern;
  const keData = KEQI_PLAIN[qi.keQi] || KEQI_PLAIN['少阴君火'];
  const zhuData = KEQI_PLAIN[qi.zhuQi] || KEQI_PLAIN['少阴君火'];
  const interaction = getMainKeInteractionNote(qi.zhuQi, qi.keQi);
  const yearNote = getSuiYunPlain(p.suiYun);
  const climateNote = cityInfo ? getClimatePlain(cityInfo.region) : '';

  // 天气分析
  let weatherGuide = null;
  if (weather) {
    weatherGuide = getWeatherPlain(weather, qi.keInfo.evil);
  }

  // 合并饮食建议（去重）
  const allEat = [...new Set([...keData.eatList, ...(WUXING_ADVICE[QI_WUXING[qi.keQi]]?.foods || [])])];
  const allAvoid = [...new Set([...keData.avoidList])];

  return {
    headline: keData.headline,
    // 身体感受
    bodySignals: keData.bodySignals,
    // 该做什么
    doList: keData.doList,
    // 推荐食材
    eatList: allEat.slice(0, 6),
    // 少碰什么
    avoidList: allAvoid.slice(0, 5),
    // 为什么（大白话版）
    why: keData.why,
    // 主客交互
    interaction,
    // 年度背景
    yearNote,
    // 气候背景
    climateNote,
    // 天气对照
    weatherGuide,
    // 详情（给想看的人）
    tcmDetail: {
      ganZhi: p.ganZhi,
      suiYun: p.suiYun,
      siTian: p.siTian,
      zaiQuan: p.zaiQuan,
      qiName: qi.name,
      zhuQi: qi.zhuQi,
      keQi: qi.keQi,
      dateRange: qi.dateRange,
    },
  };
}

// ========== 冲突分析引擎 ==========

// 气候区饮食文化特征
const REGION_FOOD_CULTURE = {
  '华南暖湿': { staple:'米饭', taste:'清淡、喜煲汤、喜海鲜', habit:'老火靓汤、凉茶' },
  '华东湿热': { staple:'米饭', taste:'咸鲜、偏甜', habit:'红烧、清蒸' },
  '华中湿热': { staple:'米饭', taste:'咸辣', habit:'重油重色' },
  '西南阴湿': { staple:'米饭', taste:'麻辣、重油', habit:'火锅、辣椒驱寒湿' },
  '华北干燥': { staple:'面食', taste:'咸香', habit:'面食为主、炖菜' },
  '东北寒燥': { staple:'米饭+面', taste:'咸、油大', habit:'炖菜、烧烤、腌菜' },
  '西北干寒': { staple:'面食', taste:'咸、酸辣', habit:'牛羊肉、面食' },
  '青藏高寒': { staple:'青稞', taste:'咸、奶制品', habit:'酥油茶、牛羊肉' },
};

// 气候区冲突对 → 水土不服分析
function getClimateConflict(fromRegion, toRegion) {
  if (!fromRegion || !toRegion || fromRegion === toRegion) return null;

  const pairs = {};
  const key = fromRegion + '→' + toRegion;

  // 湿 → 干
  if (fromRegion.includes('湿') && toRegion.includes('燥')) {
    return {
      level: 'high',
      title: '从"湿"到"燥"——身体的水分要被抽干了',
      body: `你从小在${fromRegion}长大，身体习惯了潮湿环境。到了${toRegion}，干燥是第一大挑战。皮肤干、喉咙干、容易干咳。但注意——不能一味猛喝水，因为你脾胃底子是"抗湿"模式，突然大量喝水反而加重负担。`,
      tips: ['少量多次喝水，不要一口气灌', '多吃沙参、玉竹、银耳这类润的东西', '辛辣烧烤要少碰，火上浇油'],
      dietPriority: ['燥'],
    };
  }

  // 燥 → 湿
  if (fromRegion.includes('燥') && toRegion.includes('湿')) {
    return {
      level: 'high',
      title: '从"干"到"湿"——身体像掉进了蒸笼',
      body: `你从小在${fromRegion}长大，身体习惯了干燥。到了${toRegion}，湿气是最陌生的敌人。容易困倦、身体沉重、没胃口、大便粘。你的身体还不懂得怎么"抗湿"，所以比本地人更容易被湿气困住。`,
      tips: ['适当运动出汗是排湿最快的方法', '多吃薏米、茯苓、陈皮这些祛湿食材', '生冷甜腻的东西要少碰，湿上加湿'],
      dietPriority: ['湿'],
    };
  }

  // 寒 → 热/暖
  if ((fromRegion.includes('寒')) && (toRegion.includes('热') || toRegion.includes('暖'))) {
    return {
      level: 'high',
      title: '从"冷"到"热"——身体像进了火炉',
      body: `你从小在${fromRegion}长大，身体习惯了寒冷，阳气偏旺。到了${toRegion}，热+可能的湿会让你比本地人更难受——你还没有"散热"的经验。容易上火、长痘、心烦。`,
      tips: ['慢慢适应，不要一到就狂吹空调吃冰', '绿豆、苦瓜、冬瓜这类清热食材可以多吃', '辣和酒要少碰，火上浇油'],
      dietPriority: ['热', '暑'],
    };
  }

  // 热/暖 → 寒
  if ((fromRegion.includes('热') || fromRegion.includes('暖')) && toRegion.includes('寒')) {
    return {
      level: 'high',
      title: '从"暖"到"冷"——身体还没准备好过冬',
      body: `你从小在${fromRegion}长大，身体习惯了温暖。到了${toRegion}，寒冷是你最大的挑战。手脚冰凉、容易感冒、关节不舒服。你的"抗寒基因"还没建立起来，比本地人怕冷得多。`,
      tips: ['腰腹和脚踝的保暖比穿厚衣服更重要', '生姜、肉桂、当归、羊肉这些温补食材多吃', '晚上热水泡脚是性价比最高的养生法'],
      dietPriority: ['寒'],
    };
  }

  // 湿 → 湿（不同湿）
  if (fromRegion.includes('湿') && toRegion.includes('湿') && fromRegion !== toRegion) {
    // 根据实际气候区动态描述差异
    const wetTypes = {
      '华南暖湿': { desc:'终年暖热潮湿', bias:'热' },
      '华东湿热': { desc:'四季分明、梅雨季湿气尤重', bias:'热' },
      '华中湿热': { desc:'夏热冬冷、寒湿交替', bias:'寒热都有' },
      '西南阴湿': { desc:'多雾少太阳、湿气偏寒', bias:'寒' },
    };
    const fromDesc = wetTypes[fromRegion]?.desc || fromRegion;
    const toDesc = wetTypes[toRegion]?.desc || toRegion;
    const fromBias = wetTypes[fromRegion]?.bias || '';
    const toBias = wetTypes[toRegion]?.bias || '';
    let diffNote = '';
    if (fromBias === '热' && toBias === '寒') diffNote = '你习惯的湿偏热，但这里的湿偏寒——祛湿方法要从"清热化湿"改成"温化寒湿"';
    else if (fromBias === '热' && toBias === '寒热都有') diffNote = '你习惯的湿偏热，但这里的湿寒热交替——冬天需要温化，夏天需要清化，不能一根筋';
    else if (fromBias === '寒' && toBias === '热') diffNote = '你习惯的湿偏寒，但这里的湿偏热——不能照搬老家的温化方法，要改用清热祛湿';
    else if (fromBias === '寒热都有' && toBias === '热') diffNote = '你习惯的湿随季节变，但这里的湿常年偏热——重点在清热而非温化';
    else if (fromBias === '热' && toBias === '热') diffNote = '虽然都是湿热型，但节奏不同——一个是常年闷着，一个是季节性的，身体需要时间调整祛湿的节奏';
    else diffNote = '两地的湿有微妙不同，观察身体的反应再决定方向';
    return {
      level: 'medium',
      title: '同样是"湿"，但湿法不一样',
      body: `你家乡${fromRegion}的湿是"${fromDesc}"，现居地${toRegion}的湿是"${toDesc}"。${diffNote}。`,
      tips: ['观察自己身体的反应，不要照搬老家的方法', '如果是寒湿→温化（生姜、陈皮）；湿热→清化（薏米、冬瓜）'],
      dietPriority: ['湿'],
    };
  }

  // 燥 → 燥（不同燥）
  if (fromRegion.includes('燥') && toRegion.includes('燥') && fromRegion !== toRegion) {
    return {
      level: 'medium',
      title: '同样是"燥"，冷的燥和热的燥不一样',
      body: `你在${fromRegion}习惯了干燥，但${toRegion}的燥可能更偏寒或者更偏热。寒燥伤肺更伤肾，热燥主要伤肺和皮肤。润的方法不一样。`,
      tips: ['观察自己是偏寒还是偏热，再决定用温润还是凉润', '北方燥偏寒→蜂蜜、核桃温润；西北燥偏热→沙参、玉竹凉润'],
      dietPriority: ['燥'],
    };
  }

  return {
    level: 'low',
    title: '两地的气候差异不大',
    body: `${fromRegion}和${toRegion}气候相近，你的身体应该能较快适应。`,
    tips: ['按当地当季的饮食节奏来就行'],
    dietPriority: [],
  };
}

// 体质 vs 环境冲突
function getConstitutionEnvConflict(constitution, region) {
  const conflicts = {
    '阳虚质': {
      '华南暖湿': { note:'阳虚怕冷，但环境湿热——外湿内寒，不能一味祛湿，要温阳+祛湿一起', foods:['干姜','肉桂','白术'] },
      '华东湿热': { note:'同上，湿冷天尤其难受，关节和胃最容易出问题', foods:['干姜','茯苓','桂枝'] },
      '西南阴湿': { note:'阴湿最伤阳气，你比本地人更容易关节冷痛', foods:['附子','肉桂','杜仲'] },
      '东北寒燥': { note:'寒+燥双重打击，比别人更怕冷也更干', foods:['当归','黄芪','核桃'] },
      '西北干寒': { note:'跟东北类似，干寒交加，阳虚的人在这里最难熬', foods:['羊肉','肉桂','生姜'] },
    },
    '阴虚质': {
      '华北干燥': { note:'阴虚+环境干燥——干上加干，比别人更容易口干、皮肤干、便秘', foods:['沙参','玉竹','麦冬'] },
      '西北干寒': { note:'燥+寒双重打击，但你是阴虚，要润不能温补', foods:['沙参','麦冬','枸杞'] },
      '东北寒燥': { note:'外寒内燥，不能因为冷就猛吃羊肉——会更燥', foods:['银耳','百合','雪梨'] },
    },
    '痰湿质': {
      '华南暖湿': { note:'痰湿+湿热环境——湿上加湿，比本地人更容易困倦、发胖', foods:['薏米','茯苓','陈皮'] },
      '华东湿热': { note:'同上，梅雨季是你最难熬的时候', foods:['薏米','冬瓜','藿香'] },
      '西南阴湿': { note:'阴湿入体最难除，你需要比别人更积极祛湿', foods:['白术','苍术','茯苓'] },
    },
    '湿热质': {
      '华南暖湿': { note:'湿热+湿热——火上浇油，比本地人更容易长痘、口臭、便秘', foods:['绿豆','薏米','苦瓜'] },
      '华东湿热': { note:'同上，夏天对你来说是双重考验', foods:['荷叶','冬瓜','赤小豆'] },
    },
    '气虚质': {
      '青藏高寒': { note:'气虚+高寒缺氧——气更不够用，容易疲劳气喘', foods:['黄芪','党参','红景天'] },
      '西南阴湿': { note:'湿气困脾，脾虚气更虚——恶性循环', foods:['黄芪','山药','白术'] },
    },
    '血瘀质': {
      '东北寒燥': { note:'寒凝血瘀——冷会让你的循环更差', foods:['当归','川芎','红花'] },
      '西北干寒': { note:'同上，寒凝血瘀，冬天尤其难熬', foods:['当归','生姜','桂枝'] },
      '青藏高寒': { note:'高寒缺氧+血瘀——循环不好的人在这里最难受', foods:['红景天','当归','丹参'] },
    },
  };

  const c = conflicts[constitution];
  if (!c || !c[region]) return null;
  return c[region];
}

// 天气偏差 → 调整饮食优先级
function getWeatherDeviationPriority(weather, wylq) {
  if (!weather) return { hasDeviation: false, message: '', priorityEvils: [] };

  const keEvil = wylq.currentQi.keInfo.evil;
  const t = weather.temp;
  const h = weather.humidity;

  // 严重偏差
  if (keEvil === '寒' && t > 20) {
    return { hasDeviation: true, level: 'high',
      message: `这几天比往年同期暖和不少（${t}°C），该冷的时候不冷——身体容易"上当"。毛孔开了，寒气突然回来就容易感冒。`,
      priorityEvils: ['风', '热'] };
  }
  if (keEvil === '热' && t < 8) {
    return { hasDeviation: true, level: 'high',
      message: `这几天比往年同期冷不少（${t}°C），该暖的时候冷——寒热错杂最难将息。既要注意保暖，又不能补过头。`,
      priorityEvils: ['寒', '风'] };
  }
  if (keEvil === '湿' && h < 45) {
    return { hasDeviation: true, level: 'high',
      message: `这阵子反常偏干（湿度${h}%），别按常规祛湿了——润燥比祛湿更急。`,
      priorityEvils: ['燥'] };
  }
  if (keEvil === '燥' && h > 80) {
    return { hasDeviation: true, level: 'high',
      message: `这阵子反常偏湿（湿度${h}%），燥被湿掩盖了——化湿比润燥更急。`,
      priorityEvils: ['湿'] };
  }

  // 轻度偏差
  if (keEvil === '寒' && t > 12) {
    return { hasDeviation: true, level: 'low',
      message: `这几天偏暖（${t}°C），比预期的暖和，注意衣服别穿太多捂出汗。`,
      priorityEvils: ['风'] };
  }
  if (keEvil === '热' && t < 12) {
    return { hasDeviation: true, level: 'low',
      message: `这几天偏凉（${t}°C），比预期的冷一些，加件衣服就好。`,
      priorityEvils: ['寒'] };
  }

  return { hasDeviation: false, message: '', priorityEvils: [] };
}

// 综合冲突分析
function getConflictAnalysis(hometownRegion, currentRegion, constitution, weather, wylq) {
  const conflicts = [];

  // 1. 水土不服
  const migrationConflict = getClimateConflict(hometownRegion, currentRegion);
  if (migrationConflict && migrationConflict.level !== 'low') {
    conflicts.push({ type: 'migration', ...migrationConflict });
  }

  // 2. 体质 vs 环境
  const constConflict = getConstitutionEnvConflict(constitution, currentRegion);
  if (constConflict) {
    conflicts.push({ type: 'constitution_env', level: 'medium', ...constConflict });
  }

  // 3. 天气偏差
  if (weather) {
    const dev = getWeatherDeviationPriority(weather, wylq);
    if (dev.hasDeviation) {
      conflicts.push({ type: 'weather_deviation', ...dev });
    }
  }

  // 综合优先级
  const priorityEvils = [];
  conflicts.forEach(c => {
    if (c.priorityEvils) priorityEvils.push(...c.priorityEvils);
    if (c.dietPriority) priorityEvils.push(...c.dietPriority);
  });
  const uniqueEvils = [...new Set(priorityEvils)];

  // 气候饮食文化差异
  const homeFood = REGION_FOOD_CULTURE[hometownRegion];
  const currFood = REGION_FOOD_CULTURE[currentRegion];

  return {
    conflicts,
    priorityEvils: uniqueEvils,
    hasConflict: conflicts.length > 0,
    homeFood,
    currFood,
    foodClash: (homeFood && currFood && homeFood.taste !== currFood.taste) ? {
      home: homeFood,
      current: currFood,
      note: `你从小吃${homeFood.taste}（${homeFood.habit}），现在身在${currFood.taste}的地方——吃老家的习惯不合适，完全照搬当地也可能不适应。`,
    } : null,
  };
}

// ========== 14天天气剧变检测 ==========
function detectClimateAlerts(daily) {
  if (!daily || !daily.time || daily.time.length < 2) return [];
  const alerts = [];
  const days = daily.time;
  const tMax = daily.temperature_2m_max;
  const tMin = daily.temperature_2m_min;
  const precip = daily.precipitation_sum;

  for (let i = 1; i < days.length; i++) {
    const prevMax = tMax[i-1], currMax = tMax[i];
    const prevMin = tMin[i-1], currMin = tMin[i];
    const drop24h = prevMax - currMax;
    const rise24h = currMax - prevMax;

    // 寒潮：24h降温≥8°C
    if (drop24h >= 8) {
      alerts.push({ date: days[i], type:'寒潮降温', evil:'寒',
        msg: `${days[i].slice(5)} 最高温骤降 ${drop24h.toFixed(0)}°C（${currMax.toFixed(0)}°C），寒邪来袭`,
        priority: 'high' });
    }
    // 热浪：24h升温≥8°C
    else if (rise24h >= 8) {
      alerts.push({ date: days[i], type:'热浪升温', evil:'热',
        msg: `${days[i].slice(5)} 最高温骤升 ${rise24h.toFixed(0)}°C（${currMax.toFixed(0)}°C），暑热突袭`,
        priority: 'high' });
    }
    // 持续高温：连续3天≥35°C
    if (i >= 2 && currMax >= 35 && tMax[i-1] >= 35 && tMax[i-2] >= 35 && !alerts.find(a=>a.date===days[i]&&a.type==='持续高温')) {
      alerts.push({ date: days[i], type:'持续高温', evil:'暑',
        msg: `${days[i-2].slice(5)}起连续高温 ≥35°C，注意防暑`,
        priority: 'high' });
    }
    // 持续阴雨：连续3天有降水
    if (i >= 2 && precip[i] > 0 && precip[i-1] > 0 && precip[i-2] > 0 && !alerts.find(a=>a.date===days[i]&&a.type==='持续阴雨')) {
      const totalRain = (precip[i-2]+precip[i-1]+precip[i]).toFixed(0);
      alerts.push({ date: days[i], type:'持续阴雨', evil:'湿',
        msg: `${days[i-2].slice(5)}起连续3天有雨（累计${totalRain}mm），湿气加重`,
        priority: 'medium' });
    }
  }

  // 48h湿度骤变（需要 humidity 数据，用降水+温差做 proxy：大幅温差往往伴随干湿变化）
  // 用连续两天的温差变化幅度近似
  for (let i = 2; i < days.length; i++) {
    const range1 = tMax[i-2] - tMin[i-2];
    const range2 = tMax[i] - tMin[i];
    if (Math.abs(range2 - range1) >= 10 && !alerts.find(a=>a.date===days[i]&&a.type==='温差异常')) {
      alerts.push({ date: days[i], type:'温差异常', evil:'风',
        msg: `${days[i].slice(5)} 昼夜温差剧烈变化，易受风邪，注意衣物增减`,
        priority: 'medium' });
    }
  }

  // 只取未来7天内的预警，去重
  return alerts.filter((a, i) => i < 10);
}

// ========== 跨文化饮食推荐：家乡食物 × 现居地气候 ==========
const CROSS_CULTURE_FOODS = {
  // [家乡饮食特征] → { [目标气候挑战]: { principle, foods } }
  '清淡、喜煲汤、喜海鲜': {
    '燥': { principle:'你的家乡煲汤习惯是润燥利器——在干燥环境里继续煲起来，但汤料要从祛湿型换成滋润型', foods:['沙参玉竹汤（替代土茯苓汤）','银耳莲子羹','花胶炖奶','生滚鱼片粥','白灼海鲜（清润不燥）'] },
    '寒': { principle:'海鲜偏寒但煲汤可以温补——用姜和胡椒平衡海鲜的寒性', foods:['胡椒猪肚鸡','姜葱炒蟹','当归生姜鱼汤','花雕蛋白蒸蟹','沙姜白切鸡'] },
    '湿': { principle:'你的清淡口味正好适合祛湿——少油少盐是祛湿的基础，继续保持', foods:['薏米冬瓜煲汤','清蒸鱼','白切鸡蘸沙姜','四神汤','陈皮蒸排骨'] },
  },
  '咸鲜、偏甜': {
    '燥': { principle:'红烧偏油，在干燥环境可以保留但减油增润——多用蒸和炖', foods:['清炖狮子头','冰糖炖雪梨','桂花糯米藕','酒酿圆子','莼菜鱼羹'] },
    '寒': { principle:'江南的甜可以中和温补药的燥——红枣桂圆入菜是天然搭配', foods:['红烧羊肉（加萝卜）','姜丝炒米粥','东坡肉（加黄芪）','老姜鸭汤','红糖糍粑'] },
    '湿': { principle:'甜腻助湿，在湿气重的环境要暂时减糖——咸鲜口味可以保留', foods:['盐水鸭','清蒸鲈鱼','雪菜肉丝面','榨菜蛋花汤','葱油拌面（少油版）'] },
  },
  '咸辣': {
    '燥': { principle:'辣在干燥环境是大忌——但家乡的腊味和腌菜（不过辣）可以保留', foods:['莲藕排骨汤（不加辣）','粉蒸肉','蛋酒','葛粉糊','清炒红菜苔'] },
    '寒': { principle:'你的辣正好可以用来驱寒！但要控制在"微辣出汗"的程度', foods:['胡辣汤（少辣多胡椒）','姜辣鸭','老姜肉片汤','羊肉锅（微辣版）','剁椒蒸鱼（少剁椒）'] },
    '湿': { principle:'辣能祛湿，但你家乡的重油做法在湿热环境要调整——减油不减辣', foods:['剁椒鱼头（少油版）','老姜炒肉','紫苏黄瓜','酸豆角肉末','擂辣椒皮蛋'] },
  },
  '麻辣、重油': {
    '燥': { principle:'麻辣在干燥环境等于火上浇油——但泡菜、酸汤、水煮（清汤）是宝藏', foods:['酸萝卜老鸭汤','酸汤鱼（贵州清汤版）','四川泡菜','滑肉汤（清汤）','红糖冰粉（不加辣）'] },
    '寒': { principle:'你的麻辣正好驱寒！但重油要减——改成"麻辣轻油"模式', foods:['麻辣火锅（减油版锅底）','姜汁热窝鸡','水煮牛肉（少油）','酸菜鱼（清汤）','夫妻肺片（少红油）'] },
    '湿': { principle:'麻辣祛湿是最强武器之一，但油大助湿——减油保持麻辣', foods:['酸菜鱼（少油版）','毛血旺（清汤版）','泡椒凤爪','折耳根拌菜','麻辣香锅（少油多菜）'] },
  },
  '咸香': {
    '燥': { principle:'面食炖菜在干燥环境需要加点"润"——多喝汤、面配汤', foods:['羊肉泡馍（多加汤）','清炖狮子头','刀削面（配骨汤）','莜面栲栳栳（蒸制）','山药小米粥'] },
    '寒': { principle:'你的面食+炖菜是天生的抗寒组合，保持！多放姜和葱', foods:['牛肉面（重姜葱版）','羊肉烩面','酸汤水饺','葱花饼配羊汤','大烩菜（加胡椒）'] },
    '湿': { principle:'面食在湿气环境偏滞——可以混入杂粮，炖菜多放祛湿料', foods:['荞面饸饹','杂粮煎饼','莜面鱼鱼','山药茯苓糕','陈皮炖牛肉'] },
  },
  '咸、油大': {
    '燥': { principle:'油大在干燥环境加重燥热——但炖菜和腌菜的"咸"可以生津', foods:['酸菜炖大骨（少油）','小鸡炖蘑菇（去鸡皮）','地三鲜（少油版）','大拉皮（麻酱版）','玉米碴子粥'] },
    '寒': { principle:'你的炖菜基因就是为寒冷而生的！保持重炖，加温补料', foods:['猪肉炖粉条（加肉桂）','铁锅炖大鹅','酸菜白肉锅','酱骨架（加当归）','韭菜盒子'] },
    '湿': { principle:'东北菜在湿气环境偏"滞"——多做炖菜少做烧烤，多放祛湿香料', foods:['小鸡炖蘑菇（加薏米）','鲫鱼炖豆腐','排骨炖豆角（加白胡椒）','大丰收（蘸酱菜）','疙瘩汤'] },
  },
  '咸、酸辣': {
    '燥': { principle:'酸辣在干燥环境伤阴——但新疆的奶制品和干果是润燥宝库', foods:['羊肉抓饭（少油多胡萝卜）','酸奶配核桃','大盘鸡（去辣留香）','馕配奶茶','巴旦木杏仁露'] },
    '寒': { principle:'牛羊肉+面食是天选抗寒组合，酸辣调味恰到好处', foods:['羊肉泡馍（西北版）','牛肉面（清汤重料）','手抓羊肉（配蒜）','胡辣羊蹄','馕坑烤肉'] },
    '湿': { principle:'酸辣能开胃祛湿，但面食偏滞——多喝汤、多吃烤肉（去湿）', foods:['羊肉串（孜然祛湿）','酸汤面片','大盘鸡（多放花椒）','拌面（少面多菜）','酸奶（促消化）'] },
  },
  '咸、奶制品': {
    '燥': { principle:'奶制品和酥油是天生的润燥品，在你的高原饮食里继续保留', foods:['酥油茶','牦牛奶茶','糌粑酥油粥','酸奶拌青稞','酥油蜂蜜拌燕麦'] },
    '寒': { principle:'酥油+牛羊肉是最强抗寒组合，青稞提供持久能量', foods:['酥油茶（多加酥油）','牦牛肉炖萝卜','糌粑（加酥油红糖）','羊肉青稞粥','酥油煎饼'] },
    '湿': { principle:'奶制品偏滋腻，在湿气环境要减量——青稞可以保留', foods:['青稞粥（少酥油）','牦牛肉干（风干去湿）','清茶（少奶）','青稞饼','风干肉配茶'] },
  },
};

function getCrossCultureFoods(homeRegion, currRegion) {
  if (!homeRegion || !currRegion || homeRegion === currRegion) return null;
  const homeCulture = REGION_FOOD_CULTURE[homeRegion];
  if (!homeCulture) return null;

  // 找到匹配的饮食特征
  const tasteKey = Object.keys(CROSS_CULTURE_FOODS).find(k => homeCulture.taste.includes(k) || k.includes(homeCulture.taste.slice(0,2)));
  const cultureData = CROSS_CULTURE_FOODS[tasteKey] || CROSS_CULTURE_FOODS['咸香']; // fallback

  // 判断目标气候的主要挑战
  let challenge = '湿'; // default
  if (currRegion.includes('燥')) challenge = '燥';
  else if (currRegion.includes('寒') && !currRegion.includes('湿')) challenge = '寒';
  else if (currRegion.includes('湿')) challenge = '湿';
  else if (currRegion.includes('热') || currRegion.includes('暖')) challenge = '湿'; // 湿热为主

  const advice = cultureData[challenge] || Object.values(cultureData)[0];
  return {
    homeTaste: homeCulture.taste,
    homeHabit: homeCulture.habit,
    currRegion,
    challenge,
    principle: advice.principle,
    foods: advice.foods,
  };
}
