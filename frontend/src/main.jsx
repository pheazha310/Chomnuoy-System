import React from 'react';
import ReactDOM from 'react-dom/client';
import Organization from './components/pages/organization.jsx';
import './components/css/organization.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Organization />
    import {BrowserRouter} from 'react-router-dom';
    import App from './App.jsx';
    import './index.css';

    ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
    );
