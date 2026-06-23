// ========== 每日运势引擎（浏览器版）==========
// 从 dailyCard + emotionEngine 云函数迁移

// ---- 常量（与 bazi-engine 共享，重复定义以解耦）----
const E_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const E_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const E_WUXING_GAN = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
const E_YIN_YANG_GAN = { '甲':'阳','乙':'阴','丙':'阳','丁':'阴','戊':'阳','己':'阴','庚':'阳','辛':'阴','壬':'阳','癸':'阴' };

// ---- 十神情绪映射 ----
const TEN_GOD_EMOTION = {
  '正官': { mood:'责任约束', desc:'今天责任虽重，你已经够努力了。', style:'静' },
  '七杀': { mood:'压力挑战', desc:'今天容易遇到压力，退一步不等于怂。', style:'躁' },
  '正印': { mood:'学习沉淀', desc:'今天心里比较静，适合一个人待着，不急不赶。', style:'静' },
  '偏印': { mood:'独处深思', desc:'今天想一个人待着，别逼自己社交。', style:'静' },
  '正财': { mood:'务实稳定', desc:'稳稳做事的一天，一步一脚印。', style:'稳' },
  '偏财': { mood:'机会变动', desc:'机会看着不错，先想清楚再出手。', style:'动' },
  '食神': { mood:'享受创意', desc:'今天轻松，适合对自己好一点。', style:'松' },
  '伤官': { mood:'表达叛逆', desc:'今天脑子灵光，想法多，写下来比说出来好。', style:'动' },
  '比肩': { mood:'竞争自我', desc:'今天是自己的主场，专注自己。', style:'稳' },
  '劫财': { mood:'消耗社交', desc:'今天社交可能会消耗精力，不想去的可以不去。', style:'躁' },
};

// ---- 旺衰权重 ----
const MONTH_QI = {
  '甲':[2,2,1,0,0,-1,-2,-2,-1,1,1,0],'乙':[2,2,1,0,0,-1,-2,-2,-1,1,1,0],
  '丙':[1,1,0,2,2,1,-1,-1,-2,-2,-2,-1],'丁':[1,1,0,2,2,1,-1,-1,-2,-2,-2,-1],
  '戊':[-1,-1,2,1,1,2,0,0,2,-1,-1,2],'己':[-1,-1,2,1,1,2,0,0,2,-1,-1,2],
  '庚':[-2,-2,1,-1,-1,0,2,2,1,0,0,-1],'辛':[-2,-2,1,-1,-1,0,2,2,1,0,0,-1],
  '壬':[0,0,-1,-2,-2,-1,1,1,-1,2,2,1],'癸':[0,0,-1,-2,-2,-1,1,1,-1,2,2,1],
};

function qiToWeight(qi) {
  if (qi >= 2) return 1.5;
  if (qi === 1) return 1.2;
  if (qi === 0) return 1.0;
  if (qi === -1) return 0.7;
  return 0.5;
}

// ---- 刑冲合害 ----
const CHONG = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
const HE = { '子丑':1,'丑子':1,'寅亥':1,'亥寅':1,'卯戌':1,'戌卯':1,'辰酉':1,'酉辰':1,'巳申':1,'申巳':1,'午未':1,'未午':1 };
const XING = { '子卯':1,'卯子':1,'寅巳':1,'巳申':1,'申寅':1,'丑戌':1,'戌未':1,'未丑':1 };
const ZI_XING = ['辰','午','酉','亥'];
const HAI = { '子未':1,'未子':1,'丑午':1,'午丑':1,'寅巳':1,'巳寅':1,'卯辰':1,'辰卯':1,'申亥':1,'亥申':1,'酉戌':1,'戌酉':1 };

