import { MdErrorOutline } from 'react-icons/md';

interface ErrorIndicatorProps {
  message: string;
  onClickRetry: (() => void) | undefined;
}

export default function ErrorIndicator({
  message,
  onClickRetry = undefined,
}: ErrorIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <MdErrorOutline className="size-32 text-red-500" />
      <p className="text-xl">{message}</p>

      {onClickRetry && (
        <button onClick={() => onClickRetry()} className="button-enabled">
          다시 시도하기
        </button>
      )}
    </div>
  );
}
