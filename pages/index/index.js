const api = require('../../utils/api');

Page({
  data: {
    cloudReady: false
  },

  onShow() {
    const app = getApp();
    this.setData({ cloudReady: !!(app.globalData && app.globalData.cloudReady) });
  },

  onOpenNotes() {
    wx.navigateTo({
      url: '/pages/notes/notes',
      fail(err) {
        console.error('notes nav fail', err);
        wx.showModal({
          title: '跳转失败',
          content: (err && err.errMsg) || '未知错误',
          showCancel: false
        });
      }
    });
  }
});
