// Raffle

// 进入彩票 付投注的钱

// 选择随机获胜者

// 每隔多久选出获胜者 => 全自动的

// chainlink Oracle =>

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "hardhat/console.sol";

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

    address payable[] public s_players;
    address private s_recentWinner;

    uint16 public REQUEST_CONFIRMATIONS = 3;
    uint32 public NUM_WORDS = 2;
    // uint32 public callbackGasLimit = 100000;

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gaslane, // key hash
        uint256 interval,
        uint256 enterFee,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_subscriptionId = subscriptionId;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_enterFee = enterFee;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        // 传递的 interval 最小 12秒，不然会导致 gas 激增
        i_interval = interval;
        i_gasLane = gaslane;
        i_callbackGasLimit = callbackGasLimit;
    }

    // 1. 进入抽奖
    // 进入抽奖不限制人数，不过开奖需要等一定时间才能抽到中奖人（performUpkeep）
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

    /**
      该方法我以为可以写一个自定义来做，其实并不行
      1. 可以通过本地 evm 计算 gas 消耗
      2. 更加安全，如果自己的 checkUpkeep 有问题，将会出现风险
      3. checkUpkeep、performUpkeep 是成套运行的，不然 automation 无法识别 
     */
    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
        bool isOpen = (RaffleState.OPEN == s_raffleState);
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers);
        return (upkeepNeeded, "0x0");
    }

    /**
        2. 抽奖预检查
        - 如果时间到了，开始请求随机数的前置准备
        - 调用 i_vrfCoordinator.requestRandomWords 方法后，vrfMockV2 会自动触发  fulfillRandomWords  方法
        - 每 interval 秒回执行该方法，最小为 12 秒，时间越少，消耗 gas 越多。
    */
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
        // 貌似有点多余，因为 requestId 给了前端也做不了什么事情。
        emit RequestRaffleWinner(requestId);
    }

    /**
      3. 开始随机数获取，求余，得到的就是当前 players 的某一个下标
     */
    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;
        s_raffleState = RaffleState.OPEN;
        // 这里将当前合约所有的 eth 全发给中奖人
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

    function getPlayers() external view returns (address[] memory) {
        // 可以节省gas，并且解决 payable 的报错
        address[] memory players = new address[](s_players.length);
        for (uint256 i = 0; i < s_players.length; i++) {
            players[i] = s_players[i]; // 隐式转换 address payable → address
        }
        return players;
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getRequestConfirmations() public view returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
