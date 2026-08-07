import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';
import { fetchSGCBalance, fetchSGCHistory } from '../services/sgcService';
import { fetchBTCBalance } from '../services/btcService';
import { fetchETHBalance, fetchUSDTBalance } from '../services/ethService';
import { fetchSOLBalance } from '../services/solService';
import { NETWORKS } from '../config';
import { ArrowUpRight, ArrowDownLeft, Activity } from 'lucide-react';

const Dashboard = () => {
    const { walletData } = useContext(WalletContext);
    const [balances, setBalances] = useState({
        SGC: '0.00', BTC: '0.00', ETH: '0.00', USDT: '0.00', SOL: '0.00'
    });
    const [loading, setLoading] = useState(true);
    const [recentTx, setRecentTx] = useState([]);

    useEffect(() => {
        if (!walletData) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const sgcAddr = walletData.wallets.SGC.address;
                const [sgc, btc, eth, usdt, sol, sgcTxs] = await Promise.all([
                    fetchSGCBalance(sgcAddr),
                    fetchBTCBalance(walletData.wallets.BTC.address),
                    fetchETHBalance(walletData.wallets.ETH.address),
                    fetchUSDTBalance(walletData.wallets.ETH.address),
                    fetchSOLBalance(walletData.wallets.SOL.address),
                    fetchSGCHistory(sgcAddr)
                ]);
                
                setBalances({ SGC: sgc, BTC: btc, ETH: eth, USDT: usdt, SOL: sol });
                
                // Prendre les 3 dernières transactions
                const formattedTxs = sgcTxs.slice(0, 3).map(tx => ({
                    ...tx,
                    type: tx.fromAddress === sgcAddr ? 'Envoyé' : 'Reçu'
                }));
                setRecentTx(formattedTxs);
            } catch (error) {
                console.error("Erreur chargement dashboard", error);
            }
            setLoading(false);
        };

        loadData();
    }, [walletData]);

    if (!walletData) return null;

    return (
        <div>
            <h1 className="page-title">Tableau de bord</h1>
            
            <div className="dashboard-grid">
                {/* Solde Principal (SGC) */}
                <div className="card">
                    <div className="balance-title">Solde Total</div>
                    <div className="balance-amount">{loading ? '...' : balances.SGC} SGC</div>
                    <div className="balance-change">▲ +0.00% ce mois-ci</div>
                    
                    <div className="action-row">
                        <Link to="/send?token=SGC" className="btn btn-primary" style={{textDecoration: 'none'}}>
                            <ArrowUpRight size={18} style={{marginRight: '5px'}} /> Envoyer
                        </Link>
                        <Link to="/receive?token=SGC" className="btn btn-secondary" style={{textDecoration: 'none'}}>
                            <ArrowDownLeft size={18} style={{marginRight: '5px'}} /> Recevoir
                        </Link>
                        <a href="http://localhost:3001" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{textDecoration: 'none'}}>
                            Miner
                        </a>
                    </div>
                </div>

                {/* Activité Récente */}
                <div className="card">
                    <h3 style={{marginBottom: '1.5rem'}}>Activité Récente (SGC)</h3>
                    {recentTx.length === 0 ? (
                        <p style={{color: 'var(--muted-text)'}}>Aucune transaction récente.</p>
                    ) : (
                        <div className="activity-list">
                            {recentTx.map((tx, idx) => (
                                <div key={idx} className="activity-item">
                                    <div className="activity-icon">
                                        <Activity size={20} color={tx.type === 'Envoyé' ? 'var(--danger-color)' : 'var(--primary-color)'} />
                                    </div>
                                    <div>
                                        <div style={{fontWeight: '600'}}>{tx.type} SGC</div>
                                        <div style={{fontSize: '0.85rem', color: 'var(--muted-text)'}}>{new Date(tx.timestamp).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{marginLeft: 'auto', fontWeight: 'bold', color: tx.type === 'Envoyé' ? 'var(--danger-color)' : 'var(--primary-color)'}}>
                                        {tx.type === 'Envoyé' ? '-' : '+'}{tx.amount}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <h2 style={{marginTop: '3rem', marginBottom: '1.5rem'}}>Autres Réseaux Multi-Chaînes</h2>
            <div className="dashboard-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'}}>
                {['BTC', 'ETH', 'USDT', 'SOL'].map(ticker => {
                    const address = walletData.wallets[ticker === 'USDT' ? 'ETH' : ticker].address;
                    return (
                        <div key={ticker} className="card">
                            <div className="balance-title">{NETWORKS[ticker]} ({ticker})</div>
                            <div className="balance-amount" style={{fontSize: '2rem'}}>{loading ? '...' : balances[ticker]}</div>
                            <div style={{fontSize: '0.8rem', color: 'var(--muted-text)', wordBreak: 'break-all', marginTop: '10px'}}>{address}</div>
                            <div className="action-row" style={{marginTop: '1rem'}}>
                                <Link to={`/send?token=${ticker}`} className="btn btn-secondary" style={{padding: '0.5rem', textDecoration: 'none'}}>Envoyer</Link>
                                <Link to={`/receive?token=${ticker}`} className="btn btn-secondary" style={{padding: '0.5rem', textDecoration: 'none'}}>Recevoir</Link>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default Dashboard;
