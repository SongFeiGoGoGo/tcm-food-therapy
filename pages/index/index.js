const bannerConfig = require('../../utils/banners');
const cardConfig = require('../../utils/cards');
const calendar = require('../../utils/calendar');

function cloneItems(list, prefix) {
  return (list || []).map((item, i) => ({
    id: item.id || prefix + i,
    title: item.title || '',
    image: item.image || '',
    link: item.link || '',
    imgError: false
  }));
}

Page({
  data: {
    cloudReady: false,
    banners: cloneItems(bannerConfig, 'banner_'),
    cards: cloneItems(cardConfig, 'card_'),
    cal: null
  },

  onShow() {
    const app = getApp();
    let cal = null;
    try {
      cal = calendar.todayAlmanac();
    } catch (err) {
      console.error('almanac fail', err);
    }
    this.setData({
      cloudReady: !!(app.globalData && app.globalData.cloudReady),
      cal: cal
    });
  },

  onBannerError(e) {
    const index = e.currentTarget.dataset.index;
    if (index === undefined || index === '') return;
    this.setData({ ['banners[' + index + '].imgError']: true });
  },

  onCardError(e) {
    const index = e.currentTarget.dataset.index;
    if (index === undefined || index === '') return;
    this.setData({ ['cards[' + index + '].imgError']: true });
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
