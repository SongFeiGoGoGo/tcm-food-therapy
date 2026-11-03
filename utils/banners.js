/**
 * 首页轮播占位。本地配置即可，没有运营后台。
 * image：本地图路径；空字符串表示无图，页面用色块 + 标题，不白屏。
 * title：可选。
 * link：预留。空字符串表示点击不跳转；以后可填站内路径 /pages/...
 * 配图用本地路径 /images/banners/，不要外链。正式图到位后只改 image。
 */
module.exports = [
  {
    id: 'banner_green',
    title: '中医食疗',
    image: '/images/banners/banner-1.png',
    link: ''
  },
  {
    id: 'banner_paper',
    title: '笔记与打卡',
    image: '/images/banners/banner-2.png',
    link: ''
  },
  {
    id: 'banner_no_image',
    title: '中医食疗',
    image: '',
    link: ''
  }
];
