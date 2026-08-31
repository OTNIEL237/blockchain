import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';
import { fetchSGCHistory } from '../services/sgcService';
import { Activity, ExternalLink } from 'lucide-react';
import { TOKEN_LOGOS } from '../utils/tokenLogos';

const History = () => {
    const { walletData } = useContext(WalletContext);
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!walletData) return;

        const loadHistory = async () => {
            setLoading(true);
            try {
                const sgcAddr = walletData.wallets.SGC.address;
                const sgcTxs = await fetchSGCHistory(sgcAddr);
                
                const formattedTxs = sgcTxs.map(tx => ({
                    ...tx,
                    network: 'SGC',
                    type: tx.fromAddress === sgcAddr ? 'Envoyé' : 'Reçu'
                }));
                
                setHistory(formattedTxs);
            } catch (error) {
                console.error("Erreur historique:", error);
            }
            setLoading(false);
        };

        loadHistory();
    }, [walletData]);

    if (!walletData) return null;

    return (
        <div>
            <h1 className="page-title">Historique des Transactions</h1>
            <p style={{fontSize: '0.9rem', color: 'var(--muted-text)', marginBottom: '2rem'}}>
                * L'historique multi-réseaux (BTC, ETH, SOL) nécessite des clés d'API (ex: Etherscan) pour fonctionner sans limitation. Actuellement, seul le réseau SGC est affiché.
            </p>
            
            <div className="card">
                {loading ? (
                    <p style={{color: 'var(--muted-text)'}}>Chargement des transactions...</p>
                ) : history.length === 0 ? (
                    <p style={{color: 'var(--muted-text)'}}>Aucune transaction trouvée.</p>
                ) : (
                    <div className="activity-list">
                        {history.map((tx, idx) => (
                            <div key={idx} className="activity-item">
                                <div className="activity-icon">
                                    <img src={TOKEN_LOGOS[tx.network]} alt={tx.network} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                </div>
                                <div>
                                    <div style={{fontWeight: '600'}}>{tx.type} {tx.network}</div>
                                    <div style={{fontSize: '0.85rem', color: 'var(--muted-text)'}}>{new Date(tx.timestamp).toLocaleString()}</div>
                                    <div style={{fontSize: '0.75rem', color: 'var(--muted-text)', marginTop: '4px'}}>
                                        Hash: {tx.hash}
                                    </div>
                                </div>
                                <div style={{marginLeft: 'auto', textAlign: 'right'}}>
                                    <div style={{fontWeight: 'bold', color: tx.type === 'Envoyé' ? 'var(--danger-color)' : 'var(--primary-color)', fontSize: '1.2rem'}}>
                                        {tx.type === 'Envoyé' ? '-' : '+'}{tx.amount}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div style={{marginTop: '2rem'}}>
                <button onClick={() => navigate('/')} className="btn btn-secondary">Retour au Dashboard</button>
            </div>
        </div>
    );
};

export default History;
