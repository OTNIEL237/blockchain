import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';
import { fetchSGCBalance, mineBlock } from '../services/sgcService';
import { fetchBTCBalance } from '../services/btcService';
import { fetchETHBalance, fetchUSDTBalance } from '../services/ethService';
import { fetchSOLBalance } from '../services/solService';
import { fetchExchangeRates } from '../services/swapService';
import { ArrowUpRight, ArrowDownLeft, ArrowDownUp, CreditCard, Pickaxe } from 'lucide-react';

const ASSET_ICONS = {
    SGC: { color: '#58e192', name: 'Sango Coin' },
    BTC: { color: '#F7931A', name: 'Bitcoin' },
    ETH: { color: '#627EEA', name: 'Ethereum' },
    USDT: { color: '#26A17B', name: 'TetherUS' },
    SOL: { color: '#14F195', name: 'Solana' }
};

const Dashboard = () => {
    const { walletData } = useContext(WalletContext);
    const navigate = useNavigate();
    
    const [balances, setBalances] = useState({
        SGC: '0.00', BTC: '0.00', ETH: '0.00', USDT: '0.00', SOL: '0.00'
    });
    const [rates, setRates] = useState({});
    const [loading, setLoading] = useState(true);
    const [isMining, setIsMining] = useState(false);

    const loadData = async () => {
        if (!walletData) return;
        setLoading(true);
        try {
            const sgcAddr = walletData.wallets.SGC.address;
            const [sgc, btc, eth, usdt, sol, exchangeRates] = await Promise.all([
                fetchSGCBalance(sgcAddr),
                fetchBTCBalance(walletData.wallets.BTC.address),
                fetchETHBalance(walletData.wallets.ETH.address),
                fetchUSDTBalance(walletData.wallets.ETH.address),
                fetchSOLBalance(walletData.wallets.SOL.address),
                fetchExchangeRates()
            ]);
            
            setBalances({ SGC: sgc, BTC: btc, ETH: eth, USDT: usdt, SOL: sol });
            setRates(exchangeRates);
        } catch (error) {
            console.error("Erreur chargement dashboard", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [walletData]);

    const handleMine = async () => {
        if (!walletData || isMining) return;
        setIsMining(true);
        try {
            const rewardAddress = walletData.wallets.SGC.address;
            await mineBlock(rewardAddress);
            alert('🎉 Bloc miné avec succès ! Vous avez reçu la récompense.');
            await loadData();
        } catch (error) {
            alert('❌ Erreur lors du minage : ' + error.message);
        }
        setIsMining(false);
    };

    // Calcul du solde total en USD
    const totalUsd = Object.keys(balances).reduce((total, ticker) => {
        const bal = parseFloat(balances[ticker]) || 0;
        const rate = rates[ticker] || 0;
        return total + (bal * rate);
    }, 0);

    if (!walletData) return null;

    return (
        <div style={{maxWidth: '600px', margin: '0 auto'}}>
            {/* Header / Total Balance */}
            <div style={{textAlign: 'center', marginTop: '1rem'}}>
                <div className="balance-title">Solde Principal</div>
                <div className="balance-amount">
                    ${loading ? '...' : totalUsd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <div className="balance-change">SGC Multi-Chain Wallet</div>
            </div>

            {/* Top Action Buttons */}
            <div className="top-actions-row">
                <Link to="/send?token=SGC" className="top-action-btn">
                    <div className="top-action-icon">
                        <ArrowUpRight size={24} />
                    </div>
                    Envoyer
                </Link>
                <Link to="/receive?token=SGC" className="top-action-btn">
                    <div className="top-action-icon">
                        <ArrowDownLeft size={24} />
                    </div>
                    Recevoir
                </Link>
                <button onClick={() => navigate('/swap')} className="top-action-btn">
                    <div className="top-action-icon secondary">
                        <ArrowDownUp size={24} />
                    </div>
                    Échanger
                </button>
                <button onClick={handleMine} disabled={isMining} className="top-action-btn" style={{opacity: isMining ? 0.5 : 1}}>
                    <div className="top-action-icon secondary">
                        <Pickaxe size={24} />
                    </div>
                    Miner
                </button>
            </div>

            <h3 style={{marginTop: '2.5rem', marginBottom: '0.5rem', fontSize: '1.2rem'}}>Actifs (Crypto)</h3>
            
            {/* Tokens List (Trust Wallet Style) */}
            <div className="token-list">
                {['SGC', 'BTC', 'ETH', 'USDT', 'SOL'].map(ticker => {
                    const balance = parseFloat(balances[ticker] || 0);
                    const rate = rates[ticker] || 0;
                    const fiatValue = balance * rate;
                    const iconConfig = ASSET_ICONS[ticker];
                    
                    return (
                        <Link to={`/receive?token=${ticker}`} key={ticker} className="token-item">
                            <div className="token-icon" style={{backgroundColor: iconConfig.color}}>
                                {ticker === 'SGC' ? 'S' : ticker === 'BTC' ? '₿' : ticker === 'ETH' ? 'Ξ' : ticker === 'USDT' ? '₮' : 'S'}
                            </div>
                            
                            <div className="token-info">
                                <div className="token-name">{iconConfig.name}</div>
                                <div className="token-price">
                                    ${rate.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} 
                                    <span className="token-price-change">+0.00%</span>
                                </div>
                            </div>
                            
                            <div className="token-balances">
                                <div className="token-balance-crypto">
                                    {loading ? '...' : balances[ticker]} {ticker}
                                </div>
                                <div className="token-balance-fiat">
                                    ${loading ? '...' : fiatValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
};

export default Dashboard;
