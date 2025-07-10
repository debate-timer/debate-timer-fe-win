import { createBrowserRouter } from 'react-router-dom';
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
    requiresAuth: true,
  },
  {
    path: '/composition',
    element: <TableComposition />,
    requiresAuth: false,
  },
  {
    path: '/overview/:type/:id',
    element: <TableOverview />,
    requiresAuth: false,
  },
  {
    path: '/table/customize/:id',
    element: <TimerPage />,
    requiresAuth: false,
  },
  {
    path: '*',
    element: <NotFoundPage />,
    requiresAuth: false,
  },
];

const router = createBrowserRouter([
  {
    element: <ErrorBoundaryWrapper />,
    children: routesConfig.map((route) => ({
      ...route,
      element: route.element,
    })),
  },
]);

export default router;
