import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Ticket, Role, TicketStatus, AuditEvent, Urgency, Impact } from './types';
import { INITIAL_TICKETS } from './constants';
import { calculatePriority } from './utils';

type DemoScenario = 'GUEST_COMPLAINT' | 'CLEANING_REPORT' | 'BLOCK_PART' | 'BLOCK_VENDOR';

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  tickets: Ticket[];
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'history' | 'priorityScore' | 'status'>) => void;
  updateTicket: (id: string, updates: Partial<Ticket>, actionDescription: string) => void;
  resetDemoData: () => void;
  exportCSV: () => void;

  // NEW: escenarios demo para mostrar el flujo completo en 1 minuto
  runScenario: (scenario: DemoScenario) => string | null; // regresa ticketId (si aplica) para enfocarlo
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const nextTicketId = (tickets: Ticket[]) => {
  const max = tickets.reduce((m, t) => {
    const n = parseInt(String(t.id).replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 1000);
  return `T-${max + 1}`;
};

const createAudit = (user: Role, action: string): AuditEvent => ({
  date: new Date().toISOString(),
  action,
  user
});

const buildTicket = (
  tickets: Ticket[],
  data: Omit<Ticket, 'id' | 'createdAt' | 'history' | 'priorityScore'>,
  auditUser: Role,
  auditAction: string
): Ticket => {
  const t: Ticket = {
    ...data,
    id: nextTicketId(tickets),
    createdAt: new Date().toISOString(),
    history: [createAudit(auditUser, auditAction)],
    priorityScore: 0
  };
  t.priorityScore = calculatePriority(t);
  return t;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>(Role.MANAGEMENT);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Load from local storage or init
  useEffect(() => {
    const stored = localStorage.getItem('metodiko_demo_tickets');
    if (stored) {
      try {
        const parsed: Ticket[] = JSON.parse(stored);
        const recalculated = parsed.map(t => ({ ...t, priorityScore: calculatePriority(t) }));
        setTickets(recalculated);
      } catch {
        const calculated = INITIAL_TICKETS.map(t => ({ ...t, priorityScore: calculatePriority(t) }));
        setTickets(calculated);
      }
    } else {
      const calculated = INITIAL_TICKETS.map(t => ({ ...t, priorityScore: calculatePriority(t) }));
      setTickets(calculated);
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (tickets && tickets.length >= 0) {
      localStorage.setItem('metodiko_demo_tickets', JSON.stringify(tickets));
    }
  }, [tickets]);

  const addTicket = (data: Omit<Ticket, 'id' | 'createdAt' | 'history' | 'priorityScore' | 'status'>) => {
    const newTicket: Ticket = {
      ...data,
      id: nextTicketId(tickets),
      createdAt: new Date().toISOString(),
      status: TicketStatus.OPEN,
      priorityScore: 0,
      history: [createAudit(role, 'Ticket Creado')]
    };
    newTicket.priorityScore = calculatePriority(newTicket);
    setTickets(prev => [newTicket, ...prev]);
  };

  const updateTicket = (id: string, updates: Partial<Ticket>, actionDescription: string) => {
    setTickets(prev =>
      prev.map(t => {
        if (t.id !== id) return t;

        const updated = { ...t, ...updates };
        const newHistory: AuditEvent = createAudit(role, actionDescription);

        updated.history = [...updated.history, newHistory];
        updated.priorityScore = calculatePriority(updated);

        return updated;
      })
    );
  };

  const updateTicketAs = (user: Role, id: string, updates: Partial<Ticket>, action: string) => {
    setTickets(prev =>
      prev.map(t => {
        if (t.id !== id) return t;

        const updated = { ...t, ...updates };
        updated.history = [...updated.history, createAudit(user, action)];
        updated.priorityScore = calculatePriority(updated);
        return updated;
      })
    );
  };

  const resetDemoData = () => {
    const calculated = INITIAL_TICKETS.map(t => ({ ...t, priorityScore: calculatePriority(t) }));
    localStorage.removeItem('metodiko_demo_tickets');
    setRole(Role.MANAGEMENT);
    setTickets(calculated);
  };

  const exportCSV = () => {
    const headers = ['ID', 'Habitacion', 'Ocupada', 'Activo', 'Problema', 'Estado', 'Urgencia', 'Impacto', 'Prioridad', 'Creado'];
    const rows = tickets.map(t => [
      t.id,
      t.roomNumber,
      t.isOccupied ? 'SI' : 'NO',
      t.asset,
      t.issueType,
      t.status,
      t.urgency,
      t.impact,
      String(t.priorityScore),
      t.createdAt
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'reporte_mantenimiento_els.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // NEW: escenarios DEMO
  const runScenario = (scenario: DemoScenario): string | null => {
    // Selección base (si queremos actualizar uno existente)
    const actionable = [...tickets]
      .filter(t => t.status !== TicketStatus.VERIFIED)
      .sort((a, b) => b.priorityScore - a.priorityScore);

    const pickForBlock = actionable.find(t =>
      [TicketStatus.OPEN, TicketStatus.IN_PROGRESS].includes(t.status)
    );

    if (scenario === 'GUEST_COMPLAINT') {
      // Intencional: Hab 105 + Aire Acondicionado para evidenciar "Recurrente" (ya hay casos)
      const t = buildTicket(
        tickets,
        {
          roomNumber: '105',
          isOccupied: true,
          asset: 'Aire Acondicionado',
          issueType: 'No enciende',
          description: 'Simulación DEMO: Huésped reporta que el aire no responde y no puede descansar.',
          urgency: Urgency.HIGH,
          impact: Impact.BLOCKING,
          status: TicketStatus.OPEN,
          createdBy: Role.RECEPTION,
          notes: [],
          needsPart: false,
          needsVendor: false
        },
        Role.RECEPTION,
        'Ticket creado por Recepción (DEMO)'
      );

      setTickets(prev => [t, ...prev]);
      return t.id;
    }

    if (scenario === 'CLEANING_REPORT') {
      const t = buildTicket(
        tickets,
        {
          roomNumber: '112',
          isOccupied: false,
          asset: 'Plomería',
          issueType: 'Gotea',
          description: 'Simulación DEMO: Limpieza detecta goteo en lavabo durante preparación de habitación.',
          urgency: Urgency.MEDIUM,
          impact: Impact.ANNOYING,
          status: TicketStatus.OPEN,
          createdBy: Role.CLEANING,
          notes: [],
          needsPart: false,
          needsVendor: false
        },
        Role.CLEANING,
        'Ticket creado por Limpieza (DEMO)'
      );

      setTickets(prev => [t, ...prev]);
      return t.id;
    }

    if (scenario === 'BLOCK_PART') {
      // Preferimos convertir un ticket real a “Espera refacción”
      const id = pickForBlock?.id;
      if (id) {
        updateTicketAs(
          Role.MAINTENANCE,
          id,
          {
            status: TicketStatus.WAITING_PART,
            needsPart: true,
            partName: 'Refacción DEMO (ej. empaque / capacitor / outlet)'
          },
          'Marcado espera refacción (DEMO)'
        );
        return id;
      }

      // fallback: crear uno nuevo ya bloqueado
      const t = buildTicket(
        tickets,
        {
          roomNumber: '101',
          isOccupied: true,
          asset: 'Eléctrico',
          issueType: 'Roto/Dañado',
          description: 'Simulación DEMO: Se requiere refacción para completar la reparación.',
          urgency: Urgency.HIGH,
          impact: Impact.BLOCKING,
          status: TicketStatus.WAITING_PART,
          createdBy: Role.MAINTENANCE,
          notes: ['Simulación DEMO: identificado componente a reemplazar.'],
          needsPart: true,
          partName: 'Refacción DEMO',
          needsVendor: false
        },
        Role.MAINTENANCE,
        'Ticket creado y marcado espera refacción (DEMO)'
      );

      setTickets(prev => [t, ...prev]);
      return t.id;
    }

    if (scenario === 'BLOCK_VENDOR') {
      const id = pickForBlock?.id;
      if (id) {
        updateTicketAs(
          Role.MAINTENANCE,
          id,
          {
            status: TicketStatus.VENDOR,
            needsVendor: true,
            vendorType: 'Proveedor DEMO (IT / HVAC / Cerrajería)'
          },
          'Marcado para proveedor (DEMO)'
        );
        return id;
      }

      const t = buildTicket(
        tickets,
        {
          roomNumber: '120',
          isOccupied: false,
          asset: 'TV/WiFi',
          issueType: 'Sin señal',
          description: 'Simulación DEMO: caso escalado a proveedor externo.',
          urgency: Urgency.LOW,
          impact: Impact.ANNOYING,
          status: TicketStatus.VENDOR,
          createdBy: Role.MAINTENANCE,
          notes: ['Simulación DEMO: reinicio no resuelve, se agenda visita.'],
          needsPart: false,
          needsVendor: true,
          vendorType: 'Proveedor DEMO'
        },
        Role.MAINTENANCE,
        'Ticket creado y escalado a proveedor (DEMO)'
      );

      setTickets(prev => [t, ...prev]);
      return t.id;
    }

    return null;
  };

  const value = useMemo(
    () => ({ role, setRole, tickets, addTicket, updateTicket, resetDemoData, exportCSV, runScenario }),
    [role, tickets]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
