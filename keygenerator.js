const crypto = require('crypto');

// Fonction qui génère une nouvelle paire de clés cryptographiques (Publique + Privée)
function generateKeyPair() {
    // Utilise l'algorithme "Elliptic Curve" (ec) secp256k1, qui est le même que celui utilisé par Bitcoin !
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'secp256k1',
        publicKeyEncoding: {
            type: 'spki', // Format standard pour les clés publiques
            format: 'pem' // Le format texte avec "-----BEGIN PUBLIC KEY-----"
        },
        privateKeyEncoding: {
            type: 'pkcs8', // Format standard pour les clés privées
            format: 'pem'  // Le format texte avec "-----BEGIN PRIVATE KEY-----"
        }
    });
    
    return {
        publicKey: publicKey,   // L'adresse publique (pour recevoir des fonds)
        privateKey: privateKey  // Le mot de passe secret (pour signer/autoriser les envois)
    };
}

// Fonction qui retrouve la clé publique à partir d'une clé privée
function derivePublicKey(privateKeyPem) {
    const privKeyObj = crypto.createPrivateKey(privateKeyPem);
    const pubKeyObj = crypto.createPublicKey(privKeyObj);
    return pubKeyObj.export({ type: 'spki', format: 'pem' }).toString('utf8');
}

module.exports = { generateKeyPair, derivePublicKey };

// Si ce fichier est exécuté directement dans le terminal (node keygenerator.js), on affiche les clés générées
if (require.main === module) {
    const keys = generateKeyPair();
    console.log("=== Nouvelle paire de clés générée ===");
    console.log("\nClé Publique (Votre adresse pour recevoir) :");
    console.log(keys.publicKey);
    console.log("\nClé Privée (Votre mot de passe secret pour envoyer) :");
    console.log(keys.privateKey);
}
