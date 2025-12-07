// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IComet
 * @notice Interface for Compound V3 Comet (e.g., cUSDCv3)
 */
interface IComet {
    /**
     * @notice Supply an amount of asset to the protocol
     * @param asset The asset to supply
     * @param amount The quantity to supply
     */
    function supply(address asset, uint256 amount) external;

    /**
     * @notice Withdraw an amount of asset from the protocol
     * @param asset The asset to withdraw
     * @param amount The quantity to withdraw
     */
    function withdraw(address asset, uint256 amount) external;

    /**
     * @notice Get the current supply balance with interest for an account
     * @param account The account to query
     * @return The balance of base asset (includes principal + interest)
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @notice Allows or disallows another address to withdraw or transfer on behalf of the sender
     * @param manager The account which will be allowed or disallowed
     * @param isAllowed Whether to allow or disallow
     */
    function allow(address manager, bool isAllowed) external;

    function getUtilization() external view returns (uint256);

    function getSupplyRate(uint256 utilization) external view returns (uint256);
    
}
