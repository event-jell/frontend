import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stage, Layer, Rect, Circle, Text, Transformer, Line, Group,
} from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type Konva from 'konva';
import type { PlacedElement } from '../types';
import type { ToolMode } from './planner/PlannerToolbar';

interface Props {
  elements: PlacedElement[];
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (elements: PlacedElement[]) => void;
  toolMode?: ToolMode;
  snapEnabled?: boolean;
  rulersEnabled?: boolean;
  onZoomChange?: (zoom: number) => void;
  externalZoom?: number;
  darkMode?: boolean;
  onCursorMove?: (x: number, y: number) => void;
  otherCursors?: { x: number; y: number; color: string; name: string }[];
  onElementDrag?: (id: string, x: number, y: number) => void;
  onElementTransform?: (id: string, x: number, y: number, width: number, height: number, rotation: number) => void;
  remoteDrags?: Record<string, { x: number; y: number; width?: number; height?: number; rotation?: number }>;
}

interface ViewState { scale: number; x: number; y: number; }

function snapToGrid(val: number, grid: number) {
  return Math.round(val / grid) * grid;
}

function GridLines({ width, height, gridSize }: { width: number; height: number; gridSize: number }) {
  const lines: React.ReactNode[] = [];
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(<Line key={`h${y}`} points={[0, y, width, y]} stroke="#E2E8F0" strokeWidth={0.5} />);
  }
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(<Line key={`v${x}`} points={[x, 0, x, height]} stroke="#E2E8F0" strokeWidth={0.5} />);
  }
  return <>{lines}</>;
}


