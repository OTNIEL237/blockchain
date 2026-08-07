const crypto = require('crypto');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Fonction utilitaire pour calculer le "Hash" (l'empreinte digitale numérique) d'une donnée
function SHA256(message) {
    return crypto.createHash('sha256').update(message.toString()).digest('hex');
}

// Classe représentant un transfert d'argent (Transaction)
class Transaction {
    constructor(fromAddress, toAddress, amount, fee = 0) {
        this.fromAddress = fromAddress; // Clé publique de l'expéditeur
        this.toAddress = toAddress;     // Clé publique du destinataire
        this.amount = amount;           // Montant transféré
        this.fee = fee;                 // Frais de gas (commission pour le mineur)
        this.signature = '';            // Signature cryptographique pour prouver l'accord de l'expéditeur
    }

    // Calcule l'empreinte de la transaction pour pouvoir la signer
    calculateHash() {
        return SHA256(this.fromAddress + this.toAddress + this.amount + this.fee);
    }

    // Signe la transaction avec un portefeuille ethers (utilisé principalement côté frontend)
    async signTransaction(wallet) {
        if (wallet.address !== this.fromAddress) {
            throw new Error('Vous ne pouvez pas signer pour un autre portefeuille');
        }
        this.signature = await wallet.signMessage(this.calculateHash());
    }

    // Vérifie si la transaction est valide (càd si la signature correspond bien à la clé publique de l'expéditeur)
    isValid() {
        // Si fromAddress est null, c'est une récompense de minage (générée par le système), donc c'est valide
        if (this.fromAddress === null) return true;

        if (!this.signature || this.signature.length === 0) {
            throw new Error('Aucune signature trouvée dans cette transaction');
        }

        try {
            // Ethers permet de retrouver l'adresse publique qui a signé un message spécifique
            const recoveredAddress = ethers.verifyMessage(this.calculateHash(), this.signature);
            return recoveredAddress.toLowerCase() === this.fromAddress.toLowerCase();
        } catch (error) {
            return false;
        }
    }
}

// Classe représentant un bloc (un ensemble de transactions)
class Block {
    constructor(index, timestamp, transactions, previousHash = '') {
        this.index = index;               // Numéro du bloc dans la chaîne
        this.timestamp = timestamp;       // Date et heure de création
        this.transactions = transactions; // Liste des transactions validées dans ce bloc
        this.previousHash = previousHash; // Le Hash du bloc précédent (ce qui crée la "chaîne")
        this.nonce = 0;                   // Un nombre aléatoire utilisé pour le minage (Proof of Work)
        this.hash = this.calculateHash(); // Le Hash de ce bloc actuel
    }

    // Calcule le Hash du bloc en prenant en compte TOUT son contenu
    calculateHash() {
        return SHA256(
            this.index + 
            this.timestamp + 
            JSON.stringify(this.transactions) + 
            this.previousHash + 
            this.nonce
        );
    }

    // Méthode de "Minage" (Proof of Work)
    // On doit trouver un Hash qui commence par un certain nombre de zéros (défini par 'difficulty')
    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++; // On incrémente le nonce jusqu'à trouver le bon Hash
            this.hash = this.calculateHash();
        }
        console.log("Bloc miné : " + this.hash);
    }
    
    // Vérifie si TOUTES les transactions contenues dans le bloc ont une signature valide
    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }
        return true;
    }
}

// Classe représentant la Blockchain (le registre complet)
class Blockchain {
    constructor(currentNodeUrl, port = 3000) {
        this.pendingTransactions = [];            // File d'attente des transactions non encore minées
        this.difficulty = 4;                      // Difficulté du minage (nombre de zéros requis au début du Hash)
        
        // P2P variables
        this.currentNodeUrl = currentNodeUrl;
        this.networkNodes = [];                   // Adresses des autres nœuds

        // Persistance
        this.dbFilePath = path.join(__dirname, 'data', `blockchain_${port}.json`);
        this.loadChain();
    }

    // Charge la chaîne depuis le disque ou crée le genesis block
    loadChain() {
        if (fs.existsSync(this.dbFilePath)) {
            const fileContent = fs.readFileSync(this.dbFilePath, 'utf8');
            this.chain = JSON.parse(fileContent);
        } else {
            this.chain = [this.createGenesisBlock()]; // Initialise la chaîne avec le "Bloc 0"
            this.saveChain();
        }
    }

    // Sauvegarde la chaîne sur le disque
    saveChain() {
        try {
            fs.writeFileSync(this.dbFilePath, JSON.stringify(this.chain, null, 2));
        } catch (e) {
            console.error("Erreur de sauvegarde de la blockchain :", e.message);
        }
    }

