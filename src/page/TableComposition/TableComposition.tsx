import DefaultLayout from '../../layout/defaultLayout/DefaultLayout';
import TableNameAndType from './components/TableNameAndType/TableNameAndType';
import useFunnel from '../../hooks/useFunnel';
import useTableFrom from './hook/useTableFrom';
import TimeBoxStep from './components/TimeBoxStep/TimeBoxStep';
import { UUID } from 'crypto';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { DebateInfo, DebateTableData, TimeBoxInfo } from '../../type/type';
import repository from '../../repositories/IPCDebateTableRepository';

export type TableCompositionStep = 'NameAndType' | 'TimeBox';
type Mode = 'edit' | 'add';

export default function TableComposition() {
  // URL 등으로부터 "editMode"와 "tableId"를 추출
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') as Mode;
  const tableId = (searchParams.get('tableId') || '1-1-1-1-1') as UUID;

  // Print different funnel page by mode (edit a existing table or add a new table)
  const initialMode: TableCompositionStep =
    mode !== 'edit' ? 'NameAndType' : 'TimeBox';
  const { Funnel, currentStep, goToStep } =
    useFunnel<TableCompositionStep>(initialMode);

  // 테이블 데이터 패칭 분기
  const [data, setData] = useState<DebateTableData | null>(null);

  const initData = useMemo(() => {
    if (mode === 'edit' && data) {
      const info = data.info as DebateInfo;

      return {
        info: info,
        table: data.table as TimeBoxInfo[],
      };
    }
    return undefined;
  }, [mode, data]);

  const { formData, updateInfo, updateTable, addTable, editTable } =
    useTableFrom(currentStep, initData);

  const handleButtonClick = () => {
    const patchedInfo = {
      ...formData.info,
      name: formData.info.name ?? '시간표 1',
      prosTeamName: formData.info.prosTeamName ?? '찬성',
      consTeamName: formData.info.consTeamName ?? '반대',
    };
    updateInfo(patchedInfo);

    if (mode === 'edit') {
      editTable(tableId);
    } else {
      addTable();
    }
  };

  useEffect(() => {
    const getData = async (tableId: UUID) => {
      const data = await repository.getTable(tableId);
      setData(data);
    };

    if (mode === 'edit') {
      getData(tableId);
    }
  }, []);

  return (
    <DefaultLayout>
      <Funnel
        step={{
          NameAndType: (
            <TableNameAndType
              info={formData.info}
              isEdit={mode === 'edit'}
              onInfoChange={updateInfo}
              onButtonClick={() => goToStep('TimeBox')}
            />
          ),
          TimeBox: (
            <TimeBoxStep
              initData={formData}
              isEdit={mode === 'edit'}
              onTimeBoxChange={updateTable}
              onFinishButtonClick={handleButtonClick}
              onEditTableInfoButtonClick={() => goToStep('NameAndType')}
            />
          ),
        }}
      />
    </DefaultLayout>
  );
}
