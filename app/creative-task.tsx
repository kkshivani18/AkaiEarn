import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { offersAPI, authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ErrorPopup } from '../components/popups/ErrorPopup';
import { InfoPopup } from '../components/popups/InfoPopup';
import { FONTS } from "../constants/fonts";

const CreativeTaskScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const { authState } = useAuth();
  const webViewRef = useRef<WebView>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [parametersReady, setParametersReady] = useState(false);

  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorPopupMessage, setErrorPopupMessage] = useState('');
  const [showExitPopup, setShowExitPopup] = useState(false);

  // task parameters 
  const labelOfferId = params.labelOfferId as string;
  const taskTitle = params.taskTitle as string;
  const reward = parseInt(params.reward as string) || 0;
  const iqGain = parseInt(params.iqGain as string) || 0;
  const taskType = params.taskType as string || 'labelling-task';
  const creativeLink = params.creativeLink as string; 

  // Fetch user info and prepare parameters
  React.useEffect(() => {
    const initializeTask = async () => {
      try {
        console.log('🚀 Initializing creative task...', { labelOfferId, taskTitle, reward, iqGain });
        
        if (!labelOfferId || !taskTitle) {
          console.error('❌ Missing required task parameters:', { labelOfferId, taskTitle });
          setErrorPopupMessage('Missing task information. Please go back and try again.');
          setShowErrorPopup(true);
          return;
        }

        // Fetch user info
        const response = await authAPI.getUser();
        const userData = response.user || response.data || response;
        console.log('✅ User info fetched for creative:', userData);
        
        if (userData) {
          setUserInfo(userData);
          setParametersReady(true);
          console.log('✅ Parameters ready for creative');
        } else {
          // Use fallback user info
          const fallbackUser = {
            _id: 'anonymous',
            firstName: 'User',
            iq: 0
          };
          setUserInfo(fallbackUser);
          setParametersReady(true);
          console.log('⚠️ Using fallback user info');
        }
      } catch (error) {
        console.error('❌ Failed to initialize task:', error);
        // Use fallback and continue
        setUserInfo({
          _id: 'anonymous',
          firstName: 'User',
          iq: 0
        });
        setParametersReady(true);
      }
    };

    if (authState?.authenticated) {
      initializeTask();
    } else {
      setUserInfo({
        _id: 'anonymous',
        firstName: 'User',
        iq: 0
      });
      setParametersReady(true);
    }
  }, [authState?.authenticated, labelOfferId, taskTitle]);

  // creative URL 
  const buildCreativeURL = () => {
    if (!userInfo || !parametersReady) {
      console.log('⏳ Parameters not ready yet', { userInfo: !!userInfo, parametersReady });
      return '';
    }
    
    // creative link from parameters
    const baseUrl = creativeLink;
    
    console.log('🎯 Using creative link from params:', baseUrl);
    
    // Build comprehensive parameter set with validation
    const urlParams = {
      // Core task parameters 
      labelOfferId: labelOfferId || 'fallback-task',
      taskType: taskType || 'brand-recognition-task',
      taskTitle: encodeURIComponent(taskTitle || 'Labeling Task'),
      
      // User information (required)
      userId: userInfo._id || userInfo.id || 'anonymous',
      userName: encodeURIComponent(userInfo.firstName || 'User'),
      userIq: (userInfo.iq || 0).toString(),
      
      // Reward information (required)
      reward: reward.toString(),
      iqGain: iqGain.toString(),
      coinsOnCorrect: reward.toString(),
      iqDeltaOnCorrect: iqGain.toString(),
      
      // Session tracking - UPDATED TO USE labelOfferId
      sessionId: `session_${Date.now()}_${labelOfferId}`,
      timestamp: Date.now().toString(),
      
      // App metadata
      source: 'mobile_app',
      platform: 'react_native',
      version: '1.0.0',
      
      // Creative configuration
      mode: 'interactive',
      lang: 'en',
      theme: 'dark',
      
      // Debug information
      debug: 'true',
      buildTime: Date.now().toString()
    };
    
    // Validate required parameters - UPDATED PARAMETER NAME
    const requiredParams: (keyof typeof urlParams)[] = ['labelOfferId', 'userId', 'reward', 'taskTitle'];
    const missingParams = requiredParams.filter(param => !urlParams[param] || urlParams[param] === 'undefined');
    
    if (missingParams.length > 0) {
      console.error('❌ Missing required parameters:', missingParams);
      console.error('❌ Current params:', urlParams);
      // Alert.alert('Parameter Error', `Missing: ${missingParams.join(', ')}`);
      setErrorPopupMessage('This task has missing parameter');
      setShowErrorPopup(true);
      return '';
    }

    const queryString = new URLSearchParams(urlParams).toString();
    const fullUrl = `${baseUrl}?${queryString}`;
    
    console.log('🔗 Built creative URL with correct base:', fullUrl);
    console.log('📋 All parameters:', urlParams);
    console.log('🎯 Base URL used:', baseUrl);
    
    return fullUrl;
  };

  // Enhanced WebView load handler with updated parameter name
  const handleWebViewLoad = () => {
    console.log('🌐 WebView loaded, injecting enhanced bridge...');
    
    const injectedJavaScript = `
      (function() {
        console.log('🚀 Creative bridge initializing...');
        
        // Setup communication bridge
        window.ReactNativeWebView = {
          postMessage: function(data) {
            try {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                const payload = typeof data === 'string' ? data : JSON.stringify(data);
                window.ReactNativeWebView.postMessage(payload);
                console.log('📤 Sent to React Native:', payload);
              }
            } catch (e) {
              console.error('❌ Bridge communication failed:', e);
            }
          }
        };
        
        // Parse URL parameters with extensive logging
        const urlParams = new URLSearchParams(window.location.search);
        console.log('🔍 Full URL:', window.location.href);
        console.log('🔍 Search params:', window.location.search);
        
        // Extract all parameters
        const allParams = {};
        urlParams.forEach((value, key) => {
          allParams[key] = value;
          console.log(\`📋 Param \${key}: \${value}\`);
        });
        
        // Build comprehensive task configuration - UPDATED PARAMETER NAME
        window.taskConfig = {
          labelOfferId: urlParams.get('labelOfferId') || 'unknown',
          taskType: urlParams.get('taskType') || 'unknown',
          taskTitle: decodeURIComponent(urlParams.get('taskTitle') || 'Unknown Task'),
          userId: urlParams.get('userId') || 'anonymous',
          userName: decodeURIComponent(urlParams.get('userName') || 'User'),
          userIq: parseInt(urlParams.get('userIq') || '0'),
          reward: parseInt(urlParams.get('reward') || '0'),
          iqGain: parseInt(urlParams.get('iqGain') || '0'),
          sessionId: urlParams.get('sessionId') || 'session_' + Date.now(),
          timestamp: urlParams.get('timestamp') || Date.now().toString(),
          source: urlParams.get('source') || 'unknown',
          buildTime: urlParams.get('buildTime') || 'unknown'
        };
        
        console.log('✅ Task config created:', window.taskConfig);
        
        // Expose parameters in multiple formats for maximum compatibility
        window.TASK_PARAMS = window.taskConfig;
        window.CREATIVE_CONFIG = window.taskConfig;
        window.APP_PARAMS = window.taskConfig;
        window.config = window.taskConfig;
        window.params = window.taskConfig;
        
        // Individual parameter access
        Object.keys(window.taskConfig).forEach(key => {
          window[key] = window.taskConfig[key];
        });
        
        // Validation with detailed reporting - UPDATED PARAMETER NAME
        const requiredParams = ['labelOfferId', 'userId', 'reward'];
        const missingParams = requiredParams.filter(param => 
          !window.taskConfig[param] || 
          window.taskConfig[param] === 'unknown' || 
          window.taskConfig[param] === 'undefined'
        );
        
        if (missingParams.length > 0) {
          console.error('❌ MISSING REQUIRED PARAMETERS:', missingParams);
          console.error('❌ Current config:', window.taskConfig);
          console.error('❌ All URL params:', allParams);
          
          // Send detailed error to React Native
          window.ReactNativeWebView.postMessage({
            type: 'ERROR',
            data: { 
              message: 'Missing required parameters: ' + missingParams.join(', '),
              missingParams: missingParams,
              currentConfig: window.taskConfig,
              allParams: allParams,
              url: window.location.href
            }
          });
        } else {
          console.log('✅ ALL REQUIRED PARAMETERS VALIDATED');
          console.log('✅ Config summary:', {
            taskId: window.taskConfig.taskId,
            userId: window.taskConfig.userId,
            reward: window.taskConfig.reward,
            parametersCount: Object.keys(window.taskConfig).length
          });
        }
        
        // Setup completion functions - UPDATED PARAMETER NAME
        window.completeTask = function(data = {}) {
          console.log('✅ Task completion triggered manually');
          window.ReactNativeWebView.postMessage({
            type: 'TASK_COMPLETED',
            data: {
              ...data,
              labelOfferId: window.taskConfig.labelOfferId,
              sessionId: window.taskConfig.sessionId,
              completedAt: new Date().toISOString(),
              method: 'manual_function'
            }
          });
        };
        
        // Auto-detect interactions
        document.addEventListener('click', function(e) {
          console.log('🖱️ Click detected on:', e.target);
          if (e.target.matches('button[type="submit"], .submit-btn, #submit, [data-complete], .complete-task')) {
            console.log('🎯 Submit button clicked, completing task...');
            setTimeout(() => window.completeTask({ 
              method: 'button_click', 
              element: e.target.className,
              labelOfferId: window.taskConfig.labelOfferId
            }), 500);
          }
        });
        
        document.addEventListener('submit', function(e) {
          console.log('📝 Form submission detected, completing task...');
          setTimeout(() => window.completeTask({ 
            method: 'form_submit',
            labelOfferId: window.taskConfig.labelOfferId
          }), 500);
        });
        
        // Notify React Native that creative is ready
        setTimeout(() => {
          console.log('📡 Notifying React Native that creative is ready');
          window.ReactNativeWebView.postMessage({
            type: 'CREATIVE_READY',
            data: { 
              config: window.taskConfig,
              timestamp: Date.now(),
              message: 'Creative loaded successfully with parameters',
              parametersCount: Object.keys(window.taskConfig).length,
              url: window.location.href
            }
          });
        }, 1500);
        
        // Log available functions
        console.log('🔧 Available functions:');
        console.log('- window.taskConfig (full configuration)');
        console.log('- window.completeTask(data) (manual completion)');
        console.log('- All parameters available as individual window properties');
        
      })();
      
      true; // Required for iOS
    `;
    
    webViewRef.current?.injectJavaScript(injectedJavaScript);
    
    // Shorter timeout since we have better detection
    setTimeout(() => {
      if (loading) {
        console.log('⏰ Loading timeout, assuming ready');
        setLoading(false);
      }
    }, 3000);
  };

  // Enhanced message handling
  const handleWebViewMessage = (event: any) => {
    try {
      let message;
      try {
        message = JSON.parse(event.nativeEvent.data);
      } catch {
        message = { type: 'MESSAGE', data: event.nativeEvent.data };
      }

      switch (message.type) {
        case 'CREATIVE_READY':
          console.log('🎯 Creative is ready:', message.data);
          setLoading(false);
          break;
          
        case 'TASK_COMPLETED':
        case 'COMPLETION':
        case 'SUBMIT':
          console.log('✅ Task completed:', message.data);
          setTaskCompleted(true);
          break;
          
        case 'ERROR':
          console.error('❌ Creative error:', message.data);
          // Alert.alert(
          //   'Creative Error', 
          //   message.data?.message || 'An error occurred',
          //   [
          //     { text: 'Debug Info', onPress: () => console.log('Debug:', message.data) },
          //     { text: 'OK' }
          //   ]
          // );
          setErrorPopupMessage('Creative Error');
          setShowErrorPopup(true);
          break;
          
        default:
          console.log('📬 Creative message:', message);
      }
    } catch (error) {
      console.error('❌ Error parsing WebView message:', error);
    }
  };

  // Handle task completion
  // const handleTaskCompletion = async (taskData: any) => {
  //   if (submitting) return;
    
  //   setSubmitting(true);
    
  //   try {
  //     // Create a unique task type to avoid conflicts
  //     const uniqueTaskType = `${taskType}-completed-${Date.now()}`;
      
  //     const labelOfferData = {
  //       imageLink: taskData.imageUrl || 'https://via.placeholder.com/300x200/2a2b33/fff?text=Completed+Task',
  //       type: uniqueTaskType,
  //       creativeLink: 'https://label-offers-creatives.s3.us-east-1.amazonaws.com/full-video.html',
  //       rewards: {
  //         coinsOnCorrect: reward,
  //         iqDeltaOnCorrect: iqGain,
  //         iqDeltaOnIncorrect: -Math.max(1, Math.floor(iqGain / 2)),
  //       },
  //       minimumIq: 0,
  //       description: taskData.description || `Completed ${taskTitle} task by ${userInfo?.firstName || 'User'}`,
  //       penaltyTime: 1,
  //     };

  //     console.log('📤 Creating label offer:', labelOfferData);
      
  //     // THIS is where createOffer is called
  //     const response = await offersAPI.createOffer(labelOfferData);
      
  //     if (response.success) {
  //       console.log('✅ Label offer created successfully');
        
  //       Alert.alert(
  //         'Task Completed! 🎉',
  //         `Great job! You've earned ${reward} tokens and +${iqGain} IQ points.`,
  //         [{ text: 'Continue', onPress: () => router.back() }]
  //       );
  //     } else {
  //       throw new Error(response.message || 'Failed to create label offer');
  //     }
  //   } catch (error: any) {
  //     console.error('❌ Error creating label offer:', error);
  //     Alert.alert(
  //       'Submission Error',
  //       error.message || 'Failed to submit task. Please try again.',
  //       [
  //         { text: 'Retry', onPress: () => setSubmitting(false) },
  //         { text: 'Cancel', onPress: () => router.back() }
  //       ]
  //     );
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  // Don't render until parameters are ready
  if (!parametersReady || !userInfo) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Preparing your task...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const creativeURL = buildCreativeURL();
  if (!creativeURL) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>❌ Parameter Error</Text>
            <Text style={styles.loadingSubtext}>Unable to build creative URL</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.testButton}>
              <Text style={styles.testButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowExitPopup(true)}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{taskTitle}</Text>
          </View>
          
          <View style={styles.headerRight}>
            {taskCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
            )}
          </View>
        </View>

        {/* WebView Container */}
        <View style={styles.webViewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: creativeURL }}
            style={styles.webView}
            onLoad={handleWebViewLoad}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('❌ WebView error:', nativeEvent);
              setLoading(false);
              // Alert.alert('WebView Error', `Failed to load creative: ${nativeEvent.description}`);
              setErrorPopupMessage('Failed to load creative');
              setShowErrorPopup(true);
            }}
            onLoadEnd={() => {
              console.log('📱 WebView load completed');
            }}
          />
        </View>

        {/* Footer */}
        {submitting && (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.footerText}>Submitting your work...</Text>
          </View>
        )}
        
        <ErrorPopup
          visible={showErrorPopup}
          message={errorPopupMessage}
          onClose={() => setShowErrorPopup(false)}
        />
        
        <InfoPopup
          visible={showExitPopup}
          title="EXIT TASK?"
          message="Are you sure you want to exit? Your progress will be lost."
          buttons={[
            {
              text: "STAY",
              onPress: () => setShowExitPopup(false),
              variant: 'primary'
            },
            {
              text: "EXIT",
              onPress: () => {
                setShowExitPopup(false);
                router.back();
              },
              variant: 'secondary'
            }
          ]}
          onClose={() => setShowExitPopup(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: { padding: 8, marginRight: 12 },
  headerInfo: { flex: 1 },
  headerTitle: { color: 'white', fontSize: 18, fontFamily: FONTS.body.bold },
  headerReward: { color: '#94a3b8', fontSize: 14, fontFamily: FONTS.body.medium, marginTop: 2 },
  headerRight: { width: 40, alignItems: 'center' },
  completedBadge: { padding: 4 },
  webViewContainer: { flex: 1, position: 'relative' },
  webView: { flex: 1, backgroundColor: 'transparent' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: { 
    color: 'white', 
    marginTop: 12, 
    fontSize: 16,
    fontFamily: FONTS.body.medium,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: '#94a3b8',
    marginTop: 8,
    fontSize: 14,
    fontFamily: FONTS.body.medium,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: { color: 'white', marginLeft: 8, fontSize: 14, fontFamily: FONTS.body.medium },
  testButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: FONTS.body.semiBold,
    textAlign: 'center',
  },
  debugFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
  },
  debugText: {
    color: '#888',
    fontSize: 10,
    textAlign: 'center',
    fontFamily: FONTS.body.medium,
  },
});

export default CreativeTaskScreen;
