const { Blockchain, Transaction } = require('./blockchain');

// Instanciation de la blockchain (script de test standalone)
let sangotechCoin = new Blockchain('http://localhost:9999', 9999);

console.log("=== Création de la Blockchain SangotechCoin (Test) ===");

// Test du minage : le mineur "Ghislain" mine un bloc et gagne 100 SGC
console.log("\nDébut du minage par Ghislain...");
sangotechCoin.minePendingTransactions("Ghislain");

console.log("Solde de Ghislain après 1er minage : " + sangotechCoin.getBalanceOfAddress("Ghislain") + " SGC");

console.log("\nEst-ce que la blockchain est valide ? " + sangotechCoin.isChainValid());

console.log("\nContenu de la blockchain :");
console.log(JSON.stringify(sangotechCoin.chain, null, 2));

// Tentative de falsification de la blockchain pour prouver l'immuabilité
console.log("\n=== Tentative de falsification ===");
console.log("On modifie le montant de la première transaction du bloc 1...");
sangotechCoin.chain[1].transactions[0].amount = 1000;
console.log("On recalcule le hash du bloc modifié pour masquer la modification...");
sangotechCoin.chain[1].hash = sangotechCoin.chain[1].calculateHash();

console.log("Est-ce que la blockchain est valide après modification ? " + sangotechCoin.isChainValid());
