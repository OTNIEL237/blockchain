export const SGC_API_URL = import.meta.env.VITE_SGC_API_URL || ''; // En dev, pointe vers le proxy Vite (/api) ou l'URL configurée en prod

export const NETWORKS = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    SOL: 'Solana',
    SGC: 'SangotechCoin',
    USDT: 'USDT (ERC20)'
};
