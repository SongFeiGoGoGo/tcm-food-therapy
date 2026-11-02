/**
 * 养生日记：本地 wx.storage 读写
 * 不做辨证、诊断、用药建议；仅记录与简单本周计数。
 */
const STORAGE_KEY = 'tcm_diary_entries';

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function genId() {
  return 'd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function readAll() {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY);
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch (e) {
    console.warn('diary readAll fail', e);
    return [];
  }
}

function writeAll(list) {
  wx.setStorageSync(STORAGE_KEY, list || []);
}

/** 列表：按日期新→旧，同日按 updatedAt 新→旧 */
function list() {
  return readAll().slice().sort((a, b) => {
    const da = a.date || '';
    const db = b.date || '';
    if (da !== db) return db.localeCompare(da);
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
}

function get(id) {
  if (!id) return null;
  return readAll().find((e) => e.id === id) || null;
}

/**
 * 保存：有 id 则更新，无则新建
 * @param {object} entry
 * @returns {object} 保存后的条目
 */
function save(entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('无效日记');
  }
  const listAll = readAll();
  const now = Date.now();
  const date = (entry.date || todayStr()).trim();
  const payload = {
    id: entry.id || genId(),
    date: date,
    sleep: (entry.sleep || '').trim(),
    stool: (entry.stool || '').trim(),
    appetite: (entry.appetite || '').trim(),
    mood: (entry.mood || '').trim(),
    coldHeat: (entry.coldHeat || '').trim(),
    acne: (entry.acne || '').trim(),
    acneNote: (entry.acneNote || '').trim(),
    dryThroat: (entry.dryThroat || '').trim(),
    dryThroatNote: (entry.dryThroatNote || '').trim(),
    remark: (entry.remark || '').trim(),
    updatedAt: now
  };

  const idx = listAll.findIndex((e) => e.id === payload.id);
  if (idx >= 0) {
    listAll[idx] = payload;
  } else {
    listAll.push(payload);
  }
  writeAll(listAll);
  return payload;
}

function remove(id) {
  if (!id) return false;
  const listAll = readAll();
  const next = listAll.filter((e) => e.id !== id);
  if (next.length === listAll.length) return false;
  writeAll(next);
  return true;
}

/** 本周一 00:00 起的日期字符串（本地时区） */
function weekStartStr(refDate) {
  const d = refDate ? new Date(refDate) : new Date();
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? 6 : day - 1; // Monday as start
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayNum = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + dayNum;
}

/**
 * 本周小结：只做简单计数，不做诊断建议
 * @param {array} [entries] 可选，默认读全部再筛本周
 */
function weekSummary(entries) {
  const all = Array.isArray(entries) ? entries : readAll();
  const start = weekStartStr();
  const week = all.filter((e) => e && e.date && e.date >= start);

  let dryThroatCount = 0;
  let acneCount = 0;
  let coldCount = 0;
  let heatCount = 0;
  let poorSleepCount = 0;
  let recordCount = week.length;

  week.forEach((e) => {
    if (e.dryThroat === '有') dryThroatCount += 1;
    if (e.acne === '有') acneCount += 1;
    if (e.coldHeat === '怕冷' || e.coldHeat === '都有一点') coldCount += 1;
    if (e.coldHeat === '怕热' || e.coldHeat === '都有一点') heatCount += 1;
    if (e.sleep === '差') poorSleepCount += 1;
  });

  return {
    weekStart: start,
    recordCount: recordCount,
    dryThroatCount: dryThroatCount,
    acneCount: acneCount,
    coldCount: coldCount,
    heatCount: heatCount,
    poorSleepCount: poorSleepCount
  };
}

module.exports = {
  STORAGE_KEY: STORAGE_KEY,
  todayStr: todayStr,
  list: list,
  get: get,
  save: save,
  remove: remove,
  weekSummary: weekSummary,
  weekStartStr: weekStartStr
};
