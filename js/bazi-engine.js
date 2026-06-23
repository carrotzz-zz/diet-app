// ========== 八字排盘引擎（浏览器版）==========
// 从 baziCalc 云函数迁移，零外部依赖

const GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const SHENGXIAO = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
const WUXING_GAN = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
const WUXING_ZHI = { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' };
const YIN_YANG_GAN = { '甲':'阳','乙':'阴','丙':'阳','丁':'阴','戊':'阳','己':'阴','庚':'阳','辛':'阴','壬':'阳','癸':'阴' };

const ZANG_GAN = {
  '子': ['癸'], '丑': ['己','癸','辛'], '寅': ['甲','丙','戊'],
  '卯': ['乙'], '辰': ['戊','乙','癸'], '巳': ['丙','戊','庚'],
  '午': ['丁','己'], '未': ['己','丁','乙'], '申': ['庚','壬','戊'],
  '酉': ['辛'], '戌': ['戊','辛','丁'], '亥': ['壬','甲'],
};

// 节气日期表（1900-2030）
const JIEQI = {
  1990:[2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,8,12,7,1,6],
  1991:[2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,7,1,6],
  1992:[2,4,3,5,4,4,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,6],
  1993:[2,4,3,5,4,5,5,5,6,6,7,7,8,7,9,7,10,8,11,7,12,7,1,5],
  1994:[2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,7,12,7,1,6],
  1995:[2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,7,1,6],
  1996:[2,4,3,5,4,4,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,5],
  1997:[2,4,3,5,4,5,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,5],
  1998:[2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,7,12,7,1,6],
  1999:[2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,7,1,6],
  2000:[2,4,3,5,4,4,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,6],
  2001:[2,4,3,5,4,5,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,5],
  2002:[2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,7,12,7,1,6],
  2003:[2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,7,1,6],
  2004:[2,4,3,5,4,4,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,6],
  2005:[2,4,3,5,4,5,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,5],
  2006:[2,4,3,6,4,5,5,5,6,6,7,7,8,7,9,8,10,8,11,7,12,7,1,6],
  2007:[2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,7,1,6],
  2008:[2,4,3,5,4,4,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,6],
  2009:[2,4,3,5,4,4,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,5],
  2010:[2,4,3,5,4,5,5,5,6,6,7,7,8,7,9,8,10,8,11,7,12,7,1,6],
  2011:[2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,8,12,7,1,6],
  2012:[2,4,3,5,4,4,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,5],
  2013:[2,4,3,5,4,4,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,5],
  2014:[2,4,3,6,4,5,5,5,6,6,7,7,8,7,9,8,10,8,11,7,12,7,1,6],
  2015:[2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,8,12,7,1,6],
  2016:[2,4,3,5,4,4,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,6],
  2017:[2,3,3,5,4,4,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,5],
  2018:[2,4,3,5,4,5,5,5,6,6,7,7,8,7,9,8,10,8,11,7,12,7,1,5],
  2019:[2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,8,12,7,1,6],
  2020:[2,4,3,5,4,4,5,5,6,5,7,6,8,7,9,7,10,8,11,7,12,7,1,6],
  2021:[2,3,3,5,4,4,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,5],
  2022:[2,4,3,5,4,5,5,5,6,6,7,7,8,7,9,8,10,8,11,7,12,7,1,5],
  2023:[2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,8,12,7,1,6],
  2024:[2,4,3,5,4,4,5,5,6,5,7,6,8,7,9,7,10,8,11,7,12,6,1,6],
  2025:[2,3,3,5,4,4,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,5],
  2026:[2,4,3,5,4,5,5,5,6,6,7,7,8,7,9,7,10,8,11,7,12,7,1,5],
  2027:[2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,8,12,7,1,6],
  2028:[2,4,3,5,4,4,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,6],
  2029:[2,3,3,5,4,4,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,5],
  2030:[2,4,3,5,4,5,5,5,6,5,7,7,8,7,9,7,10,8,11,7,12,7,1,6],
};

function getJieqi(year, jieIndex) {
  const effectiveYear = jieIndex === 11 ? year + 1 : year;
  if (JIEQI[year]) {
    return [effectiveYear, JIEQI[year][jieIndex * 2], JIEQI[year][jieIndex * 2 + 1]];
  }
  let nearest = year;
  for (let y = year - 1; y >= 1900; y--) { if (JIEQI[y]) { nearest = y; break; } }
  if (!JIEQI[nearest]) { for (let y = year + 1; y <= 2030; y++) { if (JIEQI[y]) { nearest = y; break; } } }
  if (JIEQI[nearest]) {
    return [effectiveYear, JIEQI[nearest][jieIndex * 2], JIEQI[nearest][jieIndex * 2 + 1]];
  }
  const approx = [[2,4],[3,6],[4,5],[5,5],[6,6],[7,7],[8,7],[9,8],[10,8],[11,7],[12,7],[1,6]];
  return [effectiveYear, approx[jieIndex][0], approx[jieIndex][1]];
}

function gregorianToJDN(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const year = y + 4800 - a;
  const month = m + 12 * a - 3;
  return d + Math.floor((153 * month + 2) / 5) + 365 * year
    + Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400) - 32045;
}

