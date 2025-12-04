"use client";

import { useState, useEffect, useCallback } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useAccount } from "wagmi";
import { DominoChain } from "./Domino";
import Leaderboard from "./Leaderboard";
import Onboarding from "./Onboarding";
import styles from "./ChainReactionApp.module.css";

// Bomb Timer Component
function BombTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const expires = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className={styles.bombTimer}>
      {timeLeft}s
    </span>
  );
}

interface DominoInChain {
  id: number;
  placedBy: { fid: number; username: string };
  topValue: number;
  bottomValue: number;
  placedAt: string;
  isPowerDomino?: boolean;
  powerType?: string;
}

interface ActivePower {
  type: string;
  emoji: string;
  name: string;
  turnsRemaining?: number;
  expiresAt?: string;
}

interface GameState {
  currentDominoCount: number;
  currentPotPoints: number;
  lastMoveAt: string | null;
  dominoes: DominoInChain[];
  lastBreaker: {
    fid: number;
    username: string;
    potWon: number;
    chainLength: number;
  } | null;
  constants: {
    EXTEND_COST: number;
    BREAK_COST: number;
    MIN_DOMINOES_TO_BREAK: number;
  };
  activePower?: ActivePower | null;
}

interface Player {
  fid: number;
  username: string;
  displayName: string;
  pointsBalance: number;
  totalPotWon: number;
  dominoesPlaced: number;
  chainsBroken: number;
  longestChainAtBreak: number;
}

interface MoveResult {
  success: boolean;
  message: string;
  state: GameState;
  player?: Player;
  pointsAwarded?: number;
}

type TabType = "game" | "leaderboard";

// Convert wallet address to a numeric ID for local testing
function addressToFid(address: string): number {
  // Take first 8 hex chars after 0x and convert to number
  const hex = address.slice(2, 10);
  return parseInt(hex, 16);
}

// Get pot level class for visual effects
function getPotLevelClass(pot: number): string {
  if (pot >= 50) return styles.potBreakBait;  // Red outline flash
  if (pot >= 30) return styles.potHigh;        // Gold shimmer + shake
  if (pot >= 11) return styles.potMedium;      // Slow glow pulse
  return "";                                    // Static (low)
}

