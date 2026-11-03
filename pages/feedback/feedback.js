/**
 * 反馈写入微信云开发集合 feedback，不请求外网。
 * 开通步骤：开发者工具开通云开发 → 建集合 feedback（建议仅创建者可写、管理端可读）
 * → 把环境 ID 填进 app.js 的 cloudEnv（留空则不初始化，不要把真实环境 ID 提交进仓库）。
 */
const SOURCE = 'tcm-miniprogram';

function isCloudReady() {
  try {
    const app = getApp();
    return !!(wx.cloud && app && app.globalData && app.globalData.cloudReady);
  } catch (e) {
    return false;
  }
}

Page({
  data: {
    message: '',
    contact: '',
    submitting: false
  },

  onLoad() {
    const pages = getCurrentPages();
    const prev = pages.length >= 2 ? pages[pages.length - 2] : null;
    const route = prev && (prev.route || prev.__route__);
    if (route === 'pages/mine/mine') return;
    wx.navigateBack({
      fail() {
        wx.switchTab({ url: '/pages/mine/mine' });
      }
    });
  },

  onMessage(e) {
    this.setData({ message: (e.detail && e.detail.value) || '' });
  },

  onContact(e) {
    this.setData({ contact: (e.detail && e.detail.value) || '' });
  },

  onSubmit() {
    if (this.data.submitting) return;
    const message = (this.data.message || '').trim();
    if (!message) {
      wx.showToast({ title: '请填写反馈内容', icon: 'none' });
      return;
    }
    if (!isCloudReady()) {
      wx.showToast({ title: '反馈服务未开通，请稍后再试', icon: 'none' });
      return;
    }
    const contact = (this.data.contact || '').trim();
    this.setData({ submitting: true });
    const db = wx.cloud.database();
    db.collection('feedback').add({
      data: {
        message: message,
        contact: contact,
        source: SOURCE,
        createdAt: db.serverDate()
      }
    }).then(() => {
      this.setData({ message: '', contact: '', submitting: false });
      wx.showToast({ title: '已提交', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack({ fail() {} });
      }, 600);
    }).catch((err) => {
      console.warn('feedback add fail', err);
      this.onFail();
    });
  },

  onFail() {
    this.setData({ submitting: false });
    wx.showToast({ title: '提交失败，请稍后重试', icon: 'none' });
  }
});