function getDayGan(jdn) { return (jdn + 9) % 10; }
function getDayZhi(jdn) { return (jdn + 1) % 12; }

function getYearPillar(year, month, day) {
  const lichun = getJieqi(year, 0);
  const isBeforeLichun = (month < lichun[1]) || (month === lichun[1] && day < lichun[2]);
  const baziYear = isBeforeLichun ? year - 1 : year;
  return { gan: ((year - 4) % 10 + 10) % 10, zhi: ((year - 4) % 12 + 12) % 12, year: baziYear };
}

const JIE_TO_YUE_ZHI = [2,3,4,5,6,7,8,9,10,11,0,1];

function getMonthPillar(year, month, day, yearGan) {
  let yueZhiIndex = -1;
  for (let j = 0; j < 12; j++) {
    const jq = getJieqi(year, j);
    if (new Date(year, month - 1, day) >= new Date(jq[0], jq[1] - 1, jq[2])) {
      yueZhiIndex = JIE_TO_YUE_ZHI[j];
    }
  }
  if (yueZhiIndex === -1) {
    const prevXiaohan = getJieqi(year - 1, 11);
    if (new Date(year, month - 1, day) >= new Date(prevXiaohan[0], prevXiaohan[1] - 1, prevXiaohan[2])) {
      yueZhiIndex = 11;
    } else { yueZhiIndex = 10; }
  }
  const yinYueGan = ((yearGan % 5) * 2 + 2) % 10;
  const yueZhiOffset = (yueZhiIndex - 2 + 12) % 12;
  return { gan: (yinYueGan + yueZhiOffset) % 10, zhi: yueZhiIndex };
}

function getHourPillar(hour, dayGan) {
  const zhiIndex = Math.floor(((hour + 1) % 24) / 2);
  const ziShiGan = ((dayGan % 5) * 2) % 10;
  return { gan: (ziShiGan + zhiIndex) % 10, zhi: zhiIndex };
}

function getTenGods(dayGan, otherGan) {
  const wuxingDay = WUXING_GAN[GAN[dayGan]];
  const wuxingOther = WUXING_GAN[GAN[otherGan]];
  const sameYinYang = YIN_YANG_GAN[GAN[dayGan]] === YIN_YANG_GAN[GAN[otherGan]];
  const relMap = {
    '木木':'同','火火':'同','土土':'同','金金':'同','水水':'同',
    '木火':'生','火土':'生','土金':'生','金水':'生','水木':'生',
    '木土':'克','火金':'克','土水':'克','金木':'克','水火':'克',
  };
  const rel = relMap[wuxingDay + wuxingOther];
  if (rel === '同') return sameYinYang ? '比肩' : '劫财';
  if (rel === '生') return sameYinYang ? '食神' : '伤官';
  const relReverse = relMap[wuxingOther + wuxingDay];
  if (relReverse === '生') return sameYinYang ? '偏印' : '正印';
  if (relReverse === '克') return sameYinYang ? '七杀' : '正官';
  return sameYinYang ? '偏财' : '正财';
}

function getDaYun(yearGan, yearZhi, monthGan, monthZhi, gender, birthYear, birthMonth, birthDay) {
  const yearGanYang = YIN_YANG_GAN[GAN[yearGan]] === '阳';
  const isMale = gender === '男';
  const forward = (isMale && yearGanYang) || (!isMale && !yearGanYang);
  const curJieIdx = (monthZhi - 2 + 12) % 12;
  let daysToJie;
  if (forward) {
    const nextJieIdx = (curJieIdx + 1) % 12;
    let nextJie = getJieqi(birthYear, nextJieIdx);
    if (nextJieIdx === 0) nextJie = getJieqi(birthYear + 1, 0);
    daysToJie = Math.round((new Date(nextJie[0], nextJie[1]-1, nextJie[2]) - new Date(birthYear, birthMonth-1, birthDay)) / 86400000);
  } else {
    const prevJie = getJieqi(birthYear, curJieIdx);
    daysToJie = Math.round((new Date(birthYear, birthMonth-1, birthDay) - new Date(prevJie[0], prevJie[1]-1, prevJie[2])) / 86400000);
  }
  const startAge = Math.round(daysToJie / 3);
  const dayuns = [];
  let cg = monthGan, cz = monthZhi;
  for (let i = 0; i < 8; i++) {
    if (forward) { cg = (cg + 1) % 10; cz = (cz + 1) % 12; }
    else { cg = (cg - 1 + 10) % 10; cz = (cz - 1 + 12) % 12; }
    const startYear = birthYear + startAge + i * 10;
    dayuns.push({ gan: cg, zhi: cz, startAge: startAge + i * 10, startYear, endYear: startYear + 9 });
  }
  return { startAge, dayuns, forward };
}

