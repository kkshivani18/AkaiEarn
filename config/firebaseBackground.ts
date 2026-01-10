import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

let isHandlerRegistered = false;

export function setupBackgroundMessageHandler() {
  if (isHandlerRegistered) {
    console.log('⚠️ Background handler already registered');
    return;
  }

  try {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      const data = remoteMessage.data;
      
      if (data?.type === 'update') {
        console.log('Silent update - no notification shown');
        return;
      }

      const channelId = data?.type === 'referral' ? 'referrals' : 'promotions';
      
      try {
        await notifee.createChannel({
          id: channelId,
          name: channelId === 'referrals' ? 'Referral Rewards' : 'Festival Offers',
          importance: channelId === 'referrals' ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
          sound: 'default',
        });

        // display notif
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
      } catch (error) {
        console.error('❌ Failed to display notification:', error);
      }
    });

    isHandlerRegistered = true;
    console.log('✅ Background message handler registered');
  } catch (error) {
    console.error('❌ Failed to setup background handler:', error);
    throw error;
  }
}