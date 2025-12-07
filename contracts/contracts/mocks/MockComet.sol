// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockComet
 * @notice Mock Compound V3 Comet for testing
 * @dev Simulates interest accrual by tracking deposits and adding mock interest
 */
contract MockComet {
    IERC20 public immutable baseToken;

    // Track each user's principal deposit
    mapping(address => uint256) public principals;

    // Mock interest rate (in basis points per call, e.g., 100 = 1% per accrual)
    uint256 public interestRateBps = 100; // 1% per accrual

    // Total interest accrued globally
    uint256 public totalInterestAccrued;

    event Supply(address indexed account, address indexed asset, uint256 amount);
    event Withdraw(address indexed account, address indexed asset, uint256 amount);
    event InterestAccrued(address indexed account, uint256 interest);

    constructor(address _baseToken) {
        baseToken = IERC20(_baseToken);
    }

    /**
     * @notice Supply an amount of asset to the protocol
     * @param asset The asset to supply (must be baseToken)
     * @param amount The quantity to supply
     */
    function supply(address asset, uint256 amount) external {
        require(asset == address(baseToken), "MockComet: invalid asset");
        require(amount > 0, "MockComet: zero amount");

        // Transfer tokens from supplier
        baseToken.transferFrom(msg.sender, address(this), amount);

        // Update principal
        principals[msg.sender] += amount;

        emit Supply(msg.sender, asset, amount);
    }

    /**
     * @notice Withdraw an amount of asset from the protocol
     * @param asset The asset to withdraw (must be baseToken)
     * @param amount The quantity to withdraw
     */
    function withdraw(address asset, uint256 amount) external {
        require(asset == address(baseToken), "MockComet: invalid asset");
        require(amount > 0, "MockComet: zero amount");
        require(balanceOf(msg.sender) >= amount, "MockComet: insufficient balance");

        // Calculate how much to deduct from principal
        uint256 principal = principals[msg.sender];
        uint256 currentBalance = balanceOf(msg.sender);

        // Proportionally reduce principal
        uint256 principalToReduce = (amount * principal) / currentBalance;
        principals[msg.sender] -= principalToReduce;

        // Transfer tokens to user
        baseToken.transfer(msg.sender, amount);

        emit Withdraw(msg.sender, asset, amount);
    }

    /**
     * @notice Get the current supply balance with interest for an account
     * @param account The account to query
     * @return The balance of base asset (includes principal + interest)
     */
    function balanceOf(address account) public view returns (uint256) {
        // Return only the principal (interest is added via accrueInterest or addMockInterest)
        return principals[account];
    }

    /**
     * @notice Manually accrue interest for an account (for testing)
     * @dev In real Compound, this happens automatically
     */
    function accrueInterest(address account) external {
        uint256 principal = principals[account];
        if (principal == 0) return;

        uint256 interest = (principal * interestRateBps) / 10000;
        principals[account] += interest;
        totalInterestAccrued += interest;

        emit InterestAccrued(account, interest);
    }

    /**
     * @notice Set the mock interest rate (only for testing)
     * @param bps Interest rate in basis points (100 = 1%)
     */
    function setInterestRate(uint256 bps) external {
        interestRateBps = bps;
    }

    /**
     * @notice Simulate interest accrual by directly adding interest
     * @param account The account to add interest to
     * @param interestAmount The amount of interest to add
     * @dev This function requires the caller to send USDC to this contract to cover the interest
     */
    function addMockInterest(address account, uint256 interestAmount) external {
        require(principals[account] > 0, "MockComet: no principal");

        // Transfer interest tokens to this contract (simulating borrower payments)
        // In production, this would come from borrowers' interest payments
        baseToken.transferFrom(msg.sender, address(this), interestAmount);

        principals[account] += interestAmount;
        totalInterestAccrued += interestAmount;

        emit InterestAccrued(account, interestAmount);
    }

    /**
     * @notice Allows or disallows another address to withdraw or transfer on behalf of the sender
     * @param manager The account which will be allowed or disallowed
     * @param isAllowed Whether to allow or disallow
     */
    function allow(address manager, bool isAllowed) external {
        // Mock implementation - not needed for basic testing
    }
}
