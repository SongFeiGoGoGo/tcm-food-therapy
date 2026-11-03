const api = require('../../utils/api');
const userNotes = require('../../utils/userNotes');
const swipeCell = require('../../utils/swipeCell');

const ACTION_WIDTH = swipeCell.getActionWidthPx(140);

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

  _touch: null,
  _suppressTap: false,

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
      recipeId: '',
      _x: 0,
      _dragging: false,
      _catchMove: false
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
            herbLine: '',
            _x: 0,
            _dragging: false,
            _catchMove: false
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
    this.closeAll();
    wx.navigateTo({ url: '/pages/notes/edit/edit' });
  },

  /** 点空白处：收起已打开的删除 */
  onPageTap() {
    this.closeAll();
  },

  onTap(e) {
    if (this._suppressTap) {
      this._suppressTap = false;
      return;
    }
    const { id, user, recipe } = e.currentTarget.dataset;
    const index = e.currentTarget.dataset.index;
    const notes = this.data.notes;
    // 已滑开：点卡片只收回
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
    const notes = this.data.notes;
    let changed = false;
    const next = notes.map((n) => {
      if (n._x || n._dragging || n._catchMove) {
        changed = true;
        return Object.assign({}, n, { _x: 0, _dragging: false, _catchMove: false });
      }
      return n;
    });
    if (changed) this.setData({ notes: next });
  },

  onTouchStart(e) {
    const t = e.touches[0];
    const index = e.currentTarget.dataset.index;
    const cur = this.data.notes[index];
    this._touch = {
      index: index,
      startX: t.clientX,
      startY: t.clientY,
      startOffset: (cur && cur._x) || 0,
      currentX: (cur && cur._x) || 0,
      moved: false,
      locking: null
    };
    // 同时只开一条
    const notes = this.data.notes;
    let changed = false;
    const next = notes.map((n, i) => {
      if (i !== index && (n._x || n._dragging || n._catchMove)) {
        changed = true;
        return Object.assign({}, n, { _x: 0, _dragging: false, _catchMove: false });
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

    if (touch.locking === null || touch.locking === 'pending') {
      const lock = swipeCell.decideLock(dx, dy);
      if (lock === null || lock === 'pending') {
        touch.locking = lock === 'pending' ? 'pending' : null;
        return;
      }
      touch.locking = lock;
      if (lock === 'v') return;
      this.setData({
        ['notes[' + touch.index + ']._dragging']: true,
        ['notes[' + touch.index + ']._catchMove']: true
      });
    }

    if (touch.locking === 'v') return;

    touch.moved = true;
    const x = swipeCell.clampX(touch.startOffset + dx, ACTION_WIDTH);
    touch.currentX = x;
    this.setData({ ['notes[' + touch.index + ']._x']: x });
  },

  onCatchTouchMove(e) {
    this.onTouchMove(e);
  },

  onTouchEnd() {
    const touch = this._touch;
    if (!touch) return;
    const index = touch.index;
    this._touch = null;

    if (touch.locking !== 'h' || !touch.moved) {
      // 点击或纵向优先：强制收回，避免竞态半开
      this.setData({
        ['notes[' + index + ']._x']: 0,
        ['notes[' + index + ']._dragging']: false,
        ['notes[' + index + ']._catchMove']: false
      });
      return;
    }

    this._suppressTap = true;
    const x = swipeCell.snapX(touch.currentX, ACTION_WIDTH);
    this.setData({
      ['notes[' + index + ']._x']: x,
      ['notes[' + index + ']._dragging']: false,
      ['notes[' + index + ']._catchMove']: false
    });
  },

  onTouchCancel() {
    this.onTouchEnd();
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
