import React, { useState, useEffect, useContext } from 'react';
import { WalletContext } from '../context/WalletContext';
import { ArrowDownUp } from 'lucide-react';
import { fetchExchangeRates, calculateSwapAmount, executeSwap } from '../services/swapService';

const Swap = () => {
    const { walletData } = useContext(WalletContext);
    const [rates, setRates] = useState({});
    const [fromToken, setFromToken] = useState('ETH');
    const [toToken, setToToken] = useState('BTC');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [ratesLoading, setRatesLoading] = useState(true);

    const tokens = ['SGC', 'BTC', 'ETH', 'USDT', 'SOL'];

    useEffect(() => {
        const loadRates = async () => {
            const fetchedRates = await fetchExchangeRates();
            setRates(fetchedRates);
            setRatesLoading(false);
        };
        loadRates();
    }, []);

    const handleSwapDirection = () => {
        setFromToken(toToken);
        setToToken(fromToken);
        setAmount('');
    };

    const estimatedReceive = calculateSwapAmount(amount, rates[fromToken], rates[toToken]);

    const handleSwap = async () => {
        if (!amount || estimatedReceive <= 0) return;
        setLoading(true);
        try {
            const result = await executeSwap(fromToken, toToken, parseFloat(amount), estimatedReceive);
            alert(result.message + "\nHash: " + result.hash);
            setAmount('');
        } catch (error) {
            alert("Erreur lors du swap : " + error.message);
        }
        setLoading(false);
    };

    return (
        <div>
            <h1 className="page-title">Échanger (Swap)</h1>
            
            <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                {ratesLoading ? (
                    <p style={{textAlign: 'center', color: 'var(--muted-text)'}}>Chargement des taux de change en direct...</p>
                ) : (
                    <>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--muted-text)' }}>De (Envoyer) :</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select 
                                    className="input-field" 
                                    value={fromToken} 
                                    onChange={(e) => setFromToken(e.target.value)}
                                    style={{ width: '120px' }}
                                >
                                    {tokens.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <input 
                                    type="number" 
                                    className="input-field" 
                                    placeholder="Montant" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                            </div>
                            <div style={{fontSize: '0.8rem', color: 'var(--muted-text)', marginTop: '5px'}}>
                                1 {fromToken} = ${rates[fromToken]?.toLocaleString()}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
                            <button 
                                className="btn btn-secondary" 
                                onClick={handleSwapDirection}
                                style={{ borderRadius: '50%', padding: '10px' }}
                            >
                                <ArrowDownUp size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--muted-text)' }}>À (Recevoir estimé) :</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select 
                                    className="input-field" 
                                    value={toToken} 
                                    onChange={(e) => setToToken(e.target.value)}
                                    style={{ width: '120px' }}
                                >
                                    {tokens.map(t => <option key={t} value={t} disabled={t === fromToken}>{t}</option>)}
                                </select>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    value={estimatedReceive > 0 ? estimatedReceive.toFixed(6) : ''}
                                    readOnly
                                    placeholder="0.00"
                                    style={{ flex: 1, backgroundColor: 'var(--bg-color)' }}
                                />
                            </div>
                            <div style={{fontSize: '0.8rem', color: 'var(--muted-text)', marginTop: '5px'}}>
                                1 {toToken} = ${rates[toToken]?.toLocaleString()}
                            </div>
                        </div>

                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', padding: '12px', fontSize: '1.1rem' }}
                            onClick={handleSwap}
                            disabled={loading || !amount || estimatedReceive <= 0}
                        >
                            {loading ? 'Échange en cours...' : 'Confirmer l\'échange'}
                        </button>
                        
                        <div style={{fontSize: '0.75rem', color: 'var(--muted-text)', marginTop: '15px', textAlign: 'center'}}>
                            Note : Il s'agit d'une simulation avec des taux de change réels. 
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Swap;
