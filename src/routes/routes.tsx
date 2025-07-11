import { createHashRouter } from 'react-router-dom';
import TableListPage from '../page/TableListPage/TableListPage';
import TableOverview from '../page/TableOverviewPage/TableOverview';
import TableComposition from '../page/TableComposition/TableComposition';
import ErrorBoundaryWrapper from '../components/ErrorBoundary/ErrorBoundaryWrapper';
import NotFoundPage from '../components/ErrorBoundary/NotFoundPage';
import TimerPage from '../page/TimerPage/TimerPage';

const routesConfig = [
  {
    path: '/',
    element: <TableListPage />,
  },
  {
    path: '/composition',
    element: <TableComposition />,
  },
  {
    path: '/overview/:type/:id',
    element: <TableOverview />,
  },
  {
    path: '/table/customize/:id',
    element: <TimerPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

const router = createHashRouter([
  {
    element: (
      <>
        <ErrorBoundaryWrapper />
      </>
    ),
    children: routesConfig.map((route) => ({
      ...route,
      element: route.element,
    })),
  },
]);

export default router;
