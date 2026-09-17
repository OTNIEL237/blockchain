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
    const [usdtNetwork, setUsdtNetwork] = React.useState(searchParams.get('network') || 'ethereum');
    const { walletData } = useContext(WalletContext);
    const navigate = useNavigate();
    
    if (!walletData) return null;

    const actualTokenKey = token === 'USDT' && usdtNetwork === 'solana' ? 'SOL' : token === 'USDT' ? 'ETH' : token;
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
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'8px'}}>
                        {[
                            ['SGC', 'Sango Coin'], ['BTC', 'Bitcoin'], ['ETH', 'Ethereum'],
                            ['USDT', 'Tether'], ['SOL', 'Solana']
                        ].map(([value, label]) => (
                            <label key={value} style={{display:'flex', alignItems:'center', gap:'8px', padding:'10px', borderRadius:'8px', border:'1px solid var(--border-color)', background: token === value ? 'rgba(88,225,146,0.12)' : 'transparent', cursor:'pointer'}}>
                                <input type="radio" name="receive-token" value={value} checked={token === value} onChange={() => { setToken(value); setSearchParams({ token: value }); }} />
                                <span>{label} ({value})</span>
                            </label>
                        ))}
                    </div>
                </div>
                {token === 'USDT' && (
                    <div style={{marginBottom:'1.5rem', textAlign:'left'}}>
                        <label style={{display:'block', marginBottom:'8px', fontWeight:'bold', color:'var(--muted-text)'}}>Réseau USDT :</label>
                        <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                            {[['ethereum', 'Ethereum (ERC-20)'], ['solana', 'Solana (SPL)']].map(([value, label]) => (
                                <label key={value} style={{display:'flex', alignItems:'center', gap:'8px', padding:'10px', borderRadius:'8px', border:'1px solid var(--border-color)', background: usdtNetwork === value ? 'rgba(88,225,146,0.12)' : 'transparent', cursor:'pointer'}}>
                                    <input type="radio" name="receive-usdt-network" value={value} checked={usdtNetwork === value} onChange={() => { setUsdtNetwork(value); setSearchParams({ token, network: value }); }} />
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
                
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