    // Crée le tout premier bloc de la chaîne (Genesis Block)
    // IMPORTANT : Le timestamp est FIXE pour que TOUS les nœuds
    // créent exactement le même bloc genesis avec le même hash.
    // Sinon, les chaînes seraient incompatibles et le consensus échouerait.
    // On utilise le 1er janvier 2026 comme date de naissance de SangotechCoin.
    createGenesisBlock() {
        return new Block(0, 1735689600000, [], "0");
    }

    // Récupère le dernier bloc ajouté à la chaîne
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    // Prend les transactions en attente, les met dans un nouveau bloc, et mine ce bloc
    minePendingTransactions(minerRewardAddress) {
        // Calculer le total des frais de gas collectés dans les transactions en attente
        let totalFees = 0;
        for (const tx of this.pendingTransactions) {
            if (tx.fromAddress !== null) { // On ne compte pas les frais des récompenses système
                totalFees += tx.fee;
            }
        }

        // On inclut la récompense de minage DANS le bloc actuel (comme Bitcoin)
        // Le mineur gagne 100 SGC de récompense fixe + les frais de gas de toutes les transactions
        const rewardTx = new Transaction(null, minerRewardAddress, 100 + totalFees);
        this.pendingTransactions.push(rewardTx);

        const block = new Block(
            this.chain.length, 
            Date.now(), 
            this.pendingTransactions,
            this.getLatestBlock().hash // Relie ce bloc au précédent
        );

        // Mine le bloc (cela prend du temps selon la difficulté)
        block.mineBlock(this.difficulty);
        this.chain.push(block); // Ajoute le bloc à la chaîne officielle

        // Sauvegarder sur le disque après avoir ajouté le bloc
        this.saveChain();

        // On vide la file d'attente : tout a été inclus dans le bloc
        this.pendingTransactions = [];
    }

    // Ajoute une nouvelle transaction à la file d'attente
    addTransaction(transaction) {
        // Validation : la transaction a-t-elle bien une adresse d'envoi et de destination ?
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error("La transaction doit inclure une adresse d'expédition et de destination.");
        }

        // Validation : la transaction est-elle cryptographiquement valide ?
        if (!transaction.isValid()) {
            throw new Error("Impossible d'ajouter une transaction invalide à la chaîne.");
        }

        // Validation des frais de gas (minimum 1 SGC)
        if (transaction.fee < 1) {
            throw new Error("Les frais de gas doivent être d'au moins 1 SGC.");
        }

        // --- Validation du solde (Anti Double-Spend) ---
        // On autorise la création de blocs de récompenses (où fromAddress est null)
        if (transaction.fromAddress !== null) {
            const currentBalance = this.getBalanceOfAddress(transaction.fromAddress);
            
            // Calculer aussi ce qui est déjà en attente de dépense pour ne pas pouvoir
            // contourner la vérification en spammant plusieurs transactions rapides.
            let pendingOutgoing = 0;
            for (const tx of this.pendingTransactions) {
                if (tx.fromAddress === transaction.fromAddress) {
                    pendingOutgoing += tx.amount + tx.fee; // On inclut aussi les frais dans le calcul
                }
            }

            // Le coût total = montant envoyé + frais de gas
            if (currentBalance < transaction.amount + transaction.fee + pendingOutgoing) {
                throw new Error("Solde insuffisant pour effectuer cette transaction (montant + frais de gas).");
            }
        }

