import { useNavigate } from 'react-router-dom';
import DefaultLayout from '../../layout/defaultLayout/DefaultLayout';
import { DebateTableData } from '../../type/type';
import Table from './components/Table';
import HeaderTitle from '../../components/HeaderTitle/HeaderTitle';
import repository from '../../repositories/IPCDebateTableRepository';
import { UUID } from 'crypto';
import { useEffect, useState } from 'react';

export default function TableListPage() {
  const repo = repository;
  const [data, setData] = useState<DebateTableData[]>([]);
  const navigate = useNavigate();

  const getAllTables = async () => {
    const response = await repository.getAllTables();
    setData(response);
  };
  // TODO: have to delete the query param 'type'
  const onEdit = (tableId: UUID) => {
    navigate(`/composition?mode=edit&tableId=${tableId}&type=CUSTOMIZE`);
  };
  // TODO: have to delete the string 'customize' from the URL
  const onClick = (tableId: UUID) => {
    navigate(`/overview/customize/${tableId}`);
  };
  const onDelete = async (tableId: UUID) => {
    await repo.deleteTable(tableId);
    getAllTables(); // Ensure refreshing after deleting item
  };

  useEffect(() => {
    getAllTables();
  }, []);

  return (
    <DefaultLayout>
      <DefaultLayout.Header>
        <DefaultLayout.Header.Left />
        <DefaultLayout.Header.Center>
          <HeaderTitle title="토론 시간표를 선택해주세요" />
        </DefaultLayout.Header.Center>
        <DefaultLayout.Header.Right />
      </DefaultLayout.Header>

      <DefaultLayout.ContentContainer>
        <div className="flex max-w-[1140px] flex-wrap justify-start">
          {/** Button that adds new table */}
          <button
            onClick={() => navigate(`/composition?mode=add`)}
            className="m-5 h-[220px] w-[340px] rounded-[28px] bg-neutral-200 shadow-lg duration-200 hover:scale-105"
          >
            <h1 className="text-[100px] font-light text-neutral-500">+</h1>
          </button>

          {/** All tables */}
          {data &&
            data.map((table: DebateTableData, idx: number) => (
              <Table
                key={idx}
                id={table.info.id}
                name={table.info.name}
                agenda={table.info.agenda}
                onDelete={() => onDelete(table.info.id)}
                onEdit={() => onEdit(table.info.id)}
                onClick={() => onClick(table.info.id)}
              />
            ))}
        </div>
      </DefaultLayout.ContentContainer>
    </DefaultLayout>
  );
}
