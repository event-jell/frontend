import { 
  Heart, Gift, Presentation, Music, Briefcase, PartyPopper, BookOpen, MoreHorizontal 
} from 'lucide-react';

export interface EventTypeConfig {
  value: string;
  label: string;
  icon: any;
  desc: string;
  theme: {
    primary: string;      // Dominant color hex
    bg: string;           // Background tint hex
    fg: string;           // Foreground/Text color hex
    accent: string;       // Accent detail color hex
    cardBg: string;       // Public card background hex
  };
  defaultRsvpFields: {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'phone' | 'email';
    required: boolean;
    placeholder?: string;
    options?: string[];
  }[];
}

export const EVENT_TYPE_CONFIGS: Record<string, EventTypeConfig> = {
  wedding: {
    value: 'wedding',
    label: 'Wedding & Reception',
    icon: Heart,
    desc: 'Seating plans, RSVPs & romantic layouts',
    theme: {
      primary: '#7A1F1F',    // Crimson
      bg: '#FAF0E8',         // Cream/Champagne
      fg: '#2A0A0A',
      accent: '#D4A24C',     // Gold
      cardBg: '#FFFDFB',
    },
    defaultRsvpFields: [
      {
        id: 'meal_preference',
        label: 'Meal Preference',
        type: 'select',
        required: true,
        options: ['Beef Tenderloin', 'Grilled Salmon', 'Vegan Wellington', 'Child Menu'],
      },
      {
        id: 'song_request',
        label: 'Song Request for the DJ',
        type: 'text',
        required: false,
        placeholder: 'e.g. Dancing Queen - ABBA',
      }
    ]
  },
  birthday: {
    value: 'birthday',
    label: 'Birthday Party',
    icon: Gift,
    desc: 'Games, gift registry & party layouts',
    theme: {
      primary: '#6D28D9',    // Purple
      bg: '#F5F3FF',
      fg: '#1E1B4B',
      accent: '#EC4899',     // Pink
      cardBg: '#FCFAFF',
    },
    defaultRsvpFields: [
      {
        id: 'favorite_drink',
        label: 'What is your favorite drink/cocktail?',
        type: 'text',
        required: false,
        placeholder: 'e.g. Gin & Tonic, Mojito...',
      }
    ]
  },
  conference: {
    value: 'conference',
    label: 'Conference & Summit',
    icon: Presentation,
    desc: 'Auditorium seating & exhibitor booths',
    theme: {
      primary: '#1E3A8A',    // Deep Blue
      bg: '#EFF6FF',
      fg: '#0F172A',
      accent: '#2563EB',     // Royal Blue
      cardBg: '#F8FAFC',
    },
    defaultRsvpFields: [
      {
        id: 'organization',
        label: 'Company / Organization',
        type: 'text',
        required: true,
        placeholder: 'e.g. Google, Stripe...',
      },
      {
        id: 'job_title',
        label: 'Job Title / Profession',
        type: 'text',
        required: true,
        placeholder: 'e.g. Product Manager, Engineer...',
      },
      {
        id: 'session_preference',
        label: 'Primary Track Interest',
        type: 'select',
        required: false,
        options: ['Keynotes & General', 'Workshops & Lab Sessions', 'Tech Panels', 'Networking Dinner'],
      }
    ]
  },
  concert: {
    value: 'concert',
    label: 'Concert & Live Show',
    icon: Music,
    desc: 'Stage zoning, standing areas & ticketing',
    theme: {
      primary: '#4C1D95',    // Violet
      bg: '#F5F3FF',
      fg: '#0F172A',
      accent: '#F59E0B',     // Amber
      cardBg: '#FAF9FF',
    },
    defaultRsvpFields: [
      {
        id: 'ticket_zone',
        label: 'Preferred Standing / Seating Zone',
        type: 'select',
        required: true,
        options: ['Front Row VIP', 'General Admission (Pit)', 'Main Stands (Left/Right)', 'Balcony'],
      }
    ]
  },
  corporate: {
    value: 'corporate',
    label: 'Corporate Event',
    icon: Briefcase,
    desc: 'Executive meetings, seminars & launches',
    theme: {
      primary: '#0F766E',    // Teal
      bg: '#F0FDF4',
      fg: '#064E3B',
      accent: '#10B981',     // Green
      cardBg: '#FAFDFB',
    },
    defaultRsvpFields: [
      {
        id: 'department',
        label: 'Department',
        type: 'text',
        required: true,
        placeholder: 'e.g. Sales, Marketing, HR...',
      },
      {
        id: 'dietary_restrictions',
        label: 'Dietary Restrictions',
        type: 'text',
        required: false,
        placeholder: 'e.g. Gluten-Free, Halal...',
      }
    ]
  },
  private_party: {
    value: 'private_party',
    label: 'Private Party / Social',
    icon: PartyPopper,
    desc: 'Reunions, dinners & custom get-togethers',
    theme: {
      primary: '#BE123C',    // Rose
      bg: '#FFF1F2',
      fg: '#4C0519',
      accent: '#F59E0B',     // Amber
      cardBg: '#FFFDFD',
    },
    defaultRsvpFields: [
      {
        id: 'plus_one_name',
        label: 'Name of plus-one (if bringing)',
        type: 'text',
        required: false,
        placeholder: 'Their full name',
      }
    ]
  },
  religious: {
    value: 'religious',
    label: 'Religious Service',
    icon: BookOpen,
    desc: 'Congregation services, weddings & events',
    theme: {
      primary: '#15803D',    // Green
      bg: '#F0FDF4',
      fg: '#14532D',
      accent: '#EAB308',     // Yellow
      cardBg: '#F9FDF9',
    },
    defaultRsvpFields: [
      {
        id: 'family_count',
        label: 'Number of family members attending with you',
        type: 'number',
        required: true,
        placeholder: '0',
      }
    ]
  },
  other: {
    value: 'other',
    label: 'Other Custom Event',
    icon: MoreHorizontal,
    desc: 'Custom layouts & personalized tracking',
    theme: {
      primary: '#374151',    // Slate/Gray
      bg: '#F9FAFB',
      fg: '#111827',
      accent: '#9CA3AF',
      cardBg: '#FFFFFF',
    },
    defaultRsvpFields: []
  }
};

export function getEventTypeConfig(type: string): EventTypeConfig {
  return EVENT_TYPE_CONFIGS[type?.toLowerCase()] || EVENT_TYPE_CONFIGS.other;
}