export default function ChainReactionApp() {
  const { context } = useMiniKit();
  const { address, isConnected } = useAccount();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("game");
  const [chainFalling, setChainFalling] = useState(false);
  const [fallingDominoes, setFallingDominoes] = useState<DominoInChain[]>([]);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null); // null = loading, true = show, false = skip

  // Use Farcaster FID if available, otherwise use wallet address as ID
  const farcasterUser = context?.user;
  const fid = farcasterUser?.fid || (isConnected && address ? addressToFid(address) : null);
  
  // Username: Farcaster username > truncated address > Anonymous
  const username = farcasterUser?.username || 
    (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Anonymous");
  const displayName = farcasterUser?.displayName || username;
  
  // Check if user is connected (either via Farcaster or wallet)
  const isUserConnected = !!fid;
  const isLocalMode = isConnected && !farcasterUser?.fid;

  // Fetch game state
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/chain-reaction/state");
      const data = await res.json();
      setGameState(data);
    } catch (error) {
      console.error("Failed to fetch state:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch or create player
  const fetchPlayer = useCallback(async () => {
    if (!fid) return;

    try {
      const res = await fetch("/api/chain-reaction/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid, username, displayName }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayer(data.player);
      }
    } catch (error) {
      console.error("Failed to fetch player:", error);
    }
  }, [fid, username, displayName]);

  // Check if onboarding has been completed
  useEffect(() => {
    const completed = localStorage.getItem("chain-reaction-onboarding-complete");
    setShowOnboarding(completed !== "true");
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [fetchState]);

  useEffect(() => {
    if (fid) {
      fetchPlayer();
    } else {
      setPlayer(null);
    }
  }, [fid, fetchPlayer]);

  const handleExtend = async () => {
    if (!fid || actionLoading) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/chain-reaction/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid, username, displayName }),
      });

      const data: MoveResult = await res.json();
      setMessage(data.message);
      
      if (data.state) {
        setGameState((prev) => prev ? { ...prev, ...data.state } : data.state);
      }
      if (data.player) {
        setPlayer(data.player);
      }
    } catch (error) {
      console.error("Failed to extend:", error);
      setMessage("Failed to place domino!");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreak = async () => {
    if (!fid || actionLoading || chainFalling) return;

    setActionLoading(true);
    setMessage(null);

    try {
      // Store current dominoes for falling animation
      const currentDominoes = gameState?.dominoes || [];
      
      const res = await fetch("/api/chain-reaction/break", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid, username, displayName }),
      });

      const data: MoveResult = await res.json();

      if (data.success && data.pointsAwarded) {
        // Start falling animation with current dominoes
        setFallingDominoes(currentDominoes);
        setChainFalling(true);
        setMessage(data.message);

        // Wait for falling animation to complete (1.5s)
        setTimeout(() => {
          setChainFalling(false);
          setFallingDominoes([]);
          
          // Now update to empty chain state
          if (data.state) {
            setGameState((prev) => prev ? { ...prev, ...data.state } : data.state);
          }
          if (data.player) {
            setPlayer(data.player);
          }
          
          // Show celebration after dominoes fall
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }, 1500);
      } else {
        // Failed to break - just show message
        setMessage(data.message);
      }
    } catch (error) {
      console.error("Failed to break:", error);
      setMessage("Failed to break chain!");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>
          <div className={styles.dominoLoader} />
          <div className={styles.dominoLoader} />
          <div className={styles.dominoLoader} />
        </div>
        <p className={styles.loadingText}>Loading chain...</p>
      </div>
    );
  }

  const extendCost = gameState?.constants?.EXTEND_COST || 10;
  const breakCost = gameState?.constants?.BREAK_COST || 20;
  const minToBreak = gameState?.constants?.MIN_DOMINOES_TO_BREAK || 3;
  const canBreak = (gameState?.currentDominoCount || 0) >= minToBreak && !chainFalling && (player?.pointsBalance || 0) >= breakCost;
  const canAfford = (player?.pointsBalance || 0) >= extendCost;
  const canAffordBreak = (player?.pointsBalance || 0) >= breakCost;

  // Transform dominoes for the chain component
  // Use falling dominoes during animation, otherwise use current state
  const dominoesToShow = chainFalling ? fallingDominoes : (gameState?.dominoes || []);
  const chainDominoes = dominoesToShow.map((d) => ({
    topValue: d.topValue,
    bottomValue: d.bottomValue,
    placedBy: d.placedBy.username,
  }));

  // Show onboarding on first visit (null = still checking localStorage)
  if (showOnboarding === null) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>
          <div className={styles.dominoLoader} />
          <div className={styles.dominoLoader} />
          <div className={styles.dominoLoader} />
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className={styles.container}>
      {showCelebration && (
        <div className={styles.celebration}>
          <div className={styles.celebrationContent}>
            <span className={styles.celebrationEmoji}>💥</span>
            <span className={styles.celebrationText}>CHAIN BROKEN!</span>
            <span className={styles.celebrationPot}>
              +{gameState?.lastBreaker?.potWon || 0} points
            </span>
          </div>
        </div>
      )}

      {/* Top Header with Wallet */}
      <header className={styles.topHeader}>
        <h1 className={styles.logo}>⛓️ Chain Reaction</h1>
        <div className={styles.headerRight}>
          <a 
            href="https://warpcast.com/chainintelio" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.followLink}
          >
            @chainintelio
          </a>
          <div className={styles.walletWrapper}>
            <Wallet />
          </div>
        </div>
      </header>

      {/* Player Balance Card - Visible when connected */}
      {isUserConnected && player && (
        <div className={styles.balanceCard}>
          {isLocalMode && (
            <div className={styles.demoModeBadge}>🧪 Local Testing</div>
          )}
          <div className={styles.balanceMain}>
            <div className={styles.balanceInfo}>
              <span className={styles.balanceLabel}>Your Balance</span>
              <div className={styles.balanceAmount}>
                <span className={styles.balanceIcon}>💎</span>
                <span className={styles.balanceValue}>{player.pointsBalance}</span>
                <span className={styles.balanceUnit}>points</span>
              </div>
            </div>
            <div className={styles.balanceStats}>
              <div className={styles.balanceStat}>
                <span className={styles.balanceStatValue}>{player.dominoesPlaced}</span>
                <span className={styles.balanceStatLabel}>🀱 Placed</span>
              </div>
              <div className={styles.balanceStat}>
                <span className={styles.balanceStatValue}>{player.chainsBroken}</span>
                <span className={styles.balanceStatLabel}>💥 Broken</span>
              </div>
              <div className={styles.balanceStat}>
                <span className={styles.balanceStatValue}>{player.totalPotWon}</span>
                <span className={styles.balanceStatLabel}>🏆 Won</span>
              </div>
            </div>
          </div>
          <div className={styles.playerName}>@{player.username}</div>
        </div>
      )}

      {/* Not connected prompt */}
      {!isUserConnected && (
        <div className={styles.loginPrompt}>
          <span className={styles.loginIcon}>👆</span>
          <p>Connect your wallet above to start playing!</p>
          <p className={styles.loginHint}>You&apos;ll get 100 points to start!</p>
        </div>
      )}

      {/* Tab Navigation */}
      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "game" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("game")}
        >
          <span>🎮</span> Play
        </button>
        <button
          className={`${styles.tab} ${activeTab === "leaderboard" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("leaderboard")}
        >
          <span>🏆</span> Leaderboard
        </button>
      </nav>

      {/* Tab Content */}
      {activeTab === "game" ? (
        <div className={styles.gameContent}>
          {/* Domino Chain Visualization */}
          <div className={styles.chainSection}>
            <DominoChain dominoes={chainDominoes} isFalling={chainFalling} />
          </div>

          {/* Game Stats */}
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>🀱</span>
              <span className={styles.statValue}>{gameState?.currentDominoCount || 0}</span>
              <span className={styles.statLabel}>Chain Length</span>
            </div>
            <div className={`${styles.statCard} ${styles.potCard} ${getPotLevelClass(gameState?.currentPotPoints || 0)}`}>
              <span className={styles.statIcon}>🏆</span>
              <span className={styles.statValue}>{gameState?.currentPotPoints || 0}</span>
              <span className={styles.statLabel}>Current Pot</span>
              {(gameState?.currentPotPoints || 0) >= 50 && (
                <span className={styles.breakBaitBadge}>🔥 BREAK BAIT!</span>
              )}
            </div>
          </div>

          {/* Active Power Display */}
          {gameState?.activePower && (
            <div className={`${styles.activePower} ${styles[`power_${gameState.activePower.type}`] || ''}`}>
              <span className={styles.powerEmoji}>{gameState.activePower.emoji}</span>
              <div className={styles.powerInfo}>
                <span className={styles.powerName}>{gameState.activePower.name}</span>
                <span className={styles.powerDesc}>
                  {gameState.activePower.type === "double_down" && "Next placement adds +20 to pot!"}
                  {gameState.activePower.type === "shockwave" && "Break now = pot cut in half!"}
                  {gameState.activePower.type === "bomb" && "60s timer! No move = pot nukes to zero!"}
                  {gameState.activePower.type === "reverse" && `Breaker only gets HALF the pot! (${gameState.activePower.turnsRemaining} breaks left)`}
                </span>
              </div>
              {gameState.activePower.type === "bomb" && gameState.activePower.expiresAt && (
                <BombTimer expiresAt={gameState.activePower.expiresAt} />
              )}
            </div>
          )}

          {/* Last Winner */}
          {gameState?.lastBreaker && (
            <div className={styles.lastBreaker}>
              <span className={styles.breakerIcon}>👑</span>
              <span className={styles.breakerInfo}>
                <strong>@{gameState.lastBreaker.username}</strong> broke a{" "}
                {gameState.lastBreaker.chainLength}-chain for{" "}
                <strong>{gameState.lastBreaker.potWon} pts</strong>
              </span>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={styles.messageBar}>
              {message}
            </div>
          )}

          {/* Action Buttons - Show when connected */}
          {isUserConnected && (
            <div className={styles.actions}>
              {/* Out of points - come back tomorrow */}
              {!canAfford && (player?.pointsBalance || 0) === 0 && (
                <div className={styles.comeBackBanner}>
                  <span className={styles.comeBackIcon}>🌙</span>
                  <div className={styles.comeBackText}>
                    <strong>Out of points!</strong>
                    <span>Come back tomorrow for 100 fresh points</span>
                  </div>
                </div>
              )}
              
              <button
                className={`${styles.extendButton} ${!canAfford ? styles.cantAfford : ""}`}
                onClick={handleExtend}
                disabled={actionLoading || !canAfford}
              >
                <span className={styles.buttonMain}>
                  <span className={styles.buttonIcon}>🀱</span>
                  <span className={styles.buttonText}>Place Domino</span>
                </span>
                <span className={styles.buttonCost}>
                  {canAfford ? `-${extendCost} pts` : "No points"}
                </span>
              </button>

              <button
                className={`${styles.breakButton} ${!canBreak ? styles.disabled : ""}`}
                onClick={handleBreak}
                disabled={actionLoading || !canBreak}
              >
                <span className={styles.buttonMain}>
                  <span className={styles.buttonIcon}>💥</span>
                  <span className={styles.buttonText}>Break Chain</span>
                </span>
                <span className={styles.buttonCost}>
                  {(gameState?.currentDominoCount || 0) < minToBreak
                    ? `Need ${minToBreak}+ dominoes`
                    : !canAffordBreak
                    ? `Need ${breakCost} pts`
                    : `-${breakCost} pts → Score: ${gameState?.currentPotPoints || 0}`}
                </span>
              </button>
            </div>
          )}

          {/* Rules */}
          <div className={styles.rules}>
            <h3>How to Play</h3>
            <ul>
              <li><strong>100 pts/day</strong> – Spend wisely, no refunds!</li>
              <li><strong>Place Domino</strong> – Costs {extendCost} pts, grows the pot</li>
              <li><strong>Break Chain</strong> – Costs {breakCost} pts, score = pot size</li>
              <li><strong>⚠️ Strategy</strong> – Big risk, big reward!</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className={styles.leaderboardContent}>
          <Leaderboard currentFid={fid} />
        </div>
      )}
    </div>
  );
}
