// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal EIP-7702 delegate contract for testing Eden session-key deploys.
/// @dev When an EOA delegates to this contract, storage writes happen in the EOA account.
contract EdenSessionAccount {
    address public sessionKey;
    uint64 public expiresAt;
    bytes32 public allowedInitCodeHash;
    uint256 public deploysRemaining;
    address public lastDeployment;

    event SessionInstalled(
        address indexed sessionKey,
        uint64 expiresAt,
        bytes32 allowedInitCodeHash,
        uint256 deploysRemaining
    );
    event SessionRevoked();
    event Deployed(address indexed deployed, bytes32 initCodeHash);

    error OnlyOwner();
    error OnlySessionKey();
    error SessionExpired();
    error NoDeploysRemaining();
    error InitCodeNotAllowed();
    error DeployFailed();

    modifier onlyOwner() {
        if (msg.sender != address(this)) revert OnlyOwner();
        _;
    }

    modifier onlySessionKey() {
        if (msg.sender != sessionKey) revert OnlySessionKey();
        if (block.timestamp > expiresAt) revert SessionExpired();
        _;
    }

    function installSession(
        address key,
        uint64 expiry,
        bytes32 initCodeHash,
        uint256 maxDeploys
    ) external onlyOwner {
        sessionKey = key;
        expiresAt = expiry;
        allowedInitCodeHash = initCodeHash;
        deploysRemaining = maxDeploys;

        emit SessionInstalled(key, expiry, initCodeHash, maxDeploys);
    }

    function revokeSession() external onlyOwner {
        sessionKey = address(0);
        expiresAt = 0;
        allowedInitCodeHash = bytes32(0);
        deploysRemaining = 0;

        emit SessionRevoked();
    }

    function deploy(bytes calldata initCode) external onlySessionKey returns (address deployed) {
        if (deploysRemaining == 0) revert NoDeploysRemaining();

        bytes32 initCodeHash = keccak256(initCode);
        if (initCodeHash != allowedInitCodeHash) revert InitCodeNotAllowed();

        deploysRemaining -= 1;

        bytes memory code = initCode;
        assembly {
            deployed := create(0, add(code, 0x20), mload(code))
        }
        if (deployed == address(0)) revert DeployFailed();

        lastDeployment = deployed;
        emit Deployed(deployed, initCodeHash);
    }
}
