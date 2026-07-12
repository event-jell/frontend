import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, User, Ticket as TicketIcon, CheckCircle2, ChevronRight, Ban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PlacedElement, SeatAssignment } from '../../types';
import { useGuests } from '../../hooks/useGuests';
import { useTickets } from '../../hooks/useTickets';

interface Props {
  element: PlacedElement;
  eventId: string;
  onClose: () => void;
  onSave: (assignments: SeatAssignment[]) => void;
}

export default function SeatingModal({ element, eventId, onClose, onSave }: Props) {
  const { t } = useTranslation();
  const { data: guests = [], isLoading: loadingGuests } = useGuests(eventId);
  const { data: tickets = [], isLoading: loadingTickets } = useTickets(eventId);

  const capacity = element.capacity || 0;
  
  const [assignments, setAssignments] = useState<SeatAssignment[]>(
    element.seatAssignments ? [...element.seatAssignments] : []
  );
  
  const [activeSeatIndex, setActiveSeatIndex] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-select the first empty seat on mount
  useEffect(() => {
    if (capacity > 0) {
      for (let i = 1; i <= capacity; i++) {
        if (!assignments.find(a => a.seatIndex === i)) {
          setActiveSeatIndex(i);
          break;
        }
      }
    }
  }, []);

  const getAssignmentForSeat = (index: number) => {
    return assignments.find(a => a.seatIndex === index);
  };

  const getAssigneeDetails = (assignment?: SeatAssignment) => {
    if (!assignment) return null;
    if (assignment.type === 'guest') {
      const g = guests.find((g: any) => g._id === assignment.id);
      return g ? { name: g.name, icon: <User size={16} /> } : null;
    } else {
      const t = tickets.find((t: any) => t._id === assignment.id);
      return t ? { name: t.name, icon: <TicketIcon size={16} /> } : null;
    }
  };

  const isFullyAssigned = (id: string) => {
    const assignedCount = assignments.filter(a => a.id === id).length;
    const ticket = tickets.find((t: any) => t._id === id) as any;
    // Tickets: hide only when all `total` seats have been consumed
    if (ticket) return assignedCount >= ticket.total;
    // Guests: hide as soon as any seat is taken
    return assignedCount > 0;
  };

  const handleAssign = (type: 'guest' | 'ticket', id: string) => {
    // For a ticket, reserve `ticket.total` seats; for a guest, reserve 1.
    const seatsToFill = type === 'ticket'
      ? (tickets.find((t: any) => t._id === id) as any)?.total ?? 1
      : 1;

    setAssignments(prev => {
      const withoutPerson = prev.filter(a => a.id !== id);
      const occupiedSeats = new Set(withoutPerson.map(a => a.seatIndex));

      const newAssignments = [...withoutPerson];
      let filled = 0;
      for (let i = activeSeatIndex; i <= capacity && filled < seatsToFill; i++) {
        if (!occupiedSeats.has(i)) {
          newAssignments.push({ seatIndex: i, type, id });
          filled++;
        }
      }
      return newAssignments;
    });

    // Auto-advance to the next empty seat after the block
    const occupiedAfter = new Set(assignments.map(a => a.seatIndex));
    let filled = 0;
    let lastFilled = activeSeatIndex;
    for (let i = activeSeatIndex; i <= capacity && filled < seatsToFill; i++) {
      if (!occupiedAfter.has(i)) { lastFilled = i; filled++; }
    }
    let nextEmpty = -1;
    for (let i = lastFilled + 1; i <= capacity; i++) {
      if (!occupiedAfter.has(i)) { nextEmpty = i; break; }
    }
    if (nextEmpty !== -1) setActiveSeatIndex(nextEmpty);

    setSearchQuery('');
  };

  const handleUnassign = (seatIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setAssignments(prev => prev.filter(a => a.seatIndex !== seatIndex));
  };

  const handleSave = () => {
    onSave(assignments);
    onClose();
  };

  // Filter unassigned guests/tickets
  const filteredOptions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    const availableGuests = guests.filter((g: any) =>
      !isFullyAssigned(g._id) && g.name?.toLowerCase().includes(query)
    );

    const availableTickets = tickets.filter((t: any) =>
      !isFullyAssigned(t._id) && t.name?.toLowerCase().includes(query)
    );

    return { guests: availableGuests, tickets: availableTickets };
  }, [guests, tickets, searchQuery, assignments]);

  const isLoading = loadingGuests || loadingTickets;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl flex flex-col h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white z-10 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800">{t('planner.seating_title')}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                {element.label}
              </span>
              <span className="text-sm font-medium text-slate-500">
                • {assignments.length} of {capacity} seats assigned
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* LEFT PANE: Seats List */}
          <div className="w-1/2 border-r border-slate-100 bg-slate-50/50 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('planner.seating_table_seats')}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {capacity === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <Ban size={32} className="opacity-50" />
                  <p className="text-sm font-medium">{t('planner.seating_no_capacity')}</p>
                </div>
              ) : (
                Array.from({ length: capacity }).map((_, i) => {
                  const seatIndex = i + 1;
                  const assignment = getAssignmentForSeat(seatIndex);
                  const details = getAssigneeDetails(assignment);
                  const isActive = activeSeatIndex === seatIndex;

                  return (
                    <button
                      key={seatIndex}
                      onClick={() => setActiveSeatIndex(seatIndex)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                        isActive 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-indigo-600/10' 
                          : assignment
                            ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                            : 'bg-white border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {seatIndex}
                        </div>
                        
                        <div>
                          {assignment && details ? (
                            <>
                              <p className={`text-sm font-bold flex items-center gap-1.5 ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                {details.name}
                              </p>
                              <p className={`text-xs font-medium mt-0.5 flex items-center gap-1 ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                                {details.icon}
                                {assignment.type === 'guest' ? 'Guest' : (() => {
                                  const t = tickets.find((t: any) => t._id === assignment.id) as any;
                                  const block = assignments.filter(a => a.id === assignment.id).length;
                                  return t && t.total > 1 ? `Open Ticket · ${block} of ${t.total} seats` : 'Open Ticket';
                                })()}
                              </p>
                            </>
                          ) : (
                            <p className={`text-sm font-semibold ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                              Empty Seat
                            </p>
                          )}
                        </div>
                      </div>

                      {assignment && (
                        <div 
                          className={`p-2 rounded-lg transition-colors ${isActive ? 'text-indigo-200 hover:bg-indigo-500 hover:text-white' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                          onClick={(e) => handleUnassign(seatIndex, e)}
                          title="Unassign"
                        >
                          <X size={16} />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANE: Guest Directory */}
          <div className="w-1/2 flex flex-col bg-white overflow-hidden">
            <div className="p-6 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Assign to Seat {activeSeatIndex}
              </h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search guests or tickets..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-slate-400">{t('planner.seating_loading')}</div>
              ) : capacity === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">{t('planner.seating_no_element')}</div>
              ) : (
                <div className="space-y-6">
                  {/* Guests */}
                  {filteredOptions.guests.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-3">{t('planner.seating_guests')}</h4>
                      <div className="space-y-1">
                        {filteredOptions.guests.map((g: any) => (
                          <button
                            key={g._id}
                            onClick={() => handleAssign('guest', g._id)}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <User size={14} />
                              </div>
                              <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{g.name}</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tickets */}
                  {filteredOptions.tickets.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-3 mt-4">{t('planner.seating_tickets')}</h4>
                      <div className="space-y-1">
                        {filteredOptions.tickets.map((t: any) => (
                          <button
                            key={t._id}
                            onClick={() => handleAssign('ticket', t._id)}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <TicketIcon size={14} />
                              </div>
                              <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{t.name}</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredOptions.guests.length === 0 && filteredOptions.tickets.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-sm font-medium text-slate-400">
                        {searchQuery ? "No matching guests or tickets found." : "All guests and tickets have been assigned."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <p className="text-sm font-medium text-slate-500">
            {assignments.length === capacity && capacity > 0 ? (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 size={16} /> Fully Assigned
              </span>
            ) : (
              `${capacity - assignments.length} seats remaining`
            )}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 active:translate-y-0 hover:-translate-y-0.5"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
