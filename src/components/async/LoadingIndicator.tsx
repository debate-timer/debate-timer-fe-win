import LoadingSpinner from '../LoadingSpinner';

interface LoadingIndicatorProps {
  message: string;
}

export default function LoadingIndicator({ message }: LoadingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <LoadingSpinner size="size-32" color="text-neutral-500" />
      <p className="text-xl">{message}</p>
    </div>
  );
}
