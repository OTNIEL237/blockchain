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
