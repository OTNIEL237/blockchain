import React, { useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { WalletContext } from '../context/WalletContext';
import { NETWORKS } from '../config';

const Receive = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || 'SGC';
    const { walletData } = useContext(WalletContext);
    const navigate = useNavigate();
    
    if (!walletData) return null;

    const actualTokenKey = token === 'USDT' ? 'ETH' : token;
    const address = walletData.wallets[actualTokenKey].address;

    return (
        <div className="container" style={{maxWidth: '600px', margin: '0 auto', padding: '2rem', textAlign: 'center'}}>
            <h2>Recevoir {NETWORKS[token]}</h2>
            <p>Utilisez l'adresse ci-dessous pour recevoir vos {token}.</p>
            
            <div style={{margin: '2rem auto', padding: '1rem', background: 'white', display: 'inline-block', borderRadius: '10px'}}>
                <QRCodeSVG value={address} size={200} />
            </div>
            
            <div style={{background: '#f8f9fa', padding: '1rem', borderRadius: '8px', wordBreak: 'break-all'}}>
                <strong>{address}</strong>
            </div>
            
            <button 
                onClick={() => navigator.clipboard.writeText(address)} 
                style={{marginTop: '1rem', padding:'8px 16px', cursor:'pointer'}}
            >
                Copier l'adresse
            </button>

            <div style={{marginTop: '2rem'}}>
                <button onClick={() => navigate('/')} style={{padding:'5px 10px'}}>Retour au Dashboard</button>
            </div>
        </div>
    );
};

export default Receive;
