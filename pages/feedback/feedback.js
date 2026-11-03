const profileUtil = require('../../utils/profile');

/** 产品指定收件邮箱。小程序内不能直接发信，提交时把整封邮件复制到剪贴板。 */
const FEEDBACK_TO = '2434722214@qq.com';

Page({
  data: {
    message: '',
    contact: ''
  },

  onMessage(e) {
    this.setData({ message: (e.detail && e.detail.value) || '' });
  },

  onContact(e) {
    this.setData({ contact: (e.detail && e.detail.value) || '' });
  },

  onSubmit() {
    const message = (this.data.message || '').trim();
    if (!message) {
      wx.showToast({ title: '请填写反馈内容', icon: 'none' });
      return;
    }
    const contact = (this.data.contact || '').trim();
    let nick = '';
    try {
      const profile = profileUtil.read();
      if (profile && profile.loggedIn) nick = (profile.nickName || '').trim();
    } catch (err) {
      nick = '';
    }
    const lines = [
      '收件人：' + FEEDBACK_TO,
      '主题：中医食疗小程序反馈',
      '',
      message
    ];
    if (contact) lines.push('', '联系方式：' + contact);
    if (nick) lines.push('昵称：' + nick);
    const mail = lines.join('\n');
    wx.setClipboardData({
      data: mail,
      success: () => {
        wx.showModal({
          title: '请发送到邮箱',
          content: '小程序里不能直接发邮件。反馈已复制，请粘贴后发送到 ' + FEEDBACK_TO,
          showCancel: false,
          confirmText: '知道了'
        });
      },
      fail: () => {
        wx.showModal({
          title: '复制失败',
          content: '请手动把反馈发到 ' + FEEDBACK_TO + '。\n\n' + message,
          showCancel: false
        });
      }
    });
  }
});
