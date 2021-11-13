// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract YTVideoAPIConsumer is ChainlinkClient {
    using Chainlink for Chainlink.Request;
    using Strings for uint96;

    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    struct YTVerification {
        string videoId;
        address requester;
        uint96 videoTokenId;
        bool isPending;
        bool isVerified;
    }

    mapping(bytes32 => YTVerification) public requests;

    event VerificationRequest(bytes32 indexed requestId, string videoId, uint256 tokenId);
    event YouTubeVideoVerification(bytes32 indexed requestId, string videoId, bool isVerified);

    constructor(address _oracle, string memory _jobId, uint256 _fee, address _link) {
        if (_link == address(0)) {
            setPublicChainlinkToken();
        } else {
            setChainlinkToken(_link);
        }
        oracle = _oracle;
        jobId = stringToBytes32(_jobId);
        fee = _fee;
    }

    /// @notice Check using an oracle if the YouTube `videoId` is controlled by NFT minter and
    /// YT Video description includes the NFT `tokenId`
    /// @dev The oracle checks through YouTube Video API if the video description contains the token identifier
    /// @param videoId The identifier of a YouTube video to be checked
    /// @param videoTokenId The part of the NFT tokenId depending on the YouTube Video, independent from token editions
    /// @return requestId The id for the request sent to the oracle
    function check(string memory videoId, uint96 videoTokenId) public returns (bytes32 requestId) {
        Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.processVerification.selector);
        req.add("id", videoId);
        req.add("hash", videoTokenId.toString());
        requestId = sendChainlinkRequestTo(oracle, req, fee);
        requests[requestId] = YTVerification(videoId, msg.sender, videoTokenId, true, false);
        emit VerificationRequest(requestId, videoId, videoTokenId);
        return requestId;
    }

    /// @notice Process the oracle callback for query `requestId` to check if `valid`
    /// @param requestId The identifier of the oracle query
    /// @param valid True if the video description contains the token identifier
    function processVerification(bytes32 requestId, bool valid) virtual public recordChainlinkFulfillment(requestId) {
        require(requests[requestId].isPending, "Oracle request already resolved");
        requests[requestId].isPending = false;
        requests[requestId].isVerified = valid;
        emit YouTubeVideoVerification(requestId, requests[requestId].videoId, valid);
    }

    function stringToBytes32(string memory source) public pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        assembly {
            result := mload(add(source, 32))
        }
    }
}
