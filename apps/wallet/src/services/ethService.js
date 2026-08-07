import { ethers } from 'ethers';

// RPC public pour Ethereum Mainnet (ou Sepolia si configuré)
const RPC_URL = import.meta.env.VITE_ETH_RPC_URL || 'https://cloudflare-eth.com';
const provider = new ethers.JsonRpcProvider(RPC_URL);

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
        const balanceWei = await provider.getBalance(address);
        return parseFloat(ethers.formatEther(balanceWei)).toFixed(4);
    } catch (error) {
        console.error("Erreur ETH Balance:", error);
        return 0;
    }
};

export const fetchUSDTBalance = async (address) => {
    try {
        const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
        const balance = await contract.balanceOf(address);
        const decimals = await contract.decimals();
        return parseFloat(ethers.formatUnits(balance, decimals)).toFixed(2);
    } catch (error) {
        console.error("Erreur USDT Balance:", error);
        return 0;
    }
};

export const sendETHTransaction = async (privateKey, toAddress, amountEth) => {
    try {
        const wallet = new ethers.Wallet(privateKey, provider);
        const tx = await wallet.sendTransaction({
            to: toAddress,
            value: ethers.parseEther(amountEth.toString())
        });
        await tx.wait(); // Attendre la confirmation
        return { success: true, hash: tx.hash };
    } catch (error) {
        console.error("Erreur envoi ETH:", error);
        throw error;
    }
};

export const sendUSDTTransaction = async (privateKey, toAddress, amountUsdt) => {
    try {
        const wallet = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, wallet);
        
        // Les décimales USDT sont 6
        const amountParsed = ethers.parseUnits(amountUsdt.toString(), 6);
        const tx = await contract.transfer(toAddress, amountParsed);
        
        await tx.wait(); // Attendre la confirmation
        return { success: true, hash: tx.hash };
    } catch (error) {
        console.error("Erreur envoi USDT:", error);
        throw error;
    }
};
