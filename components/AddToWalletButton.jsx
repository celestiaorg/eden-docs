"use client";

import { useState, useCallback } from "react";

// Generic "Add / Switch Network" button for any EIP-1193 compatible wallet
// that implements EIP-3085 (wallet_addEthereumChain) and EIP-3326 (wallet_switchEthereumChain).
// NOTE: Update the placeholder chainId and token symbol/details before production usage.
const DEFAULT_CHAIN_CONFIG = {
  chainId: "0x4D2", // 1234 in hex
  chainName: "Eden testnet",
  nativeCurrency: {
    name: "Testnet TIA",
    symbol: "TIA",
    decimals: 18,
  },
  rpcUrls: [
    "http://116.203.189.103:8545/",
  ],
  blockExplorerUrls: [
    "https://explorer-edennet-1-testnet.binary.builders:8443/",
  ],
};

export default function AddToWalletButton({ chainConfig = DEFAULT_CHAIN_CONFIG, label }) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const addChain = useCallback(async () => {
    setStatus("pending");
    setMessage("");
    const eth = typeof window !== "undefined" ? window.ethereum : undefined;
    if (!eth) {
      setStatus("error");
      setMessage("No compatible wallet found");
      return;
    }
    try {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [chainConfig],
      });
      setStatus("success");
      setMessage("Network added to wallet");
    } catch (err) {
      // If the error is 4001 (user rejected), show message and stop
      if (err?.code === 4001) {
        setStatus("idle");
        setMessage("User rejected the request");
        return;
      }
      // If the error is 4902 (unrecognized chain), try switch
      if (err?.code === 4902) {
        try {
          await eth.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainConfig.chainId }],
          });
          setStatus("success");
          setMessage("Switched to Eden testnet");
        } catch (switchErr) {
          if (switchErr?.code === 4001) {
            setStatus("idle");
            setMessage("User rejected the request");
          } else {
            setStatus("error");
            setMessage(switchErr?.message || "Failed to switch network");
          }
        }
        return;
      }
      // Other errors
      setStatus("error");
      setMessage(err?.message || "Failed to add network");
    }
  }, [chainConfig]);

  const disabled = status === "pending";
  const buttonLabel = disabled
    ? "Working…"
    : label || `Add ${chainConfig.chainName} to wallet`;

  return (
    <div style={{ margin: "1rem 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <button
        onClick={addChain}
        disabled={disabled}
        style={{
          cursor: disabled ? "not-allowed" : "pointer",
          background: "#4F46E5",
          color: "white",
          border: "none",
          padding: "0.6rem 1rem",
          borderRadius: 8,
          fontSize: "0.95rem",
          fontWeight: 500,
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          width: "fit-content",
          minWidth: 0,
        }}
      >
        {buttonLabel}
      </button>
      {message && (
        <span
          style={{
            fontSize: "0.8rem",
            color: status === "error" ? "#DC2626" : status === "success" ? "#059669" : "#374151",
          }}
        >
          {message}
        </span>
      )}
  {/* No placeholder warning needed, config is correct for Eden testnet */}
    </div>
  );
}
