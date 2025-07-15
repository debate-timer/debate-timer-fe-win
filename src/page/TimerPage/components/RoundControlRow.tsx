import { useNavigate } from 'react-router-dom';
import RoundControlButton from '../../../components/RoundControlButton/RoundControlButton';
import { DebateTableData } from '../../../type/type';

interface RoundControlRowProps {
  data: DebateTableData;
  index: number;
  goToOtherItem: (isPrev: boolean) => void;
}

export default function RoundControlRow(props: RoundControlRowProps) {
  const { data, index, goToOtherItem } = props;
  const navigate = useNavigate();

  return (
    <div className="flex flex-row space-x-1 xl:space-x-8">
      <div className="flex h-[70px] w-[175px] items-center justify-center lg:w-[200px]">
        {index !== 0 && (
          <RoundControlButton type="PREV" onClick={() => goToOtherItem(true)} />
        )}
      </div>
      <div className="flex h-[70px] w-[175px] items-center justify-center lg:w-[200px]">
        {index === data.table.length - 1 ? (
          <RoundControlButton
            type="DONE"
            onClick={() => navigate(`/overview/customize/${data.info.id}`)}
          />
        ) : (
          <RoundControlButton
            type="NEXT"
            onClick={() => goToOtherItem(false)}
          />
        )}
      </div>
    </div>
  );
}
