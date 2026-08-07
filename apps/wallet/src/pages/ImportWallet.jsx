import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { validateMnemonic, deriveWalletsFromMnemonic } from '../wallet/hdEngine';
import { saveWalletData } from '../wallet/storage';
import { WalletContext } from '../context/WalletContext';

const ImportWallet = () => {
    const [mnemonic, setMnemonic] = useState('');
    const [pin, setPin] = useState('');
    const navigate = useNavigate();
    const { unlockWallet } = useContext(WalletContext);

    const handleImport = async () => {
        if (!validateMnemonic(mnemonic)) {
            return alert("Phrase secrète invalide !");
        }
        if (pin.length < 4) return alert("PIN trop court (min 4 caractères)");
        
        try {
            const data = await deriveWalletsFromMnemonic(mnemonic);
            saveWalletData(data, pin);
            unlockWallet(pin);
            navigate('/');
        } catch (error) {
            console.error("Erreur d'importation", error);
        }
    };

    return (
        <div className="container" style={{maxWidth: '600px', margin: '0 auto', padding: '2rem'}}>
            <h2>Importer un Wallet existant</h2>
            <div>
                <label>Entrez vos 12 mots (séparés par un espace) :</label>
                <textarea 
                    value={mnemonic} 
                    onChange={e => setMnemonic(e.target.value)} 
                    rows="3"
                    style={{width:'100%', padding:'8px', marginTop: '10px'}}
                    placeholder="apple dog river moon..."
                />
            </div>
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
            <button onClick={handleImport} className="btn-primary" style={{marginTop:'1rem'}}>Restaurer mon Wallet</button>
            <div style={{marginTop: '1rem'}}>
                <Link to="/create">Je veux créer un nouveau wallet</Link>
            </div>
        </div>
    );
};

export default ImportWallet;
