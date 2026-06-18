import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useWalletModal } from '../../context/WalletModalContext';
import { shortenAddress } from '../../utils/format';
import { TRON_NETWORK } from '../../constants/config';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { walletAddress, isConnected, networkType, error, disconnectWallet } = useWallet();
  const { openModal } = useWalletModal();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isWrongNetwork = isConnected && networkType && networkType !== TRON_NETWORK;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    // Optional: show a small toast here if desired
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsDropdownOpen(false);
  };

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
        <div className={styles.walletSection} ref={dropdownRef}>
          {error && !isConnected && <span className={styles.errorText}>{error}</span>}
          <button 
            className={`${styles.connectBtn} ${isConnected ? styles.connected : ''}`}
            onClick={isConnected ? () => setIsDropdownOpen(!isDropdownOpen) : openModal}
          >
            <span className={`${styles.dot} ${isConnected ? styles.dotGreen : styles.dotRed}`}></span>
            {isConnected ? shortenAddress(walletAddress) : 'Connect Wallet'}
          </button>

          {/* Dropdown Menu */}
          {isConnected && isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownTop}>
                <div className={styles.walletAvatar}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="8" r="4" stroke="#333" strokeWidth="2"/>
                    <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <div className={styles.walletAvatarIcon}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 22L12 18L22 22L12 2Z" fill="white"/>
                    </svg>
                  </div>
                </div>
                <div className={styles.walletInfo}>
                  <div className={styles.addressRow}>
                    {shortenAddress(walletAddress)}
                    <button className={styles.iconBtn} onClick={handleCopy} title="Copy Address">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                    <a 
                      href={`https://${TRON_NETWORK === 'shasta' ? 'shasta.' : ''}tronscan.org/#/address/${walletAddress}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.iconBtn}
                      title="View on Tronscan"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  </div>
                  <div className={styles.actionRow}>
                    <button className={styles.actionBtn} onClick={handleDisconnect}>Disconnect</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
