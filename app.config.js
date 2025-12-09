export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    androidClientID: process.env.ANDROID_ID,
    webClientID: process.env.WEB_ID
  }
});