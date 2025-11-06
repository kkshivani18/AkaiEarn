import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, log } from '../config/environment'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers['auth-token'] = token; // Matches your backend middleware
        log.debug('Adding auth token to request:', config.url);
        console.log('Adding auth token to request:', config.url, 'Token length:', token.length);
      } else {
        console.log('No auth token found for request:', config.url);
      }
    } catch (error) {
      log.error('Error getting auth token:', error);
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    log.debug('API Success:', {
      url: response.config?.url,
      method: response.config?.method,
      status: response.status,
      dataLength: response.data?.data?.length || 0
    });
    return response;
  },
  (error) => {
    log.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      fullUrl: `${API_BASE_URL}${error.config?.url}`
    });
    
    // Handle specific error cases
    if (error.code === 'ECONNREFUSED' || error.message.includes('timeout')) {
      error.message = `Backend server is not running. Please start the backend server.\nTrying to reach: ${API_BASE_URL}${error.config?.url}`;
    } else if (error.response?.status === 401) {
      error.message = 'Authentication failed. Please check your credentials.';
    } else if (error.response?.status === 500) {
      error.message = 'Server error. Please try again later.';
    } else if (error.response?.status === 404) {
      error.message = `Endpoint not found: ${API_BASE_URL}${error.config?.url}`;
    }
    
    return Promise.reject(error);
  }
);

// Test API connection
export const testAPIConnection = async () => {
  try {
    log.info('🔍 Testing API connection to:', API_BASE_URL);
    const response = await api.get('/offers/get-all-label-offers');
    log.info('✅ API Connection successful!', response.data);
    return response.data;
  } catch (error: any) {
    log.error('❌ API Connection failed:', error.message);
    throw error;
  }
};

// Test auth endpoints specifically
export const testAuthConnection = async () => {
  try {
    log.info('🔍 Testing auth endpoints...');
    // Test if auth endpoints are reachable
    const response = await api.get('/auth/user');
    log.info('✅ Auth endpoints accessible!');
    return true;
  } catch (error: any) {
    if (error.response?.status === 401) {
      log.info('✅ Auth endpoints accessible (401 expected without token)');
      return true;
    }
    log.error('❌ Auth endpoints not accessible:', error.message);
    return false;
  }
};

