import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Activity, BarChart3 } from 'lucide-react';
import { WalletContext } from '../context/WalletContext';
import { fetchSGCBalance, fetchSGCHistory } from '../services/sgcService';
import { fetchBTCBalance } from '../services/btcService';
import { fetchETHBalance, fetchUSDTBalance } from '../services/ethService';
import { fetchSOLBalance } from '../services/solService';
import { fetchExchangeRates, fetchTokenMarketStats } from '../services/swapService';

const ASSETS = {
    SGC: { name: 'Sango Coin', color: '#58e192' },
    BTC: { name: 'Bitcoin', color: '#F7931A' },
    ETH: { name: 'Ethereum', color: '#627EEA' },
    USDT: { name: 'Tether', color: '#26A17B' },
    SOL: { name: 'Solana', color: '#14F195' }
};

const formatUsd = (value) => `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const formatAmount = (value) => Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 8 });

const TokenDetails = () => {
    const { ticker: routeTicker } = useParams();
    const ticker = routeTicker?.toUpperCase();
    const asset = ASSETS[ticker];
    const { walletData } = useContext(WalletContext);
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [rate, setRate] = useState(0);
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!walletData || !asset) return;
        const loadDetails = async () => {
            setLoading(true);
            try {
                const balanceAddress = walletData.wallets[ticker === 'USDT' ? 'ETH' : ticker].address;
                const balanceLoaders = {
                    SGC: fetchSGCBalance,
                    BTC: fetchBTCBalance,
                    ETH: fetchETHBalance,
                    USDT: fetchUSDTBalance,
                    SOL: fetchSOLBalance
                };
                const [currentBalance, rates, marketStats] = await Promise.all([
                    balanceLoaders[ticker](balanceAddress),
                    fetchExchangeRates(),
                    fetchTokenMarketStats(ticker)
                ]);
                setBalance(Number(currentBalance) || 0);
                setRate(rates[ticker] || 0);
                setStats(marketStats);

                if (ticker === 'SGC') {
                    const transactions = await fetchSGCHistory(walletData.wallets.SGC.address);
                    setHistory(transactions.map((tx) => ({
                        ...tx,
                        type: tx.fromAddress === walletData.wallets.SGC.address ? 'Envoyé' : 'Reçu'
                    })));
                } else {
                    setHistory([]);
                }
            } catch (error) {
                console.error('Erreur détails token:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, [asset, ticker, walletData]);

    if (!asset) return <div className="card">Token inconnu. <Link to="/">Retour au dashboard</Link></div>;

    return (
        <div className="token-details-page">
            <button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Retour</button>
            <header className="token-details-header">
                <div className="token-detail-mark" style={{ backgroundColor: asset.color }}>{ticker.slice(0, 1)}</div>
                <div>
                    <p className="eyebrow">Portefeuille</p>
                    <h1>{asset.name} <span>{ticker}</span></h1>
                </div>
            </header>

            <section className="token-balance-card">
                <p>Solde disponible</p>
                <strong>{loading ? '...' : `${formatAmount(balance)} ${ticker}`}</strong>
                <span>{loading ? '...' : formatUsd(balance * rate)}</span>
            </section>

            <section className="token-stats-grid">
                <div className="token-stat"><span>Volume 24 h</span><strong>{loading ? '...' : formatUsd(stats?.volume24h)}</strong></div>
                <div className="token-stat"><span>Contrat ouvert</span><strong>{loading ? '...' : formatUsd(stats?.open)}</strong></div>
                <div className="token-stat"><span>Taux de financement</span><strong>{loading ? '...' : `${Number(stats?.fundingRate || 0).toFixed(3)}%`}</strong></div>
                <div className="token-stat"><span>Variation 24 h</span><strong className={(stats?.change24h || 0) >= 0 ? 'positive' : 'negative'}>{loading ? '...' : `${(stats?.change24h || 0).toFixed(2)}%`}</strong></div>
            </section>

            <section className="card token-history-card">
                <div className="section-heading"><div><p className="eyebrow">Activité</p><h2>Historique {ticker}</h2></div><Activity size={20} color="var(--primary-color)" /></div>
                {!loading && ticker !== 'SGC' && <p className="empty-state">L’historique de {ticker} sera disponible avec la connexion à son explorateur.</p>}
                {!loading && ticker === 'SGC' && history.length === 0 && <p className="empty-state">Aucune transaction pour ce token.</p>}
                <div className="activity-list">
                    {history.map((tx, index) => (
                        <div key={tx.hash || index} className="activity-item">
                            <div className="activity-icon"><BarChart3 size={18} /></div>
                            <div>
                                <strong>{tx.type} {ticker}</strong>
                                <div className="muted-text">{new Date(tx.timestamp).toLocaleString()}</div>
                                {tx.hash && <div className="muted-text token-transaction-hash">Hash : {tx.hash}</div>}
                            </div>
                            <strong className={tx.type === 'Envoyé' ? 'negative' : 'positive'}>{tx.type === 'Envoyé' ? '-' : '+'}{tx.amount} {ticker}</strong>
                        </div>
                    ))}
                </div>
            </section>

            <div className="token-action-row token-action-row-bottom" aria-label={`Actions ${ticker}`}>
                <Link to={`/send/confirm?token=${ticker}`} className="btn btn-primary"><ArrowUpRight size={18} /> Envoyer</Link>
                <Link to={`/receive?token=${ticker}`} className="btn btn-secondary"><ArrowDownLeft size={18} /> Recevoir</Link>
            </div>
        </div>
    );
};

export default TokenDetails;