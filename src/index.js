import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import { store }              from './redux/store';
import { injectStoreHelpers } from './services/api';
import { logout }             from './redux/slices/authSlice';
import App                    from './App';

/**
 * Wire the store into the api interceptors HERE — after the store is
 * created — so api.js never has to import store.js at module parse time.
 * This completely eliminates the circular dependency.
 */
injectStoreHelpers(
  () => store.getState().auth.token,
  () => store.dispatch(logout()),
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar
          theme="light"
        />
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
);