function getDayGanZhiFullIndex(jdn) {
  const gan = getDayGan(jdn);
  const zhi = getDayZhi(jdn);
  for (let i = 0; i < 60; i++) { if (i % 10 === gan && i % 12 === zhi) return i; }
  return 0;
}

// ========== 主入口 ==========

function calcBazi(year, month, day, hour, gender) {
  const jdn = gregorianToJDN(year, month, day);
  const dayGan = getDayGan(jdn);
  const dayZhi = getDayZhi(jdn);
  const yearPillar = getYearPillar(year, month, day);
  const lichun = getJieqi(year, 0);
  const beforeLichun = (month < lichun[1]) || (month === lichun[1] && day < lichun[2]);
  const effectiveYearGan = beforeLichun ? ((year - 5) % 10 + 10) % 10 : yearPillar.gan;
  const monthPillar = getMonthPillar(year, month, day, effectiveYearGan);
  const hourPillar = getHourPillar(hour, dayGan);

  const pillars = [
    { name:'年', gan:yearPillar.gan, zhi:yearPillar.zhi },
    { name:'月', gan:monthPillar.gan, zhi:monthPillar.zhi },
    { name:'日', gan:dayGan, zhi:dayZhi },
    { name:'时', gan:hourPillar.gan, zhi:hourPillar.zhi },
  ];
  pillars.forEach(p => {
    p.tenGod = getTenGods(dayGan, p.gan);
    p.wuxingGan = WUXING_GAN[GAN[p.gan]];
    p.wuxingZhi = WUXING_ZHI[ZHI[p.zhi]];
    p.zangGan = ZANG_GAN[ZHI[p.zhi]];
  });

  const daYun = getDaYun(yearPillar.gan, yearPillar.zhi, monthPillar.gan, monthPillar.zhi, gender, year, month, day);
  const dayGzIndex = getDayGanZhiFullIndex(jdn);
  const kongWangMap = [[10,11],[8,9],[6,7],[4,5],[2,3],[0,1]];
  const kongWang = kongWangMap[(Math.floor(dayGzIndex / 10)) % 6];
  const dayWuxing = WUXING_GAN[GAN[dayGan]];

  const wuxingCount = { '木':0,'火':0,'土':0,'金':0,'水':0 };
  pillars.forEach(p => {
    wuxingCount[p.wuxingGan]++;
    wuxingCount[p.wuxingZhi]++;
  });

  return {
    bazi: [
      { gan:GAN[yearPillar.gan], zhi:ZHI[yearPillar.zhi], tenGod:pillars[0].tenGod, wuxing:pillars[0].wuxingGan },
      { gan:GAN[monthPillar.gan], zhi:ZHI[monthPillar.zhi], tenGod:pillars[1].tenGod, wuxing:pillars[1].wuxingGan },
      { gan:GAN[dayGan], zhi:ZHI[dayZhi], tenGod:'日主', wuxing:dayWuxing },
      { gan:GAN[hourPillar.gan], zhi:ZHI[hourPillar.zhi], tenGod:pillars[3].tenGod, wuxing:pillars[3].wuxingGan },
    ],
    dayMaster: { gan:GAN[dayGan], zhi:ZHI[dayZhi], wuxing:dayWuxing },
    daYun: daYun.dayuns.map(d => ({ gan:GAN[d.gan], zhi:ZHI[d.zhi], startAge:d.startAge, startYear:d.startYear, endYear:d.endYear })),
    startAge: daYun.startAge,
    kongWang: kongWang.map(i => ZHI[i]),
    wuxingRatio: wuxingCount,
    dayGanZhiIndex: dayGzIndex,
    _raw: {
      pillars, dayGan, dayZhi,
      yearGan: yearPillar.gan, yearZhi: yearPillar.zhi,
      monthGan: monthPillar.gan, monthZhi: monthPillar.zhi,
      hourGan: hourPillar.gan, hourZhi: hourPillar.zhi,
      dayGanZhiIndex: dayGzIndex, kongWangZhi: kongWang,
    },
  };
}
