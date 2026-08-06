const STORAGE_KEY = 'goosejobs_tracker';

export interface TrackedJob {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  applyUrl: string;
  status: 'saved' | 'applied';
  trackedAt: string;
  notes: string;
}

function read(): TrackedJob[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function write(jobs: TrackedJob[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export const tracker = {
  getAll(): TrackedJob[] {
    return read();
  },

  getStatus(id: number): 'saved' | 'applied' | null {
    return read().find(j => j.id === id)?.status ?? null;
  },

  save(job: Omit<TrackedJob, 'status' | 'trackedAt' | 'notes'>): void {
    const existing = read();
    const alreadyTracked = existing.find(j => j.id === job.id);
    if (alreadyTracked) {
      write(existing.map(j => j.id === job.id ? { ...j, status: 'saved' } : j));
    } else {
      write([...existing, { ...job, status: 'saved', trackedAt: new Date().toISOString(), notes: '' }]);
    }
  },

  markApplied(id: number): void {
    const existing = read();
    write(existing.map(j => j.id === id ? { ...j, status: 'applied' } : j));
  },

  remove(id: number): void {
    write(read().filter(j => j.id !== id));
  },

  updateNotes(id: number, notes: string): void {
    write(read().map(j => j.id === id ? { ...j, notes } : j));
  },
};
