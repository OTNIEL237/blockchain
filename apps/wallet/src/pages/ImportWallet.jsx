import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { validateMnemonic, deriveWalletsFromMnemonic } from '../wallet/hdEngine';
import { saveWalletData } from '../wallet/storage';
import { WalletContext } from '../context/WalletContext';
import { Wallet } from 'lucide-react';

const ImportWallet = () => {
    const [mnemonic, setMnemonic] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { unlockWallet } = useContext(WalletContext);

    const handleImport = async () => {
        setError('');
        const cleanMnemonic = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
        if (!validateMnemonic(cleanMnemonic)) {
            setError("Phrase secrète invalide. Vérifiez l'orthographe et l'ordre des 12 mots.");
            return;
        }
        if (pin.length < 4) {
            setError("Le code PIN doit contenir au moins 4 caractères.");
            return;
        }
        
        try {
            const data = await deriveWalletsFromMnemonic(cleanMnemonic);
            saveWalletData(data, pin);
            unlockWallet(pin);
            navigate('/');
        } catch (error) {
            console.error("Erreur d'importation", error);
            setError("Une erreur est survenue lors de l'importation.");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <Wallet size={48} color="#58e192" style={{margin:'0 auto 20px'}} />
                <h2 style={{marginBottom: '10px'}}>Importer un Wallet</h2>
                <p style={{color: 'var(--muted-text)', marginBottom: '20px', fontSize: '0.9rem'}}>
                    Sango Wallet utilise le standard sécurisé BIP39. Importez toutes vos clés (SGC, BTC, ETH, SOL) avec votre phrase secrète de 12 mots.
                </p>

                {error && <div style={{color: 'var(--danger-color)', marginBottom: '15px', padding: '10px', background: 'rgba(255, 75, 75, 0.1)', borderRadius: '8px'}}>{error}</div>}

                <div className="input-group" style={{textAlign: 'left'}}>
                    <label>Phrase secrète (12 mots)</label>
                    <textarea 
                        value={mnemonic} 
                        onChange={e => setMnemonic(e.target.value)} 
                        rows="3"
                        className="input-field"
                        style={{resize: 'none'}}
                        placeholder="apple dog river moon..."
                    />
                </div>

                <div className="input-group" style={{textAlign: 'left'}}>
                    <label>Nouveau code PIN de sécurité</label>
                    <input 
                        type="password" 
                        value={pin} 
                        onChange={e => setPin(e.target.value)} 
                        placeholder="Ex: 1234"
                        className="input-field"
                    />
                </div>

                <button onClick={handleImport} className="btn btn-primary" style={{width: '100%', marginTop: '10px'}}>
                    Restaurer mon Wallet
                </button>
                
                <div style={{marginTop: '20px'}}>
                    <Link to="/create" style={{color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500'}}>
                        Je veux créer un nouveau wallet
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ImportWallet;
