const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Blockchain, Transaction } = require('./blockchain');

// Configuration du port et de l'URL du nœud (Compatible Cloud / Render)
const PORT = process.env.PORT || process.argv[2] || 3000;
const currentNodeUrl = process.env.NODE_URL || process.argv[3] || `http://localhost:${PORT}`;

// Création du dossier "data" s'il n'existe pas
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// 1. Initialisation de notre Blockchain avec son URL et son port
const sangotechCoin = new Blockchain(currentNodeUrl, PORT);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware pour autoriser les requêtes cross-origin
app.use(cors());

// Middleware pour parser le JSON
app.use(express.json());

// Servir les fichiers statiques (le frontend)
app.use(express.static(path.join(__dirname, 'public')));


// ==========================================
// === ROUTES API REST (Communication JS) ===
// ==========================================

// Route GET pour obtenir les infos réseau et le solde d'une adresse
app.get('/api/wallet', (req, res) => {
    const userPublicKey = req.query.publicKey;
    let balance = 0;
    
    if (userPublicKey) {
        // Solde confirmé (dans les blocs)
        const confirmedBalance = sangotechCoin.getBalanceOfAddress(userPublicKey);
        
        // Soustraire ce qui est en attente de départ
        let pendingOutgoing = 0;
        for (const tx of sangotechCoin.pendingTransactions) {
            if (tx.fromAddress === userPublicKey) {
                pendingOutgoing += tx.amount + (tx.fee || 0);
            }
        }
        balance = confirmedBalance - pendingOutgoing;
    }

    res.json({
        balance: balance,
        currentNodeUrl: sangotechCoin.currentNodeUrl,
        networkNodes: sangotechCoin.networkNodes
    });
});


// Route GET pour récupérer l'historique entier (tous les blocs)
app.get('/api/blocks', (req, res) => {
    res.json(sangotechCoin.chain);
});

// Route GET pour récupérer un bloc spécifique par son Hash
app.get('/api/block/hash/:blockHash', (req, res) => {
    const blockHash = req.params.blockHash;
    const correctBlock = sangotechCoin.getBlock(blockHash);
    res.json({ block: correctBlock });
});

// Route GET pour récupérer un bloc spécifique par son index
app.get('/api/block/index/:blockIndex', (req, res) => {
    const blockIndex = req.params.blockIndex;
    const correctBlock = sangotechCoin.getBlockByIndex(blockIndex);
    res.json({ block: correctBlock });
});

// Route GET pour récupérer une transaction par son Hash
app.get('/api/transaction/:transactionHash', (req, res) => {
    const transactionHash = req.params.transactionHash;
    const transactionData = sangotechCoin.getTransaction(transactionHash);
    res.json({
        transaction: transactionData ? transactionData.transaction : null,
        block: transactionData ? transactionData.block : null
    });
});

// Route POST pour récupérer les données et l'historique d'une adresse en toute sécurité (évite les bugs liés aux slashes dans la clé)
app.post('/api/address-data', (req, res) => {
    const address = req.body.address;
    if (!address) return res.status(400).json({ error: "Adresse manquante" });
    const addressData = sangotechCoin.getAddressData(address);
    res.json({
        addressData: addressData
    });
});

// Route GET pour voir les transactions qui attendent d'être minées
app.get('/api/pending', (req, res) => {
    res.json(sangotechCoin.pendingTransactions);
});

// Route GET pour récupérer les statistiques globales du réseau (façon Etherscan)
app.get('/api/network-stats', (req, res) => {
    const totalBlocks = sangotechCoin.chain.length;
    // Récompense de 100 SGC par bloc miné (hors genesis)
    const totalSupply = (totalBlocks > 1) ? (totalBlocks - 1) * 100 : 0;
    
    let totalTransactions = 0;
    sangotechCoin.chain.forEach(block => {
        totalTransactions += block.transactions.length;
    });

    res.json({
        totalBlocks: totalBlocks,
        totalTransactions: totalTransactions,
        totalSupply: totalSupply,
        difficulty: sangotechCoin.difficulty,
        nodesCount: sangotechCoin.networkNodes.length + 1 // +1 pour inclure le nœud actuel
    });
});

