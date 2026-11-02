// 云函数：获取症状列表
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  try {
    const res = await db.collection('symptoms').orderBy('sort', 'asc').get();
    return { ok: true, data: res.data || [] };
  } catch (e) {
    console.error(e);
    return { ok: false, error: e.message, data: [] };
  }
};
