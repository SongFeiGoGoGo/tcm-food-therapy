// 云函数：切换收藏
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const recipeId = event.recipeId || '';
  if (!recipeId) return { ok: false, error: '缺少 recipeId', favorited: false };

  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  if (!openId) return { ok: false, error: '无法获取用户身份', favorited: false };

  try {
    const exist = await db
      .collection('favorites')
      .where({ openId, recipeId })
      .limit(1)
      .get();

    if (exist.data && exist.data.length) {
      await db.collection('favorites').doc(exist.data[0]._id).remove();
      return { ok: true, favorited: false, recipeId };
    }

    await db.collection('favorites').add({
      data: {
        openId,
        recipeId,
        createdAt: Date.now()
      }
    });
    return { ok: true, favorited: true, recipeId };
  } catch (e) {
    console.error(e);
    return { ok: false, error: e.message, favorited: false };
  }
};
