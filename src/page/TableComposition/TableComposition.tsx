import DefaultLayout from '../../layout/defaultLayout/DefaultLayout';
import TableNameAndType from './components/TableNameAndType/TableNameAndType';
import useFunnel from '../../hooks/useFunnel';
import useTableFrom from './hook/useTableFrom';
import TimeBoxStep from './components/TimeBoxStep/TimeBoxStep';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { DebateTableData } from '../../type/type';
import repository from '../../repositories/IPCDebateTableRepository';
import { isUUID } from '../../util/type_guard';
import useAsyncRequest from '../../repositories/useAsyncRequest';
import LoadingIndicator from '../../components/async/LoadingIndicator';
import ErrorIndicator from '../../components/async/ErrorIndicator';

export type TableCompositionStep = 'NameAndType' | 'TimeBox';
type Mode = 'edit' | 'add';

export default function TableComposition() {
  // URL 등으로부터 "editMode"와 "tableId"를 추출
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') as Mode;
  const id = searchParams.get('tableId');

  // Validate whether is is valid UUID
  if (!isUUID(id)) {
    throw new Error(`테이블 ID(${id})가 올바르지 않아요.`);
  }

  // Print different funnel page by mode (edit a existing table or add a new table)
  const initialMode: TableCompositionStep =
    mode !== 'edit' ? 'NameAndType' : 'TimeBox';
  const { Funnel, currentStep, goToStep } =
    useFunnel<TableCompositionStep>(initialMode);

  // 테이블 데이터 패칭 분기
  const {
    data,
    error,
    execute: getTable,
    isLoading,
  } = useAsyncRequest(repository.getTable);
  const [initData, setInitData] = useState<DebateTableData>();

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
      editTable(id);
    } else {
      addTable();
    }
  };

  useEffect(() => {
    if (mode !== 'edit') {
      return;
    }

    const getData = async () => {
      const response = await getTable(id);

      if (response.success) {
        if (response.data) {
          setInitData(response.data);
        }
      }
    };

    getData();
  }, [getTable, id, mode]);

  return (
    <DefaultLayout>
      {isLoading && <LoadingIndicator />}
      {!isLoading && error && (
        <ErrorIndicator onClickRetry={() => getTable(id)} />
      )}
      {!isLoading && !error && data && (
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
      )}
    </DefaultLayout>
  );
}