// Offers API
export const offersAPI = {
  // Get all offers
  getAllOffers: async () => {
    try {
      log.debug('📡 Fetching offers from:', `${API_BASE_URL}/offers/get-all-label-offers`);
      const response = await api.get('/offers/get-all-label-offers');
      log.debug('✅ Offers fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      log.error('❌ Failed to fetch offers:', error.message);
      throw error;
    }
  },
  
  // Get single offer by ID - REMOVED: Backend doesn't support this endpoint
  // getOfferById: async (offerId: string) => {
  //   try {
  //     const response = await api.get(`/offers/get-label-offer/${offerId}`);
  //     return response.data;
  //   } catch (error: any) {
  //     throw error;
  //   }
  // },
  
  // Create new offer - This hits /offers/create-label-offer
  createOffer: async (offerData: {
    imageLink: string;
    type: string;
    creativeLink: string;
    rewards: {
      coinsOnCorrect: number;
      iqDeltaOnCorrect: number;
      iqDeltaOnIncorrect: number;
    };
    minimumIq: number;
    description: string;
    penaltyTime?: number;
  }) => {
    try {
      console.log('📤 Creating label offer via API:', offerData);
      const response = await api.post('/offers/create-label-offer', offerData);
      console.log('✅ Label offer created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating label offer:', error);
      throw error;
    }
  },

  // Delete offer
  deleteOffer: async (offerId: string) => {
    try {
      const response = await api.delete(`/offers/${offerId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Flag a user for a specific task
  flagLabelForUser: async (flagData: {
    userId: string;
    labelOfferId: string;
  }) => {
    try {
      const response = await api.post('/offers/flag-label', flagData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Check if user is flagged for a task
  checkUserFlagStatus: async (checkData: {
    userId: string;
    labelOfferId: string;
  }) => {
    try {
      const response = await api.post('/offers/check-user-flag', checkData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Mark user as qualified for a task
  markUserQualified: async (qualifyData: {
    userId: string;
    labelOfferId: string;
  }) => {
    try {
      const response = await api.post('/offers/mark-qualified', qualifyData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Social Offers API
export const socialAPI = {
  // Get all social offers
  getAllSocialOffers: async () => {
    try {
      const response = await api.get('/social/offers');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Complete social offer
  completeSocialOffer: async (offerId: string) => {
    try {
      const response = await api.post('/social/complete', { offerId });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Create social offer
  createSocialOffer: async (offerData: {
    imageLink: string;
    type: string;
    description: string;
    redirectLink: string;
    reward: {
      coinsOnCorrect: number;
      iqDeltaOnCorrect: number;
      iqDeltaOnIncorrect: number;
    };
  }) => {
    try {
      const response = await api.post('/social/offers', offerData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Delete social offer
  deleteSocialOffer: async (offerId: string) => {
    try {
      const response = await api.delete(`/social/offers/${offerId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Rewards/Coupons API - Updated to use proper backend endpoints
export const couponsAPI = {
  // Get available spin wheel coupons (6 random valid coupons without coupon codes)
  getSpinWheelCoupons: async () => {
    try {
      const response = await api.get('/rewards/spin-wheel');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch spin wheel coupons:', error);
      return {
        success: true,
        data: [
          {
            _id: '675bb77dd52bb7f76b050b6a',
            company: 'Amazon',
            description: '20% off Entire Order',
            expiryDate: '2024-12-31',
            imageLink: 'https://logo.clearbit.com/amazon.com',
          },
          {
            _id: '675bb78ad52bb7f76b050b6c',
            company: 'Netflix',
            description: 'One Month Free',
            expiryDate: '2024-12-31',
            imageLink: 'https://logo.clearbit.com/netflix.com',
          },
          {
            _id: '675bb793d52bb7f76b050b6e',
            company: 'Spotify',
            description: '3 Months Premium',
            expiryDate: '2024-12-31',
            imageLink: 'https://logo.clearbit.com/spotify.com',
          }
        ]
      };
    }
  },

  // Win a coupon from spin wheel
  selectSpinWheelCoupon: async (couponId: string) => {
    try {
      console.log('🎯 API: Selecting spin wheel coupon:', couponId);
      const response = await api.post('/rewards/spin-wheel/select', { couponId });
      console.log('✅ API: Spin wheel coupon selected successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Failed to select spin wheel coupon:', error);
      throw error;
    }
  },

  // Get user's coupons from their profile (with populated coupon details)
  getUserCoupons: async () => {
    try {
      const response = await api.get('/auth/user');
      const userData = response.data.user || response.data;
      
      // If user has coupons populated, return them
      if (userData.coupons && userData.coupons.length > 0) {
        return { success: true, data: userData.coupons };
      }
      
      return { success: true, data: [] };
    } catch (error: any) {
      throw error;
    }
  },

  // Reward coupon to user - matches your backend /coupons/reward endpoint
  rewardCouponToUser: async (couponId: string, userId?: string) => {
    try {
      console.log('🎯 API: Rewarding coupon to user:', couponId);
      const response = await api.post('/coupons/reward', { 
        couponId,
        userId: userId || undefined 
      });
      console.log('✅ API: Coupon rewarded successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Failed to reward coupon:', error);
      throw error;
    }
  },

  // Create coupon (admin function) - matches your backend /coupons/ endpoint
  createCoupon: async (couponData: {
    couponCode: string;
    expiryDate: string;
    company: string;
    description: string;
    imageLink: string;
  }) => {
    try {
      const response = await api.post('/coupons/', couponData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Delete expired coupons (admin function)
  deleteExpiredCoupons: async () => {
    try {
      const response = await api.delete('/coupons/expired');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // get spin wheel status (canSpin and secondsLeft)
  getSpinWheelStatus: async () => {
    try {
      const response = await api.get('/rewards/spin-wheel/status');
      return response.data; 
    } catch (error: any) {
      // fallback if unauthenticated
      if (error.response?.status === 401) {
        return { success: true, canSpin: false, secondsLeft: 0 };
      }
      throw error;
    }
  },
};

// API functions that match your backend exactly
export const authAPI = {
  // Register - matches your /api/auth/register endpoint
  register: async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', {
        name,        
        email,      
        password,    
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  updateProfile: async (profileData: {
    occupation: string;
    // Date or a backend-friendly string
    dob: string | Date;
    gender?: string;
    tags?: string[];
    location?: {
      lat: number;
      lng: number;
    };
  }) => {
    try {
      const payload = {
        ...profileData,
        dob: typeof profileData.dob === 'string'
          ? profileData.dob
          : profileData.dob.toISOString().split('T')[0],
      };

      const response = await api.put('/auth/submit-form', payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Login - matches your /api/auth/login endpoint
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        email,     
        password,   
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Login with Google ID token (server should verify token and return app authToken)
  loginWithGoogle: async (idToken: string) => {
    try {
      const response = await api.post('/auth/google-login', { idToken });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get User Profile - matches your /api/auth/user endpoint
  getUser: async () => {
    try {
      const response = await api.get('/auth/user');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Upload profile image - matches your /api/auth/upload-profile-image endpoint
  uploadProfileImage: async (imageUri: string) => {
    try {
      console.log('📤 Uploading profile image:', imageUri);
      
      const formData = new FormData();
      
      // Determine file type from URI
      const fileExtension = imageUri.split('.').pop()?.toLowerCase();
      const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
      const fileName = `profile-image.${fileExtension || 'jpg'}`;
      
      formData.append('image', {
        uri: imageUri,
        type: mimeType,
        name: fileName,
      } as any);

      console.log('📤 FormData prepared:', { mimeType, fileName });

      const response = await api.post('/auth/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data, headers) => {
          // Remove Content-Type header to let axios set it with boundary
          delete headers['Content-Type'];
          return data;
        },
        timeout: 30000, // 30 second timeout for image uploads
      });
      
      console.log('✅ Profile image upload successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Profile image upload failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      throw error;
    }
  },

  // Update user data - matches your /api/auth/user-data endpoint
  updateUserData: async (userData: {
    firstName?: string;
    lastName?: string;
    password?: string;
  }) => {
    try {
      const response = await api.post('/auth/user-data', userData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Update basic profile info
  updateBasicProfile: async (profileData: {
    name?: string;
    email?: string;
    profilePicture?: string;
  }) => {
    try {
      // using user-data endpoint
      const response = await api.post('/auth/user-data', profileData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Update password - Note: This endpoint may not exist on the backend
  updatePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    try {
      // For now, we'll use a generic endpoint or return an error
      // You may need to implement this endpoint on the backend
      throw new Error('Password update functionality not yet implemented on the backend');
    } catch (error: any) {
      throw error;
    }
  },

  // Logout - clear secure storage
  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userData');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Get user details by ID - try different endpoint patterns
  getUserById: async (userId: string) => {
    try {
      // Option 1: Try if there's a public user endpoint
      const response = await api.get(`/auth/user-profile/${userId}`);
      return response.data;
    } catch (error: any) {
      try {
        // Option 2: Try admin endpoint if you have admin access
        const response = await api.get(`/admin/users/${userId}`);
        return response.data;
      } catch (adminError) {
        try {
          // Option 3: Try if backend accepts userId as query param
          const response = await api.get(`/auth/user?userId=${userId}`);
          return response.data;
        } catch (queryError) {
          console.error(`All attempts failed to fetch user ${userId}`);
          return null;
        }
      }
    }
  },

  // auth/forgot-password endpoint
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  // auth/reset-password endpoint
  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },
};

// Referral API
export const referralAPI = {
  // Use someone else's referral code
  useReferralCode: async (referralCode: string) => {
    try {
      const response = await api.post('/rewards/use-referral', { referralCode });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get referred users with their actual names
  getReferredUsers: async () => {
    try {
      const response = await api.get('/rewards/referred-users');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Add this new API section after referralAPI
export const configAPI = {
  // Get IQ ranges
  getIqRanges: async () => {
    try {
      const response = await api.get('/config/iq-ranges');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Update IQ ranges (Admin function)
  updateIqRanges: async (iqRanges: any) => {
    try {
      const response = await api.put('/config/iq-ranges', iqRanges);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get referral rewards
  getReferralRewards: async () => {
    try {
      const response = await api.get('/config/referral-rewards');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Update referral rewards (Admin function)
  updateReferralRewards: async (referralRewards: any) => {
    try {
      const response = await api.put('/config/referral-rewards', referralRewards);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Add this new API section after configAPI
export const logsAPI = {
  // Create log entry
  createLog: async (logData: {
    labelOfferType: string;
    userId: string;
  }) => {
    try {
      const response = await api.post('/logs/', logData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Bulk update logs with results
  bulkUpdateLogs: async (logsData: {
    logs: Array<{
      sessionId: string;
      result: "success" | "failure" | "best-label";
    }>;
  }) => {
    try {
      const response = await api.put('/logs/bulk-update', logsData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get user's logs
  getMyLogs: async () => {
    try {
      const response = await api.get('/logs/me');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

export default api;