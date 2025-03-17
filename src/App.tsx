import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import { IntlProvider, load, LocalizationProvider } from '@progress/kendo-react-intl';

import '@progress/kendo-theme-default/dist/all.css';
import './App.css';

import { testGeminiConnection } from './utils/testGeminiConnection';

console.log("Environment variables check:");
console.log("REACT_APP_GEMINI_API_KEY exists:", !!process.env.REACT_APP_GEMINI_API_KEY);
console.log("REACT_APP_GEMINI_API_KEY length:", process.env.REACT_APP_GEMINI_API_KEY ? process.env.REACT_APP_GEMINI_API_KEY.length : 0);

const App: React.FC = () => {
  useEffect(() => {
    (window as any).testGeminiConnection = testGeminiConnection;
  }, []);

  return (
    <LocalizationProvider language="en">
      <IntlProvider locale="en">
        <Router>
          <div className="app">
            <Routes>
              <Route path="/" element={<Dashboard />} />
            </Routes>
          </div>
        </Router>
      </IntlProvider>
    </LocalizationProvider>
  );
};

export default App;
