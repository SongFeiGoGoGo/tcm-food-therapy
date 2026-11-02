const api = require('../../utils/api');
const userNotes = require('../../utils/userNotes');

Page({
  data: {
    notes: [],
    loading: true
  },

  onShow() {
    this.reload();
  },

  reload() {
    this.setData({ loading: true });
    const mine = userNotes.list().map((n) => ({
      key: 'u_' + n.id,
      id: n.id,
      name: n.title,
      summary: n.summary || (n.content || '').slice(0, 60),
      icon: n.icon || '📝',
      foot: n.source || '个人学习笔记',
      badge: '我的',
      isUser: true,
      recipeId: ''
    }));

    api
      .getSymptoms()
      .then((list) => {
        const seed = (list || [])
          .filter((s) => s.group === 'notes')
          .map((s) => ({
            key: 's_' + s._id,
            id: s._id,
            name: s.name,
            summary: s.summary,
            icon: s.icon,
            foot: '据罗大伦老师书籍学习笔记 · 非原文照录',
            badge: '内置',
            isUser: false,
            recipeId: s.recipeId || ''
          }));
        this.setData({ notes: mine.concat(seed), loading: false });
      })
      .catch((err) => {
        console.error(err);
        this.setData({ notes: mine, loading: false });
        wx.showToast({ title: '内置笔记加载失败', icon: 'none' });
      });
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/notes/edit/edit' });
  },

  onTap(e) {
    const { id, user, recipe } = e.currentTarget.dataset;
    if (user === true || user === 'true') {
      wx.navigateTo({ url: '/pages/notes/edit/edit?id=' + id });
      return;
    }
    api.logView({
      targetType: 'symptom',
      targetId: id,
      symptomId: id,
      page: 'notes'
    });
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + (recipe || id) + '&symptomId=' + id
    });
  }
});
