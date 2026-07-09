import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimeBasedTimer } from './useTimeBasedTimer';

/**
 * useTimeBasedTimer의 "시간초과 허용(allowOverflow)" 동작 검증
 * - fake timer로 Date.now()/setInterval을 가짜 시간으로 진행시킨다.
 */
describe('useTimeBasedTimer - 시간초과 허용', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    // 남은 인터벌 콜백이 act 밖에서 상태를 갱신하지 않도록 정리
    act(() => {
      vi.clearAllTimers();
    });
    vi.useRealTimers();
  });

  test('A. 시간초과 미허용(기본): 발언 시간은 0에서 멈추고 전체 시간은 계속 흐른다', () => {
    const { result } = renderHook(() => useTimeBasedTimer());

    act(() => {
      result.current.setDefaultTime({
        defaultTotalTimer: 60,
        defaultSpeakingTimer: 10,
      });
      result.current.setTimers(60, 10);
    });
    act(() => {
      result.current.startTimer();
    });
    // 발언 시간(10초)보다 넉넉히 지난 시점
    act(() => {
      vi.advanceTimersByTime(12000);
    });

    // 발언 시간은 0에서 클램프
    expect(result.current.speakingTimer).toBe(0);
    // 전체 시간은 아직 남아있음
    expect(result.current.totalTimer).toBeGreaterThan(0);
  });

  test('B. 시간초과 허용: 발언 시간이 0을 넘어 마이너스로 계속 흐른다', () => {
    const { result } = renderHook(() => useTimeBasedTimer());

    act(() => {
      result.current.setAllowOverflow(true);
      result.current.setDefaultTime({
        defaultTotalTimer: 60,
        defaultSpeakingTimer: 10,
      });
      result.current.setTimers(60, 10);
    });
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      vi.advanceTimersByTime(12000);
    });

    // 발언 시간은 마이너스로 흐름
    expect(result.current.speakingTimer).toBeLessThan(0);
    // 전체 시간은 아직 남아있음
    expect(result.current.totalTimer).toBeGreaterThan(0);
  });

  test('C. 시간초과 허용이어도 전체 시간(totalTimer)은 0에서 멈춘다', () => {
    const { result } = renderHook(() => useTimeBasedTimer());

    act(() => {
      result.current.setAllowOverflow(true);
      result.current.setDefaultTime({
        defaultTotalTimer: 5,
        defaultSpeakingTimer: 100,
      });
      result.current.setTimers(5, 100);
    });
    act(() => {
      result.current.startTimer();
    });
    // 전체 시간(5초)을 넘긴 시점
    act(() => {
      vi.advanceTimersByTime(7000);
    });

    // 전체 시간은 0에서 클램프 (마이너스로 흐르지 않음)
    expect(result.current.totalTimer).toBe(0);
  });
});

/**
 * 빠른 왕복 팀전환 관련 메커니즘 검증
 * - pause 후 다시 start하면 1회당 발언시간이 초기화되지 않고 남은 값부터 이어짐
 * - markYielded/getLastYieldedAt 기록 및 clearTimer 초기화
 */
describe('useTimeBasedTimer - 빠른 왕복 메커니즘', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.clearAllTimers();
    });
    vi.useRealTimers();
  });

  test('2-1. pause 후 재개 시 1회당 발언시간이 리셋되지 않고 남은 값부터 이어진다', () => {
    const { result } = renderHook(() => useTimeBasedTimer());

    act(() => {
      result.current.setDefaultTime({
        defaultTotalTimer: 120,
        defaultSpeakingTimer: 120,
      });
      result.current.setTimers(120, 120);
    });
    act(() => {
      result.current.startTimer();
    });
    // 90초 경과 → 1회당 발언시간 약 30초 남음
    act(() => {
      vi.advanceTimersByTime(90000);
    });
    expect(result.current.speakingTimer).toBe(30);

    // 실수 전환처럼 정지
    act(() => {
      result.current.pauseTimer();
    });

    // 다시 시작(초기화 없이 재개) 후 짧게 진행
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // 120으로 리셋되지 않고 30 부근에서 이어져야 함
    expect(result.current.speakingTimer).toBeLessThanOrEqual(30);
    expect(result.current.speakingTimer).toBeGreaterThan(20);
  });

  test('2-2. markYielded 후 getLastYieldedAt이 기록된 시각을 반환한다', () => {
    const { result } = renderHook(() => useTimeBasedTimer());

    // 초기에는 기록 없음
    expect(result.current.getLastYieldedAt()).toBeNull();

    act(() => {
      result.current.markYielded();
    });

    expect(result.current.getLastYieldedAt()).toBe(Date.now());
  });

  test('2-3. clearTimer가 발언권 넘긴 기록을 초기화한다(라운드 이동 시 stale 방지)', () => {
    const { result } = renderHook(() => useTimeBasedTimer());

    act(() => {
      result.current.markYielded();
    });
    expect(result.current.getLastYieldedAt()).not.toBeNull();

    act(() => {
      result.current.clearTimer();
    });
    expect(result.current.getLastYieldedAt()).toBeNull();
  });
});
