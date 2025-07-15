import DefaultLayout from '../../layout/defaultLayout/DefaultLayout';
import PropsAndConsTitle from '../../components/ProsAndConsTitle/PropsAndConsTitle';
import { useNavigate, useParams } from 'react-router-dom';
import HeaderTableInfo from '../../components/HeaderTableInfo/HeaderTableInfo';
import HeaderTitle from '../../components/HeaderTitle/HeaderTitle';
import { RiEditFill, RiSpeakFill } from 'react-icons/ri';
import DebatePanel from '../TableComposition/components/DebatePanel/DebatePanel';
import { DebateTableData, StanceToString } from '../../type/type';
import { useEffect, useState } from 'react';
import repository from '../../repositories/IPCDebateTableRepository';
import { UUID } from 'crypto';

export default function TableOverview() {
  const { id } = useParams();
  const tableId = id;
  const navigate = useNavigate();

  // Only uses hooks related with customize due to the removal of parliamentary
  const [data, setData] = useState<DebateTableData | null>(null);

  useEffect(() => {
    const getItem = async (id: UUID) => {
      const item = await repository.getTable(id);
      setData(item);
    };

    if (id) {
      getItem(id as UUID);
    }
  }, []);

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
          <section className="mx-auto flex w-full max-w-4xl flex-col justify-center">
            <PropsAndConsTitle
              prosTeamName={
                data !== null ? data.info.prosTeamName : StanceToString['PROS']
              }
              consTeamName={
                data !== null ? data.info.consTeamName : StanceToString['CONS']
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
        </DefaultLayout.ContentContainer>

        <DefaultLayout.StickyFooterWrapper>
          <div className="mx-auto mb-8 flex w-full max-w-4xl items-center justify-between gap-2">
            <button
              className="button enabled-hover-neutral h-16 w-full"
              onClick={() => {
                navigate(
                  `/composition?mode=edit&tableId=${tableId}&type=CUSTOMIZE`,
                );
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
                navigate(`/table/customize/${tableId}`);
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
