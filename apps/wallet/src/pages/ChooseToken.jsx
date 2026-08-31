import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOKEN_NAMES, TOKEN_LOGOS } from '../utils/tokenLogos';

const TOKENS = ['SGC','BTC','ETH','USDT','SOL'];

const ChooseToken = () => {
  const [selected, setSelected] = useState('SGC');
  const navigate = useNavigate();

  const handleConfirm = () => {
    navigate(`/send/confirm?token=${selected}`);
  };

  return (
    <div style={{maxWidth: 720}}>
      <h1 className="page-title">Choisir la monnaie à envoyer</h1>
      <div className="card" style={{padding: '1rem', marginTop: '1rem'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {TOKENS.map(t => (
            <label key={t} style={{display:'flex', alignItems:'center', gap:12, padding:'10px', borderRadius:8, background: selected===t ? 'rgba(88,225,146,0.08)' : 'transparent', cursor:'pointer'}}>
              <input type="radio" name="token" value={t} checked={selected===t} onChange={() => setSelected(t)} />
              <img src={TOKEN_LOGOS[t]} alt={t} style={{width:36, height:36, borderRadius:'50%'}} />
              <div style={{fontWeight:600}}>{TOKEN_NAMES[t]} ({t})</div>
            </label>
          ))}
        </div>

        <div style={{marginTop: '18px', display: 'flex', gap: '12px'}}>
          <button className="btn btn-primary" onClick={handleConfirm} style={{flex:1}}>Confirmer</button>
        </div>
      </div>
    </div>
  );
};

export default ChooseToken;
