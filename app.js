// app.js
App({
  onLaunch() {
    // 云开发初始化：env 留空或填自己的环境 ID
    // 未配置时自动走本地模式（utils/api.js 会检测）
    const cloudEnv = ''; // 例如 'tcm-xxxx'
    this.globalData.cloudEnv = cloudEnv;

    if (wx.cloud && cloudEnv) {
      try {
        wx.cloud.init({
          env: cloudEnv,
          traceUser: true
        });
        this.globalData.cloudReady = true;
      } catch (e) {
        console.warn('云开发初始化失败，将使用本地模式', e);
        this.globalData.cloudReady = false;
      }
    } else {
      this.globalData.cloudReady = false;
      console.info('[本地模式] 未配置云环境，使用本地 JSON + wx.storage');
    }

    // 确保本地存储键存在
    try {
      if (!wx.getStorageSync('view_logs')) {
        wx.setStorageSync('view_logs', []);
      }
    } catch (e) {
      console.warn('初始化本地存储失败', e);
    }
  },

  globalData: {
    cloudEnv: '',
    cloudReady: false,
    userOpenId: ''
  }
});
