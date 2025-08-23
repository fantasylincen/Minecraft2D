/**
 * 噪音工具函数
 * 提供噪音处理的各种辅助方法
 */

/**
 * 平滑插值函数
 * @param {number} a - 起始值
 * @param {number} b - 结束值
 * @param {number} t - 插值系数 (0-1)
 * @returns {number} 插值结果
 */
export function smoothstep(a, b, t) {
  t = Math.max(0, Math.min(1, t));
  t = t * t * (3 - 2 * t);
  return a + t * (b - a);
}

/**
 * 线性插值
 * @param {number} a - 起始值
 * @param {number} b - 结束值
 * @param {number} t - 插值系数 (0-1)
 * @returns {number} 插值结果
 */
export function lerp(a, b, t) {
  return a + t * (b - a);
}

/**
 * 双线性插值
 * @param {number} a - 左上值
 * @param {number} b - 右上值
 * @param {number} c - 左下值
 * @param {number} d - 右下值
 * @param {number} tx - X方向插值系数
 * @param {number} ty - Y方向插值系数
 * @returns {number} 插值结果
 */
export function bilinearInterpolation(a, b, c, d, tx, ty) {
  const top = lerp(a, b, tx);
  const bottom = lerp(c, d, tx);
  return lerp(top, bottom, ty);
}

/**
 * 将噪音值映射到指定范围
 * @param {number} value - 原始噪音值 (-1 到 1)
 * @param {number} min - 目标最小值
 * @param {number} max - 目标最大值
 * @returns {number} 映射后的值
 */
export function mapNoise(value, min, max) {
  return min + (value + 1) * 0.5 * (max - min);
}

/**
 * 标准化噪音值到0-1范围
 * @param {number} value - 原始噪音值 (-1 到 1)
 * @returns {number} 标准化后的值 (0-1)
 */
export function normalizeNoise(value) {
  return (value + 1) * 0.5;
}

/**
 * 应用曲线到噪音值
 * @param {number} value - 噪音值 (0-1)
 * @param {number} power - 曲线强度
 * @returns {number} 应用曲线后的值
 */
export function applyCurve(value, power) {
  return Math.pow(value, power);
}

/**
 * 噪音值阶梯化
 * @param {number} value - 噪音值
 * @param {number} steps - 阶梯数量
 * @returns {number} 阶梯化后的值
 */
export function stepNoise(value, steps) {
  return Math.floor(value * steps) / steps;
}

/**
 * 噪音值柔化
 * @param {number} value - 噪音值
 * @param {number} smoothness - 柔化程度
 * @returns {number} 柔化后的值
 */
export function softenNoise(value, smoothness) {
  return value * smoothness + (1 - smoothness) * 0.5;
}

/**
 * 组合多个噪音值
 * @param {number[]} noiseValues - 噪音值数组
 * @param {number[]} weights - 权重数组
 * @returns {number} 组合后的噪音值
 */
export function combineNoise(noiseValues, weights) {
  if (noiseValues.length !== weights.length) {
    throw new Error('噪音值数组和权重数组长度必须相同');
  }
  
  let result = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < noiseValues.length; i++) {
    result += noiseValues[i] * weights[i];
    totalWeight += weights[i];
  }
  
  return totalWeight > 0 ? result / totalWeight : 0;
}

/**
 * 噪音梯度计算
 * @param {Function} noiseFn - 噪音函数
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} delta - 梯度计算步长
 * @returns {Object} 梯度向量 {x, y}
 */
export function noiseGradient(noiseFn, x, y, delta = 0.01) {
  const dx = (noiseFn(x + delta, y) - noiseFn(x - delta, y)) / (2 * delta);
  const dy = (noiseFn(x, y + delta) - noiseFn(x, y - delta)) / (2 * delta);
  return { x: dx, y: dy };
}