function ElementShape({ el, isSelected, onSelect, onChange, onDragMove, onTransform, reportPointer, gridSize, snap, toolMode, isRemoteDragging }: {
  el: PlacedElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updated: PlacedElement) => void;
  onDragMove?: (x: number, y: number) => void;
  onTransform?: (x: number, y: number, width: number, height: number, rotation: number) => void;
  reportPointer?: (pointer: { x: number, y: number } | null) => void;
  gridSize: number;
  snap: boolean;
  toolMode: ToolMode;
  isRemoteDragging?: boolean;
}) {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragMove = useCallback((e: KonvaEventObject<DragEvent>) => {
    const node = groupRef.current;
    if (!node) return;
    const x = snap ? snapToGrid(node.x(), gridSize) : node.x();
    const y = snap ? snapToGrid(node.y(), gridSize) : node.y();
    // Apply the snapped position back to the node itself so the element visibly
    // snaps to the grid while dragging, not just once on release.
    if (snap) {
      node.x(x);
      node.y(y);
    }
    onDragMove?.(x, y);

    const stage = node.getStage();
    if (stage) {
      reportPointer?.(stage.getPointerPosition());
    }
  }, [gridSize, snap, onDragMove, reportPointer]);

  const handleDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    const node = groupRef.current;
    if (!node) return;
    const x = snap ? snapToGrid(node.x(), gridSize) : node.x();
    const y = snap ? snapToGrid(node.y(), gridSize) : node.y();
    onChange({ ...el, x, y });
  }, [el, onChange, gridSize, snap]);

  const handleTransform = useCallback(() => {
    const node = groupRef.current;
    if (!node) return;
    const scaleX = node.scaleX(), scaleY = node.scaleY();
    const x = snap ? snapToGrid(node.x(), gridSize) : node.x();
    const y = snap ? snapToGrid(node.y(), gridSize) : node.y();
    const width = Math.max(20, snap ? snapToGrid(el.width * scaleX, gridSize) : el.width * scaleX);
    const height = Math.max(20, snap ? snapToGrid(el.height * scaleY, gridSize) : el.height * scaleY);
    const rotation = node.rotation();

    onTransform?.(x, y, width, height, rotation);

    const stage = node.getStage();
    if (stage) {
      reportPointer?.(stage.getPointerPosition());
    }
  }, [el, gridSize, snap, onTransform, reportPointer]);

  const handleTransformEnd = useCallback(() => {
    const node = groupRef.current;
    if (!node) return;
    const scaleX = node.scaleX(), scaleY = node.scaleY();
    node.scaleX(1); node.scaleY(1);
    onChange({
      ...el,
      x: snap ? snapToGrid(node.x(), gridSize) : node.x(),
      y: snap ? snapToGrid(node.y(), gridSize) : node.y(),
      width: Math.max(20, snap ? snapToGrid(el.width * scaleX, gridSize) : el.width * scaleX),
      height: Math.max(20, snap ? snapToGrid(el.height * scaleY, gridSize) : el.height * scaleY),
      rotation: node.rotation(),
    });
  }, [el, onChange, gridSize, snap]);

  const isDanceFloor = el.type === 'dance_floor';
  const isExit = el.type === 'exit' || el.type === 'security';

  const isWhite = el.color.toLowerCase() === '#ffffff' || el.color.toLowerCase() === '#fff';
  const commonProps = {
    fill: (isDanceFloor || isExit) ? 'transparent' : el.color,
    opacity: el.opacity !== undefined ? el.opacity : ((isDanceFloor || isExit) ? 1 : 0.9),
    stroke: isDanceFloor ? '#94A3B8' : isExit ? el.color : (isWhite ? '#cbd5e1' : el.color),
    strokeWidth: isDanceFloor || isExit ? 1.5 : (isWhite ? 1.5 : 1),
    dash: isDanceFloor || isExit ? [6, 4] : [],
  };

  const isCircle = el.shape === 'circle';
  const textX = isCircle ? -el.width / 2 : 0;
  const textY = isCircle ? -8 : (el.type === 'exit' ? el.height * 0.6 : el.height / 2 - 8);
  const textW = el.width;
  const labelColor = isDanceFloor ? '#94A3B8' : isExit ? el.color : '#fff';

  return (
    <>
      <Group
        ref={groupRef}
        x={el.x}
        y={el.y}
        rotation={el.rotation}
        draggable={toolMode === 'select' && !el.locked && !isRemoteDragging}
        opacity={isRemoteDragging ? 0.5 : 1}
        onClick={(e: KonvaEventObject<MouseEvent>) => { e.cancelBubble = true; onSelect(); }}
        onTap={(e: KonvaEventObject<Event>) => { e.cancelBubble = true; onSelect(); }}
        onDragStart={(e: KonvaEventObject<DragEvent>) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
      >
        {isCircle ? (
          <>
            <Circle {...commonProps} x={0} y={0} radius={el.width / 2} />
            {el.capacity > 0 && Array.from({ length: el.capacity }).map((_, i) => {
              const angle = (i * 2 * Math.PI) / el.capacity - Math.PI / 2;
              const chairRadius = Math.max(4, Math.min(8, (el.width * Math.PI) / (el.capacity || 1) * 0.25));
              const dist = (el.width / 2) + chairRadius + 3;
              const isAssigned = el.seatAssignments 
                ? el.seatAssignments.some(a => a.seatIndex === i + 1)
                : i < (el.seated || 0);
              
              return (
                <Circle 
                  key={`chair-${i}`}
                  x={Math.cos(angle) * dist}
                  y={Math.sin(angle) * dist}
                  radius={chairRadius}
                  fill={isAssigned ? el.color : '#ffffff'}
                  stroke={commonProps.stroke}
                  strokeWidth={1.5}
                  opacity={commonProps.opacity}
                  listening={false}
                  perfectDrawEnabled={false}
                />
              );
            })}
          </>
        ) : (
          <>
            <Rect 
              {...commonProps} 
              x={0} 
              y={0} 
              width={el.width} 
              height={el.height} 
              cornerRadius={el.type === 'chair' ? [8, 8, 2, 2] : 3} 
            />
            
            {/* Chairs for Rectangular Tables */}
            {(el.type === 'table_banquet' || el.type === 'table_square' || el.type === 'head_table') && el.capacity > 0 && (
              Array.from({ length: el.capacity }).map((_, i) => {
                const chairRadius = 6;
                let cx = 0, cy = 0;
                
                if (el.type === 'head_table') {
                  // Distribute along top edge only
                  const spacing = el.width / el.capacity;
                  cx = (i + 0.5) * spacing;
                  cy = -chairRadius - 2;
                } else {
                  // Distribute around perimeter
                  const perimeter = 2 * el.width + 2 * el.height;
                  const pos = (i + 0.5) * (perimeter / el.capacity);
                  if (pos <= el.width) { cx = pos; cy = -chairRadius - 2; }
                  else if (pos <= el.width + el.height) { cx = el.width + chairRadius + 2; cy = pos - el.width; }
                  else if (pos <= 2 * el.width + el.height) { cx = el.width - (pos - (el.width + el.height)); cy = el.height + chairRadius + 2; }
                  else { cx = -chairRadius - 2; cy = el.height - (pos - (2 * el.width + el.height)); }
                }

                const isAssigned = el.seatAssignments 
                  ? el.seatAssignments.some(a => a.seatIndex === i + 1)
                  : i < (el.seated || 0);

                return (
                  <Circle 
                    key={`rect-chair-${i}`} x={cx} y={cy} radius={chairRadius}
                    fill={isAssigned ? el.color : '#ffffff'} stroke={commonProps.stroke} strokeWidth={1.5} opacity={commonProps.opacity}
                    listening={false} perfectDrawEnabled={false}
                  />
                );
              })
            )}

            {/* Custom Decorations by Type */}
            {(el.type === 'stage' || el.type === 'riser') && (
              <>
                {/* Inner border */}
                <Rect x={3} y={3} width={el.width - 6} height={el.height - 6} stroke="#fff" strokeWidth={1} opacity={0.3} listening={false} perfectDrawEnabled={false} />
                {/* Backdrop at the top */}
                <Rect x={0} y={0} width={el.width} height={el.height * 0.15} fill="#000" opacity={0.2} listening={false} perfectDrawEnabled={false} />
                {/* Stairs at the front center */}
                <Rect x={el.width * 0.3} y={el.height - 12} width={el.width * 0.4} height={4} fill="#fff" opacity={0.6} listening={false} perfectDrawEnabled={false} />
                <Rect x={el.width * 0.25} y={el.height - 8} width={el.width * 0.5} height={4} fill="#fff" opacity={0.4} listening={false} perfectDrawEnabled={false} />
                <Rect x={el.width * 0.2} y={el.height - 4} width={el.width * 0.6} height={4} fill="#fff" opacity={0.2} listening={false} perfectDrawEnabled={false} />
              </>
            )}
            
            {el.type === 'podium' && (
              <>
                <Rect x={el.width * 0.2} y={el.height * 0.2} width={el.width * 0.6} height={el.height * 0.6} stroke={commonProps.stroke} strokeWidth={1.5} opacity={0.6} listening={false} perfectDrawEnabled={false} />
                <Circle x={el.width / 2} y={el.height * 0.3} radius={3} fill={commonProps.stroke} opacity={0.8} listening={false} perfectDrawEnabled={false} />
              </>
            )}

            {el.type === 'bar' && (
              <>
                <Line points={[5, el.height / 2, el.width - 5, el.height / 2]} stroke={commonProps.stroke} strokeWidth={2} opacity={0.4} listening={false} perfectDrawEnabled={false} />
                <Circle x={el.width * 0.2} y={el.height * 0.25} radius={3} fill={commonProps.stroke} opacity={0.5} listening={false} perfectDrawEnabled={false} />
                <Circle x={el.width * 0.3} y={el.height * 0.25} radius={3} fill={commonProps.stroke} opacity={0.5} listening={false} perfectDrawEnabled={false} />
              </>
            )}

            {el.type === 'buffet' && (
              <>
                <Rect x={el.width * 0.1} y={el.height * 0.2} width={el.width * 0.25} height={el.height * 0.6} stroke={commonProps.stroke} strokeWidth={2} cornerRadius={3} opacity={0.5} listening={false} perfectDrawEnabled={false} />
                <Rect x={el.width * 0.4} y={el.height * 0.2} width={el.width * 0.25} height={el.height * 0.6} stroke={commonProps.stroke} strokeWidth={2} cornerRadius={3} opacity={0.5} listening={false} perfectDrawEnabled={false} />
                <Rect x={el.width * 0.7} y={el.height * 0.2} width={el.width * 0.2} height={el.height * 0.6} stroke={commonProps.stroke} strokeWidth={2} cornerRadius={3} opacity={0.5} listening={false} perfectDrawEnabled={false} />
              </>
            )}

            {el.type === 'speaker' && (
              <>
                <Circle x={el.width / 2} y={el.height * 0.35} radius={el.width * 0.15} fill={commonProps.stroke} opacity={0.7} listening={false} perfectDrawEnabled={false} />
                <Circle x={el.width / 2} y={el.height * 0.7} radius={el.width * 0.25} fill={commonProps.stroke} opacity={0.4} listening={false} perfectDrawEnabled={false} />
              </>
            )}

            {el.type === 'projector' && (
              <>
                <Rect x={el.width * 0.3} y={el.height * 0.8} width={el.width * 0.4} height={el.height * 0.2} fill={commonProps.stroke} opacity={0.7} listening={false} perfectDrawEnabled={false} />
                <Circle x={el.width / 2} y={el.height} radius={el.width * 0.15} fill={commonProps.stroke} opacity={0.9} listening={false} perfectDrawEnabled={false} />
              </>
            )}

            {el.type === 'exit' && (
              <>
                {/* Door Frame */}
                <Rect x={el.width / 2 - 12} y={el.height * 0.15} width={12} height={18} stroke={commonProps.stroke} strokeWidth={2} opacity={0.8} listening={false} perfectDrawEnabled={false} />
                {/* Arrow out of door */}
                <Line points={[el.width / 2 - 4, el.height * 0.15 + 9, el.width / 2 + 10, el.height * 0.15 + 9]} stroke={commonProps.stroke} strokeWidth={2} opacity={0.8} listening={false} perfectDrawEnabled={false} />
                <Line points={[el.width / 2 + 6, el.height * 0.15 + 5, el.width / 2 + 10, el.height * 0.15 + 9, el.width / 2 + 6, el.height * 0.15 + 13]} stroke={commonProps.stroke} strokeWidth={2} opacity={0.8} listening={false} perfectDrawEnabled={false} />
              </>
            )}
          </>
        )}

        {/* Label */}
        <Text
          x={textX} y={textY} width={textW}
          text={el.label}
          fontSize={el.width > 60 ? 11 : 9}
          fontStyle="bold"
          fill={labelColor}
          align="center"
          listening={false}
        />

        {/* Capacity sub-label for tables */}
        {el.capacity > 0 && (
          <Text
            x={textX}
            y={isCircle ? 2 : el.height / 2 + 2}
            width={textW}
            text={`${el.seated}/${el.capacity}`}
            fontSize={8}
            fill={labelColor}
            align="center"
            opacity={0.75}
            listening={false}
          />
        )}
      </Group>

      {isSelected && !el.locked && (
        <Transformer
          ref={trRef}
          rotateEnabled
          keepRatio={isCircle}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)}
          anchorSize={7}
          anchorCornerRadius={3}
          borderStroke="#7A1F1F"
          anchorFill="#7A1F1F"
          anchorStroke="#fff"
        />
      )}
    </>
  );
}

