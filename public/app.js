document.addEventListener('DOMContentLoaded', () => {
    // Initialisation de la connexion WebSocket
    const socket = io();

    // Écoute des événements en temps réel du serveur
    socket.on('update_chain', async () => {
        console.log("⚡ [Temps Réel] Nouveau bloc miné !");
        await fetchBlocks();
        await fetchWallet();
    });

    socket.on('update_pending', async () => {
        console.log("⚡ [Temps Réel] Nouvelle transaction en attente !");
        await fetchPendingTransactions();
    });

    const chainContainer = document.getElementById('chain');
    const pendingList = document.getElementById('pendingList');
    const txForm = document.getElementById('txForm');
    const mineBtn = document.getElementById('mineBtn');
    const errorMsg = document.getElementById('errorMsg');
    const copyPubBtn = document.getElementById('copyPubBtn');
    const copyPrivBtn = document.getElementById('copyPrivBtn');
    
    // Nouveaux éléments réseau
    const nodeUrlSpan = document.getElementById('nodeUrlSpan');
    const addNodeBtn = document.getElementById('addNodeBtn');
    const newNodeUrlInput = document.getElementById('newNodeUrl');
    const networkNodesList = document.getElementById('networkNodesList');
    const consensusBtn = document.getElementById('consensusBtn');

    let myPublicKeyStr = '';
    let myPrivateKeyStr = '';
    let otherPublicKeyStr = '';

    const loginScreen = document.getElementById('loginScreen');
    const appScreen = document.getElementById('appScreen');
    const loginBtn = document.getElementById('loginBtn');
    const createWalletBtn = document.getElementById('createWalletBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Charger les infos du portefeuille et de la blockchain
    init();

    async function init() {
        let pub = localStorage.getItem('myPublicKey');
        let priv = localStorage.getItem('myPrivateKey');

        if (!pub || !priv) {
            // Afficher l'écran de Login
            if(loginScreen) loginScreen.style.display = 'block';
            if(appScreen) appScreen.style.display = 'none';
        } else {
            // Connecté : Afficher l'App
            if(loginScreen) loginScreen.style.display = 'none';
            if(appScreen) appScreen.style.display = 'flex';
            
            myPublicKeyStr = pub;
            myPrivateKeyStr = priv;
            document.getElementById('myPublicKey').value = pub;
            document.getElementById('myPrivateKey').value = priv;
            
            const txPrivField = document.getElementById('privateKey');
            if(txPrivField) txPrivField.value = priv;

            // Lancer la synchro silencieusement au démarrage
            try {
                await fetch('/api/consensus');
            } catch (e) {
                console.log("Erreur synchro initiale");
            }
            
            await fetchWallet();
            await fetchBlocks();
            await fetchPendingTransactions();
        }
    }

    async function fetchWallet() {
        // On passe notre clé publique pour que le serveur calcule notre solde
        const res = await fetch(`/api/wallet?publicKey=${encodeURIComponent(myPublicKeyStr)}`);
        const wallet = await res.json();
        
        otherPublicKeyStr = wallet.otherPublicKey;
        document.getElementById('myBalance').innerText = wallet.balance || 0;
        
        // MAJ Interface Réseau
        nodeUrlSpan.innerText = wallet.currentNodeUrl;
        
        if (wallet.networkNodes && wallet.networkNodes.length > 0) {
            networkNodesList.style.display = 'block';
            networkNodesList.innerHTML = wallet.networkNodes.map(n => `<li>🟢 Connecté: ${n}</li>`).join('');
        } else {
            networkNodesList.style.display = 'none';
        }
    }

    // Nouveaux boutons du Portefeuille
    // Gestion de l'écran de Login
    if(loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const priv = document.getElementById('loginPrivateKey').value.trim();
            if (!priv) {
                alert("Veuillez entrer une clé privée.");
                return;
            }
            
            loginBtn.innerText = "Connexion...";
            try {
                const res = await fetch('/api/derive-public-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ privateKey: priv })
                });
                const data = await res.json();
                
                if(res.ok) {
                    localStorage.setItem('myPublicKey', data.publicKey);
                    localStorage.setItem('myPrivateKey', priv);
                    document.getElementById('loginPrivateKey').value = '';
                    init();
                } else {
                    alert("Erreur: " + data.message);
                }
            } catch(e) {
                alert("Erreur de connexion au serveur.");
            }
            loginBtn.innerText = "Se Connecter";
        });
    }

    if(createWalletBtn) {
        createWalletBtn.addEventListener('click', async () => {
            createWalletBtn.innerText = "Création...";
            const res = await fetch('/api/generate-wallet');
            const newWallet = await res.json();
            localStorage.setItem('myPublicKey', newWallet.publicKey);
            localStorage.setItem('myPrivateKey', newWallet.privateKey);
            createWalletBtn.innerText = "Créer un nouveau portefeuille";
            init();
        });
    }

    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(confirm("Attention: Si vous n'avez pas copié votre clé privée, vous perdrez l'accès à ce portefeuille. Se déconnecter ?")) {
                localStorage.removeItem('myPublicKey');
                localStorage.removeItem('myPrivateKey');
                init();
            }
        });
    }

    // Connecter un nouveau nœud
    addNodeBtn.addEventListener('click', async () => {
        const url = newNodeUrlInput.value.trim();
        if (!url) return;
        
        addNodeBtn.innerText = "⏳...";
        await fetch('/api/register-and-broadcast-node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newNodeUrl: url })
        });
        
        newNodeUrlInput.value = '';
        addNodeBtn.innerText = "Connecter";
        fetchWallet();
    });

    // Bouton de consensus (Synchronisation)
    consensusBtn.addEventListener('click', async () => {
        consensusBtn.innerText = "⏳ Synchronisation...";
        const res = await fetch('/api/consensus');
        const data = await res.json();
        
        console.log(data.message);
        await fetchBlocks();
        await fetchPendingTransactions();
        await fetchWallet();
        
        consensusBtn.innerText = "🔄 Synchroniser la Blockchain (Consensus)";
        // Mettre en évidence si on a remplacé ou pas
        if (data.message.includes("remplacée")) {
            alert("✅ Blockchain mise à jour ! (Une chaîne plus longue a été trouvée sur le réseau)");
        } else {
            alert("ℹ️ Votre blockchain est déjà à jour.");
        }
    });

    // Pré-remplir l'adresse de destination pour les tests
    document.getElementById('presetOtherBtn').addEventListener('click', () => {
        document.getElementById('toAddress').value = otherPublicKeyStr;
    });

    // Copier les clés
    if (copyPubBtn) {
        copyPubBtn.addEventListener('click', () => {
            const pubKey = document.getElementById('myPublicKey');
            pubKey.select();
            document.execCommand('copy');
            copyPubBtn.innerText = "✅ Copié !";
            setTimeout(() => copyPubBtn.innerText = "📋 Copier", 2000);
        });
    }

    if (copyPrivBtn) {
        copyPrivBtn.addEventListener('click', () => {
            const privKey = document.getElementById('myPrivateKey');
            privKey.select();
            document.execCommand('copy');
            copyPrivBtn.innerText = "✅ Copié !";
            setTimeout(() => copyPrivBtn.innerText = "📋 Copier", 2000);
        });
    }

    // Gestion du formulaire de transaction
    txForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';
        
        const toAddress = document.getElementById('toAddress').value;
        const amount = document.getElementById('amount').value;
        const gasFee = document.getElementById('gasFee').value;
        const privateKey = document.getElementById('privateKey').value;

        // CHANGEMENT : on broadcast maintenant la transaction avec les frais de gas !
        const response = await fetch('/api/transaction/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                fromAddress: myPublicKeyStr, // L'expéditeur c'est toujours nous
                toAddress: toAddress, 
                amount: amount,
                fee: gasFee,               // Frais de gas
                privateKey: privateKey      // Pour signer sur le serveur
            })
        });

        const data = await response.json();

        if (response.ok) {
            txForm.reset();
            fetchPendingTransactions();
            fetchWallet(); // Mettre à jour le solde si nécessaire
        } else {
            errorMsg.innerText = "❌ Erreur : " + data.error;
            errorMsg.style.display = 'block';
        }
    });

    // Gestion du bouton de minage
    mineBtn.addEventListener('click', async () => {
        mineBtn.innerText = "⏳ Minage en cours...";
        mineBtn.disabled = true;
        errorMsg.style.display = 'none';

        // CHANGEMENT PHASE 3: On envoie notre adresse pour recevoir la récompense
        const response = await fetch('/api/mine', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rewardAddress: myPublicKeyStr })
        });
        
        if (response.ok) {
            await fetchBlocks();
            await fetchPendingTransactions();
            await fetchWallet(); // On a récupéré 100 SGC !
        } else {
            const data = await response.json();
            errorMsg.innerText = "❌ Erreur : " + data.message;
            errorMsg.style.display = 'block';
        }
        
        mineBtn.innerText = "⛏️ Miner pour gagner 100 Coins";
        mineBtn.disabled = false;
    });

    // Raccourcir les clés publiques pour l'affichage visuel
    function truncateKey(key) {
        if (!key) return "Système (Récompense)";
        // Enlever les en-têtes PEM pour plus de lisibilité
        const clean = key.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n|\r/g, '');
        return clean.substring(0, 10) + '...' + clean.substring(clean.length - 10);
    }

    // Récupérer et afficher la blockchain
    async function fetchBlocks() {
        const res = await fetch('/api/blocks');
        const blocks = await res.json();
        
        chainContainer.innerHTML = '';
        
        blocks.forEach(block => {
            const blockEl = document.createElement('div');
            blockEl.className = 'block';
            
            const date = new Date(block.timestamp).toLocaleString('fr-FR');
            
            let txHtml = '';
            if (block.transactions.length === 0) {
                txHtml = '<div class="tx-item"><em>Genesis Block (Aucune transaction)</em></div>';
            } else {
                block.transactions.forEach(tx => {
                    const isReward = tx.fromAddress === null;
                    const fromStr = truncateKey(tx.fromAddress);
                    const toStr = truncateKey(tx.toAddress);
                    const cssClass = isReward ? 'tx-item reward' : 'tx-item';
                    const feeStr = (!isReward && tx.fee) ? `<br><em style="color: #f0ad4e;">⛽ Frais de gas: ${tx.fee} SGC</em>` : '';
                    
                    txHtml += `<div class="${cssClass}">
                        ${isReward ? '🎁' : '💸'} ${fromStr} <br>> ${toStr} <br><strong>Montant: ${tx.amount} SGC</strong>${feeStr}
                    </div>`;
                });
            }

            blockEl.innerHTML = `
                <div class="block-header">
                    <span class="block-index">Bloc #${block.index}</span>
                    <span class="block-time">${date}</span>
                </div>
                <div class="block-data">
                    <h4>Transactions Validées</h4>
                    ${txHtml}
                </div>
                <div class="block-hash prev-hash">
                    <span class="hash-label">Hash Précédent:</span>
                    <span class="hash-value">${block.previousHash.substring(0, 20)}...</span>
                </div>
                <div class="block-hash">
                    <span class="hash-label">Hash Actuel (Nonce: ${block.nonce}):</span>
                    <span class="hash-value">${block.hash.substring(0, 25)}...</span>
                </div>
            `;
            
            chainContainer.appendChild(blockEl);
        });
    }

    // Récupérer et afficher les transactions en attente
    async function fetchPendingTransactions() {
        const res = await fetch('/api/pending');
        const pending = await res.json();
        
        pendingList.innerHTML = '';
        
        if (pending.length === 0) {
            pendingList.innerHTML = '<li><em>Aucune transaction en attente</em></li>';
            return;
        }

        pending.forEach(tx => {
            const isReward = tx.fromAddress === null;
            const fromStr = truncateKey(tx.fromAddress);
            const toStr = truncateKey(tx.toAddress);
            const feeStr = (!isReward && tx.fee) ? ` (+ ${tx.fee} SGC gas)` : '';
            
            pendingList.innerHTML += `
                <li>
                    <span>${isReward ? '🎁' : '💸'} ${fromStr} > ${toStr}</span>
                    <strong>${tx.amount} SGC${feeStr}</strong>
                </li>
            `;
        });
    }
});
