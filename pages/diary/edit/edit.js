const diary = require('../../../utils/diary');

const SLEEP_OPTS = ['好', '一般', '差'];
const STOOL_OPTS = ['正常', '偏稀', '偏干', '未解'];
const COLD_HEAT_OPTS = ['怕冷', '怕热', '都不明显', '都有一点'];
const YES_NO = ['有', '无'];

Page({
  data: {
    id: '',
    isEdit: false,
    date: '',
    sleep: '',
    sleepCustom: false,
    stool: '',
    stoolCustom: false,
    appetite: '',
    mood: '',
    coldHeat: '',
    acne: '',
    acneNote: '',
    dryThroat: '',
    dryThroatNote: '',
    remark: '',
    sleepOpts: SLEEP_OPTS,
    stoolOpts: STOOL_OPTS,
    coldHeatOpts: COLD_HEAT_OPTS,
    yesNo: YES_NO
  },

  onLoad(query) {
    const id = (query && query.id) || '';
    if (id) {
      const entry = diary.get(id);
      if (!entry) {
        wx.showToast({ title: '记录不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack({ fail() {} }), 500);
        return;
      }
      const sleepKnown = SLEEP_OPTS.indexOf(entry.sleep) >= 0 || !entry.sleep;
      const stoolKnown = STOOL_OPTS.indexOf(entry.stool) >= 0 || !entry.stool;
      this.setData({
        id: entry.id,
        isEdit: true,
        date: entry.date || diary.todayStr(),
        sleep: entry.sleep || '',
        sleepCustom: !!(entry.sleep && !sleepKnown),
        stool: entry.stool || '',
        stoolCustom: !!(entry.stool && !stoolKnown),
        appetite: entry.appetite || '',
        mood: entry.mood || '',
        coldHeat: entry.coldHeat || '',
        acne: entry.acne || '',
        acneNote: entry.acneNote || '',
        dryThroat: entry.dryThroat || '',
        dryThroatNote: entry.dryThroatNote || '',
        remark: entry.remark || ''
      });
      wx.setNavigationBarTitle({ title: '编辑日记' });
    } else {
      this.setData({
        id: '',
        isEdit: false,
        date: diary.todayStr()
      });
      wx.setNavigationBarTitle({ title: '写日记' });
    }
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  onPickSleep(e) {
    const v = e.currentTarget.dataset.v;
    if (v === '__custom') {
      this.setData({ sleepCustom: true, sleep: this.data.sleepCustom ? this.data.sleep : '' });
      return;
    }
    this.setData({ sleep: v, sleepCustom: false });
  },

  onSleepInput(e) {
    this.setData({ sleep: e.detail.value });
  },

  onPickStool(e) {
    const v = e.currentTarget.dataset.v;
    if (v === '__custom') {
      this.setData({ stoolCustom: true, stool: this.data.stoolCustom ? this.data.stool : '' });
      return;
    }
    this.setData({ stool: v, stoolCustom: false });
  },

  onStoolInput(e) {
    this.setData({ stool: e.detail.value });
  },

  onAppetiteInput(e) {
    this.setData({ appetite: e.detail.value });
  },

  onMoodInput(e) {
    this.setData({ mood: e.detail.value });
  },

  onPickColdHeat(e) {
    this.setData({ coldHeat: e.currentTarget.dataset.v });
  },

  onPickAcne(e) {
    this.setData({ acne: e.currentTarget.dataset.v });
  },

  onAcneNoteInput(e) {
    this.setData({ acneNote: e.detail.value });
  },

  onPickDryThroat(e) {
    this.setData({ dryThroat: e.currentTarget.dataset.v });
  },

  onDryThroatNoteInput(e) {
    this.setData({ dryThroatNote: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  onSave() {
    try {
      const saved = diary.save({
        id: this.data.id || undefined,
        date: this.data.date,
        sleep: this.data.sleep,
        stool: this.data.stool,
        appetite: this.data.appetite,
        mood: this.data.mood,
        coldHeat: this.data.coldHeat,
        acne: this.data.acne,
        acneNote: this.data.acneNote,
        dryThroat: this.data.dryThroat,
        dryThroatNote: this.data.dryThroatNote,
        remark: this.data.remark
      });
      this.setData({ id: saved.id, isEdit: true });
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack({ fail() {} });
      }, 450);
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  onDelete() {
    const id = this.data.id;
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
        setTimeout(() => {
          wx.navigateBack({ fail() {} });
        }, 400);
      }
    });
  }
});
