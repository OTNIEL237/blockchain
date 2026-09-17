import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createTransferInstruction,
    getOrCreateAssociatedTokenAccount
} from '@solana/spl-token';
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { ethers } from 'ethers';
import { Buffer } from 'buffer';

const SOLANA_RPC_URL = import.meta.env.VITE_SOL_RPC_URL || 'https://solana-rpc.publicnode.com';
const SOLANA_USDT_MINT = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

const keypairFromHex = (privateKeyHex) => {
    const secretKey = Buffer.from(privateKeyHex, 'hex');
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
};

export const fetchSolanaUSDTBalance = async (address) => {
    try {
        const owner = new PublicKey(address);
        const accounts = await connection.getParsedTokenAccountsByOwner(owner, { mint: SOLANA_USDT_MINT });
        const amount = accounts.value.reduce((total, account) => (
            total + Number(account.account.data.parsed.info.tokenAmount.amount)
        ), 0);
        return (amount / 1e6).toFixed(2);
    } catch (error) {
        console.error('Erreur solde USDT Solana:', error);
        return '0.00';
    }
};

export const sendSolanaUSDTTransaction = async (privateKeyHex, toAddress, amountUsdt) => {
    const payer = keypairFromHex(privateKeyHex);
    const recipient = new PublicKey(toAddress);
    const sourceAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        SOLANA_USDT_MINT,
        payer.publicKey,
        false,
        'confirmed',
        undefined,
        undefined,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const destinationAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        SOLANA_USDT_MINT,
        recipient
    );
    const amount = ethers.parseUnits(amountUsdt.toString(), 6);
    const transaction = new Transaction().add(
        createTransferInstruction(
            sourceAccount.address,
            destinationAccount.address,
            payer.publicKey,
            amount
        )
    );
    const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
    return { success: true, signature };
};
