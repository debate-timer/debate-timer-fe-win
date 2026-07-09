import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useFullscreen from './useFullscreen';

/**
 * useFullscreen의 toggleFullscreen 동작 검증
 * - 버그: 토글이 React state(isFullscreen)만 보고 분기해서,
 *   fullscreenchange 이벤트 반영 전 빠른 연속 클릭/지연 상황에서 오분기했다.
 * - 수정: 실제 DOM 상태(getFullscreenElement)를 직접 읽어 분기한다.
 */
describe('useFullscreen - toggleFullscreen는 실제 DOM 상태로 분기한다', () => {
  let requestSpy: ReturnType<typeof vi.fn>;
  let exitSpy: ReturnType<typeof vi.fn>;

  function setFullscreenElement(el: Element | null) {
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => el,
    });
  }

  beforeEach(() => {
    requestSpy = vi.fn().mockResolvedValue(undefined);
    exitSpy = vi.fn().mockResolvedValue(undefined);
    (
      document.documentElement as HTMLElement & {
        requestFullscreen: () => Promise<void>;
      }
    ).requestFullscreen = requestSpy;
    (document as Document & { exitFullscreen: () => Promise<void> }).exitFullscreen =
      exitSpy;
    setFullscreenElement(null);
  });

  afterEach(() => {
    setFullscreenElement(null);
    vi.restoreAllMocks();
  });

  test('DOM이 전체화면이 아니면 진입(request)을 호출한다', async () => {
    const { result } = renderHook(() => useFullscreen());

    await act(async () => {
      await result.current.toggleFullscreen();
    });

    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('[버그 회귀 방지] React state가 아직 false여도 DOM이 이미 전체화면이면 해제(exit)를 호출한다', async () => {
    // 마운트 시점엔 전체화면 아님 → 내부 isFullscreen state=false
    const { result } = renderHook(() => useFullscreen());

    // fullscreenchange 이벤트를 발생시키지 않고 DOM만 전체화면으로 변경
    // → React state는 여전히 false(stale)
    setFullscreenElement(document.documentElement);

    await act(async () => {
      await result.current.toggleFullscreen();
    });

    // 실제 DOM 상태를 읽으므로 해제를 호출해야 한다
    // (수정 전 코드는 stale state(false)만 보고 진입을 호출해 이 테스트가 실패한다)
    expect(exitSpy).toHaveBeenCalledTimes(1);
    expect(requestSpy).not.toHaveBeenCalled();
  });
});
