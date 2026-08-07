import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { generateMnemonic, deriveWalletsFromMnemonic } from '../wallet/hdEngine';
import { saveWalletData } from '../wallet/storage';
import { WalletContext } from '../context/WalletContext';

const CreateWallet = () => {
    const [step, setStep] = useState(1);
    const [mnemonic, setMnemonic] = useState('');
    const [pin, setPin] = useState('');
    const navigate = useNavigate();
    const { setWalletData, unlockWallet } = useContext(WalletContext);

    const handleGenerate = () => {
        setMnemonic(generateMnemonic());
        setStep(2);
    };

    const handleConfirm = async () => {
        if (pin.length < 4) return alert("PIN trop court (min 4 caractères)");
        try {
            const data = await deriveWalletsFromMnemonic(mnemonic);
            saveWalletData(data, pin);
            unlockWallet(pin);
            navigate('/');
        } catch (error) {
            console.error("Erreur de dérivation", error);
        }
    };

    return (
        <div className="container" style={{maxWidth: '600px', margin: '0 auto', padding: '2rem'}}>
            <h2>Créer un nouveau Sango Wallet</h2>
            {step === 1 && (
                <div>
                    <p>Générez votre phrase secrète de 12 mots. <strong>Ne la partagez jamais !</strong></p>
                    <button onClick={handleGenerate} className="btn-primary">Générer 12 mots</button>
                    <div style={{marginTop: '1rem'}}>
                        <Link to="/import">J'ai déjà un wallet (Importer)</Link>
                    </div>
                </div>
            )}
            {step === 2 && (
                <div>
                    <div className="mnemonic-box" style={{background:'#eee', padding:'1rem', borderRadius:'8px', marginBottom: '1rem'}}>
                        <code>{mnemonic}</code>
                    </div>
                    <p className="warning">⚠️ Écrivez ces mots sur un papier. C'est le seul moyen de récupérer vos fonds !</p>
                    
                    <div style={{marginTop: '1rem'}}>
                        <label>Choisissez un code PIN pour sécuriser ce wallet localement :</label>
                        <input 
                            type="password" 
                            value={pin} 
                            onChange={e => setPin(e.target.value)} 
                            placeholder="Ex: 1234"
                            style={{display:'block', margin:'10px 0', padding:'8px'}}
                        />
                    </div>
                    <button onClick={handleConfirm} className="btn-primary">J'ai sauvegardé, Créer mon Wallet</button>
                </div>
            )}
        </div>
    );
};

export default CreateWallet;
