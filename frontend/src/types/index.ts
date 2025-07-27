export type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type Category = 'Cleaning' | 'Cutting' | 'Refilling' | 'Other';
export type Status = 'Unknown' | 'Submitted' | 'Done' | 'Declined';
export type TaskType = 'Daily' | 'Priority';

export interface Task {
  id: number;
  task: string;
  description?: string;
  category: Category;
  day: Day;
  // initials: Staff initials after completion; Admin initials after assignment
  status: Status;
  imageRequired: boolean;
  videoRequired: boolean;
  taskType: TaskType;
  imageUrl?: string;
  videoUrl?: string;
  declineReason?: string;
  initials?: string; // Staff initials after completion; Admin initials after assignment
}

export interface Location {
  addressLine1: string;
  townCity: string;
  postcode: string;
}

export interface Notification {
  message: string;
  type: 'success' | 'error';
}

export interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  restaurant_id: number;
  is_active: boolean;
}
