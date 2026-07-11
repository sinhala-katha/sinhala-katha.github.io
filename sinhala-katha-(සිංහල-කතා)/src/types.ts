export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface StoryPart {
  id: string;
  title: string;
  content: string;
  partNumber: number;
  addedDate: string;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  parts: StoryPart[];
  author: string;
  views: number;
  likes: number;
  coverImage?: string;
  ageRestricted: boolean;
  isCompleted: boolean;
  addedDate: string;
  approved?: boolean;
  submittedBy?: string;
}

export interface User {
  username: string;
  email: string;
  isAdmin: boolean;
  likedStories: string[]; // IDs of liked stories
  isVip?: boolean;
  subscriptionType?: 'monthly' | 'yearly' | 'none' | 'partner' | 'bundle_monthly' | 'bundle_yearly';
  subscriptionDate?: string;
  hasPartnerAccess?: boolean;
  hasMoviesAccess?: boolean;
  hasVideosAccess?: boolean;
  paymentNotification?: {
    status: 'approved' | 'rejected';
    transactionId: string;
    timestamp: string;
    viewed: boolean;
  } | null;
}

export interface PartnerProfile {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  location: string;
  occupation: string;
  bio: string;
  lookingFor: string;
  contactDetails: string;
  photoUrl?: string;
  approved: boolean;
  addedDate: string;
  submittedBy?: string; // Username who posted it
}

export interface VipMedia {
  id: string;
  title: string;
  description: string;
  embedCode: string;
  type: 'video' | 'movie';
  addedDate: string;
}

export interface Comment {
  id: string;
  storyId: string;
  username: string;
  text: string;
  addedDate: string;
}

export interface PaymentSubmission {
  id: string;
  username: string;
  selectedPlan: 'monthly' | 'yearly' | 'bundle_monthly' | 'bundle_yearly';
  planName: string;
  price: string;
  transactionId: string;
  month: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

