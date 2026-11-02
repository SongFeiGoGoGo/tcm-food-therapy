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
    const hidden = userNotes.listHiddenBuiltins();
    const hiddenMap = {};
    hidden.forEach((id) => {
      hiddenMap[id] = true;
    });

    const mine = userNotes.list().map((n) => ({
      key: 'u_' + n.id,
      id: n.id,
      name: n.title,
      summary: n.summary || (n.content || '').slice(0, 60),
      icon: n.icon || '📝',
      foot: '点开可编辑 · 可删除',
      badge: '我的',
      isUser: true,
      recipeId: ''
    }));

    api
      .getSymptoms()
      .then((list) => {
        const seed = (list || [])
          .filter((s) => s.group === 'notes')
          .filter((s) => !hiddenMap[s._id])
          .map((s) => ({
            key: 's_' + s._id,
            id: s._id,
            name: s.name,
            summary: s.summary,
            icon: s.icon,
            foot: '据罗大伦老师书籍学习笔记 · 非原文照录 · 可从列表移除',
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
      url:
        '/pages/detail/detail?id=' +
        (recipe || id) +
        '&symptomId=' +
        id +
        '&from=notes'
    });
  },

  /** 用户笔记：列表快捷删除 */
  onDeleteUser(e) {
    const id = e.currentTarget.dataset.id;
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
        this.reload();
      }
    });
  },

  /** 内置笔记：仅本地从列表隐藏，不改种子库 */
  onHideBuiltin(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.showModal({
      title: '从我的列表移除？',
      content: '仅在本机隐藏，不会修改内置资料库。重启小程序后仍保持隐藏。',
      confirmText: '移除',
      confirmColor: '#b91c1c',
      success: (res) => {
        if (!res.confirm) return;
        userNotes.hideBuiltin(id);
        wx.showToast({ title: '已从列表移除', icon: 'success' });
        this.reload();
      }
    });
  },

  stopBubble() {
    /* 阻止卡片 tap 冒泡 */
  }
});
