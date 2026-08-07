import React, { useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';
import { NETWORKS } from '../config';
import { sendETHTransaction, sendUSDTTransaction } from '../services/ethService';
import { sendSOLTransaction } from '../services/solService';
import { sendSGCTransaction } from '../services/sgcService';
import { sendBTCTransaction } from '../services/btcService';
import { toast } from 'react-toastify';

const Send = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || 'SGC';
    const { walletData } = useContext(WalletContext);
    const navigate = useNavigate();
    
    const [toAddress, setToAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        setLoading(true);
        toast.info(`Transaction ${token} initiée...`);

        try {
            let result;
            const privateKey = walletData.wallets[token === 'USDT' ? 'ETH' : token].privateKey;

            if (token === 'ETH') {
                result = await sendETHTransaction(privateKey, toAddress, amount);
            } else if (token === 'USDT') {
                result = await sendUSDTTransaction(privateKey, toAddress, amount);
            } else if (token === 'SOL') {
                result = await sendSOLTransaction(privateKey, toAddress, amount);
            } else if (token === 'SGC') {
                // SGC require the public key in transaction currently in the node implementation
                const fromAddress = walletData.wallets.SGC.address;
                result = await sendSGCTransaction({
                    fromAddress,
                    toAddress,
                    amount: parseFloat(amount),
                    fee: 1 // Default fee
                });
            } else if (token === 'BTC') {
                const fromAddress = walletData.wallets.BTC.address;
                result = await sendBTCTransaction(privateKey, fromAddress, toAddress, amount);
            }

            toast.success(`Succès ! Transaction confirmée. Hash: ${result?.hash || result?.signature || 'N/A'}`);
            setTimeout(() => navigate('/'), 3000);
        } catch (error) {
            console.error(error);
            toast.error(`Erreur d'envoi: ${error.message}`);
        }
        setLoading(false);
    };

    if (!walletData) return null;

    return (
        <div>
            <h1 className="page-title">Envoyer {NETWORKS[token]}</h1>
            
            <div className="card" style={{maxWidth: '600px'}}>
                <form onSubmit={handleSend}>
                    <div style={{marginBottom: '1.5rem'}}>
                        <label style={{display:'block', marginBottom:'8px', fontWeight: 'bold', color: 'var(--muted-text)'}}>Adresse de destination :</label>
                        <input 
                            type="text" 
                            value={toAddress} 
                            onChange={e => setToAddress(e.target.value)} 
                            required 
                            className="input-field"
                            placeholder={`Collez l'adresse ${token} ici`}
                        />
                    </div>
                    <div style={{marginBottom: '2rem'}}>
                        <label style={{display:'block', marginBottom:'8px', fontWeight: 'bold', color: 'var(--muted-text)'}}>Montant ({token}) :</label>
                        <input 
                            type="number" 
                            step="any"
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            required 
                            className="input-field"
                            placeholder="0.00"
                        />
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary" style={{width: '100%', padding: '12px'}}>
                        {loading ? 'Traitement en cours...' : "Confirmer l'Envoi"}
                    </button>
                </form>
            </div>
            
            <div style={{marginTop: '2rem'}}>
                <button onClick={() => navigate(-1)} className="btn btn-secondary">Retour</button>
            </div>
        </div>
    );
};

export default Send;
