const api = require('../../utils/api');
const userNotes = require('../../utils/userNotes');
const profileUtil = require('../../utils/profile');

function herbLineOf(n) {
  const herbs = n && Array.isArray(n.herbs) ? n.herbs : [];
  const bits = [];
  herbs.forEach((h) => {
    if (!h) return;
    const name = String(h.name || '').trim();
    const amount = String(h.amount || '').trim();
    if (!name && !amount) return;
    bits.push(amount ? name + ' ' + amount : name);
  });
  return bits.join('、');
}

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
      herbLine: herbLineOf(n),
      icon: n.icon || '📝',
      foot: '',
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
            foot: '据罗大伦老师书籍学习笔记 · 非原文照录',
            badge: '示例',
            isUser: false,
            recipeId: s.recipeId || '',
            herbLine: ''
          }));
        this.setData({ notes: mine.concat(seed), loading: false });
      })
      .catch((err) => {
        console.error(err);
        this.setData({ notes: mine, loading: false });
        wx.showToast({ title: '示例笔记加载失败', icon: 'none' });
      });
  },

  onAdd() {
    if (!profileUtil.isLoggedIn()) {
      profileUtil.promptLogin();
      return;
    }
    wx.navigateTo({ url: '/pages/notes/edit/edit' });
  },

  onTap(e) {
    const { id, user, recipe } = e.currentTarget.dataset;
    if (user === true || user === 'true') {
      if (!profileUtil.isLoggedIn()) {
        profileUtil.promptLogin();
        return;
      }
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

  /** 用户笔记：点右上角后二次确认再删 */
  onDeleteUser(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.showModal({
      title: '确认删除？',
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

  /** 示例笔记：记下已删 id，下次启动不再从种子加回 */
  onHideBuiltin(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.showModal({
      title: '确认删除？',
      confirmText: '删除',
      confirmColor: '#b91c1c',
      success: (res) => {
        if (!res.confirm) return;
        userNotes.hideBuiltin(id);
        wx.showToast({ title: '已删除', icon: 'success' });
        this.reload();
      }
    });
  }
});
