import { SGC_API_URL } from '../config';

export const fetchSGCBalance = async (address) => {
    try {
        const response = await fetch(`${SGC_API_URL}/api/wallet?publicKey=${address}`);
        if (!response.ok) throw new Error("Erreur réseau");
        const data = await response.json();
        return data.balance || 0;
    } catch (error) {
        console.error("Erreur SGC Balance:", error);
        return 0;
    }
};

export const fetchSGCHistory = async (address) => {
    try {
        const response = await fetch(`${SGC_API_URL}/api/address-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
        });
        if (!response.ok) throw new Error("Erreur réseau");
        const data = await response.json();
        return data.addressData?.addressTransactions || [];
    } catch (error) {
        console.error("Erreur SGC History:", error);
        return [];
    }
};

// Envoi d'une transaction via le noeud (Note: SGC utilise actuellement un backend qui s'attend
// à ce que la transaction soit construite côté client ou passée avec une signature.
// Dans l'implémentation existante de SGC, il y avait un constructeur de transaction.)
export const sendSGCTransaction = async (transaction) => {
    try {
        const response = await fetch(`${SGC_API_URL}/api/transaction/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        });
        if (!response.ok) throw new Error("Erreur réseau");
        return await response.json();
    } catch (error) {
        console.error("Erreur envoi SGC:", error);
        throw error;
    }
};

export const mineBlock = async (rewardAddress) => {
    try {
        const response = await fetch(`${SGC_API_URL}/api/mine`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rewardAddress })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Erreur lors du minage");
        }
        return await response.json();
    } catch (error) {
        console.error("Erreur minage:", error);
        throw error;
    }
};
