// 云函数：按 ID 获取食疗详情（支持 recipeId 或 symptomId）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const id = event.id || event.recipeId || '';
  if (!id) return { ok: false, error: '缺少 id', data: null };

  try {
    // 先按食疗 _id
    let recipeRes = await db.collection('recipes').doc(id).get().catch(() => null);
    let recipe = recipeRes && recipeRes.data;

    if (!recipe) {
      // 再按 symptomId 查
      const bySymptom = await db.collection('recipes').where({ symptomId: id }).limit(1).get();
      recipe = (bySymptom.data && bySymptom.data[0]) || null;
    }

    if (!recipe) {
      return { ok: false, error: '未找到', data: null };
    }

    let symptomName = '';
    if (recipe.symptomId) {
      const sym = await db.collection('symptoms').doc(recipe.symptomId).get().catch(() => null);
      if (sym && sym.data) symptomName = sym.data.name || '';
    }

    return { ok: true, data: { ...recipe, symptomName } };
  } catch (e) {
    console.error(e);
    return { ok: false, error: e.message, data: null };
  }
};
