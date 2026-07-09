import TimerController from './TimerController';
import { Formatting } from '../../../util/formatting';
import KeyboardKeyA from '../../../assets/keyboard/keyboard_key_A.png';
import KeyboardKeyL from '../../../assets/keyboard/keyboard_key_l.png';
import { TimeBasedStance } from '../../../type/type';

type TimeBasedTimerInstance = {
  totalTimer: number | null;
  speakingTimer: number | null;
  isRunning: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resetCurrentTimer: () => void;
};
interface TimeBasedTimerProps {
  timeBasedTimerInstance: TimeBasedTimerInstance;
  isSelected: boolean;
  onActivate?: () => void;
  prosCons: TimeBasedStance;
  teamName: string;
}

export default function TimeBasedTimer({
  timeBasedTimerInstance,
  isSelected,
  onActivate,
  prosCons,
  teamName,
}: TimeBasedTimerProps) {
  const {
    totalTimer,
    speakingTimer,
    isRunning,
    startTimer,
    pauseTimer,
    resetCurrentTimer,
  } = timeBasedTimerInstance;
  const minute = Formatting.formatTwoDigits(
    Math.floor(Math.abs(totalTimer ?? 0) / 60),
  );
  const second = Formatting.formatTwoDigits(Math.abs((totalTimer ?? 0) % 60));

  const speakingMinute = Formatting.formatTwoDigits(
    Math.floor(Math.abs((speakingTimer ?? 0) / 60)),
  );
  const speakingSecond = Formatting.formatTwoDigits(
    Math.abs((speakingTimer ?? 0) % 60),
  );

  const boxShadow = isRunning
    ? prosCons === 'PROS'
      ? 'shadow-camp-blue'
      : 'shadow-camp-red'
    : '';

  const bgColorClass = prosCons === 'PROS' ? 'bg-camp-blue' : 'bg-camp-red';

  return (
    <div
      onClick={onActivate}
      className={`rounded-[45px] duration-100 ${boxShadow}`}
    >
      <div
        data-testid="timer"
        className={`flex min-h-[300px] w-[460px] flex-col items-center rounded-[45px] bg-neutral-200 transition-all duration-300 lg:w-[600px] xl:w-[720px] ${
          isSelected ? '' : 'pointer-events-none opacity-50 grayscale'
        }`}
      >
        {/* Timer Header */}
        <div
          className={`flex h-[80px] w-full items-center justify-between rounded-t-[45px] lg:h-[105px] xl:h-[139px] ${bgColorClass} relative text-[45px] font-semibold  text-neutral-50 lg:text-[60px] lg:font-bold xl:text-[75px]`}
        >
          <h2 className="absolute left-1/2 flex w-max -translate-x-1/2 transform items-center justify-center gap-2">
            {teamName}
            <img
              src={prosCons === 'PROS' ? KeyboardKeyA : KeyboardKeyL}
              alt={prosCons === 'PROS' ? 'A키' : 'ㅣ키'}
              className="h-[35px] w-[35px] lg:h-[50px] lg:w-[50px] xl:h-[56px] xl:w-[56px]"
            />
          </h2>
        </div>
        {speakingTimer !== null ? (
          <div className="h-7 lg:h-10" />
        ) : (
          <div className="h-12 lg:h-14 xl:h-20" />
        )}
        {/* 🚩 Timer 영역 */}
        <div className="flex flex-col items-center space-y-[10px] lg:space-y-[15px] xl:space-y-[20px]">
          {speakingTimer !== null ? (
            <>
              {/* 전체시간 타이머 (상단 작게 표시) */}
              <div
                className={`relative flex h-[60px] w-[400px] items-center justify-center  text-[54px] font-semibold text-neutral-900 lg:h-[70px] lg:w-[520px] lg:text-[68px] lg:font-bold xl:h-[80px] xl:w-[600px] xl:text-[80px]`}
              >
                <div className="absolute left-3 top-2 text-xs font-semibold lg:text-sm">
                  전체 시간
                </div>
                <div className="flex flex-row items-center justify-center text-center xl:space-x-3">
                  <p className="w-[95px] lg:w-[120px]">{minute}</p>
                  <p className="w-[20px] -translate-y-[4px] lg:w-[20px]">:</p>
                  <p className="w-[95px] lg:w-[120px]">{second}</p>
                </div>
              </div>

              {/* 현재시간 타이머 (크게 표시) */}
              <div
                className={`relative flex h-[110px] w-[400px] items-center justify-center bg-white text-[70px] font-semibold lg:h-[130px] lg:w-[520px] lg:text-[90px] lg:font-bold xl:h-[160px] xl:w-[600px] xl:text-[110px]`}
              >
                <div className="absolute left-3 top-2 text-xs font-semibold lg:text-sm">
                  현재 시간
                </div>
                <div className="flex flex-row items-center justify-center text-center xl:space-x-3">
                  {(speakingTimer ?? 0) < 0 && (
                    <p className="w-[30px] lg:w-[45px]">-</p>
                  )}
                  <p className="w-[110px] lg:w-[150px] xl:w-[170px]">
                    {speakingMinute}
                  </p>
                  <p className="w-[40px] -translate-y-[6px] xl:w-[40px] xl:-translate-y-[10px]">
                    :
                  </p>
                  <p className="w-[110px] lg:w-[150px] xl:w-[170px]">
                    {speakingSecond}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 타이머가 하나일 때 (크게 표시) */}
              <div
                className={`flex h-[160px] w-[400px] items-center justify-center bg-white text-[75px] font-semibold text-neutral-900 shadow-inner lg:h-[199px] lg:w-[520px] lg:text-[100px] lg:font-bold xl:h-[220px] xl:w-[600px] xl:text-[120px]`}
              >
                {minute} : {second}
              </div>
            </>
          )}
        </div>

        {/* Timer controller 유지 */}
        <div className="my-[15px] lg:my-[25px] xl:my-[30px]">
          <TimerController
            isRunning={isRunning}
            onStart={startTimer}
            onPause={pauseTimer}
            onReset={resetCurrentTimer}
          />
        </div>
      </div>
    </div>
  );
}
