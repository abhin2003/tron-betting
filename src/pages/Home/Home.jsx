import React from 'react';
import StatsBar from '../../components/StatsBar/StatsBar';
import BetForm from '../../components/BetForm/BetForm';
import HowToPlay from '../../components/HowToPlay/HowToPlay';
import BetHistory from '../../components/BetHistory/BetHistory';
import styles from './Home.module.css';

const Home = () => {
  return (
    <main className={styles.main}>
      <StatsBar />
      <section className={styles.betSection}>
        <BetForm />
      </section>
      <HowToPlay />
      <BetHistory />
    </main>
  );
};

export default Home;
