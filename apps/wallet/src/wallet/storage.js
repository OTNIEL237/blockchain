import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'sango_wallet_data';

// Sauvegarde chiffrée
export const saveWalletData = (data, pin) => {
    try {
        const jsonStr = JSON.stringify(data);
        const encrypted = CryptoJS.AES.encrypt(jsonStr, pin).toString();
        localStorage.setItem(STORAGE_KEY, encrypted);
        return true;
    } catch (error) {
        console.error("Erreur de sauvegarde:", error);
        return false;
    }
};

// Lecture déchiffrée
export const loadWalletData = (pin) => {
    try {
        const encrypted = localStorage.getItem(STORAGE_KEY);
        if (!encrypted) return null;

        const bytes = CryptoJS.AES.decrypt(encrypted, pin);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedStr) throw new Error("PIN invalide");
        
        return JSON.parse(decryptedStr);
    } catch (error) {
        console.error("Erreur de déchiffrement (PIN incorrect ?):", error);
        return null;
    }
};

export const hasWallet = () => {
    return localStorage.getItem(STORAGE_KEY) !== null;
};

export const clearWallet = () => {
    localStorage.removeItem(STORAGE_KEY);
};
