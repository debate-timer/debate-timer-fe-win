import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { GlobalPortal } from './util/GlobalPortal';
import router from './routes/routes.tsx';
import './index.css';
import './fonts.css';

// Function that initializes main React app
initializeApp();

function initializeApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <GlobalPortal.Provider>
        <RouterProvider router={router} />
      </GlobalPortal.Provider>
    </StrictMode>,
  );
}
