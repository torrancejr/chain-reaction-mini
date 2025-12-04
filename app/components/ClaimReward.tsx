"use client";

import { useState } from "react";
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from "@coinbase/onchainkit/transaction";
import { baseSepolia } from "viem/chains";
import styles from "./ClaimReward.module.css";

interface ClaimRewardProps {
  fid: number;
  username: string;
  potWon: number;
  chainLength: number;
  isWeeklyWinner?: boolean;
}

// This would be your deployed smart contract address
const CHAIN_REACTION_CONTRACT = "0x0000000000000000000000000000000000000000";

export default function ClaimReward({
  fid,
  username: _username,
  potWon,
  chainLength,
  isWeeklyWinner = false,
}: ClaimRewardProps) {
  const [claimed, setClaimed] = useState(false);

  // Encode the claim function call
  const claimCall = {
    to: CHAIN_REACTION_CONTRACT as `0x${string}`,
    data: encodeClaimData(fid, potWon, chainLength),
    value: BigInt(0),
  };

  return (
    <div className={styles.claimContainer}>
      <div className={styles.rewardCard}>
        <div className={styles.rewardHeader}>
          {isWeeklyWinner ? "Weekly Winner!" : "Chain Broken!"}
        </div>
        
        <div className={styles.rewardDetails}>
          <div className={styles.stat}>
            <span className={styles.label}>Pot Won</span>
            <span className={styles.value}>{potWon} pts</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Chain Length</span>
            <span className={styles.value}>{chainLength} dominoes</span>
          </div>
        </div>

        {!claimed ? (
          <div className={styles.transactionWrapper}>
            <p className={styles.claimText}>
              Mint this achievement on-chain!
            </p>
            <Transaction
              chainId={baseSepolia.id}
              calls={[claimCall]}
              onSuccess={() => {
                setClaimed(true);
              }}
            >
              <TransactionButton 
                text={isWeeklyWinner ? "Claim Airdrop" : "Mint Achievement"}
              />
              <TransactionStatus>
                <TransactionStatusLabel />
                <TransactionStatusAction />
              </TransactionStatus>
            </Transaction>
          </div>
        ) : (
          <div className={styles.claimedBadge}>
            Claimed On-Chain!
          </div>
        )}
      </div>
    </div>
  );
}

function encodeClaimData(fid: number, potWon: number, chainLength: number): `0x${string}` {
  const data = `0x${fid.toString(16).padStart(64, '0')}${potWon.toString(16).padStart(64, '0')}${chainLength.toString(16).padStart(64, '0')}`;
  return data as `0x${string}`;
}