function checkBranchInteraction(liuRiZhi, baziZhis) {
  for (let i = 0; i < baziZhis.length; i++) {
    if (CHONG[liuRiZhi] === baziZhis[i]) {
      if (i === 2) return { type:'冲', weight:1.5, desc:'心里不太平，坐不住，有点烦躁' };
      return { type:'冲', weight:1.3, desc:'隐隐不安，说不上来哪里不对' };
    }
  }
  for (let i = 0; i < baziZhis.length; i++) {
    if (HE[liuRiZhi + baziZhis[i]]) return { type:'合', weight:0.8, desc:'心里顺畅，有被接住的感觉' };
  }
  if (ZI_XING.includes(liuRiZhi) && baziZhis.filter(z => z === liuRiZhi).length > 0) {
    return { type:'刑', weight:1.4, desc:'自己跟自己较劲，对自己温柔点' };
  }
  for (let i = 0; i < baziZhis.length; i++) {
    if (XING[liuRiZhi + baziZhis[i]]) return { type:'刑', weight:1.2, desc:'有点小摩擦，别往心里去' };
  }
  for (let i = 0; i < baziZhis.length; i++) {
    if (HAI[liuRiZhi + baziZhis[i]]) return { type:'害', weight:1.1, desc:'说不清的别扭，不用细想' };
  }
  return { type:'none', weight:1.0, desc:'' };
}

// ---- 情志五脏 ----
const QINGZHI = {
  '木': { excess:'急，容易上火', lack:'憋着不说不痛快', organ:'肝', tip:'少生气，气顺了什么都好' },
  '火': { excess:'停不下来，心火旺', lack:'提不起劲，心气弱', organ:'心', tip:'给自己踩个刹车' },
  '土': { excess:'脑子转太多圈', lack:'懒得想事没主见', organ:'脾', tip:'不如动手做一件' },
  '金': { excess:'容易感伤压得慌', lack:'有话说不出来', organ:'肺', tip:'出门走走换个空气' },
  '水': { excess:'容易多想害怕退缩', lack:'定不住心神不安', organ:'肾', tip:'只看眼前的事' },
};

// ---- 短句库 ----
const QUOTES = {
  '怒': [
    { c:'知其不可奈何而安之若命', m:'有些事改变不了，先和它待一会儿' },
    { c:'水善利万物而不争', m:'水的力量不是硬碰硬，是绕过去' },
    { c:'安时而处顺，哀乐不能入也', m:'顺着日子过，大的情绪波动就进不来' },
  ],
  '喜不足': [
    { c:'天地有大美而不言', m:'好东西安安静静在那里，你得自己去看' },
    { c:'知足者富', m:'觉得自己够了的人，才是真的富' },
  ],
  '思': [
    { c:'少则得，多则惑', m:'想得少反而抓住重点，想太多反而乱' },
    { c:'知止不殆', m:'知道什么时候该停，才不会把自己耗干' },
  ],
  '悲': [
    { c:'物来则应，过去不留', m:'东西来了接住，过去了就松手' },
    { c:'飘风不终朝，骤雨不终日', m:'再大的风也刮不了一整天' },
  ],
  '恐': [
    { c:'不怕念起，只怕觉迟', m:'冒出害怕是正常的，能察觉到就不算晚' },
    { c:'上善若水', m:'最好的状态像水，该流就流，该停就停' },
  ],
  '通用': [
    { c:'大道至简', m:'最根本的道理都不复杂' },
    { c:'朴素而天下莫能与之争美', m:'简简单单就很好，不用跟谁比' },
  ],
};

