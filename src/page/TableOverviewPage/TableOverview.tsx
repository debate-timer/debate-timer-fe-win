import DefaultLayout from '../../layout/defaultLayout/DefaultLayout';
import PropsAndConsTitle from '../../components/ProsAndConsTitle/PropsAndConsTitle';
import { useNavigate, useParams } from 'react-router-dom';
import HeaderTableInfo from '../../components/HeaderTableInfo/HeaderTableInfo';
import HeaderTitle from '../../components/HeaderTitle/HeaderTitle';
import { RiEditFill, RiSpeakFill } from 'react-icons/ri';
import DebatePanel from '../TableComposition/components/DebatePanel/DebatePanel';
import { StanceToString } from '../../type/type';
import { useEffect } from 'react';
import repository from '../../repositories/IPCDebateTableRepository';
import useAsyncRequest from '../../repositories/useAsyncRequest';
import { isUUID } from '../../util/type_guard';
import LoadingIndicator from '../../components/async/LoadingIndicator';
import ErrorIndicator from '../../components/async/ErrorIndicator';

export default function TableOverview() {
  const { id } = useParams();

  // Validate whether is is valid UUID
  if (!isUUID(id)) {
    throw new Error(`테이블 ID(${id})가 올바르지 않아요.`);
  }

  const navigate = useNavigate();

  const {
    data,
    error,
    isLoading,
    execute: getTable,
  } = useAsyncRequest(repository.getTable);

  useEffect(() => {
    getTable(id);
  }, [getTable, id]);

  return (
    <>
      <DefaultLayout>
        <DefaultLayout.Header>
          <DefaultLayout.Header.Left>
            <HeaderTableInfo name={data?.info.name} />
          </DefaultLayout.Header.Left>
          <DefaultLayout.Header.Center>
            <HeaderTitle title={data?.info.agenda} />
          </DefaultLayout.Header.Center>
          <DefaultLayout.Header.Right />
        </DefaultLayout.Header>

        <DefaultLayout.ContentContainer>
          {isLoading && <LoadingIndicator />}
          {!isLoading && error && (
            <ErrorIndicator onClickRetry={() => getTable(id)} />
          )}
          {!isLoading && !error && data && (
            <section className="mx-auto flex w-full max-w-4xl flex-col justify-center">
              <PropsAndConsTitle
                prosTeamName={
                  data !== null
                    ? data.info.prosTeamName
                    : StanceToString['PROS']
                }
                consTeamName={
                  data !== null
                    ? data.info.consTeamName
                    : StanceToString['CONS']
                }
              />

              <div className="flex w-full flex-col gap-2">
                {data?.table.map((info, index) => (
                  <DebatePanel
                    key={index}
                    info={info}
                    prosTeamName={data.info.prosTeamName}
                    consTeamName={data.info.consTeamName}
                  />
                ))}
              </div>
            </section>
          )}
        </DefaultLayout.ContentContainer>

        <DefaultLayout.StickyFooterWrapper>
          <div className="mx-auto mb-8 flex w-full max-w-4xl items-center justify-between gap-2">
            <button
              className="button enabled-hover-neutral h-16 w-full"
              onClick={() => {
                navigate(`/composition?mode=edit&tableId=${id}&type=CUSTOMIZE`);
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <RiEditFill />
                수정하기
              </div>
            </button>
            <button
              className="button enabled-hover-neutral h-16 w-full"
              onClick={() => {
                navigate(`/table/customize/${id}`);
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <RiSpeakFill />
                토론하기
              </div>
            </button>
          </div>
        </DefaultLayout.StickyFooterWrapper>
      </DefaultLayout>
    </>
  );
}
