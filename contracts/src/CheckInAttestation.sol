// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title CheckInAttestation
 * @notice Soulbound ERC-721 token representing verified event check-in and deposit refund audit trail.
 */
contract CheckInAttestation is ERC721, Ownable {
    using Strings for uint256;
    using Strings for address;

    struct AttestationInfo {
        bytes32 eventId;
        address attendee;
        uint256 timestamp;
        string refundTxHash;
    }

    uint256 private _nextTokenId;
    address public agentAddress;
    mapping(uint256 => AttestationInfo) private _attestations;

    event AttestationMinted(uint256 indexed tokenId, address indexed attendee, bytes32 indexed eventId);
    event RefundTxHashUpdated(uint256 indexed tokenId, string txHash);
    event AgentAddressUpdated(address indexed newAgent);

    constructor(address initialOwner) ERC721("Checkpoint Attestation", "CKPT") Ownable(initialOwner) {
        _nextTokenId = 1;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner() || msg.sender == agentAddress, "Not authorized");
        _;
    }

    /**
     * @notice Set the agent address authorized to update refund hashes
     */
    function setAgentAddress(address _agentAddress) external onlyOwner {
        agentAddress = _agentAddress;
        emit AgentAddressUpdated(_agentAddress);
    }

    /**
     * @notice Mint a new attestation
     * @dev Only callable by the owner (the EventTreasury contract)
     */
    function mint(address attendee, bytes32 eventId) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(attendee, tokenId);

        _attestations[tokenId] = AttestationInfo({
            eventId: eventId,
            attendee: attendee,
            timestamp: block.timestamp,
            refundTxHash: ""
        });

        emit AttestationMinted(tokenId, attendee, eventId);
        return tokenId;
    }

    /**
     * @notice Update the refund transaction hash on-chain once complete
     * @dev Callable by either treasury owner or the agent
     */
    function setRefundTxHash(uint256 tokenId, string calldata txHash) external onlyAuthorized {
        require(_ownerOf(tokenId) != address(0), "Attestation does not exist");
        _attestations[tokenId].refundTxHash = txHash;
        emit RefundTxHashUpdated(tokenId, txHash);
    }

    /**
     * @notice Get attestation details
     */
    function getAttestation(uint256 tokenId) external view returns (
        bytes32 eventId,
        address attendee,
        uint256 timestamp,
        string memory refundTxHash
    ) {
        require(_ownerOf(tokenId) != address(0), "Attestation does not exist");
        AttestationInfo memory info = _attestations[tokenId];
        return (info.eventId, info.attendee, info.timestamp, info.refundTxHash);
    }

    /**
     * @notice Disables token transfers by overriding _update to revert
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address previousOwner = super._update(to, tokenId, auth);
        // Only allow minting (previousOwner is address(0)) and burning (to is address(0))
        if (previousOwner != address(0) && to != address(0)) {
            revert("CheckpointAttestation: Soulbound token cannot be transferred");
        }
        return previousOwner;
    }

    /**
     * @notice Generate on-chain SVG representation of the badge
     */
    function generateSVG(uint256 tokenId) public view returns (string memory) {
        AttestationInfo memory info = _attestations[tokenId];
        string memory eventIdStr = uint256(info.eventId).toHexString(32);
        string memory attendeeStr = info.attendee.toHexString();
        string memory dateStr = info.timestamp.toString();
        
        string memory txHashStr = bytes(info.refundTxHash).length > 0 
            ? info.refundTxHash 
            : "Processing Autonomous Refund...";

        return string(abi.encodePacked(
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='100%' height='100%'>",
            "<defs>",
            "<linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'>",
            "<stop offset='0%' stop-color='#0f172a'/>",
            "<stop offset='50%' stop-color='#1e1b4b'/>",
            "<stop offset='100%' stop-color='#311042'/>",
            "</linearGradient>",
            "<linearGradient id='glow' x1='0%' y1='0%' x2='100%' y2='100%'>",
            "<stop offset='0%' stop-color='#a855f7'/>",
            "<stop offset='100%' stop-color='#06b6d4'/>",
            "</linearGradient>",
            "</defs>",
            "<rect width='400' height='400' fill='url(#bg)' rx='24' stroke='url(#glow)' stroke-width='4'/>",
            "<circle cx='200' cy='120' r='60' fill='none' stroke='url(#glow)' stroke-width='2' stroke-dasharray='5,5'/>",
            "<path d='M170 120 L190 140 L230 100' fill='none' stroke='#06b6d4' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/>",
            "<text x='200' y='210' font-family='Courier New, monospace' font-size='22' fill='#ffffff' font-weight='bold' text-anchor='middle'>CHECKPOINT BADGE</text>",
            "<text x='200' y='230' font-family='Arial, sans-serif' font-size='12' fill='#94a3b8' text-anchor='middle'>Verified Attendee Proof</text>",
            "<line x1='40' y1='250' x2='360' y2='250' stroke='#334155' stroke-width='1'/>",
            "<text x='50' y='275' font-family='Arial, sans-serif' font-size='11' fill='#94a3b8'>EVENT ID:</text>",
            "<text x='130' y='275' font-family='Courier New, monospace' font-size='10' fill='#ffffff'>", 
            substring(eventIdStr, 0, 8), "...", substring(eventIdStr, 56, 66), "</text>",
            "<text x='50' y='300' font-family='Arial, sans-serif' font-size='11' fill='#94a3b8'>ATTENDEE:</text>",
            "<text x='130' y='300' font-family='Courier New, monospace' font-size='10' fill='#ffffff'>", 
            substring(attendeeStr, 0, 8), "...", substring(attendeeStr, 34, 42), "</text>",
            "<text x='50' y='325' font-family='Arial, sans-serif' font-size='11' fill='#94a3b8'>TIMESTAMP:</text>",
            "<text x='130' y='325' font-family='Courier New, monospace' font-size='10' fill='#ffffff'>", dateStr, "</text>",
            "<text x='50' y='350' font-family='Arial, sans-serif' font-size='11' fill='#94a3b8'>REFUND TX:</text>",
            "<text x='130' y='350' font-family='Courier New, monospace' font-size='9' fill='#a855f7'>", 
            bytes(txHashStr).length > 20 ? string(abi.encodePacked(substring(txHashStr, 0, 8), "...", substring(txHashStr, bytes(txHashStr).length - 8, bytes(txHashStr).length))) : txHashStr, 
            "</text>",
            "</svg>"
        ));
    }

    /**
     * @notice Get metadata URI of a token (on-chain JSON)
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        AttestationInfo memory info = _attestations[tokenId];
        
        string memory svg = generateSVG(tokenId);
        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name": "Checkpoint Attestation #', tokenId.toString(), '",',
            '"description": "On-chain proof of check-in and deposit refund justification for Checkpoint on Arc.",',
            '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
            '"attributes": [',
                '{"trait_type": "Event ID", "value": "', uint256(info.eventId).toHexString(32), '"},',
                '{"trait_type": "Attendee", "value": "', info.attendee.toHexString(), '"},',
                '{"trait_type": "Timestamp", "value": "', info.timestamp.toString(), '"},',
                '{"trait_type": "Refund Status", "value": "', bytes(info.refundTxHash).length > 0 ? "Refunded" : "Processing", '"},',
                '{"trait_type": "Refund Tx Hash", "value": "', info.refundTxHash, '"}',
            ']}'
        ))));

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    /**
     * @dev Helper to get a substring of a string
     */
    function substring(string memory str, uint256 startIndex, uint256 endIndex) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        require(startIndex <= endIndex && endIndex <= strBytes.length, "Invalid range");
        bytes memory result = new bytes(endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }
}
