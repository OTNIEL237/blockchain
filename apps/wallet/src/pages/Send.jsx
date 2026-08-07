import React, { useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';
import { NETWORKS } from '../config';
import { sendETHTransaction, sendUSDTTransaction } from '../services/ethService';
import { sendSOLTransaction } from '../services/solService';
import { sendSGCTransaction } from '../services/sgcService';
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
                throw new Error("L'envoi BTC n'est pas encore implémenté via l'API.");
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
        <div className="container" style={{maxWidth: '600px', margin: '0 auto', padding: '2rem'}}>
            <h2>Envoyer {NETWORKS[token]}</h2>
            <form onSubmit={handleSend} style={{marginTop: '2rem'}}>
                <div style={{marginBottom: '1rem'}}>
                    <label style={{display:'block', marginBottom:'5px'}}>Adresse de destination :</label>
                    <input 
                        type="text" 
                        value={toAddress} 
                        onChange={e => setToAddress(e.target.value)} 
                        required 
                        style={{width:'100%', padding:'8px'}}
                    />
                </div>
                <div style={{marginBottom: '1rem'}}>
                    <label style={{display:'block', marginBottom:'5px'}}>Montant ({token}) :</label>
                    <input 
                        type="number" 
                        step="any"
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        required 
                        style={{width:'100%', padding:'8px'}}
                    />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{padding:'10px 20px', background:'#007bff', color:'white', border:'none', borderRadius:'4px'}}>
                    {loading ? 'Traitement en cours...' : "Confirmer l'Envoi"}
                </button>
            </form>
            <div style={{marginTop: '2rem'}}>
                <button onClick={() => navigate('/')} style={{padding:'5px 10px'}}>Retour</button>
            </div>
        </div>
    );
};

export default Send;