// ---- 日柱性情底色 ----
const DAY_PILLAR_NATURE = {
  '甲子':'温润，心里有数，不轻易表态','甲寅':'自主，有主见，不喜欢被管',
  '甲辰':'表面干脆，心里盘算多','甲午':'个性鲜明，心里一把火',
  '甲申':'外在随和，内心有压力','甲戌':'表面随和，内心有目标感',
  '乙丑':'外表柔软，心里硬气','乙卯':'柔软但有底线',
  '乙巳':'心思活泛，情绪来得快去得快','乙未':'外表细腻，内心宽厚',
  '乙酉':'外表温和，内心有压力源','乙亥':'外柔内静，不急不躁',
  '丙子':'外表热情，内心有规矩','丙寅':'热情+思想，脑子里总有新想法',
  '丙辰':'阳光大方，情绪来得快散得快','丙午':'内外都热，精力旺盛',
  '丙申':'热情+行动力','丙戌':'热情但有分寸',
  '丁丑':'外在温和，心里有主意','丁卯':'心思细腻，感知力强',
  '丁巳':'敏感，对在意的事特别上心','丁未':'温火慢炖型',
  '丁酉':'心里有本账，不被人带着走','丁亥':'心里有规矩，自律',
  '戊子':'稳重务实','戊寅':'稳重下有压力源',
  '戊辰':'山一样的稳定感','戊午':'厚重但内心有温度',
  '戊申':'沉稳中带着灵活','戊戌':'内心有棱角，认准的事不轻易变',
  '己丑':'内心厚实','己卯':'外表随和，内心有持续紧张源',
  '己巳':'外表柔和，心里有温度','己未':'看似随和，内心有层次',
  '己酉':'心思灵巧','己亥':'心里有条线，不轻易越过',
  '庚子':'外表硬朗，内心灵巧','庚寅':'内心有目标',
  '庚辰':'硬中有韧','庚午':'刚硬之下有自我约束',
  '庚申':'硬骨头，不轻易弯','庚戌':'心里有决断力',
  '辛丑':'精致下有厚度','辛卯':'心思细，对得失敏感',
  '辛巳':'内心有标准，不放松自己','辛未':'追求完美，细节控',
  '辛酉':'追求极致和干净','辛亥':'心思灵动有灵气',
  '壬子':'情绪像江河，痛快','壬寅':'情绪有出口',
  '壬辰':'表面流动，内心有压感','壬午':'情绪有节制',
  '壬申':'思想深邃','壬戌':'表面流畅，内心有层次',
  '癸丑':'表面温柔，心里有城府','癸卯':'心思灵巧，情绪有自然的出口',
  '癸巳':'心里有账，情绪精细','癸未':'外柔内敛',
  '癸酉':'表面平静内心清澈','癸亥':'外表平静内心有暗涌',
};

const ZANG_GAN_MAIN = { '子':'癸','丑':'己','寅':'甲','卯':'乙','辰':'戊','巳':'丙','午':'丁','未':'己','申':'庚','酉':'辛','戌':'戊','亥':'壬' };

// ---- 辅助函数 ----

function getTenGod(dayGan, otherGan) {
  const wxD = E_WUXING_GAN[E_GAN[dayGan]];
  const wxO = E_WUXING_GAN[E_GAN[otherGan]];
  const sameYY = E_YIN_YANG_GAN[E_GAN[dayGan]] === E_YIN_YANG_GAN[E_GAN[otherGan]];
  const relMap = { '木木':'同','火火':'同','土土':'同','金金':'同','水水':'同',
    '木火':'生','火土':'生','土金':'生','金水':'生','水木':'生',
    '木土':'克','火金':'克','土水':'克','金木':'克','水火':'克' };
  const rel = relMap[wxD + wxO];
  if (rel === '同') return sameYY ? '比肩' : '劫财';
  if (rel === '生') return sameYY ? '食神' : '伤官';
  const rev = relMap[wxO + wxD];
  if (rev === '生') return sameYY ? '偏印' : '正印';
  if (rev === '克') return sameYY ? '七杀' : '正官';
  return sameYY ? '偏财' : '正财';
}

function e_gregorianToJDN(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  return d + Math.floor((153 * mo + 2) / 5) + 365 * yr
    + Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) - 32045;
}

function getClothing(temp, weather) {
  var base;
  if (temp >= 30) base = '轻薄透气';
  else if (temp >= 22) base = '薄衫出门';
  else if (temp >= 14) base = '薄外套刚好';
  else if (temp >= 5) base = '毛衣加外套';
  else base = '穿暖和些';
  var twist = '';
  if (['小雨','中雨','大雨','阵雨','暴雨'].includes(weather)) twist = '，带把伞，别淋着';
  else if (weather === '晴' && temp >= 28) twist = '，太阳大，戴个帽子';
  else if (weather === '阴') twist = '，天阴有风，脖子别受凉';
  else if (weather === '雾') twist = '，雾天出门慢一点';
  else twist = '，舒舒服服出门';
  return base + twist;
}

