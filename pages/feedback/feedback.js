/**
 * 反馈经 FormSubmit 发到指定邮箱，页面不提邮箱、剪贴板或发信限制。
 * 1) 第一次真实提交会让 FormSubmit 给 2434722214@qq.com 发一封激活邮件，收件人要点一次激活。
 * 2) 正式上传前，把 https://formsubmit.co 加到微信公众平台 → 开发 → 开发管理 → 服务器域名 → request 合法域名。开发者工具调试时可关掉域名校验。
 */
const FEEDBACK_URL = 'https://formsubmit.co/ajax/2434722214@qq.com';

Page({
  data: {
    message: '',
    contact: '',
    submitting: false
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
    const contact = (this.data.contact || '').trim();
    this.setData({ submitting: true });
    wx.request({
      url: FEEDBACK_URL,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      data: {
        name: contact || '小程序用户',
        message: message,
        _subject: '中医食疗小程序反馈',
        _template: 'table',
        _captcha: 'false',
        source: 'tcm-miniprogram'
      },
      success: (res) => {
        const body = (res && res.data) || {};
        const ok = res && res.statusCode >= 200 && res.statusCode < 300 &&
          (body.success === true || body.success === 'true');
        if (!ok) {
          this.onFail();
          return;
        }
        this.setData({ message: '', contact: '', submitting: false });
        wx.showToast({ title: '已提交', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack({ fail() {} });
        }, 600);
      },
      fail: () => {
        this.onFail();
      }
    });
  },

  onFail() {
    this.setData({ submitting: false });
    wx.showToast({ title: '提交失败，请稍后重试', icon: 'none' });
  }
});
