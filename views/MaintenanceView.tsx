import React, { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { Ticket, TicketStatus, Urgency } from '../types';
import { Button } from '../components/Button';
import { getStatusColor, getUrgencyColor } from '../utils';
import { Check, PenTool, Box, UserPlus, AlertOctagon, ClipboardList } from 'lucide-react';

const STATUS_STEPS: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_PART,
  TicketStatus.VENDOR,
  TicketStatus.RESOLVED,
  TicketStatus.VERIFIED
];

const statusLabelShort = (s: TicketStatus) => {
  switch (s) {
    case TicketStatus.OPEN: return 'Reportado';
    case TicketStatus.IN_PROGRESS: return 'En proceso';
    case TicketStatus.WAITING_PART: return 'Refacción';
    case TicketStatus.VENDOR: return 'Proveedor';
    case TicketStatus.RESOLVED: return 'Resuelto';
    case TicketStatus.VERIFIED: return 'Verificado';
    default: return s;
  }
};

const TicketCard: React.FC<{ ticket: Ticket; onEdit: (t: Ticket) => void }> = ({ ticket, onEdit }) => {
  return (
    <div
      className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
      onClick={() => onEdit(ticket)}
    >
      {ticket.isOccupied && (
        <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-bl-lg font-bold">
          OCUPADA
        </div>
      )}

      <div className="flex justify-between items-start mb-2 mt-1">
        <div>
          <span className="text-xs font-mono text-slate-400 block mb-1">{ticket.id}</span>
          <h4 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            Hab {ticket.roomNumber}
            <span className="text-sm font-normal text-slate-500">· {ticket.asset}</span>
          </h4>
        </div>
        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(ticket.status)}`}>
          {ticket.status}
        </div>
      </div>

      <p className="text-sm text-slate-600 mb-3 truncate">{ticket.description}</p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs">
          <span className={`${getUrgencyColor(ticket.urgency)}`}>{ticket.urgency}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>
        </div>
        {ticket.assignedTo ? (
          <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            {ticket.assignedTo}
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Sin asignar</span>
        )}
      </div>
    </div>
  );
};

const StatusTimeline: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const idx = STATUS_STEPS.indexOf(status);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <div className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
        <ClipboardList className="w-4 h-4" /> Flujo (DEMO)
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_STEPS.map((s, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <div
              key={s}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                current ? 'bg-slate-900 text-white border-slate-900' :
                done ? 'bg-white text-slate-700 border-slate-300' :
                'bg-white text-slate-400 border-slate-200'
              }`}
            >
              {statusLabelShort(s)}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-[11px] text-slate-400">
        *Trazabilidad visible en Audit Log (quién hizo qué y cuándo).
      </div>
    </div>
  );
};

