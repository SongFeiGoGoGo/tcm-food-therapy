const profileUtil = require('../../utils/profile');

Page({
  data: {
    loggedIn: false,
    nickName: '',
    nickDraft: '',
    editingNick: false,
    nickFocus: false,
    avatarUrl: '',
    loginCodeSeen: false,
    defaultAvatar: '/images/avatar-default.png'
  },

  _nickDraft: '',

  onShow() {
    this.setData({ editingNick: false, nickFocus: false });
    this.applyProfile(profileUtil.read());
  },

  applyProfile(profile) {
    const p = profile || profileUtil.read();
    this._nickDraft = p.nickName || '';
    this.setData({
      loggedIn: !!p.loggedIn,
      nickName: p.nickName || '',
      nickDraft: p.nickName || '',
      avatarUrl: p.avatarUrl || '',
      loginCodeSeen: !!p.loginCodeSeen
    });
  },

  onLogin() {
    wx.showLoading({ title: '登录中', mask: true });
    profileUtil.loginWithWechat().then((profile) => {
      wx.hideLoading();
      this.applyProfile(profile);
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '登录失败', icon: 'none' });
    });
  },

  onChooseAvatar(e) {
    const temp = e.detail && e.detail.avatarUrl;
    if (!temp) return;
    const prev = this.data.avatarUrl;
    if (!wx.getFileSystemManager) {
      const profile = profileUtil.save({ avatarUrl: temp, loggedIn: true });
      this.applyProfile(profile);
      return;
    }
    const fs = wx.getFileSystemManager();
    fs.saveFile({
      tempFilePath: temp,
      success: (res) => {
        const saved = (res && res.savedFilePath) || temp;
        if (prev && prev !== saved) this._dropSavedFile(prev);
        const profile = profileUtil.save({ avatarUrl: saved, loggedIn: true });
        this.applyProfile(profile);
      },
      fail: () => {
        const profile = profileUtil.save({ avatarUrl: temp, loggedIn: true });
        this.applyProfile(profile);
        wx.showToast({ title: '头像已暂存，重进可能需重选', icon: 'none' });
      }
    });
  },

  _dropSavedFile(path) {
    if (!path || path.indexOf(this.data.defaultAvatar) >= 0) return;
    try {
      wx.getFileSystemManager().removeSavedFile({
        filePath: path,
        fail() {}
      });
    } catch (err) {
      console.warn('remove avatar fail', err);
    }
  },

  onEditNick() {
    this._nickDraft = this.data.nickName || '';
    this.setData({
      editingNick: true,
      nickFocus: true,
      nickDraft: this.data.nickName || ''
    });
  },

  onNickInput(e) {
    const v = (e.detail && e.detail.value) || '';
    this._nickDraft = v;
    this.setData({ nickDraft: v });
  },

  onNickBlur(e) {
    const v = (e.detail && e.detail.value) || '';
    this._nickDraft = v;
    this.setData({ nickDraft: v });
  },

  onSaveNick() {
    // type="nickname" 往往在 blur 才把微信昵称写进 value，稍等再读
    setTimeout(() => this.commitNick(), 80);
  },

  commitNick() {
    const name = String(this._nickDraft != null ? this._nickDraft : this.data.nickDraft || '').trim();
    if (!name) {
      wx.showToast({ title: '请填写昵称', icon: 'none' });
      return;
    }
    const profile = profileUtil.save({ nickName: name, loggedIn: true });
    this.applyProfile(profile);
    this.setData({ editingNick: false, nickFocus: false });
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录？',
      confirmText: '退出',
      success: (res) => {
        if (!res.confirm) return;
        const profile = profileUtil.logout();
        this.setData({ editingNick: false, nickFocus: false });
        this.applyProfile(profile);
      }
    });
  }
});
