import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/config';
import styles from './StatsBar.module.css';

const StatsBar = () => {
  const [stats, setStats] = useState({
    totalBets: '-',
    totalWagered: '-',
    biggestWin: '-',
    contractBalance: '-'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/stats`);
        if (response.data) {
          setStats({
            totalBets: response.data.totalBets || '0',
            totalWagered: response.data.totalWagered ? Number(response.data.totalWagered).toFixed(2) : '0.00',
            biggestWin: response.data.biggestWin ? Number(response.data.biggestWin).toFixed(2) : '0.00',
            contractBalance: response.data.contractBalance ? Number(response.data.contractBalance).toFixed(2) : '0.00'
          });
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.label}>Total Bets Placed</div>
          <div className={styles.value}>{stats.totalBets}</div>
          <div className={styles.icon}>🎯</div>
        </div>
        
        <div className={styles.card}>
          <div className={styles.label}>Total TRX Wagered</div>
          <div className={styles.value}>{stats.totalWagered}</div>
          <div className={styles.icon}>💎</div>
        </div>
        
        <div className={styles.card}>
          <div className={styles.label}>Biggest Win Today</div>
          <div className={styles.value}>{stats.biggestWin}</div>
          <div className={styles.icon}>🏆</div>
        </div>
        
        <div className={styles.card}>
          <div className={styles.label}>Contract Balance</div>
          <div className={styles.value}>{stats.contractBalance}</div>
          <div className={styles.icon}>🏦</div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
