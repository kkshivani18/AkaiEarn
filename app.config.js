export default ({ config }) => ({
  ...config,
  extra: {
    androidClientID: process.env.ANDROID_ID,
    webClientID: process.env.WEB_ID,
    expoClientID: process.env.EXPO_ID
  }
});