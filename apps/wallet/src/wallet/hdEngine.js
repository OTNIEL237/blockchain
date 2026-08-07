import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { ethers } from 'ethers';
import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import { Buffer } from 'buffer';

const bip32 = BIP32Factory(ecc);

export const generateMnemonic = () => {
    return bip39.generateMnemonic(); // 12 words
};

export const validateMnemonic = (mnemonic) => {
    return bip39.validateMnemonic(mnemonic);
};

export const deriveWalletsFromMnemonic = async (mnemonic) => {
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // 1. Ethereum / SangotechCoin / USDT (EVM)
    const ethWallet = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(mnemonic));
    const ethAddress = ethWallet.address;
    const ethPrivateKey = ethWallet.privateKey;

    // 2. Bitcoin (Legacy / SegWit)
    // m / purpose' / coin_type' / account' / change / address_index
    const btcNetwork = bitcoin.networks.bitcoin; 
    const root = bip32.fromSeed(seed, btcNetwork);
    const btcPath = "m/44'/0'/0'/0/0";
    const btcChild = root.derivePath(btcPath);
    const { address: btcAddress } = bitcoin.payments.p2pkh({ pubkey: btcChild.publicKey, network: btcNetwork });
    const btcPrivateKey = btcChild.toWIF();

    // 3. Solana
    const solPath = "m/44'/501'/0'/0'";
    const derivedSeed = derivePath(solPath, seed.toString('hex')).key;
    const solKeypair = Keypair.fromSeed(derivedSeed);
    const solAddress = solKeypair.publicKey.toString();
    const solPrivateKey = Buffer.from(solKeypair.secretKey).toString('hex');

    return {
        mnemonic,
        wallets: {
            BTC: { address: btcAddress, privateKey: btcPrivateKey },
            ETH: { address: ethAddress, privateKey: ethPrivateKey }, // Shared with USDT
            SGC: { address: ethAddress, privateKey: ethPrivateKey }, // SGC uses EVM keys in this system
            SOL: { address: solAddress, privateKey: solPrivateKey }
        }
    };
};
