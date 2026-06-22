import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useWalletModal } from '../../context/WalletModalContext';
import { MIN_BET_TRX, MAX_BET_TRX, waitForConfirmation, validateTransaction, judge, payout } from '../../utils/gameLogic';
import styles from './BetForm.module.css';

import ResultPopup from '../ResultPopup/ResultPopup';

const BetForm = () => {
  const { isConnected, walletAddress } = useWallet();
  const { openModal } = useWalletModal();
  const [prediction, setPrediction] = useState(null); // 'ODD' or 'EVEN'
  const [asset, setAsset] = useState('TRX'); // 'TRX' or 'USDT'
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [statusText, setStatusText] = useState(null);

  // Popup State
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState('WIN');
  const [popupAmount, setPopupAmount] = useState(0);
  const [popupPayout, setPopupPayout] = useState(0);

  const numAmount = parseFloat(amount);
  const isValidAmount = !isNaN(numAmount) && numAmount >= MIN_BET_TRX && numAmount <= MAX_BET_TRX;
  const potentialWin = isValidAmount ? (numAmount * 1.8).toFixed(2) : '0.00';

  const handleBet = async () => {
    if (!isConnected || !prediction || !isValidAmount) return;
    
    setIsLoading(true);
    setTxHash(null);
    setError(null);
    setGameResult(null);
    setStatusText("Waiting for wallet confirmation...");

    try {
      const amountInSun = asset === 'TRX' ? window.tronWeb.toSun(numAmount) : window.tronWeb.toSun(numAmount); // both use 6 decimals for this logic
      const mainAddress = import.meta.env.VITE_MAIN_ADDRESS;
      
      let betTxId;
      
      if (asset === 'TRX') {
          const transaction = await window.tronWeb.trx.sendTransaction(mainAddress, amountInSun);
          if (!transaction || (!transaction.result && !transaction.txid)) {
            throw new Error('Transaction failed or rejected by user.');
          }
          betTxId = transaction.txid || transaction.transaction?.txID;
      } else {
          const parameter = [
            { type: 'address', value: mainAddress },
            { type: 'uint256', value: amountInSun.toString() }
          ];
          const options = { feeLimit: 150_000_000, callValue: 0 };
          const transaction = await window.tronWeb.transactionBuilder.triggerSmartContract(
              import.meta.env.VITE_USDT_ADDRESS,
              'transfer(address,uint256)',
              options,
              parameter,
              walletAddress
          );
          const signed = await window.tronWeb.trx.sign(transaction.transaction);
          const receipt = await window.tronWeb.trx.sendRawTransaction(signed);
          if (!receipt || (!receipt.result && !receipt.txid)) {
            throw new Error('Transaction failed or rejected by user.');
          }
          betTxId = receipt.txid || receipt.transaction?.txID;
      }
      
      if (!betTxId) throw new Error("Failed to get transaction ID.");
      
      setTxHash(betTxId);
      window.dispatchEvent(new CustomEvent('mascot-reaction', { detail: 'sent' }));

      setStatusText("Waiting for blockchain confirmation (approx 3-10s)...");
      const txInfo = await waitForConfirmation(betTxId);
      
      if (asset === "USDT") {
          const receiptResult = txInfo?.receipt?.result;
          if (!receiptResult || receiptResult !== 'SUCCESS') {
              throw new Error("Bet TRC20 transfer failed or unconfirmed");
          }
      }

      const blockNumber = txInfo.blockNumber;
      
      setStatusText("Validating transaction...");
      await validateTransaction(betTxId, walletAddress, amountInSun, asset);

      setStatusText("Judging result...");
      const result = judge(blockNumber);
      const isWin = result.result.toUpperCase() === prediction;
      
      let finalPayout = 0;

      if (isWin) {
          window.dispatchEvent(new CustomEvent('mascot-reaction', { detail: 'win' }));
          setStatusText("Processing payout...");
          
          try {
             const payoutTxId = await payout(amountInSun, walletAddress, asset);
             finalPayout = numAmount * 1.8;
             setPopupType('WIN');
             setPopupAmount(numAmount); // The base wager
             setPopupPayout(finalPayout);
             setShowPopup(true);
          } catch(payoutErr) {
             setGameResult(`⚠️ YOU WON! But payout failed: ${payoutErr.message}`);
          }
          
      } else {
          window.dispatchEvent(new CustomEvent('mascot-reaction', { detail: 'loss' }));
          setPopupType('LOSS');
          setPopupAmount(numAmount);
          setPopupPayout(0);
          setShowPopup(true);
      }

      // Save to local history
      try {
        const savedBets = JSON.parse(localStorage.getItem('tronFlipBets') || '[]');
        const newBet = {
          id: betTxId,
          player: walletAddress,
          prediction: prediction,
          amount: numAmount,
          asset: asset,
          block: blockNumber,
          result: isWin ? 'WIN' : 'LOSE',
          payout: finalPayout,
          timestamp: Date.now()
        };
        savedBets.unshift(newBet);
        localStorage.setItem('tronFlipBets', JSON.stringify(savedBets.slice(0, 50))); // Keep last 50
        window.dispatchEvent(new Event('local-bets-updated'));
      } catch (storageErr) {
        console.error("Failed to save bet locally", storageErr);
      }

    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during transaction.');
    } finally {
      setIsLoading(false);
      setStatusText(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.assetSelector}>
        <button 
          className={`${styles.assetBtn} ${asset === 'TRX' ? styles.activeAsset : ''}`} 
          onClick={() => setAsset('TRX')}
        >TRX</button>
        <button 
          className={`${styles.assetBtn} ${asset === 'USDT' ? styles.activeAsset : ''}`} 
          onClick={() => setAsset('USDT')}
        >USDT</button>
      </div>

      <div className={styles.cards}>
        <div 
          className={`${styles.card} ${styles.cardOdd} ${prediction === 'ODD' ? styles.selected : ''}`}
          onClick={() => setPrediction('ODD')}
        >
          <div className={styles.cardTitle}>ODD</div>
          <div className={styles.cardSubtitle}>Ends in 1, 3, 5, 7, 9</div>
        </div>
        
        <div 
          className={`${styles.card} ${styles.cardEven} ${prediction === 'EVEN' ? styles.selected : ''}`}
          onClick={() => setPrediction('EVEN')}
        >
          <div className={styles.cardTitle}>EVEN</div>
          <div className={styles.cardSubtitle}>Ends in 0, 2, 4, 6, 8</div>
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Bet Amount ({asset})</label>
        <div className={styles.inputWrapper}>
          <svg className={styles.inputIcon} viewBox="0 0 422.39 527.76" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M422.39 96.67L194.27 0v274.6L422.39 96.67zM228.12 527.76l194.27-431.09L228.12 274.6v253.16zM0 96.67l228.12-96.67v274.6L0 96.67zM194.27 527.76V274.6L0 96.67l194.27 431.09z"/>
          </svg>
          <input 
            type="number" 
            className={styles.input}
            placeholder={`Min ${MIN_BET_TRX} - Max ${MAX_BET_TRX}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={MIN_BET_TRX}
            max={MAX_BET_TRX}
          />
          <span className={styles.currency}>{asset}</span>
        </div>
        
        {amount && !isValidAmount && (
          <div className={styles.validationError}>
            Amount must be between {MIN_BET_TRX} and {MAX_BET_TRX} {asset}
          </div>
        )}
        
        <div className={styles.payout}>
          Potential win: <span className={styles.winAmount}>{potentialWin} {asset}</span>
        </div>
      </div>

      <button 
        className={styles.placeBetBtn}
        onClick={!isConnected ? openModal : handleBet}
        disabled={isConnected && (!prediction || !isValidAmount || isLoading)}
      >
        {!isConnected ? 'Connect Wallet First' : 
         isLoading ? <span className={styles.spinner}></span> : 
         'Place Bet'}
      </button>

      {statusText && (
        <div className={styles.statusMessage}>
          {statusText}
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {gameResult && (
        <div className={styles.gameResultMessage}>
          {gameResult}
        </div>
      )}

      {txHash && !gameResult && !error && (
        <div className={styles.successMessage}>
          <div>Bet Sent!</div>
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

      <ResultPopup 
        isOpen={showPopup}
        type={popupType}
        amount={popupAmount}
        payout={popupPayout}
        asset={asset}
        txHash={txHash}
        onClose={() => setShowPopup(false)}
      />
    </div>
  );
};

export default BetForm;