const RULER_THICKNESS = 20;

function Ruler({ orientation, view, length, canvasLength, gridSize, darkMode }: {
  orientation: 'horizontal' | 'vertical';
  view: ViewState;
  length: number;
  canvasLength: number;
  gridSize: number;
  darkMode: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isH = orientation === 'horizontal';

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = isH ? length : RULER_THICKNESS;
    const h = isH ? RULER_THICKNESS : length;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = darkMode ? '#1e293b' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = darkMode ? '#475569' : '#cbd5e1';
    ctx.fillStyle = darkMode ? '#94a3b8' : '#64748b';
    ctx.font = '9px sans-serif';
    ctx.lineWidth = 1;

    const offset = isH ? view.x : view.y;
    const step = gridSize;
    const startUnit = Math.max(0, Math.floor(-offset / view.scale / step) * step);
    const endUnit = Math.min(canvasLength, Math.ceil((length - offset) / view.scale / step) * step);

    for (let u = startUnit; u <= endUnit; u += step) {
      const pos = u * view.scale + offset;
      const isMajor = Math.round(u / step) % 5 === 0;
      const tickLen = isMajor ? 9 : 4;

      ctx.beginPath();
      if (isH) {
        ctx.moveTo(pos + 0.5, RULER_THICKNESS);
        ctx.lineTo(pos + 0.5, RULER_THICKNESS - tickLen);
      } else {
        ctx.moveTo(RULER_THICKNESS, pos + 0.5);
        ctx.lineTo(RULER_THICKNESS - tickLen, pos + 0.5);
      }
      ctx.stroke();

      if (isMajor) {
        const label = String(Math.round(u));
        if (isH) {
          ctx.fillText(label, pos + 2, 9);
        } else {
          ctx.save();
          ctx.translate(9, pos - 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }
      }
    }
  }, [isH, view, length, canvasLength, gridSize, darkMode]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute pointer-events-none z-10 ${
        isH ? 'top-0 left-5 border-b' : 'top-5 left-0 border-r'
      } ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}
      style={{ width: isH ? length : RULER_THICKNESS, height: isH ? RULER_THICKNESS : length }}
    />
  );
}

