/**
 * 用户自主日记：本地 wx.storage 读写
 * 与种子日记分离，不写入 seed / 云数据。
 * 另：已删除的示例日记 id 存在本机（键名不改）。列表每次从种子读取时跳过这些 id，重启也不会再出现。
 * 用户自建日记带固定模板：药材名+克数（可多行）、槽位 A/B/C、自由正文。
 * 槽位文案改 NOTE_TEMPLATE_SLOTS 即可，key 先固定。
 */
const STORAGE_KEY = 'tcm_user_notes';
const HIDDEN_BUILTIN_KEY = 'tcm_hidden_builtin_notes';

/** 预留槽位文案。产品改 label / placeholder 即可，先不要改 key。 */
const NOTE_TEMPLATE_SLOTS = [
  {
    key: 'slotA',
    label: '配伍说明',
    placeholder: '配伍或用法，可先留空',
    multiline: true
  },
  {
    key: 'slotB',
    label: '注意事项',
    placeholder: '注意事项，可先留空',
    multiline: true
  },
  {
    key: 'slotC',
    label: '来源/备注',
    placeholder: '来源或备注，可先留空',
    multiline: false
  }
];

function slotRaw(note, key) {
  if (!note) return '';
  if (key === 'slotC' && !Object.prototype.hasOwnProperty.call(note, 'slotC')) {
    return note.source || '';
  }
  if (note[key] == null) return '';
  return String(note[key]);
}

/** 编辑页用：带当前文案和已存内容 */
function templateSlotsFor(note) {
  return NOTE_TEMPLATE_SLOTS.map((s) => ({
    key: s.key,
    label: s.label,
    placeholder: s.placeholder,
    multiline: !!s.multiline,
    value: slotRaw(note, s.key)
  }));
}

/**
 * 药材行只保留成对的名称和克数。空行丢掉；只填了一半则抛错。
 * @param {array} herbs
 * @returns {{name: string, amount: string}[]}
 */
function cleanHerbs(herbs) {
  if (!Array.isArray(herbs)) return [];
  const out = [];
  herbs.forEach((h) => {
    if (!h || typeof h !== 'object') return;
    const name = String(h.name || '').trim();
    const amount = String(h.amount || '').trim();
    if (!name && !amount) return;
    if (!name || !amount) {
      throw new Error('药材名称和克数请成对填写');
    }
    out.push({ name: name, amount: amount });
  });
  return out;
}

function pickText(note, existing, key) {
  if (note && Object.prototype.hasOwnProperty.call(note, key)) {
    return String(note[key] == null ? '' : note[key]).trim();
  }
  if (existing && existing[key] != null) return String(existing[key]);
  if (key === 'slotC' && existing && existing.source) return String(existing.source);
  return '';
}

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
    throw new Error('无效日记');
  }
  const title = (note.title || '').trim();
  if (!title) {
    throw new Error('请填写标题');
  }
  const listAll = readAll();
  const now = Date.now();
  const existing = note.id ? listAll.find((e) => e.id === note.id) : null;
  const slotA = pickText(note, existing, 'slotA');
  const slotB = pickText(note, existing, 'slotB');
  const slotC = pickText(note, existing, 'slotC');
  const herbs = Array.isArray(note.herbs)
    ? cleanHerbs(note.herbs)
    : (existing && Array.isArray(existing.herbs) ? cleanHerbs(existing.herbs) : []);
  const summary = note.summary == null
    ? (existing && existing.summary != null ? String(existing.summary) : '')
    : String(note.summary).trim();
  const content = note.content == null
    ? (existing && existing.content != null ? String(existing.content) : '')
    : String(note.content).trim();
  let icon = note.icon == null
    ? (existing && existing.icon != null ? String(existing.icon) : '')
    : String(note.icon).trim();
  if (!icon) icon = '📝';
  const payload = {
    id: note.id || genId(),
    title: title,
    summary: summary,
    content: content,
    icon: icon,
    herbs: herbs,
    slotA: slotA,
    slotB: slotB,
    slotC: slotC,
    source: slotC || '个人学习日记',
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

/** 已删除的示例日记 id。种子仍在文件里，但列表不再加回。 */
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
 * 永久去掉一条示例日记（写入已删 id，重启后种子不会再把它加回列表）
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
  NOTE_TEMPLATE_SLOTS: NOTE_TEMPLATE_SLOTS,
  templateSlotsFor: templateSlotsFor,
  cleanHerbs: cleanHerbs,
  list: list,
  get: get,
  save: save,
  remove: remove,
  listHiddenBuiltins: listHiddenBuiltins,
  hideBuiltin: hideBuiltin,
  isBuiltinHidden: isBuiltinHidden
};
