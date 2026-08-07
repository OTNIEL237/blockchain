import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { WalletProvider } from './context/WalletContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <WalletProvider>
        <App />
      </WalletProvider>
    </HashRouter>
  </React.StrictMode>,
)
