// 云函数：记录浏览行为
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID || '';

  const doc = {
    openId,
    targetType: event.targetType || 'recipe',
    targetId: event.targetId || '',
    symptomId: event.symptomId || '',
    page: event.page || '',
    at: Date.now(),
    createdAt: db.serverDate()
  };

  try {
    await db.collection('view_logs').add({ data: doc });
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: e.message };
  }
};
