import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

let isInitialized = false;

export const initializeFirebase = async () => {
  if (isInitialized) {
    console.log('✅ Firebase already initialized');
    return firebase.app();
  }

  try {
    
    if (firebase.apps.length === 0) {
      console.error('❌ No Firebase apps found!');
    }
    
    const app = firebase.app();
    
    isInitialized = true;
    return app;
  } catch (error) {
    console.error('❌ Firebase error:', error);
    throw error;
  }
};

export { messaging };
export default firebase;

