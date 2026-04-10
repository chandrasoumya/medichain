import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import EHRSystemABI from "../contracts/EHRSystem.json";

const Web3Context = createContext(null);

// Fallback: if contract JSON not yet generated (pre-deploy), use empty ABI
const CONTRACT_ABI = EHRSystemABI?.abi || [];
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 in hex
const LOCAL_CHAIN_ID = "0x7a69"; // 31337 in hex

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Role states
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [isPatient, setIsPatient] = useState(false);

  const contractAddress =
    EHRSystemABI?.address ||
    process.env.REACT_APP_CONTRACT_ADDRESS ||
    "";

  const initContract = useCallback(
    async (_signer) => {
      if (!contractAddress || contractAddress === "") {
        toast.warn(
          "Contract address not configured. Please deploy and update src/contracts/EHRSystem.json"
        );
        return null;
      }
      try {
        const c = new ethers.Contract(contractAddress, CONTRACT_ABI, _signer);
        setContract(c);
        return c;
      } catch (err) {
        console.error("Contract init error:", err);
        return null;
      }
    },
    [contractAddress]
  );

  const checkRoles = useCallback(async (c, addr) => {
    if (!c || !addr) return;
    try {
      const adminAddr = await c.admin();
      setIsAdmin(adminAddr.toLowerCase() === addr.toLowerCase());
      const doctorValid = await c.isDoctorValid(addr);
      setIsDoctor(doctorValid);
      const patientReg = await c.isPatientRegistered(addr);
      setIsPatient(patientReg);
    } catch (err) {
      console.error("Role check error:", err);
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected! Please install MetaMask.");
      return;
    }
    setIsConnecting(true);
    try {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      await _provider.send("eth_requestAccounts", []);
      const _signer = await _provider.getSigner();
      const _account = await _signer.getAddress();
      const network = await _provider.getNetwork();

      setProvider(_provider);
      setSigner(_signer);
      setAccount(_account);
      setChainId(network.chainId.toString());

      const c = await initContract(_signer);
      if (c) await checkRoles(c, _account);

      toast.success(`Connected: ${_account.slice(0, 6)}...${_account.slice(-4)}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAccount(null);
    setChainId(null);
    setIsAdmin(false);
    setIsDoctor(false);
    setIsPatient(false);
    toast.info("Wallet disconnected.");
  };

  const refreshRoles = useCallback(async () => {
    if (contract && account) await checkRoles(contract, account);
  }, [contract, account, checkRoles]);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        await connectWallet();
      }
    };

    const handleChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (err) {
      toast.error("Could not switch network.");
    }
  };

  const isCorrectNetwork =
    chainId === "11155111" || chainId === "31337";

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        contract,
        account,
        chainId,
        isAdmin,
        isDoctor,
        isPatient,
        isConnecting,
        isCorrectNetwork,
        connectWallet,
        disconnectWallet,
        refreshRoles,
        switchToSepolia,
        LOCAL_CHAIN_ID,
        SEPOLIA_CHAIN_ID,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) throw new Error("useWeb3 must be used within Web3Provider");
  return context;
}
