// tokenConfig.js
// Defines supported networks per token and the native gas token for each network
export const TOKEN_CONFIG = {
  SGC: {
    networks: ['SGC'],
    defaultNetwork: 'SGC',
    gasToken: { SGC: 'SGC' }
  },
  BTC: {
    networks: ['Bitcoin'],
    defaultNetwork: 'Bitcoin',
    gasToken: { Bitcoin: 'BTC' }
  },
  ETH: {
    networks: ['Ethereum'],
    defaultNetwork: 'Ethereum',
    gasToken: { Ethereum: 'ETH' }
  },
  USDT: {
    // Support ERC-20 (Ethereum) and SPL (Solana) in the UI; backend/send support limited to ERC-20 for now
    networks: ['Ethereum', 'Solana'],
    defaultNetwork: 'Ethereum',
    gasToken: { Ethereum: 'ETH', Solana: 'SOL' }
  },
  SOL: {
    networks: ['Solana'],
    defaultNetwork: 'Solana',
    gasToken: { Solana: 'SOL' }
  }
};

export const SUPPORTED_SEND_COMBOS = [
  // token on network combos that are supported by current services
  { token: 'SGC', network: 'SGC' },
  { token: 'BTC', network: 'Bitcoin' },
  { token: 'ETH', network: 'Ethereum' },
  { token: 'USDT', network: 'Ethereum' },
  { token: 'SOL', network: 'Solana' }
];
