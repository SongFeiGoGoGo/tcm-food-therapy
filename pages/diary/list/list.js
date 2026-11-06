const calendar = require('../../../utils/calendar');
const habits = require('../../../utils/habits');
const diary = require('../../../utils/diary');
const profileUtil = require('../../../utils/profile');

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

Page({
  data: {
    weeks: [],
    lastWeekId: '',
    weekdays: WEEKDAYS,
    selected: '',
    selectedLabel: '',
    isToday: true,
    doneCount: 0,
    habitRows: [],
    habitTotal: 0,
    levels: [0, 1, 2, 3, 4, 5]
  },

  onShow() {
    const today = calendar.todayKey();
    const selected = this.data.selected && this.data.selected <= today ? this.data.selected : today;
    this.load(today, selected);
    this.maybeNotice();
  },

  load(today, selected) {
    const records = habits.readAll();
    const weeks = habits.buildWeeks(today, records);
    const day = habits.getDay(selected);
    const rows = habits.viewOf(selected, day);
    let done = 0;
    rows.forEach((row) => {
      if (row.checked) done += 1;
    });
    const last = weeks.length ? weeks[weeks.length - 1].id : '';
    this.setData({
      weeks: weeks,
      lastWeekId: last,
      selected: selected,
      selectedLabel: this.labelOf(selected, today),
      isToday: selected === today,
      doneCount: done,
      habitTotal: habits.HABITS.length,
      habitRows: rows
    });
  },

  labelOf(dateKey, today) {
    const p = calendar.parseYmd(dateKey);
    const head = p.m + '月' + p.d + '日';
    return dateKey === today ? head + ' · 今天' : head;
  },

  onPickDay(e) {
    const date = e.currentTarget.dataset.date;
    const future = e.currentTarget.dataset.future;
    if (!date || future === true || future === 'true') return;
    this.load(calendar.todayKey(), date);
  },

  onToggle(e) {
    if (!profileUtil.isLoggedIn()) {
      profileUtil.promptLogin();
      return;
    }
    const key = e.currentTarget.dataset.key;
    const selected = this.data.selected;
    if (!selected || !key) return;
    if (selected > calendar.todayKey()) return;
    habits.toggle(selected, key);
    this.load(calendar.todayKey(), selected);
  },

  maybeNotice() {
    if (this._noticed) return;
    let oldCount = 0;
    try {
      oldCount = diary.list().length;
    } catch (err) {
      console.warn('old diary read fail', err);
    }
    if (!oldCount || habits.noticeSeen()) return;
    this._noticed = true;
    habits.markNoticeSeen();
    wx.showModal({
      title: '习惯打卡',
      content: '以前的养生日记已保存在本机，新版改为习惯打卡；旧记录暂不展示，不会删除。',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
