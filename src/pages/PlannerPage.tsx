import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { LayoutGrid, X, Plus } from 'lucide-react';
import FloorCanvas from '../components/FloorCanvas';
import ElementPanel from '../components/planner/ElementPanel';
import RightPanel from '../components/planner/RightPanel';
import PlannerToolbar, { type ToolMode } from '../components/planner/PlannerToolbar';
import StatusBar, { type Room } from '../components/planner/StatusBar';
import ExportModal from '../components/planner/ExportModal';
import ShareModal from '../components/planner/ShareModal';
import { useFloorPlan, useUpdateFloorPlan, useSaveElements } from '../hooks/useFloorPlans';
import { usePresence } from '../hooks/usePresence';
import { useAuth } from '../contexts/AuthContext';
import { socket } from '../lib/socket';
import type { PlacedElement, ElementTemplate } from '../types';

type FloorMap = Record<string, PlacedElement[]>;

function useHistory<T>(initial: T) {
  const [history, setHistory] = useState<T[]>([initial]);
  const [cursor, setCursor] = useState(0);

  const current = history[cursor];

  const push = useCallback((next: T) => {
    setHistory(h => [...h.slice(0, cursor + 1), next]);
    setCursor(c => c + 1);
  }, [cursor]);

  const undo = useCallback(() => setCursor(c => Math.max(0, c - 1)), []);
  const redo = useCallback(() => setCursor(c => Math.min(history.length - 1, c + 1)), [history.length]);

  return { current, push, undo, redo, canUndo: cursor > 0, canRedo: cursor < history.length - 1 };
}

