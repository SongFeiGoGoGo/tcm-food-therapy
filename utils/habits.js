/**
 * 打卡：五项习惯，本地 storage。
 * 日期键与首页干支日相同（上海时区，23:00 起算次日），见 utils/calendar.js。
 * 不读写、不删除旧养生日记 tcm_diary_entries。
 */
const calendar = require('./calendar');

const STORAGE_KEY = 'tcm_habit_checkins';
const NOTICE_KEY = 'tcm_diary_archive_notice_seen';
const WEEK_COUNT = 16;

const HABITS = [
  { key: 'earlySleep', label: '早睡' },
  { key: 'softBelly', label: '揉腹' },
  { key: 'combHair', label: '梳头' },
  { key: 'patBaxu', label: '拍八虚' },
  { key: 'morningStool', label: '七点前完成排大便' }
];

function emptyDay() {
  return {
    earlySleep: false,
    softBelly: false,
    combHair: false,
    patBaxu: false,
    morningStool: false
  };
}

function readAll() {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY);
    if (!raw) return {};
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
    return obj;
  } catch (e) {
    console.warn('habits read fail', e);
    return {};
  }
}

function writeAll(map) {
  wx.setStorageSync(STORAGE_KEY, map || {});
}

function normalizeDay(raw) {
  const day = emptyDay();
  if (!raw || typeof raw !== 'object') return day;
  HABITS.forEach((item) => {
    day[item.key] = !!raw[item.key];
  });
  return day;
}

function countOf(raw) {
  const day = normalizeDay(raw);
  let n = 0;
  HABITS.forEach((item) => {
    if (day[item.key]) n += 1;
  });
  return n;
}

function getDay(dateKey) {
  return normalizeDay(readAll()[dateKey]);
}

function toggle(dateKey, habitKey) {
  if (!HABITS.some((item) => item.key === habitKey)) {
    throw new Error('未知项目');
  }
  const all = readAll();
  const day = normalizeDay(all[dateKey]);
  day[habitKey] = !day[habitKey];
  all[dateKey] = day;
  writeAll(all);
  return day;
}

function viewOf(dateKey, raw) {
  const day = raw ? normalizeDay(raw) : getDay(dateKey);
  return HABITS.map((item) => ({
    key: item.key,
    label: item.label,
    checked: !!day[item.key]
  }));
}

/**
 * 近 WEEK_COUNT 周，周一开头，列是一周。
 * @param {string} todayKey
 * @param {object} records
 * @param {number} [weeksCount]
 */
function buildWeeks(todayKey, records, weeksCount) {
  const total = weeksCount || WEEK_COUNT;
  const store = records || {};
  const mondayOffset = calendar.weekdayMon0(todayKey);
  const thisMonday = calendar.addDaysKey(todayKey, -mondayOffset);
  const startMonday = calendar.addDaysKey(thisMonday, -(total - 1) * 7);
  const weeks = [];
  for (let w = 0; w < total; w++) {
    const monday = calendar.addDaysKey(startMonday, w * 7);
    const days = [];
    let monthText = '';
    for (let i = 0; i < 7; i++) {
      const date = calendar.addDaysKey(monday, i);
      const future = date > todayKey;
      const count = future ? 0 : countOf(store[date]);
      if (date.slice(8) === '01') {
        monthText = String(Number(date.slice(5, 7))) + '月';
      }
      days.push({
        date: date,
        count: count,
        level: count,
        future: future
      });
    }
    if (!monthText && w === 0) {
      monthText = String(Number(monday.slice(5, 7))) + '月';
    }
    weeks.push({
      id: 'w' + w,
      monthText: monthText,
      days: days
    });
  }
  return weeks;
}

function noticeSeen() {
  try {
    return !!wx.getStorageSync(NOTICE_KEY);
  } catch (e) {
    return false;
  }
}

function markNoticeSeen() {
  wx.setStorageSync(NOTICE_KEY, 1);
}

module.exports = {
  STORAGE_KEY: STORAGE_KEY,
  NOTICE_KEY: NOTICE_KEY,
  WEEK_COUNT: WEEK_COUNT,
  HABITS: HABITS,
  readAll: readAll,
  getDay: getDay,
  toggle: toggle,
  viewOf: viewOf,
  countOf: countOf,
  buildWeeks: buildWeeks,
  noticeSeen: noticeSeen,
  markNoticeSeen: markNoticeSeen
};
