// 云函数：列出当前用户收藏（附食疗摘要）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  if (!openId) return { ok: false, error: '无法获取用户身份', data: [] };

  try {
    const favRes = await db
      .collection('favorites')
      .where({ openId })
      .orderBy('createdAt', 'desc')
      .get();

    const favs = favRes.data || [];
    const result = [];

    for (const f of favs) {
      let title = '';
      let subtitle = '';
      let symptomName = '';
      let symptomId = '';
      try {
        const recipeDoc = await db.collection('recipes').doc(f.recipeId).get();
        const recipe = recipeDoc.data;
        if (recipe) {
          title = recipe.title || '';
          subtitle = recipe.subtitle || '';
          symptomId = recipe.symptomId || '';
          if (symptomId) {
            const sym = await db.collection('symptoms').doc(symptomId).get().catch(() => null);
            if (sym && sym.data) symptomName = sym.data.name || '';
          }
        }
      } catch (e) {
        // 食疗已删则跳过摘要
      }
      result.push({
        _id: f._id,
        recipeId: f.recipeId,
        createdAt: f.createdAt,
        title,
        subtitle,
        symptomName,
        symptomId
      });
    }

    return { ok: true, data: result };
  } catch (e) {
    console.error(e);
    return { ok: false, error: e.message, data: [] };
  }
};
