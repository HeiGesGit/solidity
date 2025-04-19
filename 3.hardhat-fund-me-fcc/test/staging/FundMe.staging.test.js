const { assert } = require("chai");
const { network, ethers, getNamedAccounts } = require("hardhat");
const { developmentChain } = require("../../helper-hardhat-config");

developmentChain.includes(network.name)
  ? describe.skip
  : describe("FundMe Staging Tests", function () {
      let deployer, fundMe, fundMeAddress;
      const sendValue = ethers.parseEther("0.1");
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        const signer = await ethers.getSigner(deployer);

        const deploymentResults = await deployments.fixture(["all"]);

        fundMeAddress = deploymentResults["FundMe"]?.address;
        fundMe = await ethers.getContractAt("FundMe", fundMeAddress, signer);
      });

      it("allows people to fund and withdraw", async function () {
        const fundTxResponse = await fundMe.fund({ value: sendValue });
        await fundTxResponse.wait(1);
        const withdrawTxResponse = await fundMe.withdraw();
        await withdrawTxResponse.wait(1);

        const endingFundMeBalance = await ethers.provider.getBalance(
          fundMeAddress
        );
        console.log(
          endingFundMeBalance.toString() +
            " should equal 0, running assert equal..."
        );
        assert.equal(endingFundMeBalance.toString(), "0");
      });
    });
