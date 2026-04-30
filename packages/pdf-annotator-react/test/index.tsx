import { Annotorious } from '@annotorious/react';
import React, { createRoot } from 'react-dom/client';
import { App } from './App';

const root = createRoot(document.getElementById('app') as Element);
root.render(
  <Annotorious>
    <App />
  </Annotorious>
)