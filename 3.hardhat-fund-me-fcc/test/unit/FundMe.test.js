const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChain } = require("../../helper-hardhat-config");

!developmentChain.includes(network.name)
  ? describe.skip
  : describe("FundMe", () => {
      let fundMe, mockV3Aggregator, deployer;
      const sendValue = ethers.parseEther("1");
      //   console.log(sendValue, "sendValue");
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        const signer = await ethers.getSigner(deployer);

        if (!developmentChain.includes(network.name)) {
          throw "You need to be on a development chain to run tests";
        }

        console.log("deploying all contracts");
        const deploymentResults = await deployments.fixture(["all"]);

        const fundMeAddress = deploymentResults["FundMe"]?.address;
        fundMe = await ethers.getContractAt("FundMe", fundMeAddress, signer);
        const mockV3AggregatorAddress =
          deploymentResults["MockV3Aggregator"]?.address;
        mockV3Aggregator = await ethers.getContractAt(
          "MockV3Aggregator",
          mockV3AggregatorAddress,
          signer
        );
      });

      describe("constructor", () => {
        it("sets the aggreagtor address correctly", async () => {
          const response = await fundMe.s_priceFeed();
          console.log({ response });

          const address = await mockV3Aggregator.getAddress();

          assert.equal(response, address);
        });
      });

      describe("fund", () => {
        // 不传参数错误的情况
        it("eth-no: fail eth not enougn", async () => {
          // 期望能返回下面的字符串
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });
        // 传递参数，调用fund方法
        it("eth-update: the amount funed data", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);

          assert.equal(response.toString(), sendValue.toString());
        });

        it("adds funder to array", async () => {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.getFunder(0);
          assert.equal(funder, deployer);
        });
      });

      describe("withdraw", () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });

        it("withdraw eth from a single funder", async () => {
          // arrange
          const address = await fundMe.getAddress();
          console.log({ address });

          const startFuncMeBalance = await ethers.provider.getBalance(address);
          const startDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          const tranRes = await fundMe.withdraw();
          const tranReceipt = await tranRes.wait(1);

          const { gasUsed, gasPrice } = tranReceipt;
          const gasCost = gasUsed * gasPrice;

          const endFuncMeBalance = await ethers.provider.getBalance(address);
          const endDeployerBalance = await ethers.provider.getBalance(deployer);

          assert.equal(endFuncMeBalance, 0);
          // 提现前 开发者账户资金 + 合约的资金 = 提现后 开发者账户的资金 + gas 消耗
          assert.equal(
            (startFuncMeBalance + startDeployerBalance).toString(),
            (endDeployerBalance + gasCost).toString()
          );
        });

        it("it allows us to withdraw with multiple funders", async () => {
          const accounts = await ethers.getSigners();
          const address = await fundMe.getAddress();
          for (let i = 0; i < 6; i++) {
            // 测试网随机的测试号
            const account = accounts[i];
            const funcMeConnectedContract = await fundMe.connect(account);
            await funcMeConnectedContract.fund({ value: sendValue });
          }

          // assert
          const startingFundMeBalance = await ethers.provider.getBalance(
            address
          );
          const strartingDeveloperBalance = await ethers.provider.getBalance(
            deployer
          );

          const transactionRes = await fundMe.withdrawCheaper();
          const transactionReceipt = await transactionRes.wait(1);
          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          const endFuncMeBalance = await ethers.provider.getBalance(address);
          const endDeployerBalance = await ethers.provider.getBalance(deployer);

          assert.equal(endFuncMeBalance, 0);
          // 提现前 开发者账户资金 + 合约的资金 = 提现后 开发者账户的资金 + gas 消耗
          assert.equal(
            (startingFundMeBalance + strartingDeveloperBalance).toString(),
            (endDeployerBalance + gasCost).toString()
          );
        });

        it("only owner can withdraw", async () => {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await fundMe.connect(attacker);
          await expect(
            attackerConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(fundMe, "FundMe_NotOwner");
        });
      });
    });
