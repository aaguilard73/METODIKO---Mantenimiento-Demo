export enum Role {
  MANAGEMENT = 'Gerencia (Marc)',
  CLEANING = 'Limpieza',
  RECEPTION = 'Recepción',
  MAINTENANCE = 'Mantenimiento'
}

export enum Urgency {
  LOW = 'Baja',
  MEDIUM = 'Media',
  HIGH = 'Alta'
}

export enum Impact {
  NONE = 'No afecta',
  ANNOYING = 'Molesta',
  BLOCKING = 'Impide uso'
}

export enum TicketStatus {
  OPEN = 'Reportado',
  IN_PROGRESS = 'En proceso',
  WAITING_PART = 'Espera Refacción',
  VENDOR = 'Requiere Proveedor',
  RESOLVED = 'Resuelto',
  VERIFIED = 'Verificado'
}

export interface AuditEvent {
  date: string; // ISO string
  action: string;
  user: string;
}

export interface Ticket {
  id: string;
  roomNumber: string;
  isOccupied: boolean;
  asset: string;
  issueType: string;
  description: string;
  urgency: Urgency;
  impact: Impact;
  status: TicketStatus;
  createdAt: string; // ISO string
  createdBy: Role;
  assignedTo?: string; // Name of technician
  notes: string[];
  history: AuditEvent[];
  
  // Decision support fields
  needsPart?: boolean;
  partName?: string;
  needsVendor?: boolean;
  vendorType?: string;
  verifiedBy?: string;
  closedAt?: string;

  // Calculated
  priorityScore: number;
}

export interface Room {
  number: string;
  floor: number;
  type: 'Suite' | 'Standard' | 'Deluxe';
}