const MIN_SCALE = 0.15, MAX_SCALE = 4, ZOOM_FACTOR = 1.12;

export default function FloorCanvas({
  elements = [], canvasWidth, canvasHeight, gridSize,
  selectedId, onSelect, onChange,
  toolMode = 'select', snapEnabled = true, rulersEnabled = false,
  onZoomChange, externalZoom,
  darkMode = false,
  onCursorMove, otherCursors,
  onElementDrag, onElementTransform, remoteDrags,
}: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [view, setView] = useState<ViewState>({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const setClampedView = useCallback((updater: React.SetStateAction<ViewState>) => {
    setView(v => {
      const next = typeof updater === 'function' ? updater(v) : updater;
      const margin = 150;
      const minX = size.w - margin - canvasWidth * next.scale;
      const maxX = margin;
      const minY = size.h - margin - canvasHeight * next.scale;
      const maxY = margin;
      return {
        scale: next.scale,
        x: Math.min(Math.max(next.x, Math.min(minX, maxX)), Math.max(minX, maxX)),
        y: Math.min(Math.max(next.y, Math.min(minY, maxY)), Math.max(minY, maxY)),
      };
    });
  }, [size, canvasWidth, canvasHeight]);

  // Spacebar pan support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Sync external zoom control
  useEffect(() => {
    if (externalZoom == null) return;
    setClampedView(v => {
      const cx = size.w / 2, cy = size.h / 2;
      const newScale = externalZoom;
      return {
        scale: newScale,
        x: cx - (cx - v.x) * (newScale / v.scale),
        y: cy - (cy - v.y) * (newScale / v.scale),
      };
    });
  }, [externalZoom]);

  // Observe container & setup native events
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    // Block native context menu on the canvas entirely
    const blockContextMenu = (e: Event) => e.preventDefault();
    el.addEventListener('contextmenu', blockContextMenu);

    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    const initScale = Math.min((rect.width - 80) / canvasWidth, (rect.height - 80) / canvasHeight, 1);
    setClampedView({
      scale: initScale,
      x: (rect.width - canvasWidth * initScale) / 2,
      y: (rect.height - canvasHeight * initScale) / 2,
    });
    onZoomChange?.(initScale);
    
    return () => {
      ro.disconnect();
      el.removeEventListener('contextmenu', blockContextMenu);
    };
  }, [canvasWidth, canvasHeight, onZoomChange]);

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    if (e.evt.ctrlKey || e.evt.metaKey) {
      // Zoom (Pinch or Ctrl+Scroll)
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      setClampedView(v => {
        // Smooth scaling factor based on delta
        const scaleBy = 1.01;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * Math.pow(scaleBy, -e.evt.deltaY / 2)));
        const mousePointTo = { x: (pointer.x - v.x) / v.scale, y: (pointer.y - v.y) / v.scale };
        const next = { scale: newScale, x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale };
        onZoomChange?.(newScale);
        return next;
      });
    } else {
      // Pan (Two-finger scroll or regular scroll)
      setClampedView(v => {
        const dx = e.evt.shiftKey ? e.evt.deltaY : e.evt.deltaX;
        const dy = e.evt.shiftKey ? e.evt.deltaX : e.evt.deltaY;
        return { ...v, x: v.x - dx, y: v.y - dy };
      });
    }
  }, [onZoomChange]);

  const isPanMode = toolMode === 'pan' || spacePressed;

  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (isPanMode || e.evt.button === 1 || e.evt.button === 2 || e.evt.altKey) {
      e.evt.preventDefault();
      setIsPanning(true);
      lastPos.current = { x: e.evt.clientX, y: e.evt.clientY };
    }
  }, [isPanMode]);

  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (isPanning && lastPos.current) {
      const dx = e.evt.clientX - lastPos.current.x;
      const dy = e.evt.clientY - lastPos.current.y;
      lastPos.current = { x: e.evt.clientX, y: e.evt.clientY };
      setClampedView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
    }

    if (onCursorMove) {
      const stage = stageRef.current;
      if (stage) {
        const pointer = stage.getPointerPosition();
        if (pointer) {
          const logicalX = (pointer.x - view.x) / view.scale;
          const logicalY = (pointer.y - view.y) / view.scale;
          onCursorMove(logicalX, logicalY);
        }
      }
    }
  }, [isPanning, setClampedView, onCursorMove, view.x, view.y, view.scale]);

  const handleReportPointer = useCallback((pointer: { x: number, y: number } | null) => {
    if (pointer && onCursorMove) {
      const logicalX = (pointer.x - view.x) / view.scale;
      const logicalY = (pointer.y - view.y) / view.scale;
      onCursorMove(logicalX, logicalY);
    }
  }, [onCursorMove, view.x, view.y, view.scale]);

  const handleMouseUp = useCallback(() => { setIsPanning(false); lastPos.current = null; }, []);

  const handleElementChange = useCallback((updated: PlacedElement) => {
    onChange(elements.map(el => el.id === updated.id ? updated : el));
  }, [elements, onChange]);

  const cursor = isPanMode || isPanning ? 'grab' : 'default';

  return (
    <div 
      ref={containerRef} 
      className="flex-1 relative overflow-hidden" 
      style={{ backgroundColor: darkMode ? '#0f172a' : '#f1f5f9', cursor: isPanning ? 'grabbing' : cursor }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => { e.evt.preventDefault(); }}
        onClick={e => { if (e.target === e.target.getStage()) onSelect(null); }}
      >
        <Layer>
          <Group x={view.x} y={view.y} scaleX={view.scale} scaleY={view.scale}>
            {/* Canvas bg */}
            <Rect width={canvasWidth} height={canvasHeight} fill={darkMode ? '#1e293b' : '#f8fafc'} cornerRadius={4} listening={false} perfectDrawEnabled={false} />
            {Array.from({ length: Math.ceil(canvasWidth / gridSize) + 1 }).map((_, i) => (
              <Line
                key={`v-${i}`}
                points={[i * gridSize, 0, i * gridSize, canvasHeight]}
                stroke={darkMode ? '#334155' : '#e2e8f0'}
                strokeWidth={1}
                listening={false}
                perfectDrawEnabled={false}
              />
            ))}
            {Array.from({ length: Math.ceil(canvasHeight / gridSize) + 1 }).map((_, i) => (
              <Line
                key={`h-${i}`}
                points={[0, i * gridSize, canvasWidth, i * gridSize]}
                stroke={darkMode ? '#334155' : '#e2e8f0'}
                strokeWidth={1}
                listening={false}
                perfectDrawEnabled={false}
              />
            ))}

            {[...elements]
              .sort((a, b) => a.zIndex - b.zIndex)
              .map(el => {
                const remoteDrag = remoteDrags?.[el.id];
                const displayEl = remoteDrag ? { 
                  ...el, 
                  x: remoteDrag.x, 
                  y: remoteDrag.y,
                  ...(remoteDrag.width !== undefined && { width: remoteDrag.width }),
                  ...(remoteDrag.height !== undefined && { height: remoteDrag.height }),
                  ...(remoteDrag.rotation !== undefined && { rotation: remoteDrag.rotation }),
                } : el;
                return (
                  <ElementShape
                    key={el.id}
                    el={displayEl}
                    isSelected={selectedId === el.id}
                    onSelect={() => onSelect(el.id)}
                    onChange={handleElementChange}
                    onDragMove={(x, y) => onElementDrag?.(el.id, x, y)}
                    onTransform={(x, y, w, h, r) => onElementTransform?.(el.id, x, y, w, h, r)}
                    reportPointer={handleReportPointer}
                    gridSize={gridSize}
                    snap={snapEnabled}
                    toolMode={toolMode}
                    isRemoteDragging={!!remoteDrag}
                  />
                );
              })}

            {otherCursors?.map(c => (
              <Group key={c.name} x={c.x} y={c.y} listening={false}>
                <Line 
                  points={[0, 0, 15, 10, 8, 12, 10, 20, 6, 21, 4, 13, 0, 16]} 
                  fill={c.color} 
                  stroke="#ffffff" 
                  strokeWidth={1.5} 
                  closed 
                  shadowColor="rgba(0,0,0,0.3)"
                  shadowBlur={4}
                  shadowOffset={{ x: 0, y: 2 }}
                />
                <Group x={12} y={16}>
                  <Rect 
                    fill={c.color} 
                    cornerRadius={6} 
                    width={c.name.length * 8 + 16} 
                    height={22} 
                    shadowColor="rgba(0,0,0,0.2)"
                    shadowBlur={4}
                    shadowOffset={{ x: 0, y: 2 }}
                  />
                  <Text 
                    x={8} 
                    y={5} 
                    text={c.name} 
                    fill="#ffffff" 
                    fontSize={12} 
                    fontStyle="bold" 
                    fontFamily="sans-serif"
                  />
                </Group>
              </Group>
            ))}
          </Group>
        </Layer>
      </Stage>

      {rulersEnabled && (
        <>
          <div
            className={`absolute top-0 left-0 z-10 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'} border-r border-b`}
            style={{ width: RULER_THICKNESS, height: RULER_THICKNESS }}
          />
          <Ruler orientation="horizontal" view={view} length={size.w} canvasLength={canvasWidth} gridSize={gridSize} darkMode={darkMode} />
          <Ruler orientation="vertical" view={view} length={size.h} canvasLength={canvasHeight} gridSize={gridSize} darkMode={darkMode} />
        </>
      )}

      {/* Mini zoom controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white rounded-xl shadow-md border border-slate-100 px-2 py-1.5">
        <button onClick={() => setClampedView(v => { const s = Math.min(MAX_SCALE, v.scale * ZOOM_FACTOR); onZoomChange?.(s); const cx = size.w/2, cy = size.h/2; return { scale: s, x: cx-(cx-v.x)*(s/v.scale), y: cy-(cy-v.y)*(s/v.scale) }; })}
          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded text-base font-light">+</button>
        <span className="text-xs font-semibold text-slate-600 w-12 text-center tabular-nums">{t('planner.zoom_pct', { pct: Math.round(view.scale * 100) })}</span>
        <button onClick={() => setClampedView(v => { const s = Math.max(MIN_SCALE, v.scale / ZOOM_FACTOR); onZoomChange?.(s); const cx = size.w/2, cy = size.h/2; return { scale: s, x: cx-(cx-v.x)*(s/v.scale), y: cy-(cy-v.y)*(s/v.scale) }; })}
          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded text-base font-light">-</button>
        <div className="w-px h-4 bg-slate-200 mx-1"></div>
        <button onClick={() => {
          const initScale = Math.min((size.w - 80) / canvasWidth, (size.h - 80) / canvasHeight, 1);
          setClampedView({ scale: initScale, x: (size.w - canvasWidth * initScale) / 2, y: (size.h - canvasHeight * initScale) / 2 });
          onZoomChange?.(initScale);
        }}
          className="text-xs font-semibold text-slate-600 hover:bg-slate-50 px-2 py-1 rounded">{t('planner.fit')}</button>
      </div>
    </div>
  );
}
