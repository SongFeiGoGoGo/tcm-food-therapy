const diary = require('../../../utils/diary');

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

  onShow() {
    this.reload();
  },

  reload() {
    const entries = diary.list();
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
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/diary/edit/edit?id=' + id });
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
  },

  stopBubble() {
    /* 阻止卡片 tap 冒泡 */
  }
});
