// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./YTVideoAPIConsumer.sol";

/// @title YouTube Video NFT, consumes YouTube API through and oracle to check minter controls the video
/// @author Roberto García (https://rhizomik.net/~roberto)
contract YTVideoNFT is Ownable, Pausable, ERC721URIStorage, YTVideoAPIConsumer {

    /// @notice Editions, i.e. amount of NFTs minted, for each YouTube video.
    mapping(string => uint16) public edition;

    struct RequestedNFT {
        address requester;
        string videoId;
        uint256 tokenId;
        string metadataHash;
    }
    mapping(bytes32 => RequestedNFT) private requestedNFTs;

    event YTVNFTMinted(address indexed minter, string videoId, uint16 edition, uint256 tokenId, string tokenUri);

    constructor(address _oracle, string memory _jobId, uint256 _fee, address _link)
    ERC721("YouTubeVideoNFT", "YTVNFT")
    YTVideoAPIConsumer(_oracle, _jobId, _fee, _link) {}

    // Metadata available from contract URI:
    //    {
    //        "name": "YouTube Video NFTs",
    //        "description": "NFTs minted after proving ownership of the corresponding YouTube video, which is checked
    //                        through an Oracle that consumes YouTube's API. They can be transferred to grant the
    //                        rights specified in the individual NFT metadata.",
    //        "image": "ipfs://QmZSJovM5n8q1TxFSCpxL7GAga4nM6poWMn8uGoEpdU25r",
    //        "external_link": "https://ytvideonft.rhizomik.net",
    //        "seller_fee_basis_points": 100,
    //        "fee_recipient": "0x0650064Cb37fA2728d7AD531072F65417c22219c"
    //    }
    function contractURI() public pure returns (string memory) {
        return "ipfs://QmSCmcDtkkQpknosvpwj765Zy78mJyszEqfe8cWfkurUMJ";
    }

    /// @notice Mint a NFT for the YouTube video identified by `videoId`, after checking that its description includes
    /// the part of the token identifier common to all its editions.
    /// @dev The oracle checks through YouTube Video API if the video description contains the token identifier digits
    /// corresponding to the `videoId`.
    /// @param videoId The identifier of a YouTube video for which the NFT will be minted
    /// @param metadataHash The IPFS hash pointing to the NFT metadata
    /// @return The identifier of the minted token
    function mint(string memory videoId, string memory metadataHash) public whenNotPaused() returns (uint256)
    {
        (uint96 videoTokenId, uint256 tokenId) = generateTokenId(videoId);
        bytes32 requestId = check(videoId, videoTokenId);
        requestedNFTs[requestId] = RequestedNFT(msg.sender, videoId, tokenId, metadataHash);
        return tokenId;
    }

    /// @notice Process the oracle callback for query `requestId` and mint the corresponding NFT if `valid`
    /// @param requestId The identifier of the oracle query
    /// @param valid True if the video description contains the video token identifier
    function processVerification(bytes32 requestId, bool valid) override public {
        YTVideoAPIConsumer.processVerification(requestId, valid);
        if (valid) {
            RequestedNFT memory nft = requestedNFTs[requestId];
            _mint(nft.requester, nft.tokenId);
            _setTokenURI(nft.tokenId, nft.metadataHash);
            edition[nft.videoId]++;
            emit YTVNFTMinted(nft.requester, nft.videoId, edition[nft.videoId], nft.tokenId, tokenURI(nft.tokenId));
        }
    }

    /// @notice Generate a unique tokenId based on `videoId` and the number of editions for that video.
    /// @dev The tokenId is an integer with the first 27 digits based on converting the `videoId` 11 bytes
    /// to and uint96 and the last 5 digits reserved for the edition, and uint16. This way, all the tokenIds for the
    /// same `videoId` share the first 27 digits of the tokenId.
    /// @param videoId The identifier of the YouTube video corresponding to the token
    /// @return videoTokenId The part of the NFT tokenId depending on the YouTube Video, independent from token editions
    /// @return tokenId The full NFT identifier, including editions of the same YouTube Video NFT
    function generateTokenId(string memory videoId) public view returns(uint96 videoTokenId, uint256 tokenId) {
        bytes memory videoIdBytes = bytes(videoId);
        require(videoIdBytes.length == 11, "YouTube videoId should be 11 ASCII characters long");
        videoTokenId = _toUint96(abi.encodePacked(hex"00", videoIdBytes), 0);
        tokenId = uint256(videoTokenId) * 100000 + edition[videoId] + 1;
    }

    /// @dev Base URI for computing {tokenURI}.
    function _baseURI() override internal view virtual returns (string memory) {
        return "ipfs://";
    }

    /// @dev Reused from https://github.com/GNSPS/solidity-bytes-utils/blob/master/contracts/BytesLib.sol
    function _toUint96(bytes memory _bytes, uint256 _start) internal pure returns (uint96) {
        require(_bytes.length >= _start + 12, "toUint96_outOfBounds");
        uint96 tempUint;
        assembly {
            tempUint := mload(add(add(_bytes, 0xc), _start))
        }
        return tempUint;
    }
}
