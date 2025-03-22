import { Provider } from 'jotai';
import { createRoot } from 'react-dom/client';

import './index.css';

import App from './App.tsx';
import { store } from './states/store.ts';

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>,
);
