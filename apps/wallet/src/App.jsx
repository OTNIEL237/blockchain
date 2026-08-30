import React, { useContext, useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { WalletContext } from './context/WalletContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LayoutDashboard, Send as SendIcon, ArrowDownToLine, Activity, LogOut, Wallet, ArrowDownUp, Sun, Moon, Sparkles, ShieldCheck } from 'lucide-react';

import CreateWallet from './pages/CreateWallet';
import ImportWallet from './pages/ImportWallet';
import Dashboard from './pages/Dashboard';
import Send from './pages/Send';
import Receive from './pages/Receive';
import History from './pages/History';
import Swap from './pages/Swap';

import './index.css';

const App = () => {
  const { isLocked, walletData, unlockWallet, resetWallet } = useContext(WalletContext);
  const [pin, setPin] = useState('');
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // S'il est verrouillé et qu'on a déjà des données en local Storage
  if (isLocked && localStorage.getItem('sango_wallet_data')) {
    return (
      <div className="auth-container">
        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
        <div className="auth-card">
          <ShieldCheck size={56} strokeWidth={2} color="var(--primary-color)" style={{margin:'0 auto 15px'}} />
          <h2 className="logo-text" style={{marginBottom: '25px', textAlign: 'center', fontSize: '1.8rem'}}>Sango Wallet</h2>
          <p style={{color: 'var(--muted-text)', marginBottom: '20px', textAlign: 'center'}}>Entrez votre code PIN pour déverrouiller</p>
          <input 
            type="password" 
            placeholder="Code PIN" 
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="input-field"
            style={{textAlign: 'center', fontSize: '1.2rem', letterSpacing: '5px'}}
          />
          <button className="btn btn-primary" style={{width: '100%', marginTop: '20px'}} onClick={() => {
            if(!unlockWallet(pin)) alert("PIN Incorrect");
          }}>Déverrouiller</button>
          
          <div style={{marginTop:'30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px'}}>
            <button className="btn" style={{background:'transparent', color:'var(--danger-color)', width:'100%', justifyContent:'center'}} onClick={() => {
              if(window.confirm("Êtes-vous sûr de vouloir tout effacer ? Vous devrez réimporter avec vos 12 mots.")) {
                resetWallet();
              }
            }}>
              <LogOut size={18} />
              Effacer le Wallet (Reset)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar link helper
  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
    return (
      <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`} style={{textDecoration: 'none'}}>
        <Icon size={20} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="app-layout">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      
      {walletData && (
        <>
          {/* Desktop Sidebar */}
          <div className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-icon"><ShieldCheck size={28} strokeWidth={2.5} color="var(--primary-color)" /></div>
              <h2 className="logo-text">Sango Wallet</h2>
            </div>
            
            <div className="nav-menu">
              <NavItem to="/" icon={LayoutDashboard} label="Tableau de bord" />
              <NavItem to="/send" icon={SendIcon} label="Envoyer" />
              <NavItem to="/receive" icon={ArrowDownToLine} label="Recevoir" />
              <NavItem to="/swap" icon={ArrowDownUp} label="Échanger" />
              <NavItem to="/history" icon={Activity} label="Activité" />
            </div>

            <div className="theme-dropdown-container">
              <select 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)} 
                className="theme-dropdown"
                aria-label="Choisir le thème"
              >
                <option value="dark">🌙 Mode Sombre</option>
                <option value="light">☀️ Mode Clair</option>
                <option value="dim">✨ Mode Dim</option>
              </select>
            </div>

            <div className="account-card-mini">
              <div style={{flex: 1, overflow: 'hidden'}}>
                <div style={{fontSize: '0.85rem', color: 'var(--muted-text)'}}>Réseau Actif</div>
                <div style={{fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}>
                  Multi-Chaînes
                </div>
              </div>
              <button onClick={() => window.location.reload()} style={{background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '5px'}}>
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Mobile Bottom Nav */}
          <div className="mobile-nav">
            <Link to="/" style={{color: location.pathname==='/'?'var(--primary-color)':'var(--muted-text)'}}><LayoutDashboard size={24} /></Link>
            <Link to="/send" style={{color: location.pathname==='/send'?'var(--primary-color)':'var(--muted-text)'}}><SendIcon size={24} /></Link>
            <Link to="/receive" style={{color: location.pathname==='/receive'?'var(--primary-color)':'var(--muted-text)'}}><ArrowDownToLine size={24} /></Link>
            <Link to="/swap" style={{color: location.pathname==='/swap'?'var(--primary-color)':'var(--muted-text)'}}><ArrowDownUp size={24} /></Link>
            <Link to="/history" style={{color: location.pathname==='/history'?'var(--primary-color)':'var(--muted-text)'}}><Activity size={24} /></Link>
          </div>
        </>
      )}

      <div className="main-content">
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={walletData ? <Dashboard /> : <Navigate to="/create" />} />
            <Route path="/create" element={!walletData ? <CreateWallet /> : <Navigate to="/" />} />
            <Route path="/import" element={!walletData ? <ImportWallet /> : <Navigate to="/" />} />
            <Route path="/send" element={walletData ? <Send /> : <Navigate to="/" />} />
            <Route path="/receive" element={walletData ? <Receive /> : <Navigate to="/" />} />
            <Route path="/swap" element={walletData ? <Swap /> : <Navigate to="/" />} />
            <Route path="/history" element={walletData ? <History /> : <Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
