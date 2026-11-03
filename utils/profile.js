/**
 * 「我的」登录资料：本地 wx.storage。
 * 不启用云开发，不保存 wx.login 的 code，也不在本地换 openId。
 *
 * 后端接入点：loginWithWechat 里 wx.login 成功回调中的 res.code。
 * 以后把 code 交给自有后端（或云函数）换 openId / session，再与头像、昵称一起落库。
 * 当前 cloudEnv 为空，这里只完成本机头像昵称闭环。
 *
 * 理论讨论，不替代面诊。
 */
const STORAGE_KEY = 'tcm_user_profile';

function blank() {
  return {
    loggedIn: false,
    nickName: '',
    avatarUrl: '',
    loginCodeSeen: false,
    updatedAt: 0
  };
}

function read() {
  const base = blank();
  try {
    const raw = wx.getStorageSync(STORAGE_KEY);
    if (!raw) return base;
    let obj = raw;
    if (typeof raw === 'string') {
      obj = JSON.parse(raw);
    }
    if (!obj || typeof obj !== 'object') return base;
    return {
      loggedIn: !!obj.loggedIn,
      nickName: typeof obj.nickName === 'string' ? obj.nickName : '',
      avatarUrl: typeof obj.avatarUrl === 'string' ? obj.avatarUrl : '',
      loginCodeSeen: !!obj.loginCodeSeen,
      updatedAt: obj.updatedAt || 0
    };
  } catch (e) {
    console.warn('profile read fail', e);
    return base;
  }
}

function save(partial) {
  const cur = read();
  const next = {
    loggedIn: partial && Object.prototype.hasOwnProperty.call(partial, 'loggedIn') ? !!partial.loggedIn : cur.loggedIn,
    nickName: partial && Object.prototype.hasOwnProperty.call(partial, 'nickName') ? String(partial.nickName || '') : cur.nickName,
    avatarUrl: partial && Object.prototype.hasOwnProperty.call(partial, 'avatarUrl') ? String(partial.avatarUrl || '') : cur.avatarUrl,
    loginCodeSeen: partial && Object.prototype.hasOwnProperty.call(partial, 'loginCodeSeen') ? !!partial.loginCodeSeen : cur.loginCodeSeen,
    updatedAt: Date.now()
  };
  wx.setStorageSync(STORAGE_KEY, next);
  return next;
}

/**
 * 前端登录闭环。
 * 会调用 wx.login；code 只用于判断「本机是否调通」，不写入 storage，不上传。
 * 游客模式常拿不到 code，仍然把 loggedIn 记到本机，方便继续设置头像昵称。
 * @returns {Promise<object>}
 */
function loginWithWechat() {
  return new Promise((resolve) => {
    const finish = (gotCode) => {
      const prev = read();
      const nick = (prev.nickName || '').trim() || '微信用户';
      resolve(save({
        loggedIn: true,
        nickName: nick,
        avatarUrl: prev.avatarUrl || '',
        loginCodeSeen: !!gotCode
      }));
    };

    if (!wx.login) {
      finish(false);
      return;
    }

    wx.login({
      success(res) {
        // 后端接入点：把 res.code 发给服务端换 openId。本迭代不发送。
        finish(!!(res && res.code));
      },
      fail() {
        finish(false);
      }
    });
  });
}

function logout() {
  return save({ loggedIn: false });
}

module.exports = {
  STORAGE_KEY: STORAGE_KEY,
  read: read,
  save: save,
  loginWithWechat: loginWithWechat,
  logout: logout
};
