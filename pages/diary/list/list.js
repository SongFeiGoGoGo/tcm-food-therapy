const diary = require('../../../utils/diary');

const ACTION_WIDTH = 76; // px

Page({
  data: {
    entries: [],
    summary: {
      recordCount: 0,
      dryThroatCount: 0,
      acneCount: 0,
      coldCount: 0,
      heatCount: 0,
      poorSleepCount: 0,
      weekStart: ''
    },
    empty: true
  },

  _touch: null,

  onShow() {
    this.reload();
  },

  reload() {
    const entries = diary.list().map((e) => Object.assign({}, e, { _x: 0 }));
    const summary = diary.weekSummary(entries);
    this.setData({
      entries: entries,
      summary: summary,
      empty: !entries.length
    });
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/diary/edit/edit' });
  },

  onTapItem(e) {
    if (this._suppressTap) {
      this._suppressTap = false;
      return;
    }
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const entries = this.data.entries;
    if (entries[index] && entries[index]._x < 0) {
      this.closeAll();
      return;
    }
    this.closeAll();
    if (!id) return;
    wx.navigateTo({ url: '/pages/diary/edit/edit?id=' + id });
  },

  closeAll() {
    const entries = this.data.entries.map((n) =>
      n._x ? Object.assign({}, n, { _x: 0 }) : n
    );
    this.setData({ entries });
  },

  onTouchStart(e) {
    const t = e.touches[0];
    const index = e.currentTarget.dataset.index;
    this._touch = {
      index,
      startX: t.clientX,
      startY: t.clientY,
      startOffset: (this.data.entries[index] && this.data.entries[index]._x) || 0,
      moved: false,
      locking: null
    };
    const entries = this.data.entries;
    let changed = false;
    const next = entries.map((n, i) => {
      if (i !== index && n._x) {
        changed = true;
        return Object.assign({}, n, { _x: 0 });
      }
      return n;
    });
    if (changed) this.setData({ entries: next });
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
    this.setData({ ['entries[' + touch.index + ']._x']: x });
  },

  onTouchEnd() {
    const touch = this._touch;
    if (!touch) return;
    const item = this.data.entries[touch.index];
    if (!item) {
      this._touch = null;
      return;
    }
    let x = item._x || 0;
    if (touch.moved) {
      this._suppressTap = true;
      x = x < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0;
      this.setData({ ['entries[' + touch.index + ']._x']: x });
    }
    this._touch = null;
  },

  onDeleteItem(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.showModal({
      title: '删除这条日记？',
      content: '删除后无法恢复',
      confirmText: '删除',
      confirmColor: '#b91c1c',
      success: (res) => {
        if (!res.confirm) return;
        diary.remove(id);
        wx.showToast({ title: '已删除', icon: 'success' });
        this.reload();
      }
    });
  }
});
