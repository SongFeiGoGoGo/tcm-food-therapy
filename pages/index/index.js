const api = require('../../utils/api');

Page({
  data: {
    symptoms: [],
    loading: true,
    cloudReady: false
  },

  onShow() {
    const app = getApp();
    this.setData({ cloudReady: !!(app.globalData && app.globalData.cloudReady) });
    this.loadSymptoms();
  },

  loadSymptoms() {
    this.setData({ loading: true });
    api
      .getSymptoms()
      .then((list) => {
        this.setData({ symptoms: list || [], loading: false });
      })
      .catch((err) => {
        console.error(err);
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  onTapSymptom(e) {
    const { id, recipe } = e.currentTarget.dataset;
    api.logView({
      targetType: 'symptom',
      targetId: id,
      symptomId: id,
      page: 'index'
    });
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + (recipe || id) + '&symptomId=' + id
    });
  }
});
