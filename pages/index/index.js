const bannerConfig = require('../../utils/banners');

function cloneBanners() {
  return (bannerConfig || []).map((b, i) => ({
    id: b.id || 'banner_' + i,
    title: b.title || '',
    image: b.image || '',
    link: b.link || '',
    imgError: false
  }));
}

Page({
  data: {
    cloudReady: false,
    banners: cloneBanners()
  },

  onShow() {
    const app = getApp();
    this.setData({ cloudReady: !!(app.globalData && app.globalData.cloudReady) });
  },

  onBannerError(e) {
    const index = e.currentTarget.dataset.index;
    if (index === undefined || index === '') return;
    this.setData({ ['banners[' + index + '].imgError']: true });
  },

  /** link 为空则不跳转。预留站内路径，tab 页走 switchTab。 */
  onBannerTap(e) {
    const link = ((e.currentTarget.dataset && e.currentTarget.dataset.link) || '').trim();
    if (!link || link.indexOf('/pages/') !== 0) return;
    wx.navigateTo({
      url: link,
      fail() {
        wx.switchTab({
          url: link.split('?')[0],
          fail() {}
        });
      }
    });
  }
});
