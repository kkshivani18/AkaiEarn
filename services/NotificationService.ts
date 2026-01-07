import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { router } from 'expo-router'; 
import { authAPI } from './api';
import { Platform } from 'react-native';

interface NotificationPayload {
  type?: 'promotional' | 'referral' | 'update';
  referralPoints?: string;
  referredUserName?: string;
  referralNumber?: string;
  updateId?: string;
  url?: string;
  navigateTo?: string;
  [key: string]: string | undefined;
}

class NotificationService {
  
  static async requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    console.log('Authorization status:', authStatus);
    
    if (enabled) {
      // Get FCM token and send to backend
      await NotificationService.getFCMToken();
    }
    
    return enabled;
  }

  // Get FCM token and send to backend
  static async getFCMToken() {
    try {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('FCM Token:', fcmToken);
        
        // Send token to backend
        try {
          await authAPI.updateFcmToken(fcmToken);
          console.log('✅ FCM token sent to backend');
        } catch (error) {
          console.error('❌ Failed to send FCM token to backend:', error);
        }
      }
    } catch (error) {
      console.error('❌ Failed to get FCM token:', error);
    }
  }

  static async createChannels() {
    //channel for admin promos
    await notifee.createChannel({
      id: 'promotions',
      name: 'Festival Offers',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
    });

    // channel for referral rewards 
    await notifee.createChannel({
      id: 'referrals',
      name: 'Referral Rewards',
      importance: AndroidImportance.HIGH, 
      sound: 'default',
    });
  }

  // Handle Foreground Notifications
  static async displayForegroundNotification(remoteMessage: FirebaseMessagingTypes.RemoteMessage) {
    const data = remoteMessage.data as NotificationPayload;

    // Bulk Update
    if (data?.type === 'update') {
      console.log('Silent update trigger received');
      return; 
    }

    // Referral Notification
    if (data?.type === 'referral') {
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'Referral Code Used!',
        body: remoteMessage.notification?.body || `You earned ${data.referralPoints || 0} points!`,
        android: {
          channelId: 'referrals',
          pressAction: { id: 'default' }, 
          actions: [
            {
              title: 'View Referrals', 
              pressAction: { id: 'view_referral' },
            },
          ],
          importance: AndroidImportance.HIGH,
          sound: 'default',
        },
        data: {
          type: 'referral',
          referralPoints: data.referralPoints || '0',
          referredUserName: data.referredUserName || '',
          navigateTo: data.navigateTo || '',
        },
      });
      return;
    }

    // Admin sends promotional or festive notifs
    await notifee.displayNotification({
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      android: {
        channelId: 'promotions',
        ...(remoteMessage.notification?.android?.imageUrl && {
          style: {
            type: AndroidStyle.BIGPICTURE,
            picture: remoteMessage.notification.android.imageUrl,
          },
        }),
      },
    });
  }

  // handle when user taps a notif
  static async handleNotificationPress() {
    // App Closed -> Opened by notification
    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification) {
      NotificationService.navigateBasedOnNotification(initialNotification.notification);
    }

    // App Open/Background -> User taps notification
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
        const { notification } = detail;
        if(notification) NotificationService.navigateBasedOnNotification(notification);
        
        // specific button clicks
        if (detail.pressAction?.id === 'view_referral') {
             router.push('/rewardComponents/referralComponents/referralPage'); 
        }
      }
    });
  }
  
  // route users
  static navigateBasedOnNotification(notification: any) {
      const data = notification.data as NotificationPayload;
      
      if (data?.type === 'referral') {
          router.push('/rewardComponents/referralComponents/referralPage');
      }
  }

  // listener
  static initialize() {

    // foreground listener
    messaging().onMessage(NotificationService.displayForegroundNotification);
    
    // init notification tap handler
    NotificationService.handleNotificationPress();
    
    // init token refresh listener
    messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM Token refreshed:', newToken);
      try {
        await authAPI.updateFcmToken(newToken);
        console.log('✅ Refreshed FCM token sent to backend');
      } catch (error) {
        console.error('❌ Failed to send refreshed FCM token:', error);
      }
    });
  }
}

export default NotificationService;