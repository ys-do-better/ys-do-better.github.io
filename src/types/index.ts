export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  degree: string;
  researchArea: string;
  skills: Skill[];
  socialLinks: SocialLink[];
}

export interface Skill {
  id?: string;
  name: string;
  level: number; // 1-5
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Photo {
  id: string;
  uri: string;
  storagePath: string;
  createdAt: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  device?: string;
  tags: string[];
  isPrivate: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  occurredAt?: string; // alias for UI rendering
  category: 'academic' | 'project' | 'exam' | 'other';
  nodeType?: 'milestone' | 'daily' | 'achievement';
  metricName?: string;
  metricValue?: number;
  media?: string[];
  createdAt?: string;
}

export interface MoodEntry {
  id: string;
  date: string;
  entryDate?: string; // alias for UI rendering
  moodScore: number; // 1-5
  moodLabel: string;
  note?: string;
  tags: string[];
}

export interface BabyRecord {
  id: string;
  date: string;
  height?: number;
  weight?: number;
  headCircumference?: number;
}

export interface BabyMilestone {
  id: string;
  title: string;
  date: string;
  media?: string[];
}

export interface VaccineRecord {
  id: string;
  name: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  nextDoseDate?: string;
}

export interface HealthRecord {
  id: string;
  date: string;
  recordDate?: string; // alias for UI rendering
  sleepHours?: number;
  steps?: number;
  restingHeartRate?: number;
  waterIntakeMl?: number;
  deepWorkHours?: number;
  deepWorkMinutes?: number; // alias used in UI
}

export interface Supplement {
  id?: string;
  name: string;
  taken: boolean;
  enabled?: boolean;
  dailyReminderTime?: string;
}

export interface FinanceAccount {
  id: string;
  name: string;
  type: 'checking' | 'investment' | 'insurance' | 'liability';
  balance: number;
}

export interface InsurancePolicy {
  id: string;
  name: string;
  policyType: string;
  provider: string;
  insuredPerson: string;
  coverageAmount: number;
  startDate: string;
  expiryDate: string;
  reminderEnabled: boolean;
}

export interface FundAllocation {
  category: string;
  percentage: number;
}

export interface Book {
  id: string;
  isbn?: string;
  title: string;
  author: string;
  publisher: string;
  coverImage?: string;
  totalPages?: number;
  currentPage?: number;
  status: 'unread' | 'reading' | 'finished';
  progress?: number;
  notes?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
}

export interface BookNote {
  id: string;
  bookId: string;
  content: string;
  keywords: string[];
  pageNumber?: number;
}
