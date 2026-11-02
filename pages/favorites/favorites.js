const api = require('../../utils/api');

Page({
  data: {
    list: [],
    loading: true,
    cloudReady: false
  },

  onShow() {
    const app = getApp();
    this.setData({ cloudReady: !!(app.globalData && app.globalData.cloudReady) });
    this.loadList();
  },

  loadList() {
    this.setData({ loading: true });
    api
      .listFavorites()
      .then((list) => {
        this.setData({ list: list || [], loading: false });
      })
      .catch((err) => {
        console.error(err);
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  onTapItem(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + id
    });
  }
});
