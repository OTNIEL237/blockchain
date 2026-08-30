import React, { useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { WalletContext } from '../context/WalletContext';
import { NETWORKS } from '../config';
import { Copy } from 'lucide-react';
import { toast } from 'react-toastify';

const Receive = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [token, setToken] = React.useState(searchParams.get('token') || 'SGC');
    const { walletData } = useContext(WalletContext);
    const navigate = useNavigate();
    
    if (!walletData) return null;

    const actualTokenKey = token === 'USDT' ? 'ETH' : token;
    const address = walletData.wallets[actualTokenKey].address;

    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        toast.success('Adresse copiée dans le presse-papier !');
    };

    return (
        <div>
            <h1 className="page-title">Recevoir {NETWORKS[token]}</h1>
            
            <div className="card" style={{maxWidth: '500px', textAlign: 'center'}}>
                <div style={{marginBottom: '1.5rem', textAlign: 'left'}}>
                    <label style={{display:'block', marginBottom:'8px', fontWeight: 'bold', color: 'var(--muted-text)'}}>Actif à recevoir :</label>
                    <select 
                        value={token} 
                        onChange={(e) => {
                            setToken(e.target.value);
                            setSearchParams({ token: e.target.value });
                        }} 
                        style={{
                            appearance: 'auto', 
                            padding: '8px 12px', 
                            width: 'auto', 
                            minWidth: '200px',
                            borderRadius: '8px', 
                            background: 'var(--bg-color)', 
                            color: 'var(--text-color)', 
                            border: '1px solid var(--border-color)', 
                            fontSize: '0.95rem',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="SGC">Sango Coin (SGC)</option>
                        <option value="BTC">Bitcoin (BTC)</option>
                        <option value="ETH">Ethereum (ETH)</option>
                        <option value="USDT">Tether (USDT)</option>
                        <option value="SOL">Solana (SOL)</option>
                    </select>
                </div>
                
                <p style={{color: 'var(--muted-text)', marginBottom: '2rem'}}>
                    Utilisez l'adresse ci-dessous pour recevoir vos {token}.
                </p>
                
                <div style={{margin: '0 auto 2rem', padding: '1rem', background: 'white', display: 'inline-block', borderRadius: '10px'}}>
                    <QRCodeSVG value={address} size={200} />
                </div>
                
                <div style={{background: 'var(--background)', padding: '1rem', borderRadius: '8px', wordBreak: 'break-all', marginBottom: '1rem', border: '1px solid var(--border-color)'}}>
                    <strong style={{color: 'var(--text-color)'}}>{address}</strong>
                </div>
                
                <button 
                    onClick={handleCopy} 
                    className="btn btn-primary"
                    style={{width: '100%', padding: '12px', justifyContent: 'center'}}
                >
                    <Copy size={18} style={{marginRight: '8px'}} />
                    Copier l'adresse
                </button>
            </div>

            <div style={{marginTop: '2rem'}}>
                <button onClick={() => navigate(-1)} className="btn btn-secondary">Retour</button>
            </div>
        </div>
    );
};

export default Receive;
