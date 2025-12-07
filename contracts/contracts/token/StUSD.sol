// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./StERC20Upgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

contract StUSD is StERC20Upgradeable, Ownable2StepUpgradeable {

    address public omniVault;

    event InterestApplied(uint256 totalSupply);

    modifier onlyOmniVault() {
        require(msg.sender == omniVault, "only OmniVault contract");
        _;
    }

    constructor() {
        _transferOwnership(msg.sender);
    }

    function initialize() external initializer {
        _transferOwnership(msg.sender);
        __ERC20_init("Optimized Yield USD", "osyUSD");
    }

    function setOmniVault(address _omniVault) external onlyOwner {
        omniVault = _omniVault;
    }
    /**
        * @dev Mint new stUSD tokens. Increases share amount of user, totalShares and totalPooledUSD
        * @param account The account to mint tokens to
        * @param amount The amount of tokens to mint
        *
        * Requirements:
        * - onlyOmniVault
        *
    */
    function mint(address account, uint256 amount) external onlyOmniVault {
        _mint(account, amount);
    }

    /**
        * @dev Increase totalPooledUSD. Used to apply interest to totalPooledUSD
        * @param amount The amount of USD to increase totalPooledUSD by
        *
        * Requirements:
        * - onlyOmniVault
        *
    */
    function applyInterest(uint256 amount) external onlyOmniVault {
        uint256 totalStUSD = totalSupply();
        require(
            amount > totalStUSD,
            "omniVault: no interest to distribute"
        );
        _increaseTotalPooledUSD(amount - totalStUSD);
        emit InterestApplied(amount);
    }

    /**
 * @dev See {IERC20-burn}.
     */
    function burnFrom(address account, uint256 amount) external onlyOmniVault {
        _burn(account, amount);
    }

}
