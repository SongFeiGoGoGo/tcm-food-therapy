/**
 * 用户自主笔记：本地 wx.storage 读写
 * 与种子笔记分离，不写入 seed / 云数据。
 * 另：内置笔记「本地隐藏」黑名单（不改 seed）。
 * 理论讨论，不替代面诊；不做诊断推荐。
 */
const STORAGE_KEY = 'tcm_user_notes';
const HIDDEN_BUILTIN_KEY = 'tcm_hidden_builtin_notes';

function genId() {
  return 'un_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
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
    console.warn('userNotes readAll fail', e);
    return [];
  }
}

function writeAll(list) {
  wx.setStorageSync(STORAGE_KEY, list || []);
}

/** 列表：按 updatedAt 新→旧 */
function list() {
  return readAll()
    .slice()
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

function get(id) {
  if (!id) return null;
  return readAll().find((e) => e.id === id) || null;
}

/**
 * 保存：有 id 则更新，无则新建
 * @param {object} note
 * @returns {object}
 */
function save(note) {
  if (!note || typeof note !== 'object') {
    throw new Error('无效笔记');
  }
  const title = (note.title || '').trim();
  if (!title) {
    throw new Error('请填写标题');
  }
  const listAll = readAll();
  const now = Date.now();
  const existing = note.id ? listAll.find((e) => e.id === note.id) : null;
  const payload = {
    id: note.id || genId(),
    title: title,
    summary: (note.summary || '').trim(),
    content: (note.content || '').trim(),
    icon: (note.icon || '').trim() || '📝',
    source: (note.source || '').trim() || '个人学习笔记',
    createdAt: existing ? existing.createdAt || now : now,
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

/** 已隐藏的内置笔记 id 列表（仅本地，不改 seed） */
function listHiddenBuiltins() {
  try {
    const raw = wx.getStorageSync(HIDDEN_BUILTIN_KEY);
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
    if (typeof raw === 'string') {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
    }
    return [];
  } catch (e) {
    console.warn('listHiddenBuiltins fail', e);
    return [];
  }
}

function writeHiddenBuiltins(ids) {
  const uniq = [];
  const seen = {};
  (ids || []).forEach((id) => {
    const s = id == null ? '' : String(id);
    if (!s || seen[s]) return;
    seen[s] = true;
    uniq.push(s);
  });
  wx.setStorageSync(HIDDEN_BUILTIN_KEY, uniq);
  return uniq;
}

/**
 * 将内置笔记 id 加入本地隐藏黑名单（本机列表不再出现；不改 seed）
 * @param {string} id symptom _id
 * @returns {boolean}
 */
function hideBuiltin(id) {
  if (!id) return false;
  const sid = String(id);
  const cur = listHiddenBuiltins();
  if (cur.indexOf(sid) >= 0) return true;
  writeHiddenBuiltins(cur.concat([sid]));
  return true;
}

function isBuiltinHidden(id) {
  if (!id) return false;
  return listHiddenBuiltins().indexOf(String(id)) >= 0;
}

module.exports = {
  STORAGE_KEY: STORAGE_KEY,
  HIDDEN_BUILTIN_KEY: HIDDEN_BUILTIN_KEY,
  list: list,
  get: get,
  save: save,
  remove: remove,
  listHiddenBuiltins: listHiddenBuiltins,
  hideBuiltin: hideBuiltin,
  isBuiltinHidden: isBuiltinHidden
};
