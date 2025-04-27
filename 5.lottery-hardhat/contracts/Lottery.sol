// Raffle

// 进入彩票 付投注的钱

// 选择随机获胜者

// 每隔多久选出获胜者 => 全自动的

// chainlink Oracle =>

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

error Raffle_NotEnougnEntered();

contract Raffle {
    uint256 private immutable i_enterFee;
    address payable[] private s_players;

    constructor(uint256 enterFee) {
        i_enterFee = enterFee;
    }

    function enterRaffle() public payable {
        if (msg.value < i_enterFee) {
            revert Raffle_NotEnougnEntered();
        }
        s_players.push(payable(msg.sender));
    }

    // function pickRandomWinner() {}

    function getEnterFee() public view returns (uint256) {
        return i_enterFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }
}
