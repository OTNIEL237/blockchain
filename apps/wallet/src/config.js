export const SGC_API_URL = import.meta.env.PROD ? 'https://sangotech-backend.onrender.com' : (import.meta.env.VITE_SGC_API_URL || '');

export const NETWORKS = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    SOL: 'Solana',
    SGC: 'SangotechCoin',
    USDT: 'USDT (ERC20)'
};
