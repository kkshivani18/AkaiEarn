import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

let isHandlerRegistered = false;

export function setupBackgroundMessageHandler() {
  if (isHandlerRegistered) {
    console.log('⚠️ Background handler already registered');
    return;
  }

  // Register background message handler
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('📩 Background FCM message received:', remoteMessage);
    
    const data = remoteMessage.data;
    
    // Skip silent data-only messages
    if (data?.type === 'update') {
      console.log('Silent update - no notification shown');
      return;
    }

    // Create notification channel
    const channelId = data?.type === 'referral' ? 'referrals' : 'promotions';
    
    await notifee.createChannel({
      id: channelId,
      name: channelId === 'referrals' ? 'Referral Rewards' : 'Festival Offers',
      importance: channelId === 'referrals' ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
      sound: 'default',
    });

    // Display notification
    await notifee.displayNotification({
      title: remoteMessage.notification?.title || 'New Notification',
      body: remoteMessage.notification?.body || 'You have a new message',
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
      },
      data: remoteMessage.data,
    });
  });

  isHandlerRegistered = true;
  console.log('✅ Background message handler registered');
}