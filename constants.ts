import { Room, Ticket, TicketStatus, Urgency, Impact, Role } from './types';

export const ROOMS: Room[] = Array.from({ length: 20 }, (_, i) => ({
  number: (101 + i).toString(),
  floor: 1,
  type: i % 3 === 0 ? 'Suite' : i % 2 === 0 ? 'Deluxe' : 'Standard'
}));

export const ASSETS = [
  'Aire Acondicionado', 'Plomería', 'Eléctrico', 'TV/WiFi', 'Mobiliario', 'Cerrajería', 'Otros'
];

export const ISSUE_TYPES = [
  'No enciende', 'Gotea', 'Ruido extraño', 'Roto/Dañado', 'Sucio/Manchado', 'Sin señal', 'Mal olor'
];

// Helper to generate a past date
const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'T-1001',
    roomNumber: '105',
    isOccupied: true,
    asset: 'Aire Acondicionado',
    issueType: 'No enciende',
    description: 'Huésped reporta mucho calor, el control no responde.',
    urgency: Urgency.HIGH,
    impact: Impact.BLOCKING,
    status: TicketStatus.OPEN,
    createdAt: daysAgo(0),
    createdBy: Role.RECEPTION,
    notes: [],
    history: [{ date: daysAgo(0), action: 'Ticket creado', user: Role.RECEPTION }],
    priorityScore: 0
  },
  {
    id: 'T-1002',
    roomNumber: '112',
    isOccupied: false,
    asset: 'Plomería',
    issueType: 'Gotea',
    description: 'Grifo del lavabo gotea constantemente.',
    urgency: Urgency.MEDIUM,
    impact: Impact.ANNOYING,
    status: TicketStatus.IN_PROGRESS,
    createdAt: daysAgo(2),
    createdBy: Role.CLEANING,
    assignedTo: 'Carlos M.',
    notes: ['Se requiere cambiar empaque.'],
    history: [
      { date: daysAgo(2), action: 'Ticket creado', user: Role.CLEANING },
      { date: daysAgo(1), action: 'Asignado a Carlos M.', user: Role.MAINTENANCE }
    ],
    priorityScore: 0
  },
  {
    id: 'T-1003',
    roomNumber: '101',
    isOccupied: true,
    asset: 'Eléctrico',
    issueType: 'Roto/Dañado',
    description: 'Enchufe de mesa de noche hace chispa.',
    urgency: Urgency.HIGH,
    impact: Impact.BLOCKING,
    status: TicketStatus.WAITING_PART,
    createdAt: daysAgo(1),
    createdBy: Role.RECEPTION,
    notes: ['Desconectado circuito por seguridad.', 'Solicitado reemplazo.'],
    needsPart: true,
    partName: 'Outlet Universal Premium Blanco',
    history: [
      { date: daysAgo(1), action: 'Ticket creado', user: Role.RECEPTION },
      { date: daysAgo(0), action: 'Marcado espera refacción', user: Role.MAINTENANCE }
    ],
    priorityScore: 0
  },
  {
    id: 'T-1004',
    roomNumber: '118',
    isOccupied: false,
    asset: 'Mobiliario',
    issueType: 'Roto/Dañado',
    description: 'Pata de silla de escritorio inestable.',
    urgency: Urgency.LOW,
    impact: Impact.ANNOYING,
    status: TicketStatus.RESOLVED,
    createdAt: daysAgo(5),
    createdBy: Role.CLEANING,
    notes: ['Reparado con pegamento industrial.'],
    history: [
      { date: daysAgo(5), action: 'Ticket creado', user: Role.CLEANING },
      { date: daysAgo(2), action: 'Resuelto', user: Role.MAINTENANCE }
    ],
    priorityScore: 0
  },
  {
    id: 'T-1005',
    roomNumber: '105',
    isOccupied: true,
    asset: 'Aire Acondicionado',
    issueType: 'Gotea',
    description: 'Agua condensada cayendo en la alfombra (Recurrente).',
    urgency: Urgency.HIGH,
    impact: Impact.ANNOYING,
    status: TicketStatus.OPEN,
    createdAt: daysAgo(0),
    createdBy: Role.CLEANING,
    notes: [],
    history: [{ date: daysAgo(0), action: 'Ticket creado', user: Role.CLEANING }],
    priorityScore: 0
  },
  {
    id: 'T-1006',
    roomNumber: '120',
    isOccupied: false,
    asset: 'TV/WiFi',
    issueType: 'Sin señal',
    description: 'TV no conecta al sistema de entretenimiento.',
    urgency: Urgency.LOW,
    impact: Impact.ANNOYING,
    status: TicketStatus.VENDOR,
    needsVendor: true,
    vendorType: 'Soporte IT Externo',
    createdAt: daysAgo(3),
    createdBy: Role.MAINTENANCE,
    notes: ['Reinicio no funciona. Escalado a proveedor.'],
    history: [{ date: daysAgo(3), action: 'Ticket creado y escalado', user: Role.MAINTENANCE }],
    priorityScore: 0
  },
    {
    id: 'T-1007',
    roomNumber: '115',
    isOccupied: true,
    asset: 'Plomería',
    issueType: 'Mal olor',
    description: 'Olor a drenaje en baño principal.',
    urgency: Urgency.HIGH,
    impact: Impact.ANNOYING,
    status: TicketStatus.OPEN,
    createdAt: daysAgo(0),
    createdBy: Role.RECEPTION,
    notes: [],
    history: [{ date: daysAgo(0), action: 'Ticket creado', user: Role.RECEPTION }],
    priorityScore: 0
  },
  {
    id: 'T-1008',
    roomNumber: '102',
    isOccupied: false,
    asset: 'Cerrajería',
    issueType: 'Roto/Dañado',
    description: 'Chapa electrónica con poca batería.',
    urgency: Urgency.MEDIUM,
    impact: Impact.BLOCKING,
    status: TicketStatus.VERIFIED,
    createdAt: daysAgo(6),
    createdBy: Role.CLEANING,
    verifiedBy: 'Gerente Nocturno',
    closedAt: daysAgo(1),
    notes: ['Baterías cambiadas.'],
    history: [
        { date: daysAgo(6), action: 'Ticket creado', user: Role.CLEANING },
        { date: daysAgo(2), action: 'Resuelto', user: Role.MAINTENANCE },
        { date: daysAgo(1), action: 'Verificado', user: Role.MANAGEMENT }
    ],
    priorityScore: 0
  },
   {
    id: 'T-1009',
    roomNumber: '109',
    isOccupied: true,
    asset: 'Eléctrico',
    issueType: 'No enciende',
    description: 'Lámpara de pie fundida.',
    urgency: Urgency.LOW,
    impact: Impact.NONE,
    status: TicketStatus.OPEN,
    createdAt: daysAgo(1),
    createdBy: Role.CLEANING,
    notes: [],
    history: [{ date: daysAgo(1), action: 'Ticket creado', user: Role.CLEANING }],
    priorityScore: 0
  }
];
