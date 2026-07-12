/**
 * 초과 시간을 허용하되, 비정상적으로 큰 음수(시계 점프 등)로 튀는 것을 막기 위한 하한값(초)
 * - 어떤 토론에서도 1시간 넘게 초과 카운트가 필요하지는 않으므로 -1시간으로 방어
 */
export const OVERFLOW_FLOOR_SECONDS = -60 * 60;

/**
 * 단조 증가(monotonic) 시계 기반의 현재 시각(ms)
 * - Date.now()(벽시계)는 시스템 절전/복귀, NTP 시각 동기화, 수동 시계 변경 시 불연속적으로 점프할 수 있어
 *   목표시각 기반 카운트다운에서 남은 시간이 순간적으로 거대한 음수로 튀는 원인이 된다.
 * - performance.now()는 단조 증가하므로 벽시계 점프의 영향을 받지 않는다.
 */
export function monotonicNow(): number {
  return typeof performance !== 'undefined' && performance.now
    ? performance.now()
    : Date.now();
}
