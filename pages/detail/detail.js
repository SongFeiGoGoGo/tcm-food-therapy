const api = require('../../utils/api');
const userNotes = require('../../utils/userNotes');

Page({
  data: {
    recipe: null,
    loading: true,
    recipeId: '',
    symptomId: '',
    fromNotes: false
  },

  onLoad(query) {
    const id = query.id || '';
    const symptomId = query.symptomId || '';
    const fromNotes = query.from === 'notes';
    this.setData({ recipeId: id, symptomId, fromNotes });
    this.loadDetail(id);
  },

  loadDetail(id) {
    this.setData({ loading: true });
    api
      .getRecipeById(id)
      .then((recipe) => {
        this.setData({ recipe, loading: false, recipeId: recipe._id });
        wx.setNavigationBarTitle({ title: recipe.title || '食疗详情' });
        api.logView({
          targetType: 'recipe',
          targetId: recipe._id,
          symptomId: recipe.symptomId || this.data.symptomId,
          page: 'detail'
        });
      })
      .catch((err) => {
        console.error(err);
        this.setData({ loading: false, recipe: null });
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  /** 内置学习笔记：仅本机从列表隐藏，不改 seed / 云库 */
  onHideFromNotes() {
    const symptomId = this.data.symptomId;
    if (!symptomId) {
      wx.showToast({ title: '无法定位该笔记', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '从我的列表移除？',
      content: '仅在本机隐藏这条内置学习笔记，不会修改资料库。重启后仍保持隐藏。',
      confirmText: '移除',
      confirmColor: '#b91c1c',
      success: (res) => {
        if (!res.confirm) return;
        userNotes.hideBuiltin(symptomId);
        wx.showToast({ title: '已从列表移除', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack({ fail() {} });
        }, 400);
      }
    });
  },

  onShareAppMessage() {
    const r = this.data.recipe;
    return {
      title: r ? r.title + ' · 中医食疗参考' : '中医食疗助手',
      path: '/pages/detail/detail?id=' + (this.data.recipeId || '')
    };
  }
});
