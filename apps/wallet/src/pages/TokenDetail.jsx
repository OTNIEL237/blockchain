import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { WalletContext } from '../context/WalletContext';
import { fetchSGCBalance, fetchSGCHistory } from '../services/sgcService';
import { fetchBTCBalance } from '../services/btcService';
import { fetchETHBalance, fetchUSDTBalance } from '../services/ethService';
import { fetchSOLBalance } from '../services/solService';
import { TOKEN_LOGOS, TOKEN_NAMES } from '../utils/tokenLogos';
import { TOKEN_CONFIG } from '../utils/tokenConfig';

const getTokenBalanceFetcher = (token) => {
  if (token === 'SGC') return fetchSGCBalance;
  if (token === 'BTC') return fetchBTCBalance;
  if (token === 'ETH') return fetchETHBalance;
  if (token === 'USDT') return fetchUSDTBalance;
  if (token === 'SOL') return fetchSOLBalance;
  return null;
};

const formatTokenAmount = (value, token) => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return `0.00 ${token}`;

  if (token === 'BTC') return `${numeric.toFixed(6)} ${token}`;
  if (token === 'ETH' || token === 'SOL') return `${numeric.toFixed(4)} ${token}`;
  if (token === 'USDT') return `${numeric.toFixed(2)} ${token}`;
  return `${numeric.toFixed(4)} ${token}`;
};

const TokenDetail = () => {
  const { token: routeToken } = useParams();
  const token = (routeToken || 'ETH').toUpperCase();
  const navigate = useNavigate();
  const { walletData } = useContext(WalletContext);

  const [balance, setBalance] = useState('0.00');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const network = useMemo(() => TOKEN_CONFIG[token]?.defaultNetwork || 'Ethereum', [token]);
  const actualTokenKey = token === 'USDT' && network === 'Ethereum' ? 'ETH' : token === 'USDT' && network === 'Solana' ? 'SOL' : token;
  const walletAddress = walletData?.wallets?.[actualTokenKey]?.address || '';

  useEffect(() => {
    if (!walletData) return;

    const loadTokenData = async () => {
      setLoading(true);

      try {
        const getBalance = getTokenBalanceFetcher(token);
        if (getBalance) {
          const nextBalance = await getBalance(walletAddress);
          setBalance(String(nextBalance ?? '0.00'));
        } else {
          setBalance('0.00');
        }

        if (token === 'SGC') {
          const txs = await fetchSGCHistory(walletAddress);
          setHistory(
            (txs || []).map((tx) => ({
              ...tx,
              token,
              direction: tx.fromAddress === walletAddress ? 'Envoyé' : 'Reçu',
              amount: Number(tx.amount || 0),
              timestamp: tx.timestamp || Date.now()
            }))
          );
        } else {
          setHistory([]);
        }
      } catch (error) {
        console.error('Erreur chargement détail token:', error);
        setBalance('0.00');
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadTokenData();
  }, [walletData, token, walletAddress]);

  if (!walletData) return null;

  return (
    <div className="token-detail-page" style={{ maxWidth: '620px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="token-back-button"
          aria-label="Retour"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="token-detail-coin" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          <img src={TOKEN_LOGOS[token]} alt={token} className="token-detail-icon" />
        </div>
      </div>

      <div className="token-detail-header">
        <div className="token-detail-label">Votre solde</div>
        <div className="token-detail-balance">
          {loading ? '...' : formatTokenAmount(balance, token)}
        </div>
      </div>

      <div className="token-detail-actions">
        <button type="button" className="token-action-button token-action-primary" onClick={() => navigate(`/send/confirm?token=${token}&network=${encodeURIComponent(network)}`)}>
          <ArrowUpRight size={22} />
          Envoyer
        </button>
        <button type="button" className="token-action-button token-action-secondary" onClick={() => navigate(`/receive/confirm?token=${token}&network=${encodeURIComponent(network)}`)}>
          <ArrowDownLeft size={22} />
          Recevoir
        </button>
      </div>

      <div className="token-detail-section">
        <h2>Historique</h2>

        {loading ? (
          <p className="token-detail-empty">Chargement des transactions...</p>
        ) : history.length === 0 ? (
          <p className="token-detail-empty">Aucune transaction trouvée pour {TOKEN_NAMES[token] || token}.</p>
        ) : (
          <div className="token-history-list">
            {history.map((tx, index) => {
              const signedAmount = tx.direction === 'Envoyé' ? -Math.abs(Number(tx.amount || 0)) : Math.abs(Number(tx.amount || 0));

              return (
                <div key={`${tx.hash || tx.id || index}`} className="token-history-item">
                  <div className="token-history-meta">
                    <div className="token-history-direction">{tx.direction}</div>
                    <div className="token-history-date">
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'Date inconnue'}
                    </div>
                  </div>

                  <div className={`token-history-amount ${signedAmount >= 0 ? 'positive' : 'negative'}`}>
                    {signedAmount >= 0 ? '+' : '-'}
                    {Math.abs(signedAmount).toLocaleString(undefined, { maximumFractionDigits: 6 })} {token}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenDetail;
