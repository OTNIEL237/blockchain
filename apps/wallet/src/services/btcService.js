export const fetchBTCBalance = async (address) => {
    try {
        // Utilisation de l'API publique de Blockstream (Mainnet)
        const response = await fetch(`https://blockstream.info/api/address/${address}`);
        if (!response.ok) throw new Error("Erreur réseau");
        const data = await response.json();
        
        // Calcul du solde en Satoshis (funded - spent)
        const balanceSatoshis = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
        // Conversion en BTC (1 BTC = 100,000,000 Satoshis)
        return (balanceSatoshis / 100000000).toFixed(6);
    } catch (error) {
        console.error("Erreur BTC Balance:", error);
        return 0;
    }
};
