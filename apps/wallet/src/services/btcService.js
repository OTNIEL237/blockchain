import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { Buffer } from 'buffer';

const ECPair = ECPairFactory(ecc);
const network = bitcoin.networks.bitcoin;

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

export const sendBTCTransaction = async (privateKeyWIF, fromAddress, toAddress, amountBTC) => {
    try {
        const amountSats = Math.floor(amountBTC * 100000000);
        const feeSats = 1000; // Frais fixe pour l'exemple (peut être ajusté ou calculé dynamiquement)
        const totalNeeded = amountSats + feeSats;

        // 1. Récupérer les UTXOs
        const utxoRes = await fetch(`https://blockstream.info/api/address/${fromAddress}/utxo`);
        if (!utxoRes.ok) throw new Error("Erreur lors de la récupération des UTXO");
        const utxos = await utxoRes.json();

        let balance = 0;
        let selectedUtxos = [];
        for (const utxo of utxos) {
            selectedUtxos.push(utxo);
            balance += utxo.value;
            if (balance >= totalNeeded) break;
        }

        if (balance < totalNeeded) {
            throw new Error(`Solde insuffisant. Requis: ${totalNeeded} sats, Disponible: ${balance} sats`);
        }

        const psbt = new bitcoin.Psbt({ network });
        const keyPair = ECPair.fromWIF(privateKeyWIF, network);

        // 2. Ajouter les inputs
        for (const utxo of selectedUtxos) {
            // Pour les adresses legacy (P2PKH), il faut le nonWitnessUtxo complet
            const txHexRes = await fetch(`https://blockstream.info/api/tx/${utxo.txid}/hex`);
            if (!txHexRes.ok) throw new Error(`Erreur récupération de la transaction ${utxo.txid}`);
            const txHex = await txHexRes.text();
            
            psbt.addInput({
                hash: utxo.txid,
                index: utxo.vout,
                nonWitnessUtxo: Buffer.from(txHex, 'hex')
            });
        }

        // 3. Ajouter les outputs
        psbt.addOutput({
            address: toAddress,
            value: amountSats,
        });

        // Calcul du change (la monnaie restante à renvoyer à l'expéditeur)
        const change = balance - totalNeeded;
        if (change > 0) {
            psbt.addOutput({
                address: fromAddress,
                value: change,
            });
        }

        // 4. Signer les inputs
        for (let i = 0; i < selectedUtxos.length; i++) {
            psbt.signInput(i, keyPair);
        }
        
        psbt.finalizeAllInputs();
        
        // 5. Extraire la transaction finale en hexadécimal
        const txHex = psbt.extractTransaction().toHex();

        // 6. Diffuser sur le réseau
        const broadcastRes = await fetch('https://blockstream.info/api/tx', {
            method: 'POST',
            body: txHex
        });

        if (!broadcastRes.ok) {
            const errorMsg = await broadcastRes.text();
            throw new Error(`Erreur de diffusion: ${errorMsg}`);
        }

        const txid = await broadcastRes.text();
        return { success: true, hash: txid };

    } catch (error) {
        console.error("Erreur sendBTC:", error);
        throw error;
    }
};