export default function PlannerPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: plan, isLoading } = useFloorPlan(id!);
  const onlineUsers = usePresence(id ? `floor-plan:${id}` : undefined, user);
  const updatePlan = useUpdateFloorPlan();
  const saveElements = useSaveElements();

  const [planName, setPlanName] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [rulersEnabled, setRulersEnabled] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [zoom, setZoom] = useState(1);
  const [showFloorModal, setShowFloorModal] = useState(true); // open immediately on first load
  const floorModalInputRef = useRef<HTMLInputElement>(null);
  const [floorModalName, setFloorModalName] = useState('');
  const [floorModalWidth, setFloorModalWidth] = useState('');
  const [floorModalHeight, setFloorModalHeight] = useState('');
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);

  // History tracks the full per-floor element map
  const { current: floorMap, push: pushHistory, undo, redo, canUndo, canRedo } = useHistory<FloorMap>({});

  // Elements for the currently active floor
  const elements: PlacedElement[] = (activeRoomId ? floorMap[activeRoomId] : undefined) ?? [];

  const isInitialized = useRef(false);

  useEffect(() => {
    if (plan && !isInitialized.current) {
      isInitialized.current = true;
      setPlanName(plan.name);
      
      if (plan.rooms && plan.rooms.length > 0) {
        setRooms(plan.rooms);
        setShowFloorModal(false);
        if (!activeRoomId) {
          setActiveRoomId(plan.rooms[0].id);
        }
        
        // Populate floorMap
        const newFloorMap: FloorMap = {};
        for (const room of plan.rooms) {
          newFloorMap[room.id] = room.elements || [];
        }
        
        // If there are still global elements, maybe put them in the first room
        if (plan.elements && plan.elements.length > 0 && Object.keys(newFloorMap).length > 0) {
          const firstRoomId = plan.rooms[0].id;
          const existingIds = new Set(newFloorMap[firstRoomId].map(e => e.id));
          const toAdd = plan.elements.filter(e => !existingIds.has(e.id));
          if (toAdd.length > 0) {
             newFloorMap[firstRoomId] = [...newFloorMap[firstRoomId], ...toAdd];
          }
        }
        pushHistory(newFloorMap);
      } else if (plan.elements?.length) {
        // Fallback for legacy single-floor plans without rooms
        const legacyRoomId = nanoid();
        const legacyRoom = { id: legacyRoomId, name: 'Main Floor', canvasWidth: plan.canvasWidth, canvasHeight: plan.canvasHeight, elements: [] };
        setRooms([legacyRoom]);
        setActiveRoomId(legacyRoomId);
        setShowFloorModal(false);
        pushHistory({ [legacyRoomId]: plan.elements });
      }
    }
  }, [plan]); // removing pushHistory, activeRoomId etc to prevent infinite loops, let's keep it safe

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'v') setActiveTool('select');
      if (e.key === 'h') setActiveTool('pan');
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') handleDelete(selectedId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, undo, redo]);

  // Helpers to mutate only the active floor
  const updateFloor = useCallback((next: PlacedElement[], broadcast = true) => {
    pushHistory({ ...floorMap, [activeRoomId]: next });
    
    // Broadcast changes to other users via socket
    if (broadcast && id && activeRoomId) {
      socket.emit('planner:update', { planId: id, activeRoomId, elements: next });
    }
  }, [floorMap, activeRoomId, pushHistory, id]);

  const floorMapRef = useRef(floorMap);
  useEffect(() => {
    floorMapRef.current = floorMap;
  }, [floorMap]);

  // Socket.io Real-time Collaboration
  useEffect(() => {
    if (!id) return;
    
    // Join the floor plan room
    socket.emit('planner:join', { planId: id });
    
    const handlePlannerUpdated = (payload: { planId: string; activeRoomId: string; elements: PlacedElement[] }) => {
      if (payload.planId === id) {
        // Update local state by pushing to history
        pushHistory({ ...floorMapRef.current, [payload.activeRoomId]: payload.elements });
      }
    };
    
    socket.on('planner:updated', handlePlannerUpdated);
    
    return () => {
      socket.emit('planner:leave', { planId: id });
      socket.off('planner:updated', handlePlannerUpdated);
    };
  }, [id, pushHistory]);

  const handleAddElement = useCallback((template: ElementTemplate) => {
    const newEl: PlacedElement = {
      id: nanoid(),
      type: template.type,
      label: template.label,
      x: 120, y: 120,
      width: template.defaultWidth,
      height: template.defaultHeight,
      rotation: 0,
      color: template.defaultColor,
      shape: template.shape,
      zIndex: elements.length,
      capacity: template.defaultCapacity,
      seated: template.defaultCapacity > 0 ? Math.floor(Math.random() * template.defaultCapacity) : 0,
      notes: '',
      properties: {},
    };
    updateFloor([...elements, newEl]);
    setSelectedId(newEl.id);
  }, [elements, updateFloor]);

  const handleElementChange = useCallback((updated: PlacedElement) => {
    updateFloor(elements.map(el => el.id === updated.id ? updated : el));
  }, [elements, updateFloor]);

  const handleDelete = useCallback((elId: string) => {
    updateFloor(elements.filter(el => el.id !== elId));
    setSelectedId(null);
  }, [elements, updateFloor]);

  const handleDuplicate = useCallback((elId: string) => {
    const original = elements.find(el => el.id === elId);
    if (!original) return;
    const copy: PlacedElement = { ...original, id: nanoid(), x: original.x + 24, y: original.y + 24, zIndex: elements.length };
    updateFloor([...elements, copy]);
    setSelectedId(copy.id);
  }, [elements, updateFloor]);

  const handleAlignLeft = useCallback(() => {
    if (!selectedId) return;
    updateFloor(elements.map(el => el.id === selectedId ? { ...el, x: 0 } : el));
  }, [elements, selectedId, updateFloor]);

  const handleAlignCenter = useCallback(() => {
    if (!selectedId) return;
    const w = rooms.find(r => r.id === activeRoomId)?.width ?? plan?.canvasWidth ?? 30;
    updateFloor(elements.map(el => el.id === selectedId ? { ...el, x: (w - el.width) / 2 } : el));
  }, [elements, selectedId, rooms, activeRoomId, plan, updateFloor]);

  const handleToggleLock = useCallback(() => {
    if (!selectedId) return;
    updateFloor(elements.map(el => el.id === selectedId ? { ...el, locked: !el.locked } : el));
  }, [elements, selectedId, updateFloor]);

  const handleBringToFront = useCallback(() => {
    if (!selectedId) return;
    const maxZ = elements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);
    updateFloor(elements.map(el => el.id === selectedId ? { ...el, zIndex: maxZ + 1 } : el));
  }, [elements, selectedId, updateFloor]);

  const handleCanvasChange = useCallback((els: PlacedElement[]) => {
    updateFloor(els);
  }, [updateFloor]);

  const handleAddRoom = useCallback((name: string, width?: number, height?: number) => {
    const newRoom: Room = { id: nanoid(), name, width, height };
    const newRooms = [...rooms, newRoom];
    setRooms(newRooms);
    setActiveRoomId(newRoom.id);
    setSelectedId(null);
    pushHistory({ ...floorMap, [newRoom.id]: [] });
    setFloorModalName('');
    setFloorModalWidth('');
    setFloorModalHeight('');
    setShowFloorModal(false);

    if (id) {
      const updatedRooms = newRooms.map(r => ({
        ...r,
        canvasWidth: plan?.canvasWidth ?? 30,
        canvasHeight: plan?.canvasHeight ?? 20,
        elements: floorMap[r.id] || []
      }));
      updatePlan.mutate({ id, data: { name: planName, rooms: updatedRooms as any } });
    }
  }, [rooms, floorMap, pushHistory, id, planName, updatePlan, plan]);

  const handleRoomChange = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
    setSelectedId(null);
  }, []);

  const confirmDeleteRoom = useCallback(() => {
    if (!deleteRoomId) return;
    const remaining = rooms.filter(r => r.id !== deleteRoomId);
    setRooms(remaining);
    const newMap = { ...floorMap };
    delete newMap[deleteRoomId];
    pushHistory(newMap);
    if (activeRoomId === deleteRoomId) {
      setActiveRoomId(remaining[remaining.length - 1]?.id ?? '');
    }
    setSelectedId(null);
    setDeleteRoomId(null);

    if (id) {
      const updatedRooms = remaining.map(r => ({
        ...r,
        canvasWidth: plan?.canvasWidth ?? 30,
        canvasHeight: plan?.canvasHeight ?? 20,
        elements: newMap[r.id] || []
      }));
      updatePlan.mutate({ id, data: { name: planName, rooms: updatedRooms as any } });
    }
  }, [deleteRoomId, rooms, floorMap, activeRoomId, pushHistory, id, planName, updatePlan, plan]);

  const openFloorModal = useCallback(() => {
    setFloorModalName('');
    setFloorModalWidth('');
    setFloorModalHeight('');
    setShowFloorModal(true);
    setTimeout(() => floorModalInputRef.current?.focus(), 50);
  }, []);

  const submitFloorModal = useCallback(() => {
    const name = floorModalName.trim();
    if (!name) return;
    const w = floorModalWidth ? parseInt(floorModalWidth) : undefined;
    const h = floorModalHeight ? parseInt(floorModalHeight) : undefined;
    handleAddRoom(name, w, h);
  }, [floorModalName, floorModalWidth, floorModalHeight, handleAddRoom]);

  const handleAutoSave = useCallback(async () => {
    if (!id) return;
    // Save all floors flattened for backwards compatibility
    const allElements = Object.values(floorMap).flat();
    await saveElements.mutateAsync({ id, elements: allElements });
    
    // Save the rooms array to the plan as well
    const updatedRooms = rooms.map(r => ({
      ...r,
      canvasWidth: plan?.canvasWidth ?? 30,
      canvasHeight: plan?.canvasHeight ?? 20,
      elements: floorMap[r.id] || []
    }));
    await updatePlan.mutateAsync({ id, data: { name: planName, rooms: updatedRooms as any } });
  }, [id, floorMap, planName, plan, saveElements, updatePlan, rooms]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void handleAutoSave();
    }, 500);
    return () => clearTimeout(timer);
  }, [handleAutoSave]);

  const activeRoom = rooms.find(r => r.id === activeRoomId);
  const activeCanvasWidth = activeRoom?.width ?? plan?.canvasWidth ?? 30;
  const activeCanvasHeight = activeRoom?.height ?? plan?.canvasHeight ?? 20;

  const selectedElement = elements.find(el => el.id === selectedId) ?? null;
  const totalSeated = elements.reduce((sum, el) => sum + (el.seated || 0), 0);
  const totalCapacity = elements.reduce((sum, el) => sum + (el.capacity || 0), 0);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-[#7A1F1F] border-t-transparent rounded-full animate-spin" />
          Loading floor plan…
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-500 text-sm">Floor plan not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Mobile Block Overlay */}
      <div className="md:hidden absolute inset-0 z-20 bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
          <LayoutGrid size={32} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-3">Warning: Not Mobile Friendly</h2>
        <p className="text-slate-500 mb-8 max-w-[280px]">
          This planner is designed for larger screens. Please use a computer or tablet to build your floor plan.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-3 text-white font-semibold rounded-xl transition-colors shadow-sm"
          style={{ backgroundColor: '#7A1F1F' }}
        >
          Go Back
        </button>
      </div>

      {showExport && <ExportModal planName={planName} onClose={() => setShowExport(false)} />}
      {showShare && <ShareModal planName={planName} onClose={() => setShowShare(false)} />}

      {/* Floor name modal */}
      {showFloorModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowFloorModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* X close button — always visible */}
            <button
              onClick={() => setShowFloorModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>

            <div
              className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #9c3030 100%)' }}
            >
              <LayoutGrid size={18} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              {rooms.length === 0 ? 'Name your first floor' : 'Add a new floor'}
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              {rooms.length === 0
                ? 'Give this floor a name to start designing your layout.'
                : 'Each floor has its own independent canvas.'}
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                  Floor Name <span className="text-red-400">*</span>
                </label>
                <input
                  ref={floorModalInputRef}
                  autoFocus
                  value={floorModalName}
                  onChange={e => setFloorModalName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') submitFloorModal();
                    if (e.key === 'Escape') setShowFloorModal(false);
                  }}
                  placeholder="e.g. Main Hall, Mezzanine…"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 focus:border-[#7A1F1F]/60 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                  Floor Size <span className="text-slate-400 font-normal normal-case">(optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min={1}
                      value={floorModalWidth}
                      onChange={e => setFloorModalWidth(e.target.value)}
                      placeholder={String(plan?.canvasWidth ?? 30)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 focus:border-[#7A1F1F]/60 transition-all pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">ft</span>
                  </div>
                  <span className="text-slate-400 text-sm flex-shrink-0">×</span>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min={1}
                      value={floorModalHeight}
                      onChange={e => setFloorModalHeight(e.target.value)}
                      placeholder={String(plan?.canvasHeight ?? 20)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 focus:border-[#7A1F1F]/60 transition-all pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">ft</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Default: {plan?.canvasWidth ?? 30} × {plan?.canvasHeight ?? 20} ft</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFloorModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitFloorModal}
                disabled={!floorModalName.trim()}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 transition-all shadow-sm"
                style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #9c3030 100%)' }}
              >
                {rooms.length === 0 ? 'Start Designing' : 'Add Floor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete floor confirmation */}
      {deleteRoomId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs mx-4 p-6">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <X size={18} className="text-red-500" />
            </div>
            <h2 className="text-base font-bold text-slate-800 mb-1">Delete floor?</h2>
            <p className="text-sm text-slate-500 mb-5">
              <span className="font-semibold text-slate-700">"{rooms.find(r => r.id === deleteRoomId)?.name}"</span> and all its elements will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteRoomId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRoom}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <PlannerToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        zoom={zoom}
        onZoomIn={() => setZoom(z => Math.min(4, z * 1.12))}
        onZoomOut={() => setZoom(z => Math.max(0.15, z / 1.12))}
        onFit={() => setZoom(1)}
        snapEnabled={snapEnabled}
        onSnapToggle={() => setSnapEnabled(s => !s)}
        rulersEnabled={rulersEnabled}
        onRulersToggle={() => setRulersEnabled(r => !r)}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onExport={() => setShowExport(true)}
        onShare={() => setShowShare(true)}
        planName={planName}
        eventName="Lumen Conf"
        onAlignLeft={handleAlignLeft}
        onAlignCenter={handleAlignCenter}
        onToggleLock={handleToggleLock}
        onBringToFront={handleBringToFront}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(p => !p)}
        hasSelection={!!selectedId}
        onlineUsers={onlineUsers}
      />

      <div className="flex flex-1 overflow-hidden">
        <ElementPanel onAdd={handleAddElement} />

        {activeRoomId ? (
          <FloorCanvas
            key={activeRoomId}
            elements={elements}
            canvasWidth={activeCanvasWidth}
            canvasHeight={activeCanvasHeight}
            gridSize={plan.gridSize}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChange={handleCanvasChange}
            toolMode={activeTool}
            snapEnabled={snapEnabled}
            onZoomChange={setZoom}
            externalZoom={zoom}
            darkMode={darkMode}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm max-w-md w-full text-center">
              <div className="w-16 h-16 bg-[#FDF5EE] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <LayoutGrid size={32} className="text-[#7A1F1F]" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No floor selected</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Create your first floor to start designing the event space, arranging tables, and managing seating.
              </p>
              <button
                onClick={openFloorModal}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                style={{ backgroundColor: '#7A1F1F' }}
              >
                <Plus size={16} />
                Create a Floor
              </button>
            </div>
          </div>
        )}

        <RightPanel
          element={selectedElement}
          eventId={plan?.eventId ?? ''}
          onChange={handleElementChange}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          canvasWidth={activeCanvasWidth}
          canvasHeight={activeCanvasHeight}
          onUpdateCanvas={(w, h) => {
            setRooms(rs => rs.map(r => r.id === activeRoomId ? { ...r, width: w, height: h } : r));
          }}
        />
      </div>

      <StatusBar
        rooms={rooms}
        activeRoomId={activeRoomId}
        onRoomChange={handleRoomChange}
        onRequestAddRoom={openFloorModal}
        onRequestDeleteRoom={setDeleteRoomId}
        totalElements={elements.length}
        selectedCount={selectedId ? 1 : 0}
        gridPx={plan.gridSize}
        seatedCount={totalSeated}
        seatedTotal={totalCapacity}
        zoom={zoom}
        scale="1 in = 4 ft"
      />
    </div>
  );
}
