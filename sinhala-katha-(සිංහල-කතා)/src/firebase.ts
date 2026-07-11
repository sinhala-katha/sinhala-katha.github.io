import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { Category, Story, StoryPart, User, VipMedia, PartnerProfile, PaymentSubmission } from './types';
import { INITIAL_CATEGORIES, INITIAL_STORIES, INITIAL_PARTNER_PROFILES } from './data/initialData';

// Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyCC6HRN5zOw3vFvi0TQguQ_5nbElpJ_Rqo",
  authDomain: "gen-lang-client-0583913454.firebaseapp.com",
  projectId: "gen-lang-client-0583913454",
  storageBucket: "gen-lang-client-0583913454.firebasestorage.app",
  messagingSenderId: "603509947597",
  appId: "1:603509947597:web:27247eb4ec31b0539dbd84"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with explicit database ID from config, forcing long polling for sandbox compatibility
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, "ai-studio-rasakathasinhala-0bdd9ae3-cce7-47c2-90a7-f31baa8e020d");

// Seed default data if database is empty
export async function seedDatabaseIfEmpty() {
  try {
    const catsSnapshot = await getDocs(collection(db, 'categories'));
    if (catsSnapshot.empty) {
      console.log('Seeding initial categories...');
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }
    }

    const storiesSnapshot = await getDocs(collection(db, 'stories'));
    if (storiesSnapshot.empty) {
      console.log('Seeding initial stories...');
      for (const story of INITIAL_STORIES) {
        await setDoc(doc(db, 'stories', story.id), story);
      }
    }

    // Also seed default admin user with the secure password requested by the user
    const adminDoc = await getDoc(doc(db, 'users', 'admin'));
    // Always enforce the new secure password
    await setDoc(doc(db, 'users', 'admin'), {
      username: 'admin',
      email: 'admin@rasakatha.com',
      password: 'dsADMINds*18223',
      isAdmin: true,
      likedStories: [],
      isVip: true
    });

    // Seed test users: paid_test and unpaid_test
    const paidTestDoc = await getDoc(doc(db, 'users', 'paid_test'));
    if (!paidTestDoc.exists()) {
      await setDoc(doc(db, 'users', 'paid_test'), {
        username: 'paid_test',
        email: 'paid_test@rasakatha.com',
        password: 'user123',
        isAdmin: false,
        isVip: true,
        subscriptionType: 'monthly',
        subscriptionDate: new Date().toISOString().split('T')[0],
        likedStories: []
      });
    }

    const unpaidTestDoc = await getDoc(doc(db, 'users', 'unpaid_test'));
    if (!unpaidTestDoc.exists()) {
      await setDoc(doc(db, 'users', 'unpaid_test'), {
        username: 'unpaid_test',
        email: 'unpaid_test@rasakatha.com',
        password: 'user123',
        isAdmin: false,
        isVip: false,
        subscriptionType: 'none',
        likedStories: []
      });
    }

    // Seed some initial VIP media if empty
    const mediaSnapshot = await getDocs(collection(db, 'vip_media'));
    if (mediaSnapshot.empty) {
      console.log('Seeding initial VIP Media...');
      const initialMedia = [
        {
          id: 'media_1',
          title: 'රස කතා සජීවී VIP කථාංගය - Episode 1',
          description: 'VIP සාමාජිකයන් සඳහාම වෙන්වූ විශේෂ කථාංගය සහ රූපරාමු පෙළ.',
          embedCode: '<iframe width="100%" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
          type: 'video',
          addedDate: '2026-07-10'
        },
        {
          id: 'media_2',
          title: 'Luxury Thriller Movie - සිනමා සිත්තම',
          description: 'වැඩිහිටියන්ට වඩාත් සුදුසු සුවිශේෂී ත්‍රාසජනක සිනමා නිර්මාණය (18+).',
          embedCode: '<iframe width="100%" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
          type: 'movie',
          addedDate: '2026-07-09'
        }
      ];
      for (const m of initialMedia) {
        await setDoc(doc(db, 'vip_media', m.id), m);
      }
    }

    // Seed some initial partner profiles if empty
    const partnerSnapshot = await getDocs(collection(db, 'partner_profiles'));
    if (partnerSnapshot.empty) {
      console.log('Seeding initial partner profiles...');
      for (const p of INITIAL_PARTNER_PROFILES) {
        await setDoc(doc(db, 'partner_profiles', p.id), p);
      }
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// --- REAL-TIME LISTENERS ---

export function listenToVipMedia(callback: (media: VipMedia[]) => void) {
  return onSnapshot(collection(db, 'vip_media'), (snapshot) => {
    const mediaList: VipMedia[] = [];
    snapshot.forEach((doc) => {
      mediaList.push(doc.data() as VipMedia);
    });
    callback(mediaList);
  }, (error) => {
    // Silent offline fallback
  });
}

export function listenToUsers(callback: (users: any[]) => void) {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    const usersList: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      usersList.push({
        ...data,
        username: data.username || doc.id
      });
    });
    callback(usersList);
  }, (error) => {
    // Silent offline fallback
  });
}

