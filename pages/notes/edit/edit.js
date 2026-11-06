const userNotes = require('../../../utils/userNotes');
const profileUtil = require('../../../utils/profile');

const ICON_OPTS = ['📝', '🌿', '🍵', '📖', '💊', '🔥', '💧', '🧘', '🥣', '🦴'];

function blankHerb() {
  return {
    _key: 'h_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name: '',
    amount: ''
  };
}

function herbsFromNote(note) {
  const list = note && Array.isArray(note.herbs) ? note.herbs : [];
  const rows = list.map((h, i) => ({
    _key: 'h_' + i + '_' + ((h && h.name) || 'row'),
    name: (h && h.name) || '',
    amount: (h && h.amount) || ''
  }));
  if (!rows.length) rows.push(blankHerb());
  return rows;
}

function formatWhen(ts) {
  const d = new Date(ts || Date.now());
  const week = '日一二三四五六'.charAt(d.getDay());
  const hh = d.getHours() < 10 ? '0' + d.getHours() : String(d.getHours());
  const mm = d.getMinutes() < 10 ? '0' + d.getMinutes() : String(d.getMinutes());
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + week + ' ' + hh + ':' + mm;
}

function hasAdvanced(herbs, slots, summary) {
  const herbFilled = (herbs || []).some((h) => (h.name || '').trim() || (h.amount || '').trim());
  const slotFilled = (slots || []).some((s) => (s.value || '').trim());
  return herbFilled || slotFilled || !!(summary && String(summary).trim());
}

Page({
  data: {
    id: '',
    isEdit: false,
    title: '',
    summary: '',
    content: '',
    icon: '📝',
    iconOpts: ICON_OPTS,
    herbs: [],
    slots: [],
    blocked: false,
    showMore: false,
    whenText: ''
  },

  _query: null,
  _loginPrompted: false,
  _opened: false,

  onLoad(query) {
    this._query = query || {};
    if (!this.guardLogin()) return;
    this.openForm(this._query);
  },

  onShow() {
    if (!this.guardLogin()) return;
    if (!this._opened) this.openForm(this._query || {});
  },

  guardLogin() {
    if (profileUtil.isLoggedIn()) return true;
    this.setData({ blocked: true });
    if (!this._loginPrompted) {
      this._loginPrompted = true;
      profileUtil.promptLogin(() => {
        wx.navigateBack({
          fail() {
            wx.switchTab({ url: '/pages/mine/mine' });
          }
        });
      });
    }
    return false;
  },

  openForm(query) {
    this._opened = true;
    const id = (query && query.id) || '';
    if (id) {
      const note = userNotes.get(id);
      if (!note) {
        wx.showToast({ title: '日记不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack({ fail() {} }), 500);
        return;
      }
      const herbs = herbsFromNote(note);
      const slots = userNotes.templateSlotsFor(note);
      this.setData({
        id: note.id,
        isEdit: true,
        title: note.title || '',
        summary: note.summary || '',
        content: note.content || '',
        icon: note.icon || '📝',
        herbs: herbs,
        slots: slots,
        showMore: hasAdvanced(herbs, slots, note.summary),
        whenText: formatWhen(note.createdAt)
      });
      wx.setNavigationBarTitle({ title: '编辑日记' });
    } else {
      this.setData({
        id: '',
        isEdit: false,
        title: '',
        summary: '',
        content: '',
        icon: '📝',
        herbs: [blankHerb()],
        slots: userNotes.templateSlotsFor(null),
        showMore: false,
        whenText: formatWhen(Date.now())
      });
      wx.setNavigationBarTitle({ title: '写日记' });
    }
  },

  onToggleMore() {
    this.setData({ showMore: !this.data.showMore });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onSummaryInput(e) {
    this.setData({ summary: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onPickIcon(e) {
    this.setData({ icon: e.currentTarget.dataset.v });
  },

  onHerbName(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ ['herbs[' + index + '].name']: e.detail.value });
  },

  onHerbAmount(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ ['herbs[' + index + '].amount']: e.detail.value });
  },

  onAddHerb() {
    const herbs = (this.data.herbs || []).concat([blankHerb()]);
    this.setData({ herbs: herbs });
  },

  onRemoveHerb(e) {
    const index = Number(e.currentTarget.dataset.index);
    const herbs = (this.data.herbs || []).slice();
    if (herbs.length <= 1) {
      const kept = herbs[0] || blankHerb();
      herbs.splice(0, herbs.length, {
        _key: kept._key || blankHerb()._key,
        name: '',
        amount: ''
      });
    } else if (index >= 0 && index < herbs.length) {
      herbs.splice(index, 1);
    }
    this.setData({ herbs: herbs });
  },

  onSlotInput(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ ['slots[' + index + '].value']: e.detail.value });
  },

  onSave() {
    if (!profileUtil.isLoggedIn()) {
      this.guardLogin();
      return;
    }
    const typedTitle = (this.data.title || '').trim();
    const content = (this.data.content || '').trim();
    const title = typedTitle || (content.split('\n')[0] || '').trim().slice(0, 40) || this.data.whenText || '日记';
    if (!content && !typedTitle) {
      wx.showToast({ title: '先写一点再保存', icon: 'none' });
      return;
    }

    const cleaned = [];
    const rows = this.data.herbs || [];
    for (let i = 0; i < rows.length; i++) {
      const name = (rows[i].name || '').trim();
      const amount = (rows[i].amount || '').trim();
      if (!name && !amount) continue;
      if (!name || !amount) {
        wx.showToast({ title: '药材名称和克数请成对填写', icon: 'none' });
        return;
      }
      cleaned.push({ name: name, amount: amount });
    }

    const slotPayload = {};
    (this.data.slots || []).forEach((s) => {
      slotPayload[s.key] = s.value || '';
    });

    try {
      const saved = userNotes.save({
        id: this.data.id || undefined,
        title: title,
        summary: this.data.summary,
        content: this.data.content,
        icon: this.data.icon,
        herbs: cleaned,
        slotA: slotPayload.slotA || '',
        slotB: slotPayload.slotB || '',
        slotC: slotPayload.slotC || ''
      });
      if (!this.data.id && saved.id) {
        this.setData({ id: saved.id });
      }
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack({ fail() {} });
      }, 450);
    } catch (err) {
      console.error(err);
      wx.showToast({
        title: (err && err.message) || '保存失败',
        icon: 'none'
      });
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
        userNotes.remove(id);
        wx.showToast({ title: '已删除', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack({ fail() {} });
        }, 400);
      }
    });
  }
});
