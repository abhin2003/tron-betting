import { useState, useEffect, useCallback } from 'react';
import { TRON_NETWORK } from '../constants/config';

export const useTronLink = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [networkType, setNetworkType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const initTronWeb = useCallback(async () => {
    if (window.tronWeb && window.tronWeb.ready) {
      try {
        const address = window.tronWeb.defaultAddress.base58;
        if (address) {
          setWalletAddress(address);
          setIsConnected(true);
          setError(null);
        } else {
          setIsConnected(false);
        }
        
        // Detect network
        const node = window.tronWeb.fullNode.host;
        let network = 'unknown';
        if (node.includes('api.trongrid.io')) network = 'mainnet';
        else if (node.includes('api.shasta.trongrid.io')) network = 'shasta';
        else if (node.includes('nile')) network = 'nile';
        
        setNetworkType(network);
      } catch (err) {
        console.error("Error initializing TronWeb", err);
        setError("Error connecting to TronLink");
      }
    } else {
      setIsConnected(false);
      setWalletAddress(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let timeout;
    
    const checkTronLink = () => {
      if (window.tronWeb) {
        initTronWeb();
      } else {
        setError("Please install TronLink wallet");
        setIsLoading(false);
      }
    };

    // Wait up to 3 seconds for TronLink to inject
    if (!window.tronWeb) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.tronWeb || attempts >= 6) { // 6 * 500ms = 3s
          clearInterval(interval);
          checkTronLink();
        }
      }, 500);
      timeout = setTimeout(() => {
        clearInterval(interval);
        if (isLoading) {
          checkTronLink();
        }
      }, 3000);
    } else {
      checkTronLink();
    }

    const handleMessage = (e) => {
      if (e.data.message && e.data.message.action == "setAccount") {
        const address = e.data.message.data.address;
        if (address) {
          setWalletAddress(address);
          setIsConnected(true);
          setError(null);
        } else {
          setWalletAddress(null);
          setIsConnected(false);
        }
      }
      
      if (e.data.message && e.data.message.action == "setNode") {
        initTronWeb();
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      if (timeout) clearTimeout(timeout);
      window.removeEventListener('message', handleMessage);
    };
  }, [initTronWeb, isLoading]);

  const connectWallet = async () => {
    try {
      if (!window.tronWeb) {
        setError("Please install TronLink wallet");
        return;
      }
      
      setIsLoading(true);
      // Trigger TronLink login popup
      const res = await window.tronLink.request({ method: 'tron_requestAccounts' });
      if (res.code === 200) {
        await initTronWeb();
      } else {
        setError("User rejected connection");
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect wallet");
      setIsLoading(false);
    }
  };

  return {
    walletAddress,
    isConnected,
    networkType,
    connectWallet,
    isLoading,
    error
  };
};
