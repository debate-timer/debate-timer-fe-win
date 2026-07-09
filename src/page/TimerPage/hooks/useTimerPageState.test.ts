import { describe, test, expect } from 'vitest';
import {
  shouldReuseSpeakingTime,
  QUICK_RETURN_THRESHOLD_MS,
} from './useTimerPageState';

/**
 * 빠른 왕복 팀전환 시 1회당 발언시간 유지 여부 판단 로직 검증
 * - 3초룰: 잔여 발언시간을 남긴 채 3초 이내 복귀 시에만 이어가기(true)
 * - 발언시간을 모두 소진하고 떠났다면 3초룰과 무관하게 항상 초기화(false)
 */
describe('shouldReuseSpeakingTime - 3초룰 판단', () => {
  // 대부분의 케이스가 공유하는 기본 입력 (1회당 발언시간 사용, lastYielded=0 기준)
  const base = {
    isSpeakingTimerAvailable: true,
    speakingTimer: 30,
    isOpponentDone: false,
    lastYieldedAt: 0,
    now: 0,
  };

  test('1. 잔여 시간 남기고 3초 이내 복귀 → 이어가기(true)', () => {
    expect(shouldReuseSpeakingTime({ ...base, now: 2000 })).toBe(true);
  });

  test('2. 3초 초과 복귀 → 초기화(false)', () => {
    expect(shouldReuseSpeakingTime({ ...base, now: 3001 })).toBe(false);
  });

  test('3. 경계값 정확히 3초 → 이어가기(true, <=)', () => {
    expect(
      shouldReuseSpeakingTime({ ...base, now: QUICK_RETURN_THRESHOLD_MS }),
    ).toBe(true);
  });

  test('4. 1회당 발언시간 소진(0) 후 3초 이내 복귀 → 3초룰 무시, 초기화(false)', () => {
    expect(
      shouldReuseSpeakingTime({ ...base, speakingTimer: 0, now: 1000 }),
    ).toBe(false);
  });

  test('5. 시간초과 허용으로 마이너스까지 소진 후 복귀 → 초기화(false)', () => {
    expect(
      shouldReuseSpeakingTime({ ...base, speakingTimer: -5, now: 1000 }),
    ).toBe(false);
  });

  test('6. 상대팀 완료 상황 → 전체시간 부여 우선, 초기화(false)', () => {
    expect(
      shouldReuseSpeakingTime({ ...base, isOpponentDone: true, now: 1000 }),
    ).toBe(false);
  });

  test('7. 첫 전환(기록 없음) → 초기화(false)', () => {
    expect(
      shouldReuseSpeakingTime({ ...base, lastYieldedAt: null, now: 1000 }),
    ).toBe(false);
  });

  test('8. 1회당 발언시간 미사용 모드 → 초기화(false)', () => {
    expect(
      shouldReuseSpeakingTime({
        ...base,
        isSpeakingTimerAvailable: false,
        speakingTimer: null,
        now: 1000,
      }),
    ).toBe(false);
  });
});
