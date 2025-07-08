// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract GiftCard {
    // Each gift card hash maps to the buyer's address
    mapping(bytes32 => address) private codeOwner;

    // Tracks if a gift card has been redeemed
    mapping(bytes32 => bool) public redeemed;

    // Store the value associated with each gift card
    mapping(bytes32 => uint256) private giftCardValue;

    // Stores when each card was purchased (in block timestamp)
    mapping(bytes32 => uint256) private purchaseTimestamp;

    // Stores user's gift card hashes
    mapping(address => bytes32[]) private userGiftCards;

    // Constants
    uint256 public constant MIN_PURCHASE = 0.001 ether;
    uint256 public constant EXPIRATION_TIME = 30 days;

    // 🛍️ Purchase a gift card by sending ETH and a code hash
    function buy(bytes32 codeHash) public payable {
        require(msg.value >= MIN_PURCHASE, "Send at least 0.001 ETH");
        require(codeOwner[codeHash] == address(0), "Code already used");

        codeOwner[codeHash] = msg.sender;
        userGiftCards[msg.sender].push(codeHash);
        giftCardValue[codeHash] = msg.value;
        purchaseTimestamp[codeHash] = block.timestamp;
        redeemed[codeHash] = false;
    }

    // 🎁 Redeem a card — only if not expired or redeemed, and owned by caller
    function redeem(bytes32 codeHash) public {
        require(codeOwner[codeHash] == msg.sender, "Not your gift card");
        require(!redeemed[codeHash], "Already redeemed");
        require(
            block.timestamp <= purchaseTimestamp[codeHash] + EXPIRATION_TIME,
            "Card expired"
        );

        uint256 amount = giftCardValue[codeHash];
        require(amount > 0, "Invalid value");

        redeemed[codeHash] = true;
        // 💸 Transfer ETH to the redeemer
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "ETH transfer failed");
    }

    // 📋 View cards owned by caller
    function getGiftCards() public view returns (bytes32[] memory) {
        return userGiftCards[msg.sender];
    }

    // 👀 See who owns a specific card
    function whoOwns(bytes32 codeHash) public view returns (address) {
        return codeOwner[codeHash];
    }

    // ⏳ View timestamp when the card was purchased
    function getPurchaseTime(bytes32 codeHash) public view returns (uint256) {
        return purchaseTimestamp[codeHash];
    }
}
