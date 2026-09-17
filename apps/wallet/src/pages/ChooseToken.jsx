import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { TOKEN_NAMES, TOKEN_LOGOS } from '../utils/tokenLogos';
import { TOKEN_CONFIG } from '../utils/tokenConfig';

const TOKENS = ['SGC','BTC','ETH','USDT','SOL'];

const ChooseToken = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const requestedToken = searchParams.get('token');
  const initialToken = TOKENS.includes(requestedToken) ? requestedToken : 'SGC';
  const [selected, setSelected] = useState(initialToken);

  // Determine whether this chooser is for sending or receiving based on path
  const action = location.pathname.startsWith('/receive') ? 'receive' : 'send';

  const requestedNetwork = searchParams.get('network');
  const initialNetwork = TOKEN_CONFIG[initialToken].networks.find(network => network.toLowerCase() === requestedNetwork?.toLowerCase()) || TOKEN_CONFIG[initialToken].defaultNetwork;
  const [selectedNetwork, setSelectedNetwork] = useState(initialNetwork);

  // update selected network when token changes
  React.useEffect(() => {
    setSelectedNetwork(TOKEN_CONFIG[selected].defaultNetwork);
  }, [selected]);

  const handleConfirm = () => {
    const network = selected === 'USDT' && selectedNetwork === 'Solana' ? 'solana' : selected === 'USDT' ? 'ethereum' : selectedNetwork;
    navigate(`/${action}/confirm?token=${selected}&network=${encodeURIComponent(network)}`);
  };

  return (
    <div style={{maxWidth: 720}}>
      <h1 className="page-title">{action === 'send' ? 'Choisir la monnaie à envoyer' : "Choisir la monnaie à recevoir"}</h1>
      <div className="card" style={{padding: '1rem', marginTop: '1rem'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {TOKENS.map(t => (
            <label key={t} style={{display:'flex', alignItems:'center', gap:12, padding:'10px', borderRadius:8, background: selected===t ? 'rgba(88,225,146,0.06)' : 'transparent', cursor:'pointer'}}>
              <input type="radio" name="token" value={t} checked={selected===t} onChange={() => setSelected(t)} />
              <img src={TOKEN_LOGOS[t]} alt={t} style={{width:36, height:36, borderRadius:'50%'}} />
              <div style={{fontWeight:600}}>{TOKEN_NAMES[t]} ({t})</div>
            </label>
          ))}
        </div>

        <div style={{marginTop: '18px', display: 'flex', gap: '12px'}}>
          <div style={{flex:1}}>
            <div style={{marginBottom:8, color:'var(--muted-text)'}}>Réseau :</div>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {TOKEN_CONFIG[selected].networks.map(net => (
                <label key={net} style={{display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:8, background: selectedNetwork===net ? 'rgba(88,225,146,0.08)' : 'transparent', cursor:'pointer'}}>
                  <input type="radio" name="network" value={net} checked={selectedNetwork===net} onChange={() => setSelectedNetwork(net)} />
                  <span style={{fontWeight:600}}>{net}</span>
                </label>
              ))}
            </div>
            <button className="btn btn-primary" onClick={handleConfirm} style={{width:'100%', marginTop:12}}>Confirmer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChooseToken;
