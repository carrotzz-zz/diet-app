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
    // 一句话标题
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
