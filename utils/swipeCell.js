/**
 * 列表左滑删除手势辅助：方向锁定、删除区宽度、跟手位移。
 * 约定：仅当水平位移明显大于垂直时才进入左滑；否则交给页面滚动。
 */

function getActionWidthPx(rpx) {
  const w = typeof rpx === 'number' ? rpx : 140;
  try {
    const sys = wx.getSystemInfoSync();
    return Math.max(1, Math.round((sys.windowWidth / 750) * w));
  } catch (e) {
    return 70;
  }
}

/** 判定方向：null=位移不足；'pending'=方向不明继续等；'h'|'v'=已锁定 */
function decideLock(dx, dy, threshold, ratio) {
  const lockPx = threshold == null ? 10 : threshold;
  const hRatio = ratio == null ? 1.5 : ratio;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  if (adx < lockPx && ady < lockPx) return null;
  if (adx >= lockPx && adx > ady * hRatio) return 'h';
  if (ady >= lockPx && ady > adx * hRatio) return 'v';
  return 'pending';
}

function clampX(x, actionWidth) {
  if (x > 0) return 0;
  if (x < -actionWidth) return -actionWidth;
  return x;
}

/** 松手后吸附：超过一半则全开，否则收回 */
function snapX(x, actionWidth) {
  return x < -actionWidth / 2 ? -actionWidth : 0;
}

module.exports = {
  getActionWidthPx: getActionWidthPx,
  decideLock: decideLock,
  clampX: clampX,
  snapX: snapX
};
