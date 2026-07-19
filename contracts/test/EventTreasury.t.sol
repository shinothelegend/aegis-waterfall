// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/EventTreasury.sol";
import "../src/CheckInAttestation.sol";
import "../src/MockUSDC.sol";

contract EventTreasuryTest is Test {
    EventTreasury public treasury;
    CheckInAttestation public attestation;
    MockUSDC public usdc;

    address public admin = address(0x1);
    address public agent = address(0x2);
    address public organizer = address(0x3);
    address public attendee = address(0x4);
    address public vendor1 = address(0x5);
    address public vendor2 = address(0x6);

    bytes32 public eventId = keccak256("hackathon_2026");
    uint256 public ticketPrice = 50 * 10**6; // 50 USDC
    uint256 public eventEndTime;

    function setUp() public {
        eventEndTime = block.timestamp + 1 days;

        // Deploy USDC
        usdc = new MockUSDC();

        // Deploy CheckInAttestation with temporary owner (this contract)
        attestation = new CheckInAttestation(address(this));

        // Deploy EventTreasury
        treasury = new EventTreasury(
            address(usdc),
            address(attestation),
            admin,
            agent
        );

        // Grant agent address authority in attestation contract
        attestation.setAgentAddress(agent);

        // Transfer ownership of CheckInAttestation to EventTreasury
        attestation.transferOwnership(address(treasury));

        // Fund attendee with USDC
        usdc.mint(attendee, 100 * 10**6);
    }

    function testCreateEvent() public {
        bytes32 newEventId = keccak256("new_event");
        uint256 endTime = block.timestamp + 2 days;

        vm.prank(organizer);
        treasury.createEvent(newEventId, ticketPrice, organizer, endTime);

        (uint256 price, address org, uint256 end, bool settled, uint256 bal) = treasury.getEvent(newEventId);
        assertEq(price, ticketPrice);
        assertEq(org, organizer);
        assertEq(end, endTime);
        assertEq(settled, false);
        assertEq(bal, 0);
    }

    function test_RevertIfCreateEventByNonOrganizer() public {
        bytes32 newEventId = keccak256("new_event_fail");
        uint256 endTime = block.timestamp + 2 days;

        vm.expectRevert("Organizer must be the caller");
        vm.prank(attendee); // attendee is not the organizer
        treasury.createEvent(newEventId, ticketPrice, organizer, endTime);
    }

    function testDeposit() public {
        vm.prank(organizer);
        treasury.createEvent(eventId, ticketPrice, organizer, eventEndTime);

        vm.startPrank(attendee);
        usdc.approve(address(treasury), ticketPrice);
        treasury.deposit(eventId);
        vm.stopPrank();

        assertTrue(treasury.getDepositStatus(eventId, attendee));
        assertEq(treasury.getEventBalance(eventId), ticketPrice);
        assertEq(usdc.balanceOf(address(treasury)), ticketPrice);
    }

    function testCheckIn() public {
        vm.prank(organizer);
        treasury.createEvent(eventId, ticketPrice, organizer, eventEndTime);

        vm.startPrank(attendee);
        usdc.approve(address(treasury), ticketPrice);
        treasury.deposit(eventId);
        vm.stopPrank();

        // Only organizer or agent can check in
        vm.prank(organizer);
        treasury.checkIn(eventId, attendee);

        assertTrue(treasury.getCheckInStatus(eventId, attendee));
    }

    function testCheckInByAgent() public {
        vm.prank(organizer);
        treasury.createEvent(eventId, ticketPrice, organizer, eventEndTime);

        vm.startPrank(attendee);
        usdc.approve(address(treasury), ticketPrice);
        treasury.deposit(eventId);
        vm.stopPrank();

        vm.prank(agent);
        treasury.checkIn(eventId, attendee);

        assertTrue(treasury.getCheckInStatus(eventId, attendee));
    }

    function test_RevertIfCheckInByStranger() public {
        vm.prank(organizer);
        treasury.createEvent(eventId, ticketPrice, organizer, eventEndTime);

        vm.startPrank(attendee);
        usdc.approve(address(treasury), ticketPrice);
        treasury.deposit(eventId);
        vm.stopPrank();

        vm.expectRevert("Only organizer or agent can check in");
        vm.prank(attendee); // attendee is not organizer or agent
        treasury.checkIn(eventId, attendee);
    }

    function testAutonomousRefund() public {
        vm.prank(organizer);
        treasury.createEvent(eventId, ticketPrice, organizer, eventEndTime);

        vm.startPrank(attendee);
        usdc.approve(address(treasury), ticketPrice);
        treasury.deposit(eventId);
        vm.stopPrank();

        vm.prank(organizer);
        treasury.checkIn(eventId, attendee);

        // Refund by agent
        uint256 attendeeBalanceBefore = usdc.balanceOf(attendee);
        
        vm.prank(agent);
        treasury.refund(eventId, attendee);

        uint256 attendeeBalanceAfter = usdc.balanceOf(attendee);
        assertEq(attendeeBalanceAfter - attendeeBalanceBefore, ticketPrice);
        assertTrue(treasury.getRefundStatus(eventId, attendee));
        assertEq(treasury.getEventBalance(eventId), 0);

        // Attestation check
        assertEq(attestation.balanceOf(attendee), 1);
        
        // Check tokenURI structure
        string memory uri = attestation.tokenURI(1);
        assertTrue(bytes(uri).length > 0);
    }

    function test_RevertIfRefundByNonAgent() public {
        vm.prank(organizer);
        treasury.createEvent(eventId, ticketPrice, organizer, eventEndTime);

        vm.startPrank(attendee);
        usdc.approve(address(treasury), ticketPrice);
        treasury.deposit(eventId);
        vm.stopPrank();

        vm.prank(organizer);
        treasury.checkIn(eventId, attendee);

        vm.expectRevert();
        vm.prank(organizer); // organizer is not agent
        treasury.refund(eventId, attendee);
    }

    function testSoulboundNFT() public {
        vm.prank(organizer);
        treasury.createEvent(eventId, ticketPrice, organizer, eventEndTime);

        vm.startPrank(attendee);
        usdc.approve(address(treasury), ticketPrice);
        treasury.deposit(eventId);
        vm.stopPrank();

        vm.prank(organizer);
        treasury.checkIn(eventId, attendee);

        vm.prank(agent);
        treasury.refund(eventId, attendee);

        // Transfer should fail
        vm.expectRevert("CheckpointAttestation: Soulbound token cannot be transferred");
        vm.prank(attendee);
        attestation.transferFrom(attendee, organizer, 1);
    }

    function testSettleEvent() public {
        vm.prank(organizer);
        treasury.createEvent(eventId, ticketPrice, organizer, eventEndTime);

        vm.startPrank(attendee);
        usdc.approve(address(treasury), ticketPrice);
        treasury.deposit(eventId);
        vm.stopPrank();

        // Event ends
        vm.warp(eventEndTime + 1 hours);

        address[] memory vendors = new address[](2);
        vendors[0] = vendor1;
        vendors[1] = vendor2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 20 * 10**6; // 20 USDC
        amounts[1] = 15 * 10**6; // 15 USDC

        uint256 organizerBalanceBefore = usdc.balanceOf(organizer);

        vm.prank(agent);
        treasury.settleEvent(eventId, vendors, amounts);

        assertEq(usdc.balanceOf(vendor1), 20 * 10**6);
        assertEq(usdc.balanceOf(vendor2), 15 * 10**6);
        // Organizer gets 50 - 20 - 15 = 15 USDC
        assertEq(usdc.balanceOf(organizer) - organizerBalanceBefore, 15 * 10**6);
        assertEq(treasury.getEventBalance(eventId), 0);
    }

    function test_RevertIfSettleBeforeEndTime() public {
        vm.prank(organizer);
        treasury.createEvent(eventId, ticketPrice, organizer, eventEndTime);

        vm.startPrank(attendee);
        usdc.approve(address(treasury), ticketPrice);
        treasury.deposit(eventId);
        vm.stopPrank();

        address[] memory vendors = new address[](1);
        vendors[0] = vendor1;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 10 * 10**6;

        vm.expectRevert("Event has not ended yet");
        vm.prank(agent);
        treasury.settleEvent(eventId, vendors, amounts);
    }
}
