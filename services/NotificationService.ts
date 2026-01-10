import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { router } from 'expo-router'; 
import { authAPI } from './api';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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
      // get FCM token and send to backend
      await NotificationService.getFCMToken();
    }
    
    return enabled;
  }

  static async getFCMToken() {
    try {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('FCM Token:', fcmToken);
        
        await SecureStore.setItemAsync('fcmToken', fcmToken);
        
        const authToken = await SecureStore.getItemAsync('authToken');
        
        if (authToken) {
          try {
            await authAPI.updateFcmToken(fcmToken);
            console.log('✅ FCM token sent to backend');
          } catch (error) {
            console.error('❌ Failed to send FCM token to backend:', error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to get FCM token:', error);
    }
  }

  static async createChannels() {
    // admin promos
    await notifee.createChannel({
      id: 'promotions',
      name: 'Festival Offers',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
    });

    // referral rewards 
    await notifee.createChannel({
      id: 'referrals',
      name: 'Referral Rewards',
      importance: AndroidImportance.HIGH, 
      sound: 'default',
    });
  }

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
    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification) {
      NotificationService.navigateBasedOnNotification(initialNotification.notification);
    }

    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
        const { notification } = detail;
        if(notification) NotificationService.navigateBasedOnNotification(notification);
        
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

  static async sendStoredFCMToken() {
    try {
      const fcmToken = await SecureStore.getItemAsync('fcmToken');
      const authToken = await SecureStore.getItemAsync('authToken');
      
      if (fcmToken && authToken) {
        await authAPI.updateFcmToken(fcmToken);
        console.log('✅ Stored FCM token sent to backend after login');
      }
    } catch (error) {
      console.error('❌ Failed to send stored FCM token:', error);
    }
  }

  // listener
  static initialize() {

    messaging().onMessage(NotificationService.displayForegroundNotification);
    NotificationService.handleNotificationPress();

    messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM Token refreshed:', newToken);
      
      await SecureStore.setItemAsync('fcmToken', newToken);
      
      const authToken = await SecureStore.getItemAsync('authToken');
      if (authToken) {
        try {
          await authAPI.updateFcmToken(newToken);
          console.log('✅ Refreshed FCM token sent to backend');
        } catch (error) {
          console.error('❌ Failed to send refreshed FCM token:', error);
        }
      } else {
        console.log('⏳ Refreshed FCM token stored. Will send after login.');
      }
    });
  }
}

export default NotificationService;