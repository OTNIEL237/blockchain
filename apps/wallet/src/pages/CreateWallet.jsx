import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { generateMnemonic, deriveWalletsFromMnemonic } from '../wallet/hdEngine';
import { saveWalletData } from '../wallet/storage';
import { WalletContext } from '../context/WalletContext';
import { Wallet, Copy, Check } from 'lucide-react';

const CreateWallet = () => {
    const [step, setStep] = useState(1);
    const [mnemonic, setMnemonic] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();
    const { unlockWallet } = useContext(WalletContext);

    const handleGenerate = () => {
        setMnemonic(generateMnemonic());
        setStep(2);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(mnemonic);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const handleConfirm = async () => {
        setError('');
        if (pin.length < 4) {
            setError("Le code PIN doit contenir au moins 4 caractères.");
            return;
        }
        try {
            const data = await deriveWalletsFromMnemonic(mnemonic);
            saveWalletData(data, pin);
            unlockWallet(pin);
            navigate('/');
        } catch (error) {
            console.error("Erreur de dérivation", error);
            setError("Erreur lors de la création du wallet.");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <Wallet size={48} color="#58e192" style={{margin:'0 auto 20px'}} />
                <h2 style={{marginBottom: '10px'}}>Nouveau Wallet</h2>

                {step === 1 && (
                    <div>
                        <p style={{color: 'var(--muted-text)', marginBottom: '30px', fontSize: '0.95rem'}}>
                            Générez votre phrase secrète de 12 mots. Elle est la clé unique pour accéder à vos fonds sur toutes les blockchains (SGC, BTC, ETH, SOL).
                        </p>
                        <button onClick={handleGenerate} className="btn btn-primary" style={{width: '100%'}}>
                            Générer mes 12 mots
                        </button>
                        <div style={{marginTop: '20px'}}>
                            <Link to="/import" style={{color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500'}}>
                                J'ai déjà un wallet (Importer)
                            </Link>
                        </div>
                    </div>
                )}
                {step === 2 && (
                    <div>
                        <p style={{color: 'var(--muted-text)', marginBottom: '15px', fontSize: '0.9rem'}}>
                            ⚠️ Écrivez ces mots sur un papier. Ne les partagez jamais avec personne !
                        </p>
                        
                        <div className="key-reveal-box" style={{position: 'relative', marginBottom: '20px'}}>
                            {mnemonic}
                            <button 
                                onClick={handleCopy}
                                style={{
                                    position: 'absolute', top: '10px', right: '10px', 
                                    background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer'
                                }}
                            >
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                        </div>
                        
                        {error && <div style={{color: 'var(--danger-color)', marginBottom: '15px', padding: '10px', background: 'rgba(255, 75, 75, 0.1)', borderRadius: '8px'}}>{error}</div>}

                        <div className="input-group" style={{textAlign: 'left'}}>
                            <label>Choisissez un code PIN</label>
                            <input 
                                type="password" 
                                value={pin} 
                                onChange={e => setPin(e.target.value)} 
                                placeholder="Ex: 1234"
                                className="input-field"
                            />
                        </div>
                        
                        <button onClick={handleConfirm} className="btn btn-primary" style={{width: '100%', marginTop: '10px'}}>
                            J'ai sauvegardé, Créer mon Wallet
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateWallet;
