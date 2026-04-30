import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './app';
import { Annotorious } from '@annotorious/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Annotorious>
      <App />
    </Annotorious>
  </React.StrictMode>
);
