const api = require('../../utils/api');
const userNotes = require('../../utils/userNotes');

const ACTION_WIDTH = 76; // px，约等于 140rpx

Page({
  data: {
    notes: [],
    loading: true
  },

  _touch: null,

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
      foot: '',
      badge: '我的',
      isUser: true,
      recipeId: '',
      _x: 0
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
            badge: '内置',
            isUser: false,
            recipeId: s.recipeId || '',
            _x: 0
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
    if (this._suppressTap) {
      this._suppressTap = false;
      return;
    }
    const { id, user, recipe } = e.currentTarget.dataset;
    // 若当前项已滑开，点卡片先收回
    const index = e.currentTarget.dataset.index;
    const notes = this.data.notes;
    if (notes[index] && notes[index]._x < 0) {
      this.closeAll();
      return;
    }
    this.closeAll();
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

  closeAll() {
    const notes = this.data.notes.map((n) =>
      n._x ? Object.assign({}, n, { _x: 0 }) : n
    );
    this.setData({ notes });
  },

  onTouchStart(e) {
    const t = e.touches[0];
    const index = e.currentTarget.dataset.index;
    this._touch = {
      index,
      startX: t.clientX,
      startY: t.clientY,
      startOffset: (this.data.notes[index] && this.data.notes[index]._x) || 0,
      moved: false,
      locking: null
    };
    // 关闭其他已打开项
    const notes = this.data.notes;
    let changed = false;
    const next = notes.map((n, i) => {
      if (i !== index && n._x) {
        changed = true;
        return Object.assign({}, n, { _x: 0 });
      }
      return n;
    });
    if (changed) this.setData({ notes: next });
  },

  onTouchMove(e) {
    const touch = this._touch;
    if (!touch) return;
    const t = e.touches[0];
    const dx = t.clientX - touch.startX;
    const dy = t.clientY - touch.startY;
    if (touch.locking === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      touch.locking = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }
    if (touch.locking === 'v') return;
    touch.moved = true;
    let x = touch.startOffset + dx;
    if (x > 0) x = 0;
    if (x < -ACTION_WIDTH) x = -ACTION_WIDTH;
    const key = 'notes[' + touch.index + ']._x';
    this.setData({ [key]: x });
  },

  onTouchEnd() {
    const touch = this._touch;
    if (!touch) return;
    const notes = this.data.notes;
    const item = notes[touch.index];
    if (!item) {
      this._touch = null;
      return;
    }
    let x = item._x || 0;
    if (touch.moved) {
      this._suppressTap = true;
      x = x < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0;
      this.setData({ ['notes[' + touch.index + ']._x']: x });
    }
    this._touch = null;
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
  }
});
