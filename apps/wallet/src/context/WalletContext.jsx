import React, { createContext, useState, useEffect } from 'react';
import { hasWallet, loadWalletData, clearWallet } from '../wallet/storage';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
    const [isLocked, setIsLocked] = useState(hasWallet()); // S'il y a un wallet, on commence verrouillé
    const [walletData, setWalletData] = useState(null);

    const unlockWallet = (pin) => {
        const data = loadWalletData(pin);
        if (data) {
            setWalletData(data);
            setIsLocked(false);
            return true;
        }
        return false;
    };

    const lockWallet = () => {
        setWalletData(null);
        setIsLocked(true);
    };

    const resetWallet = () => {
        clearWallet();
        setWalletData(null);
        setIsLocked(false);
    };

    return (
        <WalletContext.Provider value={{ 
            walletData, setWalletData, 
            isLocked, unlockWallet, lockWallet, resetWallet 
        }}>
            {children}
        </WalletContext.Provider>
    );
};
