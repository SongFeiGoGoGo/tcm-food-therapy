/**
 * 统一数据层：云开发可用时走云函数；否则本地 JSON + wx.storage
 */
const seed = require('./seed');

function isCloudReady() {
  try {
    const app = getApp();
    return !!(app && app.globalData && app.globalData.cloudReady && wx.cloud);
  } catch (e) {
    return false;
  }
}

function getLocalOpenId() {
  let id = wx.getStorageSync('local_openid');
  if (!id) {
    id = 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    wx.setStorageSync('local_openid', id);
  }
  return id;
}

/** 获取症状列表 */
function getSymptoms() {
  if (isCloudReady()) {
    return wx.cloud
      .callFunction({ name: 'getSymptoms' })
      .then((res) => {
        const list = (res.result && res.result.data) || [];
        return list.length ? list : seed.symptoms.slice().sort((a, b) => a.sort - b.sort);
      })
      .catch((err) => {
        console.warn('getSymptoms 云调用失败，回退本地', err);
        return seed.symptoms.slice().sort((a, b) => a.sort - b.sort);
      });
  }
  return Promise.resolve(seed.symptoms.slice().sort((a, b) => a.sort - b.sort));
}

/** 按食疗 ID 或症状 ID 取详情 */
function getRecipeById(id) {
  if (!id) return Promise.reject(new Error('缺少 id'));

  if (isCloudReady()) {
    return wx.cloud
      .callFunction({ name: 'getRecipeById', data: { id } })
      .then((res) => {
        if (res.result && res.result.data) return res.result.data;
        return findRecipeLocal(id);
      })
      .catch((err) => {
        console.warn('getRecipeById 云调用失败，回退本地', err);
        return findRecipeLocal(id);
      });
  }
  return Promise.resolve(findRecipeLocal(id));
}

function findRecipeLocal(id) {
  let recipe =
    seed.recipes.find((r) => r._id === id) ||
    seed.recipes.find((r) => r.symptomId === id);
  if (!recipe) {
    const sym = seed.symptoms.find((s) => s._id === id);
    if (sym) recipe = seed.recipes.find((r) => r._id === sym.recipeId);
  }
  if (!recipe) throw new Error('未找到食疗方案：' + id);

  const symptom = seed.symptoms.find((s) => s._id === recipe.symptomId);
  return {
    ...recipe,
    symptomName: symptom ? symptom.name : ''
  };
}

/** 记录浏览 */
function logView(payload) {
  const data = {
    targetType: payload.targetType || 'recipe',
    targetId: payload.targetId || '',
    symptomId: payload.symptomId || '',
    page: payload.page || '',
    at: Date.now()
  };

  if (isCloudReady()) {
    return wx.cloud
      .callFunction({ name: 'logView', data })
      .then((res) => res.result || { ok: true })
      .catch((err) => {
        console.warn('logView 云调用失败，回退本地', err);
        return logViewLocal(data);
      });
  }
  return Promise.resolve(logViewLocal(data));
}

function logViewLocal(data) {
  const openId = getLocalOpenId();
  let logs = wx.getStorageSync('view_logs') || [];
  logs.push({
    _id: 'view_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    openId,
    ...data
  });
  // 本地最多保留 200 条
  if (logs.length > 200) logs = logs.slice(-200);
  wx.setStorageSync('view_logs', logs);
  return { ok: true };
}

module.exports = {
  isCloudReady,
  getSymptoms,
  getRecipeById,
  logView
};
