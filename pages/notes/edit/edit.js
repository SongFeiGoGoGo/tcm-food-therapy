const userNotes = require('../../../utils/userNotes');

const ICON_OPTS = ['📝', '🌿', '🍵', '📖', '💊', '🔥', '💧', '🧘', '🥣', '🦴'];

Page({
  data: {
    id: '',
    isEdit: false,
    title: '',
    summary: '',
    content: '',
    icon: '📝',
    source: '个人学习笔记',
    iconOpts: ICON_OPTS
  },

  onLoad(query) {
    const id = (query && query.id) || '';
    if (id) {
      const note = userNotes.get(id);
      if (!note) {
        wx.showToast({ title: '笔记不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack({ fail() {} }), 500);
        return;
      }
      this.setData({
        id: note.id,
        isEdit: true,
        title: note.title || '',
        summary: note.summary || '',
        content: note.content || '',
        icon: note.icon || '📝',
        source: note.source || '个人学习笔记'
      });
      wx.setNavigationBarTitle({ title: '编辑笔记' });
    } else {
      this.setData({
        id: '',
        isEdit: false,
        title: '',
        summary: '',
        content: '',
        icon: '📝',
        source: '个人学习笔记'
      });
      wx.setNavigationBarTitle({ title: '写笔记' });
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onSummaryInput(e) {
    this.setData({ summary: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onSourceInput(e) {
    this.setData({ source: e.detail.value });
  },

  onPickIcon(e) {
    this.setData({ icon: e.currentTarget.dataset.v });
  },

  onSave() {
    const title = (this.data.title || '').trim();
    if (!title) {
      wx.showToast({ title: '请填写标题', icon: 'none' });
      return;
    }
    try {
      const saved = userNotes.save({
        id: this.data.id || undefined,
        title: title,
        summary: this.data.summary,
        content: this.data.content,
        icon: this.data.icon,
        source: this.data.source
      });
      this.setData({ id: saved.id, isEdit: true });
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack({ fail() {} });
      }, 450);
    } catch (err) {
      console.error(err);
      wx.showToast({
        title: (err && err.message) || '保存失败',
        icon: 'none'
      });
    }
  },

  onDelete() {
    const id = this.data.id;
    if (!id) return;
    wx.showModal({
      title: '删除这条笔记？',
      content: '删除后无法恢复',
      confirmText: '删除',
      confirmColor: '#b91c1c',
      success: (res) => {
        if (!res.confirm) return;
        userNotes.remove(id);
        wx.showToast({ title: '已删除', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack({ fail() {} });
        }, 400);
      }
    });
  }
});
