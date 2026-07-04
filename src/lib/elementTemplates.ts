import type { ElementTemplate, ElementCategory } from '../types';

export const ELEMENT_TEMPLATES: ElementTemplate[] = [
  // Tables
  { type: 'table_round', category: 'tables', label: 'Round 10', defaultWidth: 80, defaultHeight: 80, defaultColor: '#4F46E5', shape: 'circle', defaultCapacity: 10 },
  { type: 'table_banquet', category: 'tables', label: 'Banquet', defaultWidth: 160, defaultHeight: 60, defaultColor: '#4F46E5', shape: 'rect', defaultCapacity: 8 },
  { type: 'table_square', category: 'tables', label: 'Square 8', defaultWidth: 80, defaultHeight: 80, defaultColor: '#4F46E5', shape: 'rect', defaultCapacity: 8 },
  { type: 'table_cocktail', category: 'tables', label: 'Cocktail', defaultWidth: 50, defaultHeight: 50, defaultColor: '#4F46E5', shape: 'circle', defaultCapacity: 4 },
  // Stage & Seating
  { type: 'stage', category: 'stage_seating', label: 'Stage', defaultWidth: 200, defaultHeight: 70, defaultColor: '#1E3A8A', shape: 'rect', defaultCapacity: 0 },
  { type: 'head_table', category: 'stage_seating', label: 'Head Table', defaultWidth: 160, defaultHeight: 45, defaultColor: '#3B5BDB', shape: 'rect', defaultCapacity: 12 },
  { type: 'podium', category: 'stage_seating', label: 'Podium', defaultWidth: 50, defaultHeight: 50, defaultColor: '#1E3A8A', shape: 'rect', defaultCapacity: 1 },
  { type: 'chair', category: 'stage_seating', label: 'Chair', defaultWidth: 28, defaultHeight: 28, defaultColor: '#64748b', shape: 'rect', defaultCapacity: 1 },
  { type: 'riser', category: 'stage_seating', label: 'Riser', defaultWidth: 120, defaultHeight: 50, defaultColor: '#475569', shape: 'rect', defaultCapacity: 0 },
  // Safety & Service
  { type: 'exit', category: 'safety_service', label: 'Exit', defaultWidth: 50, defaultHeight: 30, defaultColor: '#DC2626', shape: 'rect', defaultCapacity: 0 },
  { type: 'security', category: 'safety_service', label: 'Security', defaultWidth: 50, defaultHeight: 50, defaultColor: '#DC2626', shape: 'rect', defaultCapacity: 0 },
  { type: 'bar', category: 'safety_service', label: 'Bar', defaultWidth: 140, defaultHeight: 50, defaultColor: '#EF9F27', shape: 'rect', defaultCapacity: 0 },
  { type: 'buffet', category: 'safety_service', label: 'Buffet', defaultWidth: 160, defaultHeight: 55, defaultColor: '#EF9F27', shape: 'rect', defaultCapacity: 0 },
  // AV & Tech
  { type: 'speaker', category: 'av_tech', label: 'Speaker', defaultWidth: 36, defaultHeight: 36, defaultColor: '#334155', shape: 'rect', defaultCapacity: 0 },
  { type: 'projector', category: 'av_tech', label: 'Projector', defaultWidth: 50, defaultHeight: 36, defaultColor: '#334155', shape: 'rect', defaultCapacity: 0 },
  { type: 'dance_floor', category: 'stage_seating', label: 'Dance Floor', defaultWidth: 160, defaultHeight: 120, defaultColor: 'transparent', shape: 'rect', defaultCapacity: 0 },
];

export const CATEGORY_LABELS: Record<ElementCategory, string> = {
  tables: 'Tables',
  stage_seating: 'Stage & Seating',
  safety_service: 'Safety & Service',
  av_tech: 'AV & Tech',
};

export const CATEGORIES: ElementCategory[] = ['tables', 'stage_seating', 'safety_service', 'av_tech'];

export function getTemplate(type: string) {
  return ELEMENT_TEMPLATES.find(t => t.type === type);
}

export const PRESET_COLORS = [
  '#4F46E5', '#1E3A8A', '#3B5BDB', '#EF9F27', '#DC2626',
  '#10B981', '#0F6E56', '#334155', '#7C3AED', '#DB2777',
];
