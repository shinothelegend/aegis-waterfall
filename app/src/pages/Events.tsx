import { EscrowGrid } from '../components/EscrowGrid';
import { EscrowDetails } from '../components/EscrowDetails';
import type { EventItem } from '../hooks/useCheckpointData';

interface EventsProps {
  events: EventItem[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string | null) => void;
  isConnected: boolean;
  userAddress?: string;
  onChainEvent: any;
  hasDeposited: boolean;
  hasCheckedIn: boolean;
  hasRefunded: boolean;
  usdcAllowance: bigint | undefined;
  rsvps: any[];
  onDeposit: () => void;
  onUploadInvoice: (amount: string, fileUrl: string) => void;
}

export function Events({
  events,
  selectedEventId,
  onSelectEvent,
  isConnected,
  userAddress,
  onChainEvent,
  hasDeposited,
  hasCheckedIn,
  hasRefunded,
  usdcAllowance,
  rsvps,
  onDeposit,
  onUploadInvoice
}: EventsProps) {
  const selectedEvent = events.find(e => e.id === selectedEventId);

  if (selectedEventId && selectedEvent) {
    return (
      <EscrowDetails
        selectedEvent={selectedEvent}
        isConnected={isConnected}
        userAddress={userAddress}
        onChainEvent={onChainEvent}
        hasDeposited={hasDeposited}
        hasCheckedIn={hasCheckedIn}
        hasRefunded={hasRefunded}
        usdcAllowance={usdcAllowance}
        rsvps={rsvps}
        onBack={() => onSelectEvent(null)}
        onDeposit={onDeposit}
        onUploadInvoice={onUploadInvoice}
      />
    );
  }

  return (
    <EscrowGrid 
      events={events} 
      onSelectEvent={(id) => onSelectEvent(id)} 
    />
  );
}
