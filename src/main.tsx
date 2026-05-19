import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import '@fontsource/noto-serif/400.css';
import '@fontsource/noto-serif/500.css';
import '@fontsource/noto-serif/600.css';
import '@fontsource/noto-serif/700.css';
import App from './App';
import { AuthProvider } from './features/auth/AuthProvider';
import { appTheme } from './theme';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);