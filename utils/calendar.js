/**
 * 首页干支与节气。纯本地计算，库为 lunar-javascript。
 *
 * 切日规则（写死，与打卡日期键相同）：
 * - 时区 Asia/Shanghai。中国自 1991 年起无夏令时，用 UTC+8 取上海墙钟，不读手机时区。
 * - 子时换日：上海钟点 >= 23:00 时，干支日算下一个公历日。
 * - 年、月、日柱取该干支日 12:00 的库结果。正午避开库内部的 23:00 日界，
 *   与真实时刻上 Lunar.getDayInGanZhiExact()（晚子时算次日）对齐。
 * - 节气用库给出的交节时刻（北京时间），再套同一套 23:00 规则落到干支日。
 *   交节钟点 < 23:00：节气日 = 该公历日；>= 23:00：节气日 = 次日。
 *   干支日等于该节气日则显示「今日××」。
 * - 临近阈值 NEAR_DAYS = 7，可改这一处。
 */
const { Solar } = require('lunar-javascript');

const DAY_CUT_HOUR = 23;
const NEAR_DAYS = 7;

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

function ymd(y, m, d) {
  return y + '-' + pad2(m) + '-' + pad2(d);
}

function parseYmd(key) {
  const parts = String(key || '').split('-');
  return {
    y: Number(parts[0]),
    m: Number(parts[1]),
    d: Number(parts[2])
  };
}

function addDays(y, m, d, n) {
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return {
    y: dt.getUTCFullYear(),
    m: dt.getUTCMonth() + 1,
    d: dt.getUTCDate()
  };
}

function addDaysKey(key, n) {
  const p = parseYmd(key);
  const next = addDays(p.y, p.m, p.d, n);
  return ymd(next.y, next.m, next.d);
}

/** 0=周一 … 6=周日 */
function weekdayMon0(key) {
  const p = parseYmd(key);
  const sun0 = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
  return sun0 === 0 ? 6 : sun0 - 1;
}

function shanghaiParts(date) {
  const shifted = new Date(date.getTime() + 8 * 3600 * 1000);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
    h: shifted.getUTCHours(),
    min: shifted.getUTCMinutes(),
    s: shifted.getUTCSeconds()
  };
}

function shiftIfZi(parts) {
  if ((parts.h || 0) >= DAY_CUT_HOUR) {
    return addDays(parts.y, parts.m, parts.d, 1);
  }
  return { y: parts.y, m: parts.m, d: parts.d };
}

function dayDiff(fromKey, toKey) {
  const a = parseYmd(fromKey);
  const b = parseYmd(toKey);
  const ua = Date.UTC(a.y, a.m - 1, a.d);
  const ub = Date.UTC(b.y, b.m - 1, b.d);
  return Math.round((ub - ua) / 86400000);
}

function anchorOf(date) {
  const civil = shanghaiParts(date || new Date());
  const anchor = shiftIfZi(civil);
  return {
    civil: civil,
    anchor: anchor,
    key: ymd(anchor.y, anchor.m, anchor.d),
    solarText: civil.y + '年' + civil.m + '月' + civil.d + '日'
  };
}

function termKeyFromSolar(solar) {
  const anchor = shiftIfZi({
    y: solar.getYear(),
    m: solar.getMonth(),
    d: solar.getDay(),
    h: solar.getHour()
  });
  return ymd(anchor.y, anchor.m, anchor.d);
}

function collectTerms(lunar) {
  const map = {};
  function add(name, solar) {
    if (!name || !solar || typeof solar.getYear !== 'function') return;
    if (!/[\u4e00-\u9fff]/.test(name)) return;
    const id = name + '|' + (solar.toYmdHms ? solar.toYmdHms() : solar.toYmd());
    map[id] = { name: name, key: termKeyFromSolar(solar) };
  }
  const table = lunar.getJieQiTable();
  Object.keys(table).forEach((name) => {
    add(name, table[name]);
  });
  const upcoming = lunar.getNextJieQi(false);
  const afterToday = lunar.getNextJieQi(true);
  if (upcoming) add(upcoming.getName(), upcoming.getSolar());
  if (afterToday) add(afterToday.getName(), afterToday.getSolar());
  return Object.keys(map).map((id) => map[id]);
}

function describeTerm(anchorKey, terms) {
  let todayName = '';
  let next = null;
  terms.forEach((term) => {
    if (term.key === anchorKey) {
      todayName = term.name;
      return;
    }
    if (term.key > anchorKey && (!next || term.key < next.key)) {
      next = term;
    }
  });
  if (todayName) {
    return {
      termToday: true,
      termName: todayName,
      days: 0,
      near: false,
      termText: '今日' + todayName,
      nearText: ''
    };
  }
  if (!next) {
    return {
      termToday: false,
      termName: '',
      days: 0,
      near: false,
      termText: '',
      nearText: ''
    };
  }
  const days = dayDiff(anchorKey, next.key);
  const near = days <= NEAR_DAYS;
  return {
    termToday: false,
    termName: next.name,
    days: days,
    near: near,
    termText: '下一节气 · ' + next.name + ' · ' + days + ' 天后',
    nearText: near ? '还有 ' + days + ' 天到' + next.name : ''
  };
}

function todayAlmanac(date) {
  const info = anchorOf(date || new Date());
  const solar = Solar.fromYmdHms(info.anchor.y, info.anchor.m, info.anchor.d, 12, 0, 0);
  const lunar = solar.getLunar();
  const yearGZ = lunar.getYearInGanZhi();
  const monthGZ = lunar.getMonthInGanZhi();
  const dayGZ = lunar.getDayInGanZhiExact();
  const term = describeTerm(info.key, collectTerms(lunar));
  return {
    key: info.key,
    line: yearGZ + '年 · ' + monthGZ + '月 · ' + dayGZ + '日',
    yearGZ: yearGZ,
    monthGZ: monthGZ,
    dayGZ: dayGZ,
    solarText: info.solarText,
    termToday: term.termToday,
    termName: term.termName,
    days: term.days,
    near: term.near,
    termText: term.termText,
    nearText: term.nearText
  };
}

function todayKey(date) {
  return anchorOf(date || new Date()).key;
}

module.exports = {
  DAY_CUT_HOUR: DAY_CUT_HOUR,
  NEAR_DAYS: NEAR_DAYS,
  ymd: ymd,
  parseYmd: parseYmd,
  addDaysKey: addDaysKey,
  weekdayMon0: weekdayMon0,
  shanghaiParts: shanghaiParts,
  todayAlmanac: todayAlmanac,
  todayKey: todayKey
};
