import { Connection, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, Keypair } from '@solana/web3.js';
import { Buffer } from 'buffer';

const RPC_URL = import.meta.env.VITE_SOL_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

export const fetchSOLBalance = async (address) => {
    try {
        const pubKey = new PublicKey(address);
        const balanceLamports = await connection.getBalance(pubKey);
        return (balanceLamports / 1e9).toFixed(4); // 1 SOL = 1e9 Lamports
    } catch (error) {
        console.error("Erreur SOL Balance:", error);
        return 0;
    }
};

export const sendSOLTransaction = async (privateKeyHex, toAddress, amountSol) => {
    try {
        const secretKey = Buffer.from(privateKeyHex, 'hex');
        const fromKeypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
        const toPubkey = new PublicKey(toAddress);

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey,
                lamports: amountSol * 1e9
            })
        );

        const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
        return { success: true, signature };
    } catch (error) {
        console.error("Erreur envoi SOL:", error);
        throw error;
    }
};
