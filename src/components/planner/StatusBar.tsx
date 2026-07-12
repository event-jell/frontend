import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface Room {
  id: string;
  name: string;
  width?: number;
  height?: number;
}

interface Props {
  rooms: Room[];
  activeRoomId: string;
  onRoomChange: (id: string) => void;
  onRequestAddRoom: () => void;
  onRequestDeleteRoom: (id: string) => void;
  totalElements: number;
  selectedCount: number;
  gridPx: number;
  seatedCount: number;
  seatedTotal: number;
  zoom: number;
  scale: string;
}

export default function StatusBar({
  rooms, activeRoomId, onRoomChange, onRequestAddRoom, onRequestDeleteRoom,
  totalElements, selectedCount, gridPx,
  seatedCount, seatedTotal, zoom, scale,
}: Props) {
  const { t } = useTranslation();
  const pct = seatedTotal > 0 ? seatedCount / seatedTotal : 0;

  return (
    <div className="h-9 bg-white border-t border-slate-100 flex items-center flex-shrink-0 shadow-sm">
      {/* Room tabs */}
      <div className="flex items-center h-full border-r border-slate-100 pr-1 overflow-x-auto">
        {rooms.map(room => (
          <div
            key={room.id}
            className={`group flex items-center h-full border-b-2 transition-all whitespace-nowrap ${
              room.id === activeRoomId
                ? 'border-[#7A1F1F] text-[#7A1F1F]'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <button
              onClick={() => onRoomChange(room.id)}
              className="flex items-center gap-1.5 h-full pl-4 pr-2 text-xs font-medium"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: room.id === activeRoomId ? '#7A1F1F' : '#94A3B8' }}
              />
              {room.name}
            </button>

            {/* Delete button — visible on hover */}
            <button
              onClick={e => { e.stopPropagation(); onRequestDeleteRoom(room.id); }}
              className="opacity-0 group-hover:opacity-100 mr-1.5 p-0.5 rounded hover:bg-red-100 hover:text-red-500 transition-all text-slate-300"
              title="Delete floor"
            >
              <X size={11} />
            </button>
          </div>
        ))}

        <button
          onClick={onRequestAddRoom}
          className="flex items-center gap-1 h-full px-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors border-b-2 border-transparent"
          title="Add floor"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Right stats */}
      <div className="ml-auto flex items-center gap-4 pr-4 text-xs text-slate-500">
        <span>
          <span className="text-slate-700 font-medium">{t('planner.status_bar_elements', { count: totalElements })}</span>
          {selectedCount > 0 && (
            <> · <span className="text-slate-700 font-medium">{t('planner.status_bar_selected', { count: selectedCount })}</span></>
          )}
        </span>

        <span>{t('planner.status_bar_grid', { px: gridPx })}</span>

        <span className="text-slate-400">|</span>

        <span>{t('planner.status_bar_zoom', { pct: Math.round(zoom * 100), scale: scale })}</span>

        <span className="text-slate-400">|</span>

        <div className="flex items-center gap-2">
          <span>
            {t('planner.status_bar_seated', { seated: seatedCount, total: seatedTotal })}
          </span>
          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct * 100}%`, backgroundColor: pct > 0.8 ? '#7A1F1F' : '#7A1F1F' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
