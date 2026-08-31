import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';
import { NETWORKS } from '../config';
import { sendETHTransaction, sendUSDTTransaction, fetchETHBalance, fetchUSDTBalance } from '../services/ethService';
import { sendSOLTransaction, fetchSOLBalance } from '../services/solService';
import { sendSGCTransaction, fetchSGCBalance } from '../services/sgcService';
import { sendBTCTransaction, fetchBTCBalance } from '../services/btcService';
import { toast } from 'react-toastify';
import { TOKEN_LOGOS, TOKEN_NAMES } from '../utils/tokenLogos';
import { TOKEN_CONFIG, SUPPORTED_SEND_COMBOS } from '../utils/tokenConfig';

const Send = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [token, setToken] = useState(searchParams.get('token') || 'SGC');
    const [network, setNetwork] = useState(searchParams.get('network') || (TOKEN_CONFIG[searchParams.get('token') || 'SGC']?.defaultNetwork));
    const { walletData } = useContext(WalletContext);
    const navigate = useNavigate();
    
    const [toAddress, setToAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState(null);
    const [ethBalanceForGas, setEthBalanceForGas] = useState(null);
    const [balanceLoading, setBalanceLoading] = useState(true);

    // Charger le solde actuel au chargement de la page
    useEffect(() => {
        const loadBalance = async () => {
            if (!walletData) return;
            setBalanceLoading(true);
            try {
                let bal = 0;
                // Determine balance based on token + network
                if (token === 'SGC') {
                    bal = await fetchSGCBalance(walletData.wallets.SGC.address);
                } else if (token === 'BTC') {
                    bal = await fetchBTCBalance(walletData.wallets.BTC.address);
                } else if (token === 'ETH' && network === 'Ethereum') {
                    bal = await fetchETHBalance(walletData.wallets.ETH.address);
                } else if (token === 'USDT') {
                    if (network === 'Ethereum') {
                        bal = await fetchUSDTBalance(walletData.wallets.ETH.address);
                        const ethBal = await fetchETHBalance(walletData.wallets.ETH.address);
                        setEthBalanceForGas(parseFloat(ethBal));
                    } else if (network === 'Solana') {
                        // SPL-USDT not implemented; show SOL balance as proxy for gas availability
                        try {
                            bal = await fetchSOLBalance(walletData.wallets.SOL.address);
                        } catch (e) {
                            bal = 0;
                        }
                    }
                } else if (token === 'SOL' && network === 'Solana') {
                    bal = await fetchSOLBalance(walletData.wallets.SOL.address);
                }
                setBalance(parseFloat(bal));
            } catch (error) {
                console.error("Erreur chargement solde:", error);
                setBalance(0);
            }
            setBalanceLoading(false);
        };
        loadBalance();
    }, [walletData, token, network]);

    // keep network in sync if query param changes
    useEffect(() => {
        const qNet = searchParams.get('network');
        if (qNet) setNetwork(qNet);
    }, [searchParams]);

    const handleSend = async (e) => {
        e.preventDefault();
        
        const sendAmount = parseFloat(amount);

        // ─── Vérifications AVANT envoi ───
        if (!sendAmount || sendAmount <= 0) {
            toast.error("❌ Montant invalide.");
            return;
        }

        if (balance !== null && balance === 0) {
            toast.error(`❌ Solde insuffisant.`);
            return;
        }

        if (balance !== null && sendAmount > balance) {
            toast.error(`❌ Solde insuffisant.`);
            return;
        }

        // Check supported token/network combo
        const supported = SUPPORTED_SEND_COMBOS.find(c => c.token === token && c.network === network);
        if (!supported) {
            toast.error(`❌ Envoi de ${token} sur ${network} non supporté.`);
            return;
        }

        // For USDT on Ethereum: check ETH for gas
        if (token === 'USDT' && network === 'Ethereum' && ethBalanceForGas !== null && ethBalanceForGas <= 0) {
            toast.error(`❌ Solde insuffisant (ETH requis pour les frais).`);
            return;
        }

        // Pour ETH : vérifier qu'il y a assez d'ETH pour le montant + gas
        if (token === 'ETH' && balance !== null && sendAmount >= balance) {
            toast.error(`❌ Solde insuffisant.`);
            return;
        }

        setLoading(true);
        toast.info(`Transaction ${token} initiée...`);

        try {
            let result;
            // pick private key and call appropriate send function based on token+network
            if (token === 'USDT' && network === 'Ethereum') {
                const privateKey = walletData.wallets.ETH.privateKey;
                result = await sendUSDTTransaction(privateKey, toAddress, amount);
            } else if (token === 'ETH' && network === 'Ethereum') {
                const privateKey = walletData.wallets.ETH.privateKey;
                result = await sendETHTransaction(privateKey, toAddress, amount);
            } else if (token === 'SOL' && network === 'Solana') {
                const privateKey = walletData.wallets.SOL.privateKey;
                result = await sendSOLTransaction(privateKey, toAddress, amount);
            } else if (token === 'SGC' && network === 'SGC') {
                const fromAddress = walletData.wallets.SGC.address;
                result = await sendSGCTransaction({
                    fromAddress,
                    toAddress,
                    amount: parseFloat(amount),
                    fee: 1
                });
            } else if (token === 'BTC' && network === 'Bitcoin') {
                const privateKey = walletData.wallets.BTC.privateKey;
                const fromAddress = walletData.wallets.BTC.address;
                result = await sendBTCTransaction(privateKey, fromAddress, toAddress, amount);
            } else {
                throw new Error('Envoi non implémenté pour ce réseau/token');
            }

            toast.success(`✅ Transaction confirmée. Hash: ${result?.hash || result?.signature || 'N/A'}`);
            setTimeout(() => navigate('/'), 3000);
        } catch (error) {
            console.error(error);
            toast.error(`❌ Solde insuffisant.`);
        }
        setLoading(false);
    };

    if (!walletData) return null;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
                <img src={TOKEN_LOGOS[token]} alt={token} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                <h1 className="page-title" style={{ margin: 0 }}>Envoyer {TOKEN_NAMES[token]}</h1>
            </div>
            
            <div className="card" style={{maxWidth: '600px'}}>
                {/* Affichage du solde disponible */}
                <div style={{
                    marginBottom: '1.5rem', 
                    padding: '12px 16px', 
                    borderRadius: '10px', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <span style={{color: 'var(--muted-text)', fontSize: '0.85rem'}}>Solde disponible : </span>
                    <span style={{fontWeight: 'bold', color: balance > 0 ? 'var(--primary-color)' : 'var(--danger-color)'}}>
                        {balanceLoading ? '...' : `${balance} ${token}`}
                    </span>
                    {token === 'USDT' && !balanceLoading && (
                        <div style={{fontSize: '0.8rem', color: 'var(--muted-text)', marginTop: '4px'}}>
                            ETH pour gas : {ethBalanceForGas !== null ? ethBalanceForGas : '...'} ETH
                            {ethBalanceForGas !== null && ethBalanceForGas <= 0 && (
                                <span style={{color: 'var(--danger-color)', marginLeft: '8px'}}>⚠️ Pas d'ETH pour les frais !</span>
                            )}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSend}>
                    {/* Token is chosen on the previous screen (ChooseToken). */}
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
                    <button type="submit" disabled={loading || balanceLoading} className="btn btn-primary" style={{width: '100%', padding: '12px'}}>
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