const TicketEditModal: React.FC<{ ticket: Ticket | null; onClose: () => void }> = ({ ticket, onClose }) => {
  const { updateTicket, role } = useApp();
  const [note, setNote] = useState('');
  const [partName, setPartName] = useState(ticket?.partName || '');
  const [vendorType, setVendorType] = useState(ticket?.vendorType || '');
  const [pendingAction, setPendingAction] = useState<null | 'PART' | 'VENDOR'>(null);

  const [checkClean, setCheckClean] = useState(false);
  const [checkWorking, setCheckWorking] = useState(false);

  if (!ticket) return null;

  const handleAssign = () => {
    updateTicket(ticket.id, { assignedTo: 'Técnico Demo' }, 'Asignado a Técnico Demo');
  };

  const setStatus = (newStatus: TicketStatus, extra?: Partial<Ticket>, action?: string) => {
    const updates: Partial<Ticket> = { status: newStatus, ...(extra || {}) };

    let actionDescription = action || `Estado cambiado a ${newStatus}`;

    if (newStatus === TicketStatus.RESOLVED) {
      actionDescription = 'Marcado como Resuelto — Pendiente de verificación';
    }

    if (newStatus === TicketStatus.VERIFIED) {
      updates.verifiedBy = role;
      updates.closedAt = new Date().toISOString();
      actionDescription = `Verificado y Cerrado por ${role}`;
    }

    updateTicket(ticket.id, updates, actionDescription);
    onClose();
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    updateTicket(ticket.id, { notes: [...ticket.notes, note.trim()] }, `Nota agregada: ${note.trim().slice(0, 28)}${note.trim().length > 28 ? '…' : ''}`);
    setNote('');
  };

  const confirmPart = () => {
    const name = (partName || '').trim() || 'Refacción (DEMO)';
    setStatus(
      TicketStatus.WAITING_PART,
      { needsPart: true, partName: name },
      `Marcado espera refacción: ${name}`
    );
  };

  const confirmVendor = () => {
    const v = (vendorType || '').trim() || 'Proveedor (DEMO)';
    setStatus(
      TicketStatus.VENDOR,
      { needsVendor: true, vendorType: v },
      `Marcado para proveedor: ${v}`
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-slate-200 flex justify-between items-start">
          <div>
            <span className="text-xs font-mono text-slate-400">{ticket.id}</span>
            <h2 className="text-2xl font-bold text-slate-900">Habitación {ticket.roomNumber}</h2>
            <div className="text-sm text-slate-500 mt-1">
              {ticket.asset} — {ticket.issueType} · <span className="font-semibold">{ticket.createdBy}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <StatusTimeline status={ticket.status} />

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pb-6 border-b border-slate-100">
            {!ticket.assignedTo && ticket.status !== TicketStatus.VERIFIED && (
              <Button onClick={handleAssign} size="sm" variant="secondary">
                <UserPlus className="w-4 h-4 mr-2" /> Tomar Ticket
              </Button>
            )}

            {ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.VERIFIED && (
              <>
                <Button onClick={() => setStatus(TicketStatus.IN_PROGRESS)} size="sm" variant={ticket.status === TicketStatus.IN_PROGRESS ? 'primary' : 'ghost'}>
                  En Proceso
                </Button>

                <Button
                  onClick={() => setPendingAction('PART')}
                  size="sm"
                  variant={ticket.status === TicketStatus.WAITING_PART ? 'primary' : 'ghost'}
                >
                  <Box className="w-4 h-4 mr-1" /> Falta Pieza
                </Button>

                <Button
                  onClick={() => setPendingAction('VENDOR')}
                  size="sm"
                  variant={ticket.status === TicketStatus.VENDOR ? 'primary' : 'ghost'}
                >
                  <AlertOctagon className="w-4 h-4 mr-1" /> Proveedor
                </Button>

                <Button onClick={() => setStatus(TicketStatus.RESOLVED)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Check className="w-4 h-4 mr-1" /> Resolver
                </Button>
              </>
            )}
          </div>

          {/* Inline action panels (sin prompt) */}
          {pendingAction === 'PART' && ticket.status !== TicketStatus.VERIFIED && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <div className="text-sm font-bold text-amber-800 mb-2">Espera refacción (DEMO)</div>
              <div className="text-xs text-amber-700 mb-3">Registrar refacción para el soporte a decisiones “¿Qué comprar?”</div>
              <div className="flex gap-2">
                <input
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="flex-1 border border-amber-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                  placeholder="Nombre de refacción…"
                />
                <Button size="sm" onClick={confirmPart}>Confirmar</Button>
                <Button size="sm" variant="ghost" onClick={() => setPendingAction(null)}>Cancelar</Button>
              </div>
            </div>
          )}

          {pendingAction === 'VENDOR' && ticket.status !== TicketStatus.VERIFIED && (
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <div className="text-sm font-bold text-purple-800 mb-2">Requiere proveedor (DEMO)</div>
              <div className="text-xs text-purple-700 mb-3">Registrar tipo de proveedor para el soporte a decisiones “¿Qué tercerizar?”</div>
              <div className="flex gap-2">
                <input
                  value={vendorType}
                  onChange={(e) => setVendorType(e.target.value)}
                  className="flex-1 border border-purple-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                  placeholder="Tipo de proveedor…"
                />
                <Button size="sm" onClick={confirmVendor}>Confirmar</Button>
                <Button size="sm" variant="ghost" onClick={() => setPendingAction(null)}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* Resolved -> Verification */}
          {ticket.status === TicketStatus.RESOLVED && (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
              <h4 className="text-emerald-800 font-bold text-sm mb-2">Checklist de Verificación</h4>
              <div className="space-y-2 mb-3">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="rounded text-emerald-600" checked={checkClean} onChange={(e) => setCheckClean(e.target.checked)} />
                  El área quedó limpia
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="rounded text-emerald-600" checked={checkWorking} onChange={(e) => setCheckWorking(e.target.checked)} />
                  El activo funciona correctamente
                </label>
              </div>
              <Button onClick={() => setStatus(TicketStatus.VERIFIED)} disabled={!(checkClean && checkWorking)} size="sm" className="w-full">
                Confirmar y Cerrar
              </Button>
            </div>
          )}

          {/* Details + Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Detalles</h4>
              <div className="bg-slate-50 p-4 rounded-lg space-y-3 text-sm">
                <p><span className="font-semibold">Descripción:</span> {ticket.description}</p>
                <p><span className="font-semibold">Urgencia:</span> {ticket.urgency}</p>
                <p><span className="font-semibold">Impacto:</span> {ticket.impact}</p>
                {ticket.needsPart && <p className="text-amber-700 font-semibold">Refacción: {ticket.partName}</p>}
                {ticket.needsVendor && <p className="text-purple-700 font-semibold">Proveedor: {ticket.vendorType}</p>}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Notas Técnicas</h4>
              <div className="space-y-2 mb-2 max-h-40 overflow-y-auto">
                {ticket.notes.length === 0 && <p className="text-xs text-slate-400 italic">Sin notas.</p>}
                {ticket.notes.map((n, i) => (
                  <div key={i} className="bg-yellow-50 p-2 rounded border border-yellow-100 text-xs text-slate-700">{n}</div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-slate-500"
                  placeholder="Agregar nota..."
                />
                <Button onClick={handleAddNote} size="sm" variant="secondary">
                  <PenTool className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Audit Log */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Audit Log</h4>
            <div className="border-l-2 border-slate-200 pl-4 space-y-4 max-h-48 overflow-y-auto">
              {ticket.history.map((h, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white"></div>
                  <p className="text-xs text-slate-500 mb-0.5">
                    {new Date(h.date).toLocaleString()} <span className="text-slate-300">•</span> {h.user}
                  </p>
                  <p className="text-sm font-medium text-slate-800">{h.action}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            *DEMO: datos simulados, sin integraciones externas.
          </div>
        </div>
      </div>
    </div>
  );
};

export const MaintenanceView: React.FC = () => {
  const { tickets } = useApp();
  const [filter, setFilter] = useState<'ALL' | 'URGENT' | 'CLOSED'>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (filter === 'ALL') return t.status !== TicketStatus.VERIFIED;
      if (filter === 'URGENT') return t.urgency === Urgency.HIGH && t.status !== TicketStatus.VERIFIED;
      if (filter === 'CLOSED') return t.status === TicketStatus.VERIFIED;
      return true;
    });
  }, [tickets, filter]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Cola de Trabajo</h2>
          <p className="text-slate-500">Gestión de tickets y trazabilidad (DEMO).</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <button onClick={() => setFilter('ALL')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === 'ALL' ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-500'}`}>Activos</button>
          <button onClick={() => setFilter('URGENT')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === 'URGENT' ? 'bg-rose-50 font-medium text-rose-700' : 'text-slate-500'}`}>Urgentes</button>
          <button onClick={() => setFilter('CLOSED')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === 'CLOSED' ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-500'}`}>Cerrados</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTickets.map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket} onEdit={setSelectedTicket} />
        ))}
      </div>

      {selectedTicket && <TicketEditModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
    </div>
  );
};
