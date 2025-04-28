// Raffle

// 进入彩票 付投注的钱

// 选择随机获胜者

// 每隔多久选出获胜者 => 全自动的

// chainlink Oracle =>

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

error Raffle_NotEnougnEntered();
error Raffle_TransferFailed();
error Raffle_NotOpen();
error Raffle__UpkeepNotNeeded(
    uint256 currentBalance,
    uint256 numPlayers,
    uint256 raffleState
);

/**
    title： 一个抽奖的合约示例
    创建一个不可篡改的智能合约，提供给用户抽奖
    实现了 vrf chainlink v2 以及 chainlink keepers 
 */
contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    enum RaffleState {
        OPEN,
        CALCULATING
    }
    // events
    event RaffleEnter(address indexed player);
    event RequestRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winnerPicked);

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint256 private immutable i_enterFee;
    uint64 private immutable i_subscriptionId;
    uint256 private immutable i_interval;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;

    uint256 private s_lastTimeStamp;

    RaffleState private s_raffleState;

    address payable[] private s_players;
    address private s_recentWinner;

    uint16 public REQUEST_CONFIRMATIONS = 3;
    uint32 public NUM_WORDS = 2;
    // uint32 public callbackGasLimit = 100000;

    constructor(
        address vrfCoordinatorV2,
        uint256 enterFee,
        bytes32 gaslane, // key hash
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_subscriptionId = subscriptionId;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_enterFee = enterFee;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
        i_gasLane = gaslane;
        i_callbackGasLimit = callbackGasLimit;
    }

    function enterRaffle() public payable {
        if (msg.value < i_enterFee) {
            revert Raffle_NotEnougnEntered();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle_NotOpen();
        }
        s_players.push(payable(msg.sender));

        emit RaffleEnter(msg.sender);
    }

    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
        bool isOpen = (RaffleState.OPEN == s_raffleState);
        bool timePassed = ((block.timestamp - s_lastTimeStamp) < i_interval);
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers);
        return (upkeepNeeded, "0x0");
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Raffle__UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );
        }
        s_raffleState = RaffleState.CALCULATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestRaffleWinner(requestId);
    }

    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle_TransferFailed();
        }

        emit WinnerPicked(recentWinner);
    }

    function getEnterFee() public view returns (uint256) {
        return i_enterFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumWords() public view returns (uint256) {
        return NUM_WORDS;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getRequestConfirmations() public view returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }
}
