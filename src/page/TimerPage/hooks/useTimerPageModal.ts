// hooks/useTimerPageModal.ts
import { useEffect } from 'react';
import { useModal } from '../../../hooks/useModal';

export function useTimerPageModal() {
  const IS_VISITED = 'isVisited';
  const TRUE = 'true';
  const FALSE = 'false';

  // 툴팁(처음 사용 안내) 모달
  const {
    openModal: openUseTooltipModal,
    closeModal: closeUseTooltipModal,
    ModalWrapper: UseToolTipWrapper,
    isOpen: isUseTooltipOpen,
  } = useModal({
    onClose: () => {
      localStorage.setItem(IS_VISITED, TRUE);
    },
    isCloseButtonExist: false,
  });

  useEffect(() => {
    const isVisited = localStorage.getItem(IS_VISITED);

    if (isVisited === null || isVisited === FALSE) {
      openUseTooltipModal();
    }
  }, [openUseTooltipModal]);

  return {
    isUseTooltipOpen,
    UseToolTipWrapper,
    openUseTooltipModal,
    closeUseTooltipModal,
  };
}
