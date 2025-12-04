"use client";

import styles from "./Domino.module.css";

interface DominoProps {
  topValue: number;
  bottomValue: number;
  placedBy?: string;
  index?: number;
  isFalling?: boolean;
  totalCount?: number;
}

// Dot positions for each value (1-6) on a 3x3 grid
const dotPatterns: Record<number, [number, number][]> = {
  1: [[1, 1]], // center
  2: [[0, 2], [2, 0]], // opposite corners
  3: [[0, 2], [1, 1], [2, 0]], // diagonal
  4: [[0, 0], [0, 2], [2, 0], [2, 2]], // four corners
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]], // four corners + center
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]], // two columns of 3
};

function DominoDots({ value }: { value: number }) {
  const dots = dotPatterns[value] || [];

  return (
    <div className={styles.dotGrid}>
      {dots.map(([row, col], i) => (
        <div
          key={i}
          className={styles.dot}
          style={{
            gridRow: row + 1,
            gridColumn: col + 1,
          }}
        />
      ))}
    </div>
  );
}

export default function Domino({
  topValue,
  bottomValue,
  placedBy,
  index = 0,
  isFalling = false,
  totalCount = 1,
}: DominoProps) {
  // Calculate fall delay - first domino falls first, cascading effect
  const fallDelay = isFalling ? index * 0.08 : 0;
  
  return (
    <div
      className={`${styles.domino} ${isFalling ? styles.falling : ""}`}
      style={{ 
        animationDelay: isFalling ? `${fallDelay}s` : `${index * 0.1}s`,
        zIndex: isFalling ? totalCount - index : index,
      }}
      title={placedBy ? `Placed by @${placedBy}` : undefined}
    >
      <div className={styles.half}>
        <DominoDots value={topValue} />
      </div>
      <div className={styles.dividerLine} />
      <div className={styles.half}>
        <DominoDots value={bottomValue} />
      </div>
    </div>
  );
}

// Chain display - horizontal row of dominoes
export function DominoChain({
  dominoes,
  isFalling = false,
}: {
  dominoes: { topValue: number; bottomValue: number; placedBy: string }[];
  isFalling?: boolean;
}) {
  const visibleDominoes = dominoes.slice(-8); // Show last 8 dominoes
  const hiddenCount = dominoes.length - visibleDominoes.length;

  return (
    <div className={`${styles.chainContainer} ${isFalling ? styles.chainFalling : ""}`}>
      <div className={styles.chainHeader}>
        <span className={styles.chainTitle}>🀱 The Chain</span>
        {dominoes.length > 0 && (
          <span className={styles.chainCount}>
            {isFalling ? "💥 BREAKING!" : `${dominoes.length} domino${dominoes.length !== 1 ? 's' : ''}`}
          </span>
        )}
      </div>
      
      <div className={styles.chainArea}>
        {dominoes.length === 0 ? (
          <div className={styles.emptyChain}>
            <div className={styles.emptyDomino}>
              <span>?</span>
              <div className={styles.emptyDivider} />
              <span>?</span>
            </div>
            <p>No dominoes yet – be the first!</p>
          </div>
        ) : (
          <div className={styles.chain}>
            {hiddenCount > 0 && (
              <div className={`${styles.hiddenCount} ${isFalling ? styles.falling : ""}`}
                   style={isFalling ? { animationDelay: '0s' } : undefined}>
                <span>+{hiddenCount}</span>
                <span className={styles.hiddenLabel}>more</span>
              </div>
            )}
            {visibleDominoes.map((d, i) => (
              <Domino
                key={i}
                topValue={d.topValue}
                bottomValue={d.bottomValue}
                placedBy={d.placedBy}
                index={i}
                isFalling={isFalling}
                totalCount={visibleDominoes.length}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
