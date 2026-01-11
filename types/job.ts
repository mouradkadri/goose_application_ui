// The format your API returns
export interface RawApiJob {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  salary: string | null;
  relevance_score: number;
  date_posted: string;
  apply_url: string;
}

// The format your UI components expect
export interface Job {
  id: string | number;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string;
  posted: string;
  matchScore: number;
  requirements: string[];
  benefits: string[];
  applyUrl: string;
}