import { describe, test, expect } from 'vitest';
import { isTimeBasedTimerFinished } from './useBellSound';

/**
 * 종료 벨 판정(isTimeBasedTimerFinished) 검증
 * - 버그: 시간초과 허용(allowOverflow)이 켜져 있어도 발언 시간이 0이 되는 순간
 *   종료로 판정되어 종료 벨이 잘못 울렸다.
 * - 수정: allowOverflow가 켜진 경우 발언 시간 0은 종료로 보지 않고,
 *   전체 시간(totalTimer) 소진만 종료로 처리한다.
 */
describe('isTimeBasedTimerFinished - 종료 벨 판정', () => {
  const base = {
    isRunning: true,
    speakingTimer: 30 as number | null,
    totalTimer: 60 as number | null,
    allowOverflow: false,
  };

  test('정지 상태면 어떤 경우에도 종료가 아니다', () => {
    expect(
      isTimeBasedTimerFinished({
        ...base,
        isRunning: false,
        speakingTimer: 0,
        totalTimer: 0,
      }),
    ).toBe(false);
  });

  test('시간초과 미허용: 발언 시간 0은 종료로 판정된다(기존 동작 유지)', () => {
    expect(
      isTimeBasedTimerFinished({
        ...base,
        allowOverflow: false,
        speakingTimer: 0,
        totalTimer: 40,
      }),
    ).toBe(true);
  });

  test('[버그 수정] 시간초과 허용: 발언 시간 0이어도 전체 시간이 남아 있으면 종료가 아니다', () => {
    expect(
      isTimeBasedTimerFinished({
        ...base,
        allowOverflow: true,
        speakingTimer: 0,
        totalTimer: 40,
      }),
    ).toBe(false);
  });

  test('[버그 수정] 시간초과 허용: 발언 시간이 마이너스로 흘러도 종료가 아니다', () => {
    expect(
      isTimeBasedTimerFinished({
        ...base,
        allowOverflow: true,
        speakingTimer: -5,
        totalTimer: 30,
      }),
    ).toBe(false);
  });

  test('시간초과 허용이어도 전체 시간 소진(totalTimer 0)은 항상 종료다(종료 벨은 이때 울려야 함)', () => {
    expect(
      isTimeBasedTimerFinished({
        ...base,
        allowOverflow: true,
        speakingTimer: -12,
        totalTimer: 0,
      }),
    ).toBe(true);
  });

  test('시간초과 미허용: 전체 시간 소진도 종료다', () => {
    expect(
      isTimeBasedTimerFinished({
        ...base,
        allowOverflow: false,
        speakingTimer: 5,
        totalTimer: 0,
      }),
    ).toBe(true);
  });
});
