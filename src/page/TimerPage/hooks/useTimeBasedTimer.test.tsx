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
