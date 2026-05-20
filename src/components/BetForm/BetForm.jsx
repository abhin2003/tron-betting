import React, { useState } from 'react';
import { useTronLink } from '../../hooks/useTronLink';
import { 
  ODD_WALLET_ADDRESS, 
  EVEN_WALLET_ADDRESS, 
  MIN_BET_TRX, 
  MAX_BET_TRX, 
  PLATFORM_FEE_PERCENT 
} from '../../constants/config';
import styles from './BetForm.module.css';

const BetForm = () => {
  const { isConnected, connectWallet } = useTronLink();
  const [prediction, setPrediction] = useState(null); // 'ODD' or 'EVEN'
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const numAmount = parseFloat(amount);
  const isValidAmount = !isNaN(numAmount) && numAmount >= MIN_BET_TRX && numAmount <= MAX_BET_TRX;
  const potentialWin = isValidAmount ? (numAmount * 2 * (1 - PLATFORM_FEE_PERCENT / 100)).toFixed(2) : '0.00';

  const handleBet = async () => {
    if (!isConnected || !prediction || !isValidAmount) return;
    
    setIsLoading(true);
    setTxHash(null);
    setError(null);

    try {
      const toAddress = prediction === 'ODD' ? ODD_WALLET_ADDRESS : EVEN_WALLET_ADDRESS;
      const amountInSun = window.tronWeb.toSun(numAmount);
      
      const transaction = await window.tronWeb.trx.sendTransaction(toAddress, amountInSun);
      
      if (transaction && transaction.result) {
        setTxHash(transaction.txid);
      } else {
        setError('Transaction failed or rejected by user.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        <div 
          className={`${styles.card} ${prediction === 'ODD' ? styles.selected : ''}`}
          onClick={() => setPrediction('ODD')}
        >
          <div className={styles.cardTitle}>ODD</div>
          <div className={styles.cardSubtitle}>Ends in 1, 3, 5, 7, 9</div>
        </div>
        
        <div 
          className={`${styles.card} ${prediction === 'EVEN' ? styles.selected : ''}`}
          onClick={() => setPrediction('EVEN')}
        >
          <div className={styles.cardTitle}>EVEN</div>
          <div className={styles.cardSubtitle}>Ends in 0, 2, 4, 6, 8</div>
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Bet Amount (TRX)</label>
        <div className={styles.inputWrapper}>
          <input 
            type="number" 
            className={styles.input}
            placeholder={`Min ${MIN_BET_TRX} - Max ${MAX_BET_TRX}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={MIN_BET_TRX}
            max={MAX_BET_TRX}
          />
          <span className={styles.currency}>TRX</span>
        </div>
        
        {amount && !isValidAmount && (
          <div className={styles.validationError}>
            Amount must be between {MIN_BET_TRX} and {MAX_BET_TRX} TRX
          </div>
        )}
        
        <div className={styles.payout}>
          Potential win: <span className={styles.winAmount}>{potentialWin} TRX</span>
        </div>
      </div>

      <button 
        className={styles.placeBetBtn}
        onClick={!isConnected ? connectWallet : handleBet}
        disabled={isConnected && (!prediction || !isValidAmount || isLoading)}
      >
        {!isConnected ? 'Connect Wallet First' : 
         isLoading ? <span className={styles.spinner}></span> : 
         'Place Bet'}
      </button>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {txHash && (
        <div className={styles.successMessage}>
          <div>Bet Placed Successfully!</div>
          <a 
            href={`https://shasta.tronscan.org/#/transaction/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.txLink}
          >
            View on Tronscan
          </a>
        </div>
      )}
    </div>
  );
};

export default BetForm;