export function listenToCategories(callback: (categories: Category[]) => void) {
  return onSnapshot(collection(db, 'categories'), (snapshot) => {
    const categories: Category[] = [];
    snapshot.forEach((doc) => {
      categories.push(doc.data() as Category);
    });
    callback(categories);
  }, (error) => {
    // Silent offline fallback
  });
}

export function listenToStories(callback: (stories: Story[]) => void) {
  // Sort by addedDate desc or just return real-time snapshot
  return onSnapshot(collection(db, 'stories'), (snapshot) => {
    const stories: Story[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as Story;
      stories.push(data);
    });
    // Sort client-side by date or part order for robust display
    callback(stories);
  }, (error) => {
    // Silent offline fallback
  });
}

// --- CATEGORIES OPERATIONS ---

export async function addCategory(category: Category) {
  await setDoc(doc(db, 'categories', category.id), category);
}

export async function deleteCategory(categoryId: string) {
  await deleteDoc(doc(db, 'categories', categoryId));
}

// --- STORIES OPERATIONS ---

export async function addStory(story: Story) {
  await setDoc(doc(db, 'stories', story.id), story);
}

export async function deleteStory(storyId: string) {
  await deleteDoc(doc(db, 'stories', storyId));
}

export async function updateStoryParts(storyId: string, parts: StoryPart[]) {
  const storyRef = doc(db, 'stories', storyId);
  await updateDoc(storyRef, { parts });
}

export async function approveStory(storyId: string, approved: boolean) {
  const storyRef = doc(db, 'stories', storyId);
  await updateDoc(storyRef, { approved });
}

export async function incrementViews(storyId: string) {
  const storyRef = doc(db, 'stories', storyId);
  await runTransaction(db, async (transaction) => {
    const sfDoc = await transaction.get(storyRef);
    if (!sfDoc.exists()) {
      return;
    }
    const newViews = (sfDoc.data().views || 0) + 1;
    transaction.update(storyRef, { views: newViews });
  });
}

export async function toggleStoryLike(storyId: string, username: string, isLiking: boolean) {
  const storyRef = doc(db, 'stories', storyId);
  const userRef = doc(db, 'users', username.toLowerCase());

  await runTransaction(db, async (transaction) => {
    const storyDoc = await transaction.get(storyRef);
    const userDoc = await transaction.get(userRef);

    if (!storyDoc.exists() || !userDoc.exists()) {
      return;
    }

    const storyData = storyDoc.data();
    const userData = userDoc.data();

    // Calculate new like count
    const currentLikes = storyData.likes || 0;
    const newLikes = isLiking ? currentLikes + 1 : Math.max(0, currentLikes - 1);

    // Calculate new user liked list
    const currentLikedStories: string[] = userData.likedStories || [];
    const newLikedStories = isLiking 
      ? [...currentLikedStories, storyId]
      : currentLikedStories.filter(id => id !== storyId);

    transaction.update(storyRef, { likes: newLikes });
    transaction.update(userRef, { likedStories: newLikedStories });
  });
}

// --- USER OPERATIONS ---

export async function getUserProfile(username: string): Promise<any | null> {
  const userDoc = await getDoc(doc(db, 'users', username.toLowerCase()));
  if (userDoc.exists()) {
    return userDoc.data();
  }
  return null;
}

export function listenToUserProfile(username: string, callback: (user: any) => void) {
  return onSnapshot(doc(db, 'users', username.toLowerCase()), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    }
  });
}

export async function updateUserPaymentNotification(
  username: string,
  status: 'approved' | 'rejected',
  transactionId: string
) {
  const userRef = doc(db, 'users', username.toLowerCase());
  await setDoc(userRef, {
    paymentNotification: {
      status,
      transactionId,
      timestamp: new Date().toISOString(),
      viewed: false
    }
  }, { merge: true });
}