function getRecommendation(month, temp, weather, mainTenGod) {
  var base;
  if (month >= 5 && month <= 7) base = '暑天心火旺，午饭后歇一刻钟，比喝凉茶管用。';
  else if (month >= 2 && month <= 4) base = '春天养肝，少生气多舒展，出门走走。';
  else if (month >= 9 && month <= 11) base = '秋天容易感伤，多出门晒晒太阳。';
  else if (month === 12 || month === 1) base = '冬天养藏，别太消耗自己，早点睡。';
  else base = '喝杯温水，缓一缓。';
  var twist = '';
  if (['小雨','中雨','大雨','阵雨','雷阵雨'].includes(weather)) twist = '下雨天闷，';
  else if (weather === '晴') twist = temp >= 32 ? '天热，' : (temp >= 26 ? '天气不错，' : '天凉，');
  else if (weather === '阴') twist = '阴天容易闷，';
  else if (weather === '多云') twist = '云多不晒，';
  var tenGodTip = '';
  if (['正印','偏印'].includes(mainTenGod)) tenGodTip = '适合放慢节奏。';
  else if (['七杀','正官'].includes(mainTenGod)) tenGodTip = '别给自己加太多压力。';
  else if (['食神','伤官'].includes(mainTenGod)) tenGodTip = '有灵感就记下来。';
  else if (['比肩','劫财'].includes(mainTenGod)) tenGodTip = '按自己的节奏来。';
  else tenGodTip = '不急不躁就好。';
  return twist + tenGodTip;
}

