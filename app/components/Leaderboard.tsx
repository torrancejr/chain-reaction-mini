"use client";

import { useState, useEffect } from "react";
import styles from "./Leaderboard.module.css";

interface Player {
  fid: number;
  username: string;
  displayName: string;
  pointsBalance: number;
  dailyBreakPot?: number;
  weeklyBreakPot?: number;
  dominoesPlaced: number;
  chainsBroken: number;
  longestChainAtBreak: number;
}

interface LeaderboardProps {
  currentFid?: number | null;
}

export default function Leaderboard({ currentFid }: LeaderboardProps) {
  const [dailyPlayers, setDailyPlayers] = useState<Player[]>([]);
  const [weeklyPlayers, setWeeklyPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/chain-reaction/leaderboard");
        const data = await res.json();
        if (data.success) {
          setDailyPlayers(data.daily || []);
          setWeeklyPlayers(data.weekly || []);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading leaderboard...</div>
      </div>
    );
  }

  const renderPlayerRow = (player: Player, index: number, scoreField: 'dailyBreakPot' | 'weeklyBreakPot') => {
    const isCurrentUser = player.fid === currentFid;
    const rank = index + 1;
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
    const score = player[scoreField] ?? 0;

    return (
      <div
        key={player.fid}
        className={`${styles.row} ${isCurrentUser ? styles.currentUser : ""} ${rank <= 3 ? styles.topThree : ""}`}
      >
        <div className={styles.rank}>
          {medal || <span className={styles.rankNumber}>{rank}</span>}
        </div>
        
        <div className={styles.playerInfo}>
          <span className={styles.username}>
            @{player.username}
            {isCurrentUser && <span className={styles.youBadge}>YOU</span>}
          </span>
        </div>

        <div className={styles.score}>
          <span className={styles.scoreValue}>{score}</span>
          <span className={styles.scoreLabel}>pts</span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Airdrop Banner */}
      <div className={styles.airdropBanner}>
        <span className={styles.airdropIcon}>🎁</span>
        <span className={styles.airdropText}>Airdrop for Weekly Winner!</span>
      </div>

      {/* Two-column leaderboard grid */}
      <div className={styles.leaderboardGrid}>
        {/* Daily Leaderboard */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>📅 Daily</h3>
            <span className={styles.sectionSubtitle}>Resets midnight</span>
          </div>
          
          {dailyPlayers.length === 0 ? (
            <div className={styles.emptySection}>
              <p>No breaks yet!</p>
            </div>
          ) : (
            <div className={styles.list}>
              {dailyPlayers.map((player, index) => 
                renderPlayerRow(player, index, 'dailyBreakPot')
              )}
            </div>
          )}
        </div>

        {/* Weekly Leaderboard */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>🏆 Weekly</h3>
            <span className={styles.sectionSubtitle}>Resets Sunday</span>
          </div>
          
          {weeklyPlayers.length === 0 ? (
            <div className={styles.emptySection}>
              <p>No breaks yet!</p>
            </div>
          ) : (
            <div className={styles.list}>
              {weeklyPlayers.map((player, index) => 
                renderPlayerRow(player, index, 'weeklyBreakPot')
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
