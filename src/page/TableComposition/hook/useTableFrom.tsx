import { useEffect, useState } from 'react';
import { useNavigate, useNavigationType } from 'react-router-dom';
import { TableCompositionStep } from '../TableComposition';
import useBrowserStorage from '../../../hooks/useBrowserStorage';
import { DebateInfo, DebateTableData, TimeBoxInfo } from '../../../type/type';
import { UUID } from 'crypto';
import repository from '../../../repositories/IPCDebateTableRepository';
import useAsyncRequest from '../../../repositories/useAsyncRequest';

const useTableFrom = (
  currentStep: TableCompositionStep,
  initData?: DebateTableData,
) => {
  const navigationType = useNavigationType();
  const navigate = useNavigate();

  const { execute: postTable, isLoading: postLoading } = useAsyncRequest(
    repository.postTable,
  );
  const { execute: patchTable, isLoading: patchLoading } = useAsyncRequest(
    repository.patchTable,
  );
  const [isLoading, setIsLoading] = useState(false);

  // Set default value as CUSTOMIZE to prevent users to make PARLIAMENTARY tables
  const [formData, setFormData, removeValue] =
    useBrowserStorage<DebateTableData>({
      key: 'creationInfo',
      initialState: {
        info: {
          id: '1-1-1-1-1',
          name: '',
          agenda: '',
          prosTeamName: '',
          consTeamName: '',
          warningBell: true,
          finishBell: true,
        },
        table: [],
      },
      storage: 'sessionStorage',
    });

  const isNewCreation =
    currentStep === 'NameAndType' && navigationType === 'PUSH';

  if (isNewCreation) {
    removeValue();
  }

  useEffect(() => {
    if (initData) {
      setFormData(initData);
    }
    // Originaly here was exhaustive-deps
  }, [initData, setFormData]);

  const updateInfo: React.Dispatch<
    React.SetStateAction<DebateTableData['info']>
  > = (action) => {
    setFormData((prev) => {
      const newInfo = typeof action === 'function' ? action(prev.info) : action;
      const debateInfo: DebateInfo = {
        id: newInfo.id,
        name: newInfo.name,
        agenda: newInfo.agenda,
        warningBell: newInfo.warningBell,
        finishBell: newInfo.finishBell,
        prosTeamName: newInfo.prosTeamName,
        consTeamName: newInfo.consTeamName,
      };

      return {
        info: debateInfo,
        table: prev.table as TimeBoxInfo[],
      };
    });
  };

  const updateTable = (
    action: TimeBoxInfo[] | ((prev: TimeBoxInfo[]) => TimeBoxInfo[]),
  ) => {
    setFormData((prev) => {
      const newTable =
        typeof action === 'function' ? action(prev.table) : action;
      return {
        info: prev.info,
        table: newTable,
      } as DebateTableData;
    });
  };

  const onAddTable = async (item: DebateTableData) => {
    const response = await postTable(item);

    if (response.success) {
      await removeValue();
      navigate(`/overview/customize/${response.data.info.id}`);
    } else {
      throw new Error('테이블 추가에 실패했어요.');
    }
  };

  const onModifyTable = async (item: DebateTableData) => {
    const response = await patchTable(item);

    if (response.success) {
      await removeValue();
      navigate(`/overview/customize/${response.data.info.id}`);
    } else {
      throw new Error('테이블 수정에 실패했어요.');
    }
  };

  const addTable = () => {
    onAddTable({
      info: formData.info,
      table: formData.table as TimeBoxInfo[],
    });
  };

  const editTable = (tableId: UUID) => {
    onModifyTable({
      info: { ...formData.info, id: tableId },
      table: formData.table as TimeBoxInfo[],
    });
  };

  useEffect(() => {
    setIsLoading(postLoading || patchLoading);
  }, [postLoading, patchLoading]);

  return {
    formData,
    updateInfo,
    updateTable,
    addTable,
    editTable,
    isLoading,
  };
};

export default useTableFrom;
