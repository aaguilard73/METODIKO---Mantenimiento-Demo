import { Ticket, Urgency, Impact, TicketStatus } from './types';

// Simple heuristic for priority score
export const calculatePriority = (ticket: Ticket): number => {
  if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.VERIFIED) return 0;

  let score = 0;

  // Urgency
  if (ticket.urgency === Urgency.HIGH) score += 50;
  if (ticket.urgency === Urgency.MEDIUM) score += 30;
  if (ticket.urgency === Urgency.LOW) score += 10;

  // Impact
  if (ticket.impact === Impact.BLOCKING) score += 40;
  if (ticket.impact === Impact.ANNOYING) score += 20;

  // Occupancy
  if (ticket.isOccupied) score += 30;

  // Age (Days open) - Max 30 points
  const daysOpen = (new Date().getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 3600 * 24);
  score += Math.min(daysOpen * 5, 30);

  return Math.round(score);
};

export const getStatusColor = (status: TicketStatus) => {
  switch (status) {
    case TicketStatus.OPEN: return 'bg-rose-100 text-rose-800 border-rose-200';
    case TicketStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800 border-blue-200';
    case TicketStatus.WAITING_PART: return 'bg-amber-100 text-amber-800 border-amber-200';
    case TicketStatus.VENDOR: return 'bg-purple-100 text-purple-800 border-purple-200';
    case TicketStatus.RESOLVED: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case TicketStatus.VERIFIED: return 'bg-slate-100 text-slate-800 border-slate-200';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getUrgencyColor = (urgency: Urgency) => {
    switch(urgency) {
        case Urgency.HIGH: return 'text-rose-600 font-bold';
        case Urgency.MEDIUM: return 'text-amber-600 font-medium';
        default: return 'text-slate-500';
    }
}
