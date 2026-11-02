const diary = require('../../../utils/diary');
const swipeCell = require('../../../utils/swipeCell');

const ACTION_WIDTH = swipeCell.getActionWidthPx(140);

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
  _suppressTap: false,

  onShow() {
    this.reload();
  },

  reload() {
    const entries = diary.list().map((e) =>
      Object.assign({}, e, { _x: 0, _dragging: false, _catchMove: false })
    );
    const summary = diary.weekSummary(entries);
    this.setData({
      entries: entries,
      summary: summary,
      empty: !entries.length
    });
  },

  onAdd() {
    this.closeAll();
    wx.navigateTo({ url: '/pages/diary/edit/edit' });
  },

  /** 点空白处：收起已打开的删除 */
  onPageTap() {
    this.closeAll();
  },

  onTapItem(e) {
    if (this._suppressTap) {
      this._suppressTap = false;
      return;
    }
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const entries = this.data.entries;
    // 已滑开：点卡片只收回，不进编辑
    if (entries[index] && entries[index]._x < 0) {
      this.closeAll();
      return;
    }
    this.closeAll();
    if (!id) return;
    wx.navigateTo({ url: '/pages/diary/edit/edit?id=' + id });
  },

  closeAll() {
    const entries = this.data.entries;
    let changed = false;
    const next = entries.map((n) => {
      if (n._x || n._dragging || n._catchMove) {
        changed = true;
        return Object.assign({}, n, { _x: 0, _dragging: false, _catchMove: false });
      }
      return n;
    });
    if (changed) this.setData({ entries: next });
  },

  onTouchStart(e) {
    const t = e.touches[0];
    const index = e.currentTarget.dataset.index;
    const cur = this.data.entries[index];
    this._touch = {
      index: index,
      startX: t.clientX,
      startY: t.clientY,
      startOffset: (cur && cur._x) || 0,
      currentX: (cur && cur._x) || 0,
      moved: false,
      locking: null
    };
    // 同时只开一条：按下时关闭其他项
    const entries = this.data.entries;
    let changed = false;
    const next = entries.map((n, i) => {
      if (i !== index && (n._x || n._dragging || n._catchMove)) {
        changed = true;
        return Object.assign({}, n, { _x: 0, _dragging: false, _catchMove: false });
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

    if (touch.locking === null || touch.locking === 'pending') {
      const lock = swipeCell.decideLock(dx, dy);
      if (lock === null || lock === 'pending') {
        touch.locking = lock === 'pending' ? 'pending' : null;
        return;
      }
      touch.locking = lock;
      if (lock === 'v') return;
      // 水平锁定：跟手、禁 transition、catch 掉滚动
      this.setData({
        ['entries[' + touch.index + ']._dragging']: true,
        ['entries[' + touch.index + ']._catchMove']: true
      });
    }

    if (touch.locking === 'v') return;

    touch.moved = true;
    const x = swipeCell.clampX(touch.startOffset + dx, ACTION_WIDTH);
    touch.currentX = x;
    this.setData({ ['entries[' + touch.index + ']._x']: x });
  },

  /** catchtouchmove：水平锁定后阻止页面滚动 */
  onCatchTouchMove(e) {
    this.onTouchMove(e);
  },

  onTouchEnd() {
    const touch = this._touch;
    if (!touch) return;
    const index = touch.index;
    this._touch = null;

    if (touch.locking !== 'h' || !touch.moved) {
      // 点击或纵向滚动：强制收回，避免 setData 竞态残留半开
      this.setData({
        ['entries[' + index + ']._x']: 0,
        ['entries[' + index + ']._dragging']: false,
        ['entries[' + index + ']._catchMove']: false
      });
      return;
    }

    this._suppressTap = true;
    const x = swipeCell.snapX(touch.currentX, ACTION_WIDTH);
    this.setData({
      ['entries[' + index + ']._x']: x,
      ['entries[' + index + ']._dragging']: false,
      ['entries[' + index + ']._catchMove']: false
    });
  },

  onTouchCancel() {
    this.onTouchEnd();
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