// Route GET pour obtenir les meilleurs comptes (Rich List)
app.get('/api/rich-list', (req, res) => {
    const balances = {}; // { "address": balance }

    // Parcourir toutes les transactions pour calculer le solde de tout le monde
    for (const block of sangotechCoin.chain) {
        for (const tx of block.transactions) {
            const normFrom = tx.fromAddress ? tx.fromAddress.replace(/\s+/g, '') : null;
            const normTo = tx.toAddress ? tx.toAddress.replace(/\s+/g, '') : null;

            if (normFrom) {
                if (balances[normFrom] === undefined) balances[normFrom] = 0;
                balances[normFrom] -= tx.amount;
                balances[normFrom] -= (tx.fee || 0);
            }
            if (normTo) {
                if (balances[normTo] === undefined) balances[normTo] = 0;
                balances[normTo] += tx.amount;
            }
        }
    }

    // Convertir en tableau et trier
    const richList = Object.keys(balances).map(addr => ({
        address: addr,
        balance: balances[addr]
    })).filter(account => account.balance > 0)
       .sort((a, b) => b.balance - a.balance);

    res.json(richList.slice(0, 100)); // Retourne le Top 100
});

// Route GET pour les données de graphique (Chart Data)
app.get('/api/chart-data', (req, res) => {
    // Par exemple : nombre de transactions par bloc (les 20 derniers blocs)
    const recentBlocks = sangotechCoin.chain.slice(-20);
    const labels = recentBlocks.map(b => `Block ${b.index}`);
    const data = recentBlocks.map(b => b.transactions.length);

    res.json({ labels, data });
});

// Route POST pour déclencher le minage des transactions en attente
app.post('/api/mine', async (req, res) => {
    const rewardAddress = req.body.rewardAddress;
    if (!rewardAddress) {
        return res.status(400).json({ message: "Adresse de récompense manquante" });
    }

    // 1. On mine le bloc
    sangotechCoin.minePendingTransactions(rewardAddress);
    const newBlock = sangotechCoin.getLatestBlock();
    
    // TEMPS RÉEL : On prévient l'interface web connectée qu'il y a un nouveau bloc
    io.emit('update_chain');

    // 2. On "crie" (broadcast) ce nouveau bloc à tous les autres nœuds
    const requestPromises = [];
    sangotechCoin.networkNodes.forEach(networkNodeUrl => {
        const requestPromise = fetch(`${networkNodeUrl}/api/receive-new-block`, {
            method: 'POST',
            body: JSON.stringify({ newBlock: newBlock }),
            headers: { 'Content-Type': 'application/json' }
        }).catch(err => console.log("Erreur broadcast bloc vers", networkNodeUrl));
        requestPromises.push(requestPromise);
    });

    await Promise.all(requestPromises);

    res.json({ 
        message: "Bloc miné et diffusé avec succès !", 
        block: newBlock 
    });
});

// Route POST quand un autre nœud nous envoie un nouveau bloc qu'il vient de miner
app.post('/api/receive-new-block', (req, res) => {
    const newBlock = req.body.newBlock;
    const lastBlock = sangotechCoin.getLatestBlock();

    // Vérifier si le bloc s'enchaîne bien avec notre dernier bloc
    const correctHash = lastBlock.hash === newBlock.previousHash;
    const correctIndex = lastBlock.index + 1 === newBlock.index;

    if (correctHash && correctIndex) {
        sangotechCoin.chain.push(newBlock);
        // IMPORTANT : Sauvegarder sur le disque pour ne pas perdre le bloc au redémarrage !
        sangotechCoin.saveChain();

        // On retire UNIQUEMENT les transactions qui sont dans le bloc reçu
        // (et pas celles qui sont peut-être arrivées entre-temps)
        const minedTxHashes = new Set();
        for (const tx of newBlock.transactions) {
            // On identifie chaque transaction par from+to+amount+fee
            minedTxHashes.add(JSON.stringify({
                from: tx.fromAddress, to: tx.toAddress,
                amount: tx.amount, fee: tx.fee
            }));
        }
        sangotechCoin.pendingTransactions = sangotechCoin.pendingTransactions.filter(tx => {
            const key = JSON.stringify({
                from: tx.fromAddress, to: tx.toAddress,
                amount: tx.amount, fee: tx.fee
            });
            return !minedTxHashes.has(key);
        });

        res.json({ message: 'Nouveau bloc accepté et ajouté', newBlock: newBlock });
        io.emit('update_chain'); // Mettre à jour l'interface web
    } else {
        res.json({ message: 'Nouveau bloc rejeté', newBlock: newBlock });
    }
});

