interface PropsAndConsTitleProps {
  prosTeamName?: string;
  consTeamName?: string;
}

export default function PropsAndConsTitle({
  prosTeamName = '찬성',
  consTeamName = '반대',
}: PropsAndConsTitleProps) {
  return (
    <div className="mx-auto flex w-full items-center justify-between gap-2 py-4">
      <div className="flex w-1/2 flex-col items-center">
        <span className="text-camp-blue text-2xl font-bold">
          {prosTeamName}
        </span>
        <div className="bg-camp-blue mt-1 h-1 w-full" />
      </div>
      <div className="flex w-1/2 flex-col items-center">
        <span className="text-camp-red text-2xl font-bold">{consTeamName}</span>
        <div className="bg-camp-red mt-1 h-1 w-full" />
      </div>
    </div>
  );
}