// ---- 天气获取 ----
async function fetchWeather(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=Asia/Shanghai&forecast_days=1`;
    const res = await fetch(url);
    const wx = await res.json();
    const d = wx.daily;
    const code = d.weathercode[0];
    const wMap = { 0:'晴',1:'晴',2:'多云',3:'阴',45:'雾',51:'小雨',53:'小雨',55:'中雨',61:'小雨',63:'中雨',65:'大雨',71:'小雪',73:'中雪',75:'大雪',80:'阵雨',81:'阵雨',82:'暴雨',95:'雷阵雨',96:'雷暴+冰雹',99:'强雷暴' };
    const w = wMap[code] || '多云';
    const eMap = { '晴':'☀️','多云':'⛅','阴':'☁️','雾':'🌫️','小雨':'🌧️','中雨':'🌧️','大雨':'🌧️','暴雨':'🌧️⛈️','小雪':'❄️','中雪':'❄️','大雪':'❄️','阵雨':'🌦️','雷阵雨':'🌩️','雷暴+冰雹':'🌩️','强雷暴':'🌩️' };
    return {
      weather: w, emoji: eMap[w] || '🌤️',
      maxTemp: Math.round(d.temperature_2m_max[0]),
      minTemp: Math.round(d.temperature_2m_min[0]),
      precip: d.precipitation_sum[0],
    };
  } catch(e) {
    return { weather:'多云', emoji:'🌤️', maxTemp:25, minTemp:18, precip:0 };
  }
}

// ========== 主入口：生成每日运势卡片 ==========

async function generateDailyCard(baziData, date, lat, lon) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 天气
  const weatherData = lat && lon ? await fetchWeather(lat, lon) : null;

  // 流日计算
  const raw = baziData._raw;
  const dayGan = raw.dayGan;
  const jdn = e_gregorianToJDN(year, month, day);
  const liuRiGan = (jdn + 9) % 10;
  const liuRiZhiIdx = (jdn + 1) % 12;
  const liuRiZhi = E_ZHI[liuRiZhiIdx];
  const liuRiDayPillar = E_GAN[liuRiGan] + liuRiZhi;

  // 十神
  const mainTenGod = getTenGod(dayGan, liuRiGan);
  const auxGan = E_GAN.indexOf(ZANG_GAN_MAIN[liuRiZhi]);
  const auxTenGod = auxGan >= 0 ? getTenGod(dayGan, auxGan) : mainTenGod;

  // 旺衰
  const ganWx = E_WUXING_GAN[E_GAN[liuRiGan]];
  const qiVal = MONTH_QI[ganWx] ? MONTH_QI[ganWx][month - 1] : 0;
  const qiWeight = qiToWeight(qiVal);

  // 刑冲合害
  const baziZhis = [raw.yearZhi, raw.monthZhi, raw.dayZhi, raw.hourZhi].map(z => E_ZHI[z]);
  const interaction = checkBranchInteraction(liuRiZhi, baziZhis);

  // 空亡
  const isKong = baziData.kongWang.includes(liuRiZhi);

  // 日柱底色
  const dayPillarKey = E_GAN[raw.dayGan] + E_ZHI[raw.dayZhi];
  const dayNature = DAY_PILLAR_NATURE[dayPillarKey] || '有自己独特的性格底色';

  // 情志五脏
  const wuxingCount = baziData.wuxingRatio;
  const sortedWx = Object.entries(wuxingCount).sort((a, b) => b[1] - a[1]);
  const topWx = sortedWx[0][0];
  const total = Object.values(wuxingCount).reduce((s, v) => s + v, 0);
  const topRatio = sortedWx[0][1] / total;
  const qzInfo = QINGZHI[topWx];
  const qingZhiType = topRatio >= 0.3 ? 'excess' : 'lack';
  const bodyNote = topRatio >= 0.35 ? qzInfo[qingZhiType] : '';

  // 情绪描述
  const tenGodInfo = TEN_GOD_EMOTION[mainTenGod] || TEN_GOD_EMOTION['正印'];
  const baseEmotion = tenGodInfo.desc;

  let emotionDesc;
  if (interaction.type === '冲' && interaction.desc.includes('心里不太平')) {
    emotionDesc = `今天心里不太平，坐不住。${baseEmotion.replace(/。/, '，')}可能会有点烦躁，不是什么大事，过去了就好。`;
  } else if (interaction.type === '冲') {
    emotionDesc = `${baseEmotion}但可能会有点说不上来的不踏实，不是什么大事，别细想。`;
  } else if (interaction.type === '合') {
    emotionDesc = `${baseEmotion}心里顺畅，有被接住的感觉。`;
  } else if (interaction.type === '刑') {
    emotionDesc = `${baseEmotion}但容易跟自己较劲，对自己温柔点。`;
  } else if (isKong) {
    emotionDesc = `今天做什么都觉得差口气，不是你的问题。${baseEmotion}`;
  } else {
    emotionDesc = baseEmotion;
  }

  // 时辰建议
  const shichenMap = {
    '正印':'上午9点到11点精神最好，重要的事放这时。',
    '偏印':'晚上7点到9点脑子最静，适合给自己一点独处时间。',
    '比肩':'上午7点到9点精力最旺，趁早把想做的事干了。',
    '劫财':'下午3点到5点效率最高，别在上午磨叽。',
    '食神':'中午11点到1点心情最好，适合吃顿好的犒劳自己。',
    '伤官':'上午9点到11点思路最清，有想法赶紧记下来。',
    '正财':'上午9点到11点头脑清醒，适合处理钱和数字。',
    '偏财':'下午1点到3点灵光乍现，适合琢磨新方向。',
    '正官':'上午7点到9点状态最到位，先啃硬骨头。',
    '七杀':'下午5点到7点体力回升，适合出去走走散散心。',
  };
  const shichenTip = shichenMap[mainTenGod] || '按自己节奏来，身体知道什么时候该做什么。';

  // 短句
  const styleMap = { '正官':'思','七杀':'怒','正印':'思','偏印':'思','正财':'通用','偏财':'通用','食神':'喜不足','伤官':'怒','比肩':'通用','劫财':'思' };
  const quotePool = QUOTES[styleMap[mainTenGod]] || QUOTES['通用'];
  const quote = quotePool[Math.floor(Math.random() * quotePool.length)];

  // 拉回今天
  const tieMap = { '合':'今天顺畅，享受就好。','冲':'今天这点动荡，过去了就好了。','刑':'今天这个坎是自己给自己设的，松开就好。','害':'这点不对劲不用细想，明天就好。' };
  const tie = tieMap[interaction.type] || '今天就是这样，来了就接着，过了就放下。';

  // 穿衣 + 推荐
  const clothing = weatherData ? getClothing(weatherData.maxTemp, weatherData.weather) : '';
  const recommendation = weatherData ? getRecommendation(month, weatherData.maxTemp, weatherData.weather, mainTenGod) : '';

  // 星期
  const weekDays = ['日','一','二','三','四','五','六'];
  const dateStr = `${month}月${day}日 周${weekDays[date.getDay()]}`;

  return {
    dateStr,
    weather: weatherData,
    dayPillar: liuRiDayPillar,
    mainTenGod,
    auxTenGod,
    qiWeight,
    branchInteraction: interaction,
    kong: isKong,
    emotionDesc,
    bodyNote,
    shichenTip,
    clothing,
    recommendation,
    dayNature,
    quote: { classical: quote.c, modern: quote.m, tieToToday: tie },
  };
}
