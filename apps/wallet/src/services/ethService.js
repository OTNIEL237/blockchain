import { ethers } from 'ethers';

// Liste des nœuds RPC Ethereum de secours
const RPC_FALLBACKS = [
    import.meta.env.VITE_ETH_RPC_URL,
    'https://ethereum-rpc.publicnode.com',
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://cloudflare-eth.com'
].filter(Boolean);

// Exécute une opération blockchain avec basculement automatique sur les RPCs si l'un échoue
const executeWithFallback = async (operation) => {
    let lastError;
    for (const rpcUrl of RPC_FALLBACKS) {
        try {
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            return await operation(provider);
        } catch (err) {
            console.warn(`RPC ETH ${rpcUrl} a échoué, tentative sur le nœud suivant...`, err);
            lastError = err;
        }
    }
    throw lastError;
};

// Contract ABI minimum pour USDT (ERC20)
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function transfer(address to, uint amount) returns (bool)"
];

const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT Mainnet

export const fetchETHBalance = async (address) => {
    try {
        const balanceWei = await executeWithFallback(provider => provider.getBalance(address));
        const ethVal = parseFloat(ethers.formatEther(balanceWei));
        return ethVal > 0 ? ethVal.toFixed(6) : '0.00';
    } catch (error) {
        console.error("Erreur ETH Balance:", error);
        return '0.00';
    }
};

export const fetchUSDTBalance = async (address) => {
    try {
        const balance = await executeWithFallback(async (provider) => {
            const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
            return await contract.balanceOf(address);
        });
        return parseFloat(ethers.formatUnits(balance, 6)).toFixed(2);
    } catch (error) {
        console.error("Erreur USDT Balance:", error);
        return '0.00';
    }
};

export const sendETHTransaction = async (privateKey, toAddress, amountEth) => {
    return executeWithFallback(async (provider) => {
        const wallet = new ethers.Wallet(privateKey, provider);
        const tx = await wallet.sendTransaction({
            to: toAddress,
            value: ethers.parseEther(amountEth.toString())
        });
        await tx.wait();
        return { success: true, hash: tx.hash };
    });
};

export const sendUSDTTransaction = async (privateKey, toAddress, amountUsdt) => {
    return executeWithFallback(async (provider) => {
        const wallet = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, wallet);
        const amountParsed = ethers.parseUnits(amountUsdt.toString(), 6);
        const tx = await contract.transfer(toAddress, amountParsed);
        await tx.wait();
        return { success: true, hash: tx.hash };
    });
};

