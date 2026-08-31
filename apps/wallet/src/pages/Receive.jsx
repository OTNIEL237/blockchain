import React, { useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { WalletContext } from '../context/WalletContext';
import { NETWORKS } from '../config';
import { Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import { TOKEN_LOGOS, TOKEN_NAMES } from '../utils/tokenLogos';
import { TOKEN_CONFIG } from '../utils/tokenConfig';

const Receive = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [token, setToken] = React.useState(searchParams.get('token') || 'SGC');
    const { walletData } = useContext(WalletContext);
    const navigate = useNavigate();
    
    if (!walletData) return null;

    const network = searchParams.get('network') || TOKEN_CONFIG[token]?.defaultNetwork;
    // For tokens mapped to a native wallet key, determine the wallet key
    const actualTokenKey = token === 'USDT' && network === 'Ethereum' ? 'ETH' : token === 'USDT' && network === 'Solana' ? 'SOL' : token;
    const address = walletData.wallets[actualTokenKey]?.address || '';

    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        toast.success('Adresse copiée dans le presse-papier !');
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
                <img src={TOKEN_LOGOS[token]} alt={token} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                <h1 className="page-title" style={{ margin: 0 }}>Recevoir {TOKEN_NAMES[token]}</h1>
            </div>
            
            <div className="card" style={{maxWidth: '500px', textAlign: 'center'}}>
                {/* Token is chosen on the previous screen (ChooseToken). */}
                
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
