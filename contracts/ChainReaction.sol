// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChainReaction
 * @notice On-chain achievements and rewards for Chain Reaction mini app
 * @dev This stores achievements and handles weekly winner airdrops
 */
contract ChainReaction {
    
    // Achievement record
    struct Achievement {
        uint256 fid;           // Farcaster ID
        uint256 potWon;        // Points won from break
        uint256 chainLength;   // How many dominoes were in the chain
        uint256 timestamp;     // When it was claimed
        bool isWeeklyWinner;   // Whether this was a weekly winner claim
    }
    
    // Weekly winner record
    struct WeeklyWinner {
        uint256 fid;
        uint256 weekNumber;
        uint256 totalScore;
        bool claimed;
    }
    
    // Owner (can set weekly winners and manage rewards)
    address public owner;
    
    // All achievements
    Achievement[] public achievements;
    
    // FID => their achievement count
    mapping(uint256 => uint256) public achievementCount;
    
    // FID => total pot won on-chain
    mapping(uint256 => uint256) public totalPotWon;
    
    // Week number => winner FID
    mapping(uint256 => WeeklyWinner) public weeklyWinners;
    
    // Events
    event AchievementMinted(uint256 indexed fid, uint256 potWon, uint256 chainLength, uint256 achievementId);
    event WeeklyWinnerSet(uint256 indexed fid, uint256 weekNumber, uint256 totalScore);
    event WeeklyRewardClaimed(uint256 indexed fid, uint256 weekNumber, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @notice Mint an achievement for breaking a chain
     * @param fid Farcaster ID of the player
     * @param potWon Points won from the break
     * @param chainLength Number of dominoes in the chain
     */
    function claimBreak(uint256 fid, uint256 potWon, uint256 chainLength) external {
        Achievement memory newAchievement = Achievement({
            fid: fid,
            potWon: potWon,
            chainLength: chainLength,
            timestamp: block.timestamp,
            isWeeklyWinner: false
        });
        
        achievements.push(newAchievement);
        achievementCount[fid]++;
        totalPotWon[fid] += potWon;
        
        emit AchievementMinted(fid, potWon, chainLength, achievements.length - 1);
    }
    
    /**
     * @notice Set the weekly winner (called by owner/backend)
     * @param fid Farcaster ID of the winner
     * @param weekNumber Week number (e.g., 202449 for week 49 of 2024)
     * @param totalScore Their winning score
     */
    function setWeeklyWinner(uint256 fid, uint256 weekNumber, uint256 totalScore) external onlyOwner {
        require(weeklyWinners[weekNumber].fid == 0, "Winner already set for this week");
        
        weeklyWinners[weekNumber] = WeeklyWinner({
            fid: fid,
            weekNumber: weekNumber,
            totalScore: totalScore,
            claimed: false
        });
        
        emit WeeklyWinnerSet(fid, weekNumber, totalScore);
    }
    
    /**
     * @notice Claim weekly winner reward (sends ETH to caller)
     * @param weekNumber The week to claim for
     */
    function claimWeeklyReward(uint256 weekNumber) external {
        WeeklyWinner storage winner = weeklyWinners[weekNumber];
        require(winner.fid != 0, "No winner for this week");
        require(!winner.claimed, "Already claimed");
        
        // In production, you'd verify the caller's FID matches
        // For now, anyone can claim (you'd add verification)
        
        winner.claimed = true;
        
        uint256 reward = address(this).balance > 0.01 ether ? 0.01 ether : address(this).balance;
        
        if (reward > 0) {
            payable(msg.sender).transfer(reward);
        }
        
        emit WeeklyRewardClaimed(winner.fid, weekNumber, reward);
    }
    
    /**
     * @notice Get player stats
     */
    function getPlayerStats(uint256 fid) external view returns (uint256 count, uint256 totalWon) {
        return (achievementCount[fid], totalPotWon[fid]);
    }
    
    /**
     * @notice Get total achievements minted
     */
    function getTotalAchievements() external view returns (uint256) {
        return achievements.length;
    }
    
    /**
     * @notice Fund the contract for rewards
     */
    receive() external payable {}
    
    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}

