import {
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { TimeBasedTimerLogics, useTimeBasedTimer } from './useTimeBasedTimer';
import { NormalTimerLogics, useNormalTimer } from './useNormalTimer';
import { useBellSound } from './useBellSound';
import {
  DebateTableData,
  TimeBasedStance,
  TimerBGState,
} from '../../../type/type';
import repository from '../../../repositories/IPCDebateTableRepository';
import { UUID } from 'crypto';
import useAsyncRequest from '../../../repositories/useAsyncRequest';
import { useTimerBackground } from './useTimerBackground';

// 팀 전환 후 같은 팀으로 되돌아온 것을 "실수/첨언"으로 간주하는 시간 임계값(ms)
export const QUICK_RETURN_THRESHOLD_MS = 2000;

/**
 * 팀 전환 시 다음 팀의 1회당 발언시간을 "초기화하지 않고 이어서" 사용할지 판단
 * - 2초룰: 잔여 발언시간을 남긴 채(speakingTimer > 0) 2초 이내에 되돌아온 경우에만 이어가기
 * - 1회당 발언시간을 모두 소진(speakingTimer <= 0)하고 떠났다면 항상 초기화(false)
 */
export function shouldReuseSpeakingTime(params: {
  isSpeakingTimerAvailable: boolean;
  speakingTimer: number | null;
  isOpponentDone: boolean;
  lastYieldedAt: number | null;
  now: number;
  thresholdMs?: number;
}): boolean {
  const {
    isSpeakingTimerAvailable,
    speakingTimer,
    isOpponentDone,
    lastYieldedAt,
    now,
    thresholdMs = QUICK_RETURN_THRESHOLD_MS,
  } = params;
  return (
    isSpeakingTimerAvailable &&
    speakingTimer !== null &&
    speakingTimer > 0 && // 1회당 발언시간을 다 쓰지 않고 떠났을 때만 이어가기
    !isOpponentDone &&
    lastYieldedAt !== null &&
    now - lastYieldedAt <= thresholdMs
  );
}

/**
 * 타이머 페이지의 상태(타이머, 라운드, 벨 등) 전반을 관리하는 커스텀 훅
 */
export function useTimerPageState(tableId: UUID) {
  const [data, setData] = useState<DebateTableData | null>(null);
  const {
    data: patchedData,
    error,
    execute: getTable,
    isLoading,
  } = useAsyncRequest(repository.getTable);

  // 추가 타이머가 가능한지 여부 (예: 사전에 설정한 "작전 시간"이 있으면 false)
  const isAdditionalTimerAvailable = useMemo(() => {
    if (data) {
      return !data.table.some((value) => value.speechType === '작전 시간');
    }
    return true;
  }, [data]);

  // 현재 진행 중인 토론 순서 인덱스
  const [index, setIndex] = useState(0);

  // 자유토론 타이머, 일반 타이머 상태 관리 커스텀 훅
  const timer1 = useTimeBasedTimer();
  const timer2 = useTimeBasedTimer();
  const normalTimer = useNormalTimer();

  // 현재 발언자('PROS'/'CONS')
  const [prosConsSelected, setProsConsSelected] =
    useState<TimeBasedStance>('PROS');

  // 벨 사운드 관련 훅 (벨 ref 제공)
  const { warningBellRef, finishBellRef } = useBellSound({
    timer1,
    timer2,
    normalTimer,
    isWarningBell: data?.info.warningBell,
    isFinishBell: data?.info.finishBell,
  });

  // 배경 색상 관련 훅
  const { bg, setBg } = useTimerBackground({
    timer1,
    timer2,
    normalTimer,
    prosConsSelected,
    data,
    index,
  });

  /**
   * 라운드 이동 (이전/다음)
   */
  const goToOtherItem = useCallback(
    (isPrev: boolean) => {
      if (isPrev) {
        if (index > 0) {
          setIndex((prev) => prev - 1);
        }
      } else {
        if (data && index < data.table.length - 1) {
          setIndex((prev) => prev + 1);
        }
      }
    },
    [index, data],
  );

  /**
   * 발언 진영 전환(ENTER 키/버튼)
   * - pros → cons, cons → pros로 타이머/상태 전환
   */
  const switchCamp = useCallback(() => {
    // 1. 현재 팀과 다음 팀의 정보 설정
    const currentTimer = prosConsSelected === 'PROS' ? timer1 : timer2;
    const nextTimer = prosConsSelected === 'PROS' ? timer2 : timer1;
    const nextTeam = prosConsSelected === 'PROS' ? 'CONS' : 'PROS';

    // 2. 상대 팀이 시간을 모두 소진했을 경우, 차례를 넘기지 않고 반환
    if (nextTimer.isDone) {
      return;
    }

    // 3. 현재 팀의 발언이 종료되었는지 확인
    const isOpponentDone =
      currentTimer.totalTimer !== null && currentTimer.totalTimer <= 0;

    // 4. 현재 타이머를 멈추기 전, 실행 중이었는지를 저장
    const wasRunning = currentTimer.isRunning;

    // 5. 다음 팀이 발언권을 넘긴 뒤 2초 이내에 되돌아오는 경우인지 판단(티키타카 첨언 방지)
    //    - 이 경우 1회당 발언 시간을 초기화하지 않고 남은 값 그대로 이어서 사용
    const isQuickReturn = shouldReuseSpeakingTime({
      isSpeakingTimerAvailable: nextTimer.isSpeakingTimerAvailable,
      speakingTimer: nextTimer.speakingTimer,
      isOpponentDone,
      lastYieldedAt: nextTimer.getLastYieldedAt(),
      now: Date.now(),
    });

    // 6. 이제 현재 타이머를 정지하고, 발언권을 넘긴 시각을 기록
    currentTimer.pauseTimer();
    currentTimer.markYielded();

    // 7. 발언권을 다음 팀에게 넘김 (현재 발언권 가진 팀을 다음 팀으로 설정)
    setProsConsSelected(nextTeam);

    if (isQuickReturn) {
      // 8-1. 빠른 복귀: 1회당 발언 시간을 초기화하지 않고 남은 값 그대로 이어서 사용
      //      (실행 중이었을 때만 재개; 정지 상태였다면 남은 값 유지)
      if (wasRunning) {
        nextTimer.startTimer();
      }
    } else if (wasRunning) {
      // 8-2. 만약 타이머가 실행 중이었다면, 다음 타이머 초기화 후 즉시 시작
      nextTimer.resetAndStartTimer(isOpponentDone);
    } else {
      // 8-3. 만약 타이머가 멈춰 있었다면, 다음 타이머 초기화만 진행
      nextTimer.resetTimerForNextPhase(isOpponentDone);
    }
  }, [prosConsSelected, timer1, timer2]);

  /**
   * 특정 진영(팀)을 활성화하는 함수
   * - 사용자가 좌/우 타이머 영역을 직접 클릭할 때 사용
   * - 현재 진영이 아닌 타이머를 클릭한 경우에만 동작
   */
  const handleActivateTeam = useCallback(
    (team: TimeBasedStance) => {
      const clickedTimerStance = team === 'PROS' ? 'PROS' : 'CONS';
      const clickedTimer = clickedTimerStance === 'PROS' ? timer1 : timer2;

      // 클릭한 타이머가 현재 타이머와 동일한 타이머라면, 바로 반환
      if (prosConsSelected === clickedTimerStance) return;

      // 아니라면, 타이머 변경
      if (clickedTimer.isDone) {
        setProsConsSelected(clickedTimerStance);
      } else {
        switchCamp();
      }
    },
    [prosConsSelected, switchCamp, timer1, timer2],
  );

  /**
   * 데이터를 IPC 저장소에서 불러옴
   */
  useEffect(() => {
    const getData = async () => {
      const response = await getTable(tableId);

      if (response.success) {
        if (response.data) {
          setData(response.data);
        }
      }
    };

    getData();
  }, [getTable, tableId]);

  /**
   * 라운드 이동/초기 진입 시 타이머 상태 초기화 및 셋업
   */
  useEffect(() => {
    if (!data) return;
    const currentBox = data.table[index];
    timer1.clearTimer();
    timer2.clearTimer();
    normalTimer.clearTimer();
    normalTimer.handleCloseAdditionalTimer();

    // 일반 타이머(중립 발언 등)
    if (currentBox.boxType === 'NORMAL') {
      const defaultTime = currentBox.time ?? 0;
      normalTimer.setDefaultTimer(defaultTime);
      normalTimer.setTimer(defaultTime);
    }
    // 진영별 타이머(찬/반)
    else if (currentBox.boxType === 'TIME_BASED') {
      normalTimer.clearTimer();
      const defaultTotalTimer = currentBox.timePerTeam;
      const defaultSpeakingTimer = currentBox.timePerSpeaking;
      const allowOverflow = currentBox.allowSpeakingOverflow ?? false;
      [timer1, timer2].forEach((timer) => {
        timer.setDefaultTime({ defaultTotalTimer, defaultSpeakingTimer });
        timer.setTimers(defaultTotalTimer, defaultSpeakingTimer);
        timer.setIsDone(false);
        timer.setAllowOverflow(allowOverflow);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data,
    index,
    timer1.setDefaultTime,
    timer1.setTimers,
    timer2.setDefaultTime,
    timer2.setTimers,
    normalTimer.setDefaultTimer,
    normalTimer.setTimer,
  ]);

  /**
   * 진영 전환 시, 상대 타이머가 작동 가능하면 isDone을 false로 변경
   */
  useEffect(() => {
    const isPros = prosConsSelected === 'PROS';
    const opponentTimer = isPros ? timer2 : timer1;
    if (opponentTimer.totalTimer !== null && opponentTimer.totalTimer > 0) {
      opponentTimer.setIsDone(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prosConsSelected]);

  /**
   * 각 타이머가 종료 시 자동으로 타이머 일시정지
   */
  useEffect(() => {
    [timer1, timer2].forEach((timer) => {
      // 전체 시간이 소진되면 항상 정지 (시간초과 허용이어도 여기서 멈춤)
      if (timer.totalTimer === 0) {
        timer.pauseTimer();
      }
      // 시간초과 허용이 아닐 때만 발언 시간 0에서 정지
      else if (!timer.allowOverflow && timer.speakingTimer === 0) {
        timer.pauseTimer();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    timer1.speakingTimer,
    timer1.totalTimer,
    timer2.speakingTimer,
    timer2.totalTimer,
  ]);

  /**
   * 각 진영의 타이머가 완전히 끝난 경우(isDone 처리)
   */
  useEffect(() => {
    const selectedTimer = prosConsSelected === 'PROS' ? timer1 : timer2;

    // 시간초과 허용이거나 발언 타이머가 없으면 전체 시간 소진 시에만 완료 처리
    const isDone =
      selectedTimer.speakingTimer === null || selectedTimer.allowOverflow
        ? selectedTimer.totalTimer === 0
        : selectedTimer.speakingTimer === 0;

    if (isDone) {
      selectedTimer.setIsDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    prosConsSelected,
    timer1.totalTimer,
    timer1.speakingTimer,
    timer2.totalTimer,
    timer2.speakingTimer,
  ]);

  return {
    warningBellRef,
    finishBellRef,
    data,
    bg,
    setBg,
    isAdditionalTimerAvailable,
    index,
    setIndex,
    timer1,
    timer2,
    normalTimer,
    prosConsSelected,
    setProsConsSelected,
    goToOtherItem,
    switchCamp,
    handleActivateTeam,
    tableId,
    error,
    isLoading,
    patchedData,
  };
}

export interface TimerPageLogics {
  warningBellRef: RefObject<HTMLAudioElement>;
  finishBellRef: RefObject<HTMLAudioElement>;
  data: DebateTableData | null;
  bg: TimerBGState;
  setBg: Dispatch<SetStateAction<TimerBGState>>;
  isAdditionalTimerAvailable: boolean;
  index: number;
  setIndex: Dispatch<SetStateAction<number>>;
  timer1: TimeBasedTimerLogics;
  timer2: TimeBasedTimerLogics;
  normalTimer: NormalTimerLogics;
  prosConsSelected: TimeBasedStance;
  setProsConsSelected: Dispatch<SetStateAction<TimeBasedStance>>;
  goToOtherItem: (isPrev: boolean) => void;
  switchCamp: () => void;
  handleActivateTeam: (team: TimeBasedStance) => void;
  tableId: UUID;
}
