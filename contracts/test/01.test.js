const helpers = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const fs = require('fs');

const deployments = JSON.parse(fs.readFileSync('./deployments.json', 'utf8'));

const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS;
const RELAYER_ADDRESS = process.env.RELAYER_ADDRESS;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

let deployer, relayer;
let bridge, omniVault;
let bridge_user;

let snapshotId;

describe('OmniVault test', () => {

  before(async () => {
    const chainId = (await ethers.provider.getNetwork()).chainId.toString();
    console.log(`Current network:  ${chainId}`);

    await helpers.mine();

    deployer = await ethers.getImpersonatedSigner(DEPLOYER_ADDRESS);
    relayer = await ethers.getImpersonatedSigner(RELAYER_ADDRESS);

    bridge = await ethers.getContractAt('Bridge', deployments[chainId].BridgeProxy, deployer);
    omniVault = await ethers.getContractAt('OmniVault', deployments[chainId].OmniVaultProxy, deployer);

    bridge_user = await ethers.getImpersonatedSigner(bridge.target);
    
    await helpers.setBalance(bridge_user.address, ethers.parseEther('100'));
    await helpers.setBalance(omniVault.target, ethers.parseEther('100'));
    await helpers.setBalance(deployer.address, ethers.parseEther('100'));
    await helpers.setBalance(relayer.address, ethers.parseEther('100'));
  });

  beforeEach(async () => {
    snapshotId = await helpers.takeSnapshot();
  });

  afterEach(async () => {
    await snapshotId.restore();
  });

  describe('setup', () => {

    it('set USDC', async () => {
      await deployer.sendTransaction({
        to: bridge.target,
        data: '0x251bf0f1000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000aa36a7000000000000000000000000000000000000000000000000000000000000aa020000000000000000000000006d9ffe31dfc72e4fd486db5701f82d76ccb1c8ea00000000000000000000000000000000000000000000000000000000000000000000000000000000000000006d9ffe31dfc72e4fd486db5701f82d76ccb1c8ea00000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000064daa1da1f0000000000000000000000000000000000000000000000000000000000aa36a700000000000000000000000000000000000000000000000000000000000f423f0000000000000000000000000000000000000000000000000000000003223e2a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041ea3544d04dfc3ae6e60762293b4100a8acb90ec7ad16dd4f6807f2d60f40d59247d329017debd138428021622525a0dbb5e695ac6b1a421c883a5cf0c36f022f1c00000000000000000000000000000000000000000000000000000000000000'
      });
    });

  });

});