// Route POST pour créer et diffuser une transaction
app.post('/api/transaction/broadcast', async (req, res) => {
    try {
        // 1. On prépare la transaction (avec les frais de gas)
        const fee = parseFloat(req.body.fee) || 1; // Frais minimum : 1 SGC
        const tx = new Transaction(req.body.fromAddress, req.body.toAddress, parseFloat(req.body.amount), fee);
        
        // 2. La transaction a été signée localement par le Wallet de l'utilisateur !
        // Le serveur ne reçoit jamais la clé privée.
        tx.signature = req.body.signature;

        // 3. On l'ajoute à notre blockchain locale
        sangotechCoin.addTransaction(tx);

        // 4. On la diffuse à tous les autres nœuds
        const requestPromises = [];
        sangotechCoin.networkNodes.forEach(networkNodeUrl => {
            const requestPromise = fetch(`${networkNodeUrl}/api/transaction`, {
                method: 'POST',
                body: JSON.stringify(tx),
                headers: { 'Content-Type': 'application/json' }
            }).catch(err => console.log("Erreur broadcast tx vers", networkNodeUrl));
            requestPromises.push(requestPromise);
        });

        await Promise.all(requestPromises);

        res.json({ message: "Transaction signée et diffusée à la file d'attente du réseau !" });
        io.emit('update_pending'); // Mettre à jour l'interface web
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Route POST pour recevoir une transaction venant d'un autre nœud
app.post('/api/transaction', (req, res) => {
    const txData = req.body;
    // On reconstruit l'objet Transaction pour avoir ses méthodes (avec les frais)
    const tx = new Transaction(txData.fromAddress, txData.toAddress, txData.amount, txData.fee || 0);
    tx.signature = txData.signature;

    try {
        sangotechCoin.addTransaction(tx);
        res.json({ message: 'Transaction ajoutée à la file d\'attente' });
        io.emit('update_pending'); // Mettre à jour l'interface web
    } catch (err) {
        // On ignore les erreurs de duplication simple, mais on peut les loguer
        console.log("Tx rejetée:", err.message);
        res.status(400).json({ error: err.message });
    }
});

// ==========================================
// === ROUTES P2P (Réseau distribué) ========
// ==========================================

// Route pour connecter un nouveau nœud à tout le réseau
app.post('/api/register-and-broadcast-node', async (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;
    
    if (!sangotechCoin.networkNodes.includes(newNodeUrl) && sangotechCoin.currentNodeUrl !== newNodeUrl) {
        sangotechCoin.networkNodes.push(newNodeUrl);
    }

    const regNodesPromises = [];
    sangotechCoin.networkNodes.forEach(networkNodeUrl => {
        // On envoie le nouveau noeud à tout le monde
        const requestPromise = fetch(`${networkNodeUrl}/api/register-node`, {
            method: 'POST',
            body: JSON.stringify({ newNodeUrl: newNodeUrl }),
            headers: { 'Content-Type': 'application/json' }
        }).catch(err => console.log("Erreur reg node vers", networkNodeUrl));
        regNodesPromises.push(requestPromise);
    });

    await Promise.all(regNodesPromises);

    // Et on envoie la liste complète actuelle au nouveau noeud
    const bulkRegisterOptions = {
        method: 'POST',
        body: JSON.stringify({ allNetworkNodes: [ ...sangotechCoin.networkNodes, sangotechCoin.currentNodeUrl ] }),
        headers: { 'Content-Type': 'application/json' }
    };

    fetch(`${newNodeUrl}/api/register-nodes-bulk`, bulkRegisterOptions)
        .then(() => res.json({ message: 'Nœud enregistré et diffusé avec succès.' }))
        .catch(err => res.json({ message: 'Erreur lors du bulk register.' }));
});

// Route pour enregistrer un nœud (quand on reçoit l'annonce d'un autre nœud)
app.post('/api/register-node', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;
    if (!sangotechCoin.networkNodes.includes(newNodeUrl) && sangotechCoin.currentNodeUrl !== newNodeUrl) {
        sangotechCoin.networkNodes.push(newNodeUrl);
    }
    res.json({ message: 'Nouveau nœud enregistré.' });
});

// Route pour recevoir la liste complète des nœuds (quand on rejoint le réseau)
app.post('/api/register-nodes-bulk', (req, res) => {
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        if (!sangotechCoin.networkNodes.includes(networkNodeUrl) && sangotechCoin.currentNodeUrl !== networkNodeUrl) {
            sangotechCoin.networkNodes.push(networkNodeUrl);
        }
    });
    res.json({ message: 'Enregistrement en masse réussi.' });
});

