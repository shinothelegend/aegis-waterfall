// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CheckInAttestation.sol";

/**
 * @title EventTreasury
 * @notice Manages ticket deposits, escrow custody, autonomous attendee refunds, and vendor settlement payouts on Arc Testnet.
 */
contract EventTreasury is AccessControl, ReentrancyGuard {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    struct EventInfo {
        uint256 ticketPriceUSDC; // 6 decimals
        address organizer;
        uint256 eventEndTime;
        bool settled;
        uint256 totalBalance; // current event treasury balance in escrow
    }

    IERC20 public immutable usdcToken;
    CheckInAttestation public immutable attestationContract;

    mapping(bytes32 => EventInfo) private _events;
    mapping(bytes32 => mapping(address => bool)) private _deposits;
    mapping(bytes32 => mapping(address => bool)) private _checkedIn;
    mapping(bytes32 => mapping(address => bool)) private _refunds;

    event EventCreated(bytes32 indexed eventId, uint256 ticketPriceUSDC, address indexed organizer, uint256 eventEndTime);
    event Deposited(bytes32 indexed eventId, address indexed attendee, uint256 amount);
    event CheckedIn(bytes32 indexed eventId, address indexed attendee);
    event Refunded(bytes32 indexed eventId, address indexed attendee, uint256 amount, uint256 tokenId);
    event EventSettled(bytes32 indexed eventId, uint256 totalVendorPayout, uint256 organizerPayout);

    constructor(
        address _usdcToken,
        address _attestationContract,
        address _admin,
        address _agent
    ) {
        require(_usdcToken != address(0), "Invalid USDC token");
        require(_attestationContract != address(0), "Invalid attestation contract");
        require(_admin != address(0), "Invalid admin");
        require(_agent != address(0), "Invalid agent");

        usdcToken = IERC20(_usdcToken);
        attestationContract = CheckInAttestation(_attestationContract);

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(AGENT_ROLE, _agent);
    }

    /**
     * @notice Create a new event with ticket price and end time
     */
    function createEvent(
        bytes32 eventId,
        uint256 ticketPriceUSDC,
        address organizer,
        uint256 eventEndTime
    ) external {
        require(msg.sender == organizer, "Organizer must be the caller");
        require(_events[eventId].organizer == address(0), "Event already exists");
        require(organizer != address(0), "Invalid organizer");
        require(eventEndTime > block.timestamp, "End time must be in the future");

        _events[eventId] = EventInfo({
            ticketPriceUSDC: ticketPriceUSDC,
            organizer: organizer,
            eventEndTime: eventEndTime,
            settled: false,
            totalBalance: 0
        });

        emit EventCreated(eventId, ticketPriceUSDC, organizer, eventEndTime);
    }

    /**
     * @notice Deposit ticket price USDC into event escrow
     */
    function deposit(bytes32 eventId) external nonReentrant {
        EventInfo storage ev = _events[eventId];
        require(ev.organizer != address(0), "Event does not exist");
        require(block.timestamp <= ev.eventEndTime, "Event has ended");
        require(!_deposits[eventId][msg.sender], "Already deposited");

        _deposits[eventId][msg.sender] = true;
        ev.totalBalance += ev.ticketPriceUSDC;

        // Pull USDC from attendee
        require(
            usdcToken.transferFrom(msg.sender, address(this), ev.ticketPriceUSDC),
            "USDC deposit transfer failed"
        );

        emit Deposited(eventId, msg.sender, ev.ticketPriceUSDC);
    }

    /**
     * @notice Verify attendee arrival and trigger check-in
     * @dev Restricted to event organizer or agent
     */
    function checkIn(bytes32 eventId, address attendee) external {
        EventInfo memory ev = _events[eventId];
        require(ev.organizer != address(0), "Event does not exist");
        require(
            msg.sender == ev.organizer || hasRole(AGENT_ROLE, msg.sender),
            "Only organizer or agent can check in"
        );
        require(_deposits[eventId][attendee], "Attendee has not deposited");
        require(!_checkedIn[eventId][attendee], "Attendee already checked in");

        _checkedIn[eventId][attendee] = true;

        emit CheckedIn(eventId, attendee);
    }

    /**
     * @notice Autonomous refund triggered by agent when check-in is verified
     * @dev Only callable by AGENT_ROLE. Mints check-in attestation SBT.
     */
    function refund(bytes32 eventId, address attendee) external onlyRole(AGENT_ROLE) nonReentrant {
        EventInfo storage ev = _events[eventId];
        require(ev.organizer != address(0), "Event does not exist");
        require(_deposits[eventId][attendee], "No deposit found");
        require(_checkedIn[eventId][attendee], "Attendee not checked in");
        require(!_refunds[eventId][attendee], "Already refunded");
        require(ev.totalBalance >= ev.ticketPriceUSDC, "Insufficient event balance");

        _refunds[eventId][attendee] = true;
        ev.totalBalance -= ev.ticketPriceUSDC;

        // Mint soulbound attestation badge
        uint256 tokenId = attestationContract.mint(attendee, eventId);

        // Refund the ticket price in USDC
        require(usdcToken.transfer(attendee, ev.ticketPriceUSDC), "Refund transfer failed");

        emit Refunded(eventId, attendee, ev.ticketPriceUSDC, tokenId);
    }

    /**
     * @notice Settle vendor payouts and organizer profit after event ends
     * @dev Only callable by AGENT_ROLE after eventEndTime
     */
    function settleEvent(
        bytes32 eventId,
        address[] calldata vendors,
        uint256[] calldata amounts
    ) external onlyRole(AGENT_ROLE) nonReentrant {
        EventInfo storage ev = _events[eventId];
        require(ev.organizer != address(0), "Event does not exist");
        require(block.timestamp > ev.eventEndTime, "Event has not ended yet");
        require(!ev.settled, "Event already settled");
        require(vendors.length == amounts.length, "Arrays length mismatch");

        uint256 totalVendorPayout = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalVendorPayout += amounts[i];
        }

        require(ev.totalBalance >= totalVendorPayout, "Payout sum exceeds escrow balance");
        ev.settled = true;

        uint256 organizerPayout = ev.totalBalance - totalVendorPayout;
        ev.totalBalance = 0;

        // Pay vendors
        for (uint256 i = 0; i < vendors.length; i++) {
            if (amounts[i] > 0) {
                require(usdcToken.transfer(vendors[i], amounts[i]), "Vendor payout failed");
            }
        }

        // Pay organizer remaining funds
        if (organizerPayout > 0) {
            require(usdcToken.transfer(ev.organizer, organizerPayout), "Organizer payout failed");
        }

        emit EventSettled(eventId, totalVendorPayout, organizerPayout);
    }

    // --- View Functions ---

    function getEvent(bytes32 eventId) external view returns (
        uint256 ticketPriceUSDC,
        address organizer,
        uint256 eventEndTime,
        bool settled,
        uint256 totalBalance
    ) {
        EventInfo memory ev = _events[eventId];
        return (ev.ticketPriceUSDC, ev.organizer, ev.eventEndTime, ev.settled, ev.totalBalance);
    }

    function getEventBalance(bytes32 eventId) external view returns (uint256) {
        return _events[eventId].totalBalance;
    }

    function getDepositStatus(bytes32 eventId, address attendee) external view returns (bool) {
        return _deposits[eventId][attendee];
    }

    function getCheckInStatus(bytes32 eventId, address attendee) external view returns (bool) {
        return _checkedIn[eventId][attendee];
    }

    function getRefundStatus(bytes32 eventId, address attendee) external view returns (bool) {
        return _refunds[eventId][attendee];
    }
}
