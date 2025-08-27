
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';

ReactDOM.render(
  <Theme>
    <App />
  </Theme>,
  document.getElementById('root')
);