// L'Algorithme de Consensus (La chaîne la plus longue gagne)
app.get('/api/consensus', async (req, res) => {
    const requestPromises = [];
    sangotechCoin.networkNodes.forEach(networkNodeUrl => {
        requestPromises.push(
            fetch(`${networkNodeUrl}/api/blocks`)
            .then(res => res.json())
            .catch(err => null)
        );
    });

    const blockchains = await Promise.all(requestPromises);
    
    let currentChainLength = sangotechCoin.chain.length;
    let newLongestChain = null;
    let newPendingTransactions = null;

    blockchains.forEach(blockchain => {
        if (blockchain && blockchain.length > currentChainLength) {
            newLongestChain = blockchain;
            currentChainLength = blockchain.length;
        }
    });

    const chainReplaced = newLongestChain && sangotechCoin.replaceChain(newLongestChain);
    if (chainReplaced) {
        res.json({ message: 'La chaîne actuelle a été remplacée.', chain: sangotechCoin.chain });
        io.emit('update_chain'); // Mettre à jour l'interface web
    } else {
        res.json({
            message: 'La chaîne actuelle n\'a pas été remplacée.',
            chain: sangotechCoin.chain
        });
    }
});

// Auto-connexion automatique aux ports par défaut (3000 à 3004) au démarrage
const defaultPorts = [3000, 3001, 3002, 3003, 3004];

function autoConnectDefaultNodes() {
    defaultPorts.forEach(port => {
        if (port !== parseInt(PORT)) {
            const targetUrl = `http://localhost:${port}`;
            fetch(`${targetUrl}/api/register-and-broadcast-node`, {
                method: 'POST',
                body: JSON.stringify({ newNodeUrl: currentNodeUrl }),
                headers: { 'Content-Type': 'application/json' }
            }).then(() => {
                console.log(`🟢 Auto-connexion P2P réussie vers ${targetUrl}`);
            }).catch(() => {
                // Le nœud sur ce port n'est pas allumé, c'est normal !
            });
        }
    });
}

// Démarrage du serveur
server.listen(PORT, () => {
    console.log(`Serveur Sécurisé démarré sur port ${PORT}. Nœud P2P: ${currentNodeUrl}`);
    // 1. Tenter la connexion automatique aux autres nœuds (après 1 seconde)
    setTimeout(autoConnectDefaultNodes, 1000);
    
    // 2. Synchroniser automatiquement la blockchain (après 3 secondes)
    setTimeout(() => {
        fetch(`${currentNodeUrl}/api/consensus`)
            .then(res => res.json())
            .then(data => console.log(`🔄 Auto-Synchro : ${data.message}`))
            .catch(err => console.log("Erreur lors de l'auto-synchronisation."));
    }, 3000);
});
