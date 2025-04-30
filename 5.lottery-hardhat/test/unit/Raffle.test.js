const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");

!developmentChains?.includes(network.name)
  ? describe.skip
  : describe("raffle 合约测试", function () {
      let raffle, vrfV2Mock, raffleContract, raffleEnterFee, interval, player;
      const chainId = network.config.chainId;

      beforeEach(async () => {
        // 获取ethers 的 用户
        accounts = await ethers.getSigners();
        // 对应 hardhat.config.js 的 accounts
        player = accounts[1];
        // 部署 mocks 和 raffle 两个合约
        // 去哪里找？hardhat-deploy 插件的标签化部署机制​
        // 对应的 是 00-mock、01-raffle  最底下的tags
        await deployments.fixture(["mocks", "raffle"]);
        // 获取对应【已部署】的 v2mock 合约
        vrfV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        // 获取 【已部署】的 raffle 合约
        raffleContract = await ethers.getContract("Raffle");
        // 连接一下某个用户（如果有特定的场景需要某个用户才能使用的方法，可以使用connect）
        raffle = raffleContract.connect(player);
        // 获取当前进入彩票系统的门票 在 config 定义的
        raffleEnterFee = await raffle.getEnterFee();
        // 获取当前进入彩票系统的门票 在 config 定义的 30，看下作用是什么？
        interval = await raffle.getInterval();
      });

      describe("contructor", async () => {
        it("初始化正常", async () => {
          // 获取状态
          const raffleState = await raffle.getRaffleState();
          const interval = await raffle.getInterval();

          assert.equal(raffleState.toString(), "0");
          // 这里的interval 就是 hardhat.config.js 传递过去的
          assert.equal(interval.toString(), networkConfig[chainId].interval);
        });
      });

      describe("enterRaffle", function () {
        it("钱不够参与抽奖", async () => {
          await expect(raffle.enterRaffle()).to.be.revertedWith(
            "Raffle_NotEnougnEntered"
          );
        });
        it("用户进来抽奖的时候记录用户", async () => {
          await raffle.enterRaffle({ value: raffleEnterFee });
          const contractPlayer = await raffle.getPlayer(0);
          // 上面 beforeEach 中，将player的地址链接了该合约（相当于是第一个玩家进入了）
          assert.equal(player.address, contractPlayer);
        });
        it("用户进入抽奖的时候，触发 RaffleEnter 事件", async () => {
          // 可以监听每个用户开始抽奖之前的动作
          raffleContract.on("RaffleEnter", (player) => {
            console.log("玩家参与抽奖:", player);
          });
          // 期望 player 进入合约，开始抽奖，可以触发事件 RaffleEnter
          expect(await raffle.enterRaffle({ value: raffleEnterFee })).to.emit(
            // emits RaffleEnter event if entered to index player(s) address
            raffle,
            "RaffleEnter"
          );
        });
        it("当抽奖正在进行中，不允许抽奖", async () => {
          // 第一个人进入，抽奖
          await raffle.enterRaffle({ value: raffleEnterFee });

          /* 
						为什么多个player push进来，但是一直只有一个 ? 应该是it的特性，不会受其他 it 方法的影响？。
          		常见以太坊测试框架（如 Hardhat、Truffle）默认会在每个 it 块执行后 ​​回滚链状态到初始快照​​。
           	测试：新链接一个用户，然后使用新用户调用 enterRaffle ，看看players？
           		一个 address[] 的参数，是否会有多个一样的 address，并没有。
					 */
          const players = await raffle.getPlayers();
          console.log({ players }); // 每个 it 永远都是独立的

          // 本地 evm 模拟时间 增加，这里意味着要开始抽奖了？
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          // 开始抽奖
          await raffle.performUpkeep("0x");
          await expect(
            // 第二个人进入抽奖，这时候 raffleState 状态已经是 计算中 了，所以未开启
            raffle.enterRaffle({ value: raffleEnterFee })
          ).to.be.revertedWith("Raffle_NotOpen");
        });
      });
      describe("checkUpkeep", function () {
        it("如果没有足够的 ETH，返回false", async () => {
          // 这时候，合约已经被抽奖提现完成了，合约的 eth 为 0
          // 所以再进来直接调用 check 方法，hasBalance、hasPlayers 应该都是false
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert(!upkeepNeeded);
        });

        it("如果彩票没打开，返回false", async () => {
          await raffle.enterRaffle({ value: raffleEnterFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 5,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          // 这时候上一轮抽奖完毕，新的用户进来，并且开始抽奖，raffleState 为 CALCULATING(1)
          await raffle.performUpkeep("0x"); // changes the state to calculating

          const raffleState = await raffle.getRaffleState(); // stores the new state
          // isOpen 为 false
          const { upkeepNeeded } = await raffle.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert.equal(raffleState.toString() == "1", upkeepNeeded == false);
        });

        it("如果时间不到，返回false", async () => {
          await raffle.enterRaffle({ value: raffleEnterFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) - 5,
          ]); // use a higher number here if this test fails
          await network.provider.request({ method: "evm_mine", params: [] });
          // 时间还在冷却中，用户进去check 也是返回false
          const { upkeepNeeded } = await raffle.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert(!upkeepNeeded);
        });
        it("如果所有条件都达标，返回true", async () => {
          await raffle.enterRaffle({ value: raffleEnterFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 100,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          // 这时候 合约时间到了、isOpen也是构造器中默认的open、hasBalance 是第一个用户转进去的钱、players 是第一个用户
          const { upkeepNeeded } = await raffle.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          // 校验通过，可以抽奖
          assert(upkeepNeeded);
        });
      });

      describe("performUpkeep", function () {
        it("只有checkup 运行为true才通过", async () => {
          await raffle.enterRaffle({ value: raffleEnterFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) - 10,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const tx = await raffle.performUpkeep("0x");
          // 返回的是 bool ？是返回的账单，如果未通过的话 ，会把 Raffle__UpkeepNotNeeded error 抛出
          assert(tx);
        });
        it("checkup 为 false 就 reverts", async () => {
          // 这时候，应该很多条件都不满足，hasBalance、hasPlayer、timePassed 都不满足
          await expect(raffle.performUpkeep("0x")).to.be.revertedWith(
            "Raffle__UpkeepNotNeeded"
          );
        });
        it("如果触发了 requestid 就更新 抽检系统的 状态", async () => {
          await raffle.enterRaffle({ value: raffleEnterFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          // 时间到了，开始抽奖，获取收据，performUpkeep 触发后，会返回一个可以用来mock的 requestId 。
          const txResponse = await raffle.performUpkeep("0x"); // emits requestId
          const txReceipt = await txResponse.wait(1); // waits 1 block
          const raffleState = await raffle.getRaffleState(); // updates state

          // 这是用于 mock的 固定的 requestId
          const requestId = txReceipt.logs[1].args.requestId;

          assert(Number(requestId) > 0);
          assert(raffleState == 1); // 0 = open, 1 = calculating
        });
      });
      describe("fulfillRandomWords", function () {
        beforeEach(async () => {
          await raffle.enterRaffle({ value: raffleEnterFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
        });
        it("可以称为 pickup 之后的运行", async () => {
          // vrfV2Mock 的方法调用需要有  performUpkeep 的 receipt 中的 requestId 用于mock，随意传递 是没用的。
          // 验证：使用上面的真实的 txReceipt.logs[1].args.requestId 来传入，就不会 reverted
          // await expect(
          //   vrfV2Mock.fulfillRandomWords(txReceipt.logs[1].args.requestId, raffle.target) // reverts if not fulfilled
          // ).to.be.revertedWith("nonexistent request");
          await expect(
            vrfV2Mock.fulfillRandomWords(1, raffle.target) // reverts if not fulfilled
          ).to.be.revertedWith("nonexistent request");
        });

        // This test is too big...
        // This test simulates users entering the raffle and wraps the entire functionality of the raffle
        // inside a promise that will resolve if everything is successful.
        // An event listener for the WinnerPicked is set up
        // Mocks of chainlink keepers and vrf coordinator are used to kickoff this winnerPicked event
        // All the assertions are done once the WinnerPicked event is fired
        it("选一个胜利者发钱", async () => {
          const additionalEntrances = 3; // to test
          const startingIndex = 2;
          let startingBalance;
          for (
            let i = startingIndex;
            i < startingIndex + additionalEntrances;
            i++
          ) {
            // i = 2; i < 5; i=i+1
            raffle = raffleContract.connect(accounts[i]);
            await raffle.enterRaffle({ value: raffleEnterFee });
          }
          const startingTimeStamp = await raffle.getLastTimeStamp();

          await new Promise(async (resolve, reject) => {
            // 监听 winner 选中的事件。
            raffle.once("WinnerPicked", async () => {
              console.log("WinnerPicked event fired!");
              try {
                // Now lets get the ending values...
                const recentWinner = await raffle.getRecentWinner();
                const raffleState = await raffle.getRaffleState();
                const winnerBalance = await ethers.provider.getBalance(
                  accounts[2]
                );
                const endingTimeStamp = await raffle.getLastTimeStamp();
                // 刚选出获胜者，这时候，抽奖的玩家已清空，获取 player[0] 应该报错
                await expect(raffle.getPlayer(0)).to.be.reverted;

                // winner 应该是下面 指定的 raffle.target
                assert.equal(recentWinner.toString(), accounts[2].address);

                // 这一轮的中奖者揭晓、下一轮开始
                assert.equal(raffleState, 0);

                // 为什么还需要加上  raffleEnterFee 呢？
                // 三个用户参加，小明小红小白各付了10元给合约，小明中奖后，应该获得 合约池的 30 元，并且参与的 10 元为什么要退回来？
                // 因为一开始 beforeEach 就已经有人进入抽奖了，所以实际 players 是 4 个
                assert.equal(
                  winnerBalance.toString(),
                  startingBalance +
                    (raffleEnterFee * BigInt(additionalEntrances) +
                      raffleEnterFee)
                );
                assert(endingTimeStamp > startingTimeStamp);
                resolve(); // if try passes, resolves the promise
              } catch (e) {
                reject(e); // if try fails, rejects the promise
              }
            });

            // kicking off the event by mocking the chainlink keepers and vrf coordinator
            try {
              console.log("try catch");

              const tx = await raffle.performUpkeep("0x");
              const txReceipt = await tx.wait(1);

              startingBalance = await ethers.provider.getBalance(accounts[2]);

              // hardhat 环境手动触发 fulfillRandomWords 方法
              await vrfV2Mock.fulfillRandomWords(
                // vrfV2mock 固定参数，就是 logs[1] 用户随机数请求的参数
                txReceipt.logs[1].args.requestId,
                raffle.target
              );
            } catch (e) {
              reject(e);
            }
          });
        });
      });
    });
