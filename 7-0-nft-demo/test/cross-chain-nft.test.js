const { getNamedAccounts, deployments, ethers } = require("hardhat");
const { expect } = require("chai");

let firstAccount;
let nft;
let wnft;
let poolLnR;
let poolBnM;
let chainSelector;

before(async function () {
  firstAccount = (await getNamedAccounts()).firstAccount;
  await deployments.fixture(["all"]);
  nft = await ethers.getContract("MyToken", firstAccount);
  wnft = await ethers.getContract("WrapperMyToken", firstAccount);
  poolLnR = await ethers.getContract("NFTPoolLockAndRelease", firstAccount);
  poolBnM = await ethers.getContract("NFTPoolBurnAndMint", firstAccount);
  ccipLocalSimulator = await ethers.getContract(
    "CCIPLocalSimulator",
    firstAccount
  );
  chainSelector = (await ccipLocalSimulator.configuration()).chainSelector_;
});

describe("source chain => dest chain tests", async function () {
  it("test if the nft can be minted successfully", async function () {
    // get nft
    await nft.safeMint(firstAccount);
    // check the owner
    const ownerOfNft = await nft.ownerOf(0);
    expect(ownerOfNft).to.equal(firstAccount);
  });

  // it("test if user can lock the nft in the pool and send ccip message on cource chain", async function () {
  //   const approveNft = await nft.approve(poolLnR.target, 0);
  //   approveNft.wait(1);

  //   const ccipTx = await ccipLocalSimulator.requestLinkFromFaucet(
  //     poolLnR.target,
  //     ethers.parseEther("10")
  //   );
  //   ccipTx.wait(1);


  //   await poolLnR.lockAndSendNFT(
  //     0,
  //     firstAccount,
  //     chainSelector,
  //     poolBnM.target
  //   );
  //   const owner = await nft.ownerOf(0);
  //   expect(owner).to.equal(poolLnR);
  // });
  it("transfer NFT from source chain to dest chain, check if the nft is locked", async function () {
    // const tx = await ccipLocalSimulator.requestLinkFromFaucet(
    //   poolLnR.target,
    //   ethers.parseEther("10")
    // );
    // tx.wait(6);

    // lock and send with CCIP
    await nft.approve(poolLnR.target, 0);
    await poolLnR.lockAndSendNFT(
      0,
      firstAccount,
      chainSelector,
      poolBnM.target
    );

    const fundMeBalance = await ethers.provider.getBalance(poolLnR.target);
    console.log(`balance of the fundme is ${fundMeBalance}`);

    // check if owner of nft is pool's address
    const newOwner = await nft.ownerOf(0);
    console.log("test");
    expect(newOwner).to.equal(poolLnR.target);
  });
});