export async function clearUserPaymentNotification(username: string) {
  const userRef = doc(db, 'users', username.toLowerCase());
  await setDoc(userRef, {
    paymentNotification: null
  }, { merge: true });
}

export async function registerUserProfile(userProfile: any) {
  const usernameLower = userProfile.username.toLowerCase();
  await setDoc(doc(db, 'users', usernameLower), {
    ...userProfile,
    isVip: userProfile.isVip || false,
    subscriptionType: userProfile.subscriptionType || 'none'
  });
}

// --- VIP MEDIA & USER MANAGEMENT ---

export async function addVipMedia(media: VipMedia) {
  await setDoc(doc(db, 'vip_media', media.id), media);
}

export async function deleteVipMedia(mediaId: string) {
  await deleteDoc(doc(db, 'vip_media', mediaId));
}

export async function updateUserVipStatus(
  username: string, 
  isVip: boolean, 
  subscriptionType: 'monthly' | 'yearly' | 'none' | 'partner' | 'bundle_monthly' | 'bundle_yearly',
  hasPartnerAccess?: boolean,
  hasMoviesAccess?: boolean,
  hasVideosAccess?: boolean
) {
  const userRef = doc(db, 'users', username.toLowerCase());
  await setDoc(userRef, {
    isVip,
    subscriptionType,
    subscriptionDate: isVip || subscriptionType !== 'none' ? new Date().toISOString().split('T')[0] : '',
    hasPartnerAccess: hasPartnerAccess !== undefined ? hasPartnerAccess : (isVip || subscriptionType === 'partner' || subscriptionType === 'bundle_monthly' || subscriptionType === 'bundle_yearly'),
    hasMoviesAccess: hasMoviesAccess !== undefined ? hasMoviesAccess : (isVip || subscriptionType === 'bundle_monthly' || subscriptionType === 'bundle_yearly'),
    hasVideosAccess: hasVideosAccess !== undefined ? hasVideosAccess : (isVip || subscriptionType === 'bundle_monthly' || subscriptionType === 'bundle_yearly')
  }, { merge: true });
}

// --- PARTNER PROFILE OPERATIONS ---

export function listenToPartnerProfiles(callback: (profiles: PartnerProfile[]) => void) {
  return onSnapshot(collection(db, 'partner_profiles'), (snapshot) => {
    const list: PartnerProfile[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as PartnerProfile);
    });
    // Sort by addedDate descending
    list.sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
    callback(list);
  }, (error) => {
    // Silent offline fallback
    callback(INITIAL_PARTNER_PROFILES as any[]);
  });
}

export async function addPartnerProfile(profile: PartnerProfile) {
  await setDoc(doc(db, 'partner_profiles', profile.id), profile);
}

export async function deletePartnerProfile(profileId: string) {
  await deleteDoc(doc(db, 'partner_profiles', profileId));
}

export async function updatePartnerProfileApproval(profileId: string, approved: boolean) {
  const ref = doc(db, 'partner_profiles', profileId);
  await updateDoc(ref, { approved });
}

// --- NOWPAYMENTS CONFIGURATION OPERATIONS ---

export async function getNowPaymentsSettings(): Promise<any> {
  try {
    const docRef = doc(db, 'settings', 'nowpayments');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.error("Error reading nowpayments settings:", err);
  }
  return null;
}

export async function saveNowPaymentsSettings(settings: any) {
  const docRef = doc(db, 'settings', 'nowpayments');
  await setDoc(docRef, settings, { merge: true });
}

// --- PAYMENT SUBMISSIONS OPERATIONS ---

export async function submitPaymentSubmission(submission: PaymentSubmission) {
  await setDoc(doc(db, 'payment_submissions', submission.id), submission);
}

export function listenToPaymentSubmissions(callback: (submissions: PaymentSubmission[]) => void) {
  return onSnapshot(collection(db, 'payment_submissions'), (snapshot) => {
    const list: PaymentSubmission[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as PaymentSubmission;
      list.push({
        ...data,
        id: data.id || doc.id,
        username: data.username || "User",
        month: data.month || "Current Month"
      });
    });
    // Sort by submittedAt descending (newest first)
    list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    callback(list);
  }, (error) => {
    // Silent offline fallback
  });
}

export async function updatePaymentSubmissionStatus(submissionId: string, status: 'approved' | 'rejected' | 'pending') {
  const ref = doc(db, 'payment_submissions', submissionId);
  await setDoc(ref, { status }, { merge: true });
}




