const api = require('../../utils/api');

Page({
  data: {
    notes: [],
    loading: true
  },

  onShow() {
    this.setData({ loading: true });
    api
      .getSymptoms()
      .then((list) => {
        const notes = (list || []).filter((s) => s.group === 'notes');
        this.setData({ notes, loading: false });
      })
      .catch((err) => {
        console.error(err);
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  onTap(e) {
    const { id, recipe } = e.currentTarget.dataset;
    api.logView({
      targetType: 'symptom',
      targetId: id,
      symptomId: id,
      page: 'notes'
    });
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + (recipe || id) + '&symptomId=' + id
    });
  }
});
