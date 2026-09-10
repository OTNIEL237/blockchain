export const fetchExchangeRates = async () => {
    try {
        // CoinGecko IDs for BTC, ETH, USDT, SOL
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana&vs_currencies=usd');
        if (!response.ok) throw new Error("Erreur récupération prix");
        const data = await response.json();
        
        return {
            BTC: data.bitcoin?.usd || 65000,
            ETH: data.ethereum?.usd || 3500,
            USDT: data.tether?.usd || 1,
            SOL: data.solana?.usd || 150,
            SGC: 1 // Default price for SGC since it's not listed yet
        };
    } catch (error) {
        console.error("Erreur Swap Service:", error);
        // Fallback rates if API fails or rate limits
        return {
            BTC: 65000,
            ETH: 3500,
            USDT: 1,
            SOL: 150,
            SGC: 1
        };
    }
};

const MARKET_IDS = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    SOL: 'solana'
};

export const fetchTokenMarketStats = async (ticker) => {
    const fallback = { volume24h: 0, change24h: 0, open: 0, fundingRate: 0 };
    if (ticker === 'SGC') return fallback;

    try {
        const id = MARKET_IDS[ticker];
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
        if (!response.ok) throw new Error('Erreur récupération statistiques');
        const marketData = (await response.json()).market_data;
        return {
            volume24h: marketData?.total_volume?.usd || 0,
            change24h: marketData?.price_change_percentage_24h || 0,
            open: marketData?.open_interest_usd || 0,
            fundingRate: 0.01
        };
    } catch (error) {
        console.error('Erreur statistiques token:', error);
        return fallback;
    }
};

export const calculateSwapAmount = (amount, fromRate, toRate) => {
    if (!amount || isNaN(amount) || amount <= 0) return 0;
    // value in USD = amount * fromRate
    // received token amount = (value in USD) / toRate
    const usdValue = parseFloat(amount) * fromRate;
    const received = usdValue / toRate;
    return received;
};

// Simulation of an atomic swap / cross-chain execution
export const executeSwap = async (fromToken, toToken, amount, estimatedReceive) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                message: `Swap de ${amount} ${fromToken} vers ${estimatedReceive.toFixed(6)} ${toToken} complété avec succès ! (Simulation)`,
                hash: "0x" + Math.random().toString(16).slice(2, 20)
            });
        }, 3000); // 3 seconds fake delay
    });
};
