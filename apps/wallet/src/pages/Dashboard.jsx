import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';
import { fetchSGCBalance } from '../services/sgcService';
import { fetchBTCBalance } from '../services/btcService';
import { fetchETHBalance, fetchUSDTBalance } from '../services/ethService';
import { fetchSOLBalance } from '../services/solService';
import { NETWORKS } from '../config';

const Dashboard = () => {
    const { walletData, lockWallet } = useContext(WalletContext);
    const [balances, setBalances] = useState({
        SGC: 0, BTC: 0, ETH: 0, USDT: 0, SOL: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!walletData) return;

        const loadBalances = async () => {
            setLoading(true);
            try {
                const sgc = await fetchSGCBalance(walletData.wallets.SGC.address);
                const btc = await fetchBTCBalance(walletData.wallets.BTC.address);
                const eth = await fetchETHBalance(walletData.wallets.ETH.address);
                const usdt = await fetchUSDTBalance(walletData.wallets.ETH.address);
                const sol = await fetchSOLBalance(walletData.wallets.SOL.address);
                
                setBalances({ SGC: sgc, BTC: btc, ETH: eth, USDT: usdt, SOL: sol });
            } catch (error) {
                console.error("Erreur chargement balances", error);
            }
            setLoading(false);
        };

        loadBalances();
    }, [walletData]);

    if (!walletData) return null;

    return (
        <div className="container" style={{maxWidth: '800px', margin: '0 auto', padding: '2rem'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h2>Mon Sango Wallet Multi-Chaînes</h2>
                <button onClick={lockWallet} style={{padding:'8px', background:'red', color:'white', border:'none', borderRadius:'4px'}}>Verrouiller</button>
            </div>
            
            {loading ? <p>Mise à jour des soldes...</p> : null}

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem'}}>
                {Object.keys(NETWORKS).map(ticker => {
                    const address = walletData.wallets[ticker === 'USDT' ? 'ETH' : ticker].address;
                    return (
                        <div key={ticker} style={{border: '1px solid #ccc', padding: '1rem', borderRadius: '8px'}}>
                            <h3>{NETWORKS[ticker]} ({ticker})</h3>
                            <h2 style={{margin: '10px 0'}}>{balances[ticker]} {ticker}</h2>
                            <p style={{fontSize:'0.8rem', color:'#666', wordBreak:'break-all'}}>{address}</p>
                            <div style={{marginTop:'1rem', display:'flex', gap:'10px'}}>
                                <Link to={`/send?token=${ticker}`} className="btn-primary" style={{textDecoration:'none', padding:'5px 10px', background:'#007bff', color:'white', borderRadius:'4px'}}>Envoyer</Link>
                                <Link to={`/receive?token=${ticker}`} className="btn-secondary" style={{textDecoration:'none', padding:'5px 10px', background:'#28a745', color:'white', borderRadius:'4px'}}>Recevoir</Link>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default Dashboard;
