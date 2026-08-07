import React, { useContext, useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { WalletContext } from './context/WalletContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import CreateWallet from './pages/CreateWallet';
import ImportWallet from './pages/ImportWallet';
import Dashboard from './pages/Dashboard';
import Send from './pages/Send';
import Receive from './pages/Receive';
import History from './pages/History';

import './index.css';

const App = () => {
  const { isLocked, walletData, unlockWallet, resetWallet } = useContext(WalletContext);
  const [pin, setPin] = useState('');

  // S'il est verrouillé et qu'on a déjà des données en local Storage
  if (isLocked && localStorage.getItem('sango_wallet_data')) {
    return (
      <div style={{maxWidth:'400px', margin:'100px auto', textAlign:'center', padding:'2rem', border:'1px solid #ccc', borderRadius:'8px'}}>
        <ToastContainer position="top-right" autoClose={3000} />
        <h2>Déverrouillez votre Wallet</h2>
        <input 
          type="password" 
          placeholder="Votre code PIN" 
          value={pin}
          onChange={e => setPin(e.target.value)}
          style={{padding:'8px', width:'80%', marginBottom:'10px'}}
        />
        <br/>
        <button className="btn-primary" onClick={() => {
          if(!unlockWallet(pin)) alert("PIN Incorrect");
        }}>Déverrouiller</button>
        <div style={{marginTop:'20px'}}>
          <button style={{background:'transparent', border:'none', color:'red', cursor:'pointer'}} onClick={() => {
            if(window.confirm("Êtes-vous sûr de vouloir tout effacer ? Vous devrez réimporter avec vos 12 mots.")) {
              resetWallet();
            }
          }}>Effacer les données locales</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <ToastContainer position="top-right" autoClose={3000} />
      {walletData && (
        <nav style={{padding:'1rem', background:'#f4f4f4', marginBottom:'2rem'}}>
          <Link to="/" style={{marginRight:'1rem'}}>Dashboard</Link>
          <Link to="/history" style={{marginRight:'1rem'}}>Historique</Link>
        </nav>
      )}
      <Routes>
        <Route path="/" element={walletData ? <Dashboard /> : <Navigate to="/create" />} />
        <Route path="/create" element={!walletData ? <CreateWallet /> : <Navigate to="/" />} />
        <Route path="/import" element={!walletData ? <ImportWallet /> : <Navigate to="/" />} />
        <Route path="/send" element={walletData ? <Send /> : <Navigate to="/" />} />
        <Route path="/receive" element={walletData ? <Receive /> : <Navigate to="/" />} />
        <Route path="/history" element={walletData ? <History /> : <Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App;
