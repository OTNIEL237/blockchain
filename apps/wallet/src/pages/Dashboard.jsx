import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';
import { fetchSGCBalance, mineBlock } from '../services/sgcService';
import { fetchBTCBalance } from '../services/btcService';
import { fetchETHBalance, fetchUSDTBalance } from '../services/ethService';
import { fetchSOLBalance } from '../services/solService';
import { fetchExchangeRates } from '../services/swapService';
import { ArrowUpRight, ArrowDownLeft, ArrowDownUp, CreditCard, Zap } from 'lucide-react';

const ASSET_ICONS = {
    SGC: { color: '#58e192', name: 'Sango Coin' },
    BTC: { color: '#F7931A', name: 'Bitcoin' },
    ETH: { color: '#627EEA', name: 'Ethereum' },
    USDT: { color: '#26A17B', name: 'TetherUS' },
    SOL: { color: '#14F195', name: 'Solana' }
};

const TokenLogo = ({ ticker }) => {
    const commonProps = {
        viewBox: '0 0 64 64',
        ariaLabel: `${ticker} logo`,
        role: 'img',
        className: 'token-logo-svg'
    };

    switch (ticker) {
        case 'BTC':
            return (
                <svg {...commonProps}>
                    <circle cx="32" cy="32" r="30" fill="#F7931A" />
                    <path d="M34.5 18.5h4.5a5.5 5.5 0 0 1 0 11H34.5v-11Zm0 15.5h6a6.5 6.5 0 0 1 0 13H34.5V34Zm-8-15.5V17h8v3.5h-8Zm0 17v-4h8v4h-8ZM22 25.5c0-6.5 5-11 11.5-11 4.2 0 7.2 1.4 9.1 4.2a9.3 9.3 0 0 1-3.2 15 7.1 7.1 0 0 1 2.1 5.2 9.3 9.3 0 0 1-10.5 9.4c-6.1 0-10.8-4.6-10.8-10.8v-1.6c0-1.8.3-3.7 1-5.4a10.7 10.7 0 0 1-1.2-4.8Zm7.5 0c0 1.1.2 2.3.8 3.3h4.8c1.7 0 3.1-1.4 3.1-3.1 0-1.8-1.4-3.2-3.1-3.2h-5.6Zm0 14c0 2 1.6 3.5 3.6 3.5h5.6c2 0 3.5-1.6 3.5-3.5 0-1.9-1.5-3.5-3.5-3.5h-5.6c-2 0-3.6 1.6-3.6 3.5Z" fill="#fff"/>
                </svg>
            );
        case 'ETH':
            return (
                <svg {...commonProps}>
                    <circle cx="32" cy="32" r="30" fill="#627EEA" />
                    <path d="M32 14 20 32.2l12 7.1 12-7.1L32 14Zm0 32.9L20 35.2l12 17.1 12-17.1-12 11.7Z" fill="#fff" opacity="0.9"/>
                    <path d="M32 38.2v13.3l12-17.1-12 3.8Zm0-24.2L20 32.2l12-7.1 12 7.1L32 14Z" fill="#dfe7ff"/>
                </svg>
            );
        case 'USDT':
            return (
                <svg {...commonProps}>
                    <circle cx="32" cy="32" r="30" fill="#26A17B" />
                    <path d="M28 18h8v5h-2v20h5v5h-14v-5h5V23h-2v-5Zm-1 9h10v5H27v-5Zm0 9h10v5H27v-5Z" fill="#fff"/>
                </svg>
            );
        case 'SOL':
            return (
                <svg {...commonProps}>
                    <defs>
                        <linearGradient id="solanaGradient" x1="12" x2="52" y1="8" y2="56" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#00FFA3"/>
                            <stop offset="1" stopColor="#14F195"/>
                        </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="30" fill="#0A0F1D"/>
                    <path d="M18 24.2c1.3-1.3 3.2-2 5.1-2h24.3c1.8 0 2.8 2.1 1.6 3.3l-6.3 6.3c-1.2 1.2-3.1 2-5 2H14.3c-1.8 0-2.8-2.1-1.6-3.3l5.3-5.3Zm0 15.6c1.3-1.3 3.2-2 5.1-2h24.3c1.8 0 2.8 2.1 1.6 3.3l-6.3 6.3c-1.2 1.2-3.1 2-5 2H14.3c-1.8 0-2.8-2.1-1.6-3.3l5.3-5.3Zm28.6-10.1c-1.3 1.3-3.2 2-5.1 2H17.2c-1.8 0-2.8-2.1-1.6-3.3l6.3-6.3c1.2-1.2 3.1-2 5-2h24.3c1.8 0 2.8 2.1 1.6 3.3l-5.4 5.3Z" fill="url(#solanaGradient)"/>
                </svg>
            );
        case 'SGC':
        default:
            return (
                <svg {...commonProps}>
                    <circle cx="32" cy="32" r="30" fill="#58e192" />
                    <path d="M43 18.5H25.6c-4.2 0-7.6 3.2-7.6 7.4 0 3.3 2.1 6.1 5 7l7.3 1.8c2.6.6 4.4 2.6 4.4 5 0 3-2.5 5.4-5.5 5.4H23v-5.5h9.3c1.2 0 2.1-.9 2.1-2.1 0-1.2-.9-2.1-2.1-2.1H27.7c-4.2 0-7.6-3.3-7.6-7.4S23.5 13 27.7 13H43v5.5Z" fill="#0B1C17"/>
                    <path d="M45.5 41.5H27.3c-4 0-7.2-3.2-7.2-7.2 0-3.2 2.1-6 5.1-6.8l7.6-2c3.1-.9 5.4-3.6 5.4-6.8 0-4-3.2-7.2-7.2-7.2H20.3v-4.8h13.8c6.7 0 12.2 5.5 12.2 12.2 0 5.1-3.2 9.5-7.6 11.2l-7.3 2.8c-1.6.6-2.5 2.2-2.5 3.9 0 2.3 1.9 4.2 4.2 4.2h16v4.8Z" fill="#fff" opacity="0.7"/>
                </svg>
            );
    }
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
                <Link to="/send" className="top-action-btn">
                    <div className="top-action-icon">
                        <ArrowUpRight size={24} />
                    </div>
                    Envoyer
                </Link>
                <Link to="/receive" className="top-action-btn">
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
                        <Zap size={24} />
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
                                <TokenLogo ticker={ticker} />
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
