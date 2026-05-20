import React from 'react';
import { useTronLink } from '../../hooks/useTronLink';
import { shortenAddress } from '../../utils/format';
import { TRON_NETWORK } from '../../constants/config';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { walletAddress, isConnected, networkType, connectWallet, error } = useTronLink();

  const isWrongNetwork = isConnected && networkType && networkType !== TRON_NETWORK;

  return (
    <>
      {isWrongNetwork && (
        <div className={styles.warningBanner}>
          Wrong network detected. Please switch to {TRON_NETWORK === 'shasta' ? 'Shasta Testnet' : 'Mainnet'} in TronLink.
        </div>
      )}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          TRON BET
        </div>
        <div className={styles.walletSection}>
          {error && !isConnected && <span className={styles.errorText}>{error}</span>}
          <button 
            className={`${styles.connectBtn} ${isConnected ? styles.connected : ''}`}
            onClick={isConnected ? undefined : connectWallet}
            disabled={isConnected}
          >
            <span className={`${styles.dot} ${isConnected ? styles.dotGreen : styles.dotRed}`}></span>
            {isConnected ? shortenAddress(walletAddress) : 'Connect Wallet'}
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
