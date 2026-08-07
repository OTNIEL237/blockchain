import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';
import { fetchSGCHistory } from '../services/sgcService';

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
                // Pour l'instant, on charge l'historique SGC (local/Render)
                // Dans une version complète, on ferait des Promise.all sur Etherscan, Solscan, Blockstream
                const sgcAddr = walletData.wallets.SGC.address;
                const sgcTxs = await fetchSGCHistory(sgcAddr);
                
                const formattedTxs = sgcTxs.map(tx => ({
                    ...tx,
                    network: 'SGC',
                    type: tx.fromAddress === sgcAddr ? 'Envoyé' : 'Reçu'
                }));

                // Simulation pour Etherscan / Autres réseaux API publiques
                // const ethRes = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${walletData.wallets.ETH.address}&sort=desc`);
                
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
        <div className="container" style={{maxWidth: '800px', margin: '0 auto', padding: '2rem'}}>
            <h2>Historique des Transactions (SGC)</h2>
            <p style={{fontSize: '0.9rem', color: '#666'}}>
                * L'historique multi-réseaux (BTC, ETH, SOL) nécessite des clés d'API (ex: Etherscan) pour fonctionner sans limitation.
            </p>
            
            {loading ? (
                <p>Chargement des transactions...</p>
            ) : history.length === 0 ? (
                <p>Aucune transaction trouvée.</p>
            ) : (
                <ul style={{listStyle: 'none', padding: 0}}>
                    {history.map((tx, idx) => (
                        <li key={idx} style={{borderBottom:'1px solid #eee', padding:'1rem 0', display:'flex', justifyContent:'space-between'}}>
                            <div>
                                <strong style={{color: tx.type === 'Envoyé' ? 'red' : 'green'}}>{tx.type}</strong>
                                <div style={{fontSize:'0.85rem', color:'#555'}}>{new Date(tx.timestamp).toLocaleString()}</div>
                                <div style={{fontSize:'0.8rem', color:'#999'}}>Hash: {tx.hash}</div>
                            </div>
                            <div style={{fontWeight: 'bold', fontSize: '1.2rem'}}>
                                {tx.amount} {tx.network}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            
            <div style={{marginTop: '2rem'}}>
                <button onClick={() => navigate('/')} className="btn-secondary" style={{padding:'5px 10px'}}>Retour au Dashboard</button>
            </div>
        </div>
    );
};

export default History;