        // Si tout est bon, on met la transaction en attente du prochain minage
        this.pendingTransactions.push(transaction);
    }

    // Calcule le solde d'une adresse en parcourant TOUT l'historique de la blockchain
    // NOTE : Cette fonction ne prend en compte QUE les blocs confirmés (pas les pending).
    // La vérification des transactions en attente est faite séparément dans addTransaction().
    getBalanceOfAddress(address) {
        let balance = 0;
        const normAddr = address ? address.replace(/\s+/g, '') : null;

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                const normFrom = trans.fromAddress ? trans.fromAddress.replace(/\s+/g, '') : null;
                const normTo = trans.toAddress ? trans.toAddress.replace(/\s+/g, '') : null;
                
                if (normFrom === normAddr) {
                    balance -= trans.amount;          // L'adresse a envoyé de l'argent
                    balance -= (trans.fee || 0);      // L'adresse a payé des frais de gas
                }
                if (normTo === normAddr) {
                    balance += trans.amount; // L'adresse a reçu de l'argent
                }
            }
        }

        return balance;
    }

    // Vérifie si la blockchain a été piratée ou modifiée
    isChainValid(chain = this.chain) {
        // Optionnel: on pourrait vérifier le bloc genesis
        for (let i = 1; i < chain.length; i++) {
            const currentBlock = Object.assign(new Block(), chain[i]);
            const previousBlock = chain[i - 1];

            // 1. Les transactions ont-elles été falsifiées ?
            // currentBlock.transactions est un tableau d'objets bruts si on le reçoit du réseau,
            // on doit vérifier s'ils ont la méthode isValid. Pour l'exercice de base, 
            // on suppose qu'ils sont valides ou on reconstruit les objets Transaction.
            for (let txData of currentBlock.transactions) {
                const tx = new Transaction(txData.fromAddress, txData.toAddress, txData.amount, txData.fee || 0);
                tx.signature = txData.signature;
                if (!tx.isValid()) {
                    return false;
                }
            }

            // 2. Le Hash du bloc actuel est-il correct ?
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            // 3. Le bloc est-il bien lié au précédent ?
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    // Remplace la chaîne actuelle par une nouvelle si elle est plus longue et valide (Consensus)
    replaceChain(newChain) {
        if (newChain.length <= this.chain.length) {
            console.log("La chaîne reçue n'est pas plus longue.");
            return false;
        } else if (!this.isChainValid(newChain)) {
            console.log("La chaîne reçue est plus longue mais n'est pas valide.");
            return false;
        }

        console.log("La chaîne a été remplacée !");
        this.chain = newChain;
        // NOUVEAU : Sauvegarder sur le disque
        this.saveChain();
        return true;
    }

    // --- API Helper Methods for Explorer ---

    getBlock(blockHash) {
        for (const block of this.chain) {
            if (block.hash === blockHash) return block;
        }
        return null;
    }

    getBlockByIndex(blockIndex) {
        const index = parseInt(blockIndex);
        if (index >= 0 && index < this.chain.length) {
            return this.chain[index];
        }
        return null;
    }

    getTransaction(transactionHash) {
        for (const block of this.chain) {
            for (const tx of block.transactions) {
                const txObj = new Transaction(tx.fromAddress, tx.toAddress, tx.amount, tx.fee || 0);
                if (txObj.calculateHash() === transactionHash) {
                    return { transaction: txObj, block: block };
                }
            }
        }
        return null;
    }

    getAddressData(address) {
        const addressTransactions = [];
        let balance = 0;
        const normAddr = address ? address.replace(/\s+/g, '') : null;

        for (const block of this.chain) {
            for (const tx of block.transactions) {
                const normFrom = tx.fromAddress ? tx.fromAddress.replace(/\s+/g, '') : null;
                const normTo = tx.toAddress ? tx.toAddress.replace(/\s+/g, '') : null;
                
                if (normFrom === normAddr || normTo === normAddr) {
                    const txObj = new Transaction(tx.fromAddress, tx.toAddress, tx.amount, tx.fee || 0);
                    txObj.signature = tx.signature;
                    
                    addressTransactions.push({
                        fromAddress: tx.fromAddress,
                        toAddress: tx.toAddress,
                        amount: tx.amount,
                        fee: tx.fee || 0,
                        signature: tx.signature,
                        hash: txObj.calculateHash(),
                        timestamp: block.timestamp,
                        blockIndex: block.index
                    });

                    if (normFrom === normAddr) {
                        balance -= tx.amount;
                        balance -= (tx.fee || 0);
                    }
                    if (normTo === normAddr) {
                        balance += tx.amount;
                    }
                }
            }
        }

        // Include pending transactions in the list as well
        const pendingForAddress = [];
        for (const tx of this.pendingTransactions) {
            const normFrom = tx.fromAddress ? tx.fromAddress.replace(/\s+/g, '') : null;
            const normTo = tx.toAddress ? tx.toAddress.replace(/\s+/g, '') : null;
            
            if (normFrom === normAddr || normTo === normAddr) {
                const txObj = new Transaction(tx.fromAddress, tx.toAddress, tx.amount, tx.fee || 0);
                txObj.signature = tx.signature;
                
                pendingForAddress.push({
                    fromAddress: tx.fromAddress,
                    toAddress: tx.toAddress,
                    amount: tx.amount,
                    fee: tx.fee || 0,
                    signature: tx.signature,
                    hash: txObj.calculateHash(),
                    timestamp: Date.now(),
                    blockIndex: -1 // -1 means pending
                });
            }
        }

        const allTransactions = [...pendingForAddress, ...addressTransactions].sort((a, b) => b.timestamp - a.timestamp);

        return {
            addressTransactions: allTransactions,
            addressBalance: balance
        };
    }
}

module.exports = {
    Transaction,
    Block,
    Blockchain
};
