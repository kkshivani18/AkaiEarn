// import React, { useEffect, useState } from 'react';
// import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
// import { Login } from './Login';
// import { SignUp } from './SignUp';
// import { SplashScreen } from './SplashScreen';
// import { useAuth } from '../contexts/AuthContext';
// import { router } from 'expo-router';

// export default function Index() {
//   const [showSplash, setShowSplash] = useState(true);
//   const [showSignIn, setShowSignIn] = useState(false);
//   const [showSignUp, setShowSignUp] = useState(false);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setShowSplash(false);
//       setShowSignIn(true);
//       setShowSignUp(false);
//       console.log('Splash screen timed out, showing SignIn');
//     }, 2000);

//     return () => clearTimeout(timer);
//   }, []);

//   // useEffect(() => {
//   //   console.log('Auth state:', authState);
    
//   //   // Wait for auth state to be determined
//   //   if (!authState || authState.authenticated === null) {
//   //     console.log('Still loading auth state...');
//   //     return; 
//   //   }

//   //   console.log('Auth state determined:', {
//   //     authenticated: authState.authenticated,
//   //     profileCompleted: authState.profileCompleted
//   //   });

//   //   if (authState.authenticated) {
//   //     // User is authenticated, check if profile is completed
//   //     if (authState.profileCompleted) {
//   //       console.log('Navigating to tabs');
//   //       // router.replace('/(tabs)');
//   //     } else {
//   //       console.log('Navigating to profile completion');
//   //       // router.replace('/profile-completion');
//   //     }
//   //   } else {
//   //     // User is not authenticated, go to login
//   //     console.log('Navigating to login');
//   //     router.replace('/components/Login');
//   //   }
//   // }, [authState?.authenticated, authState?.profileCompleted]);

//   const handleSignUp = (email: string, password: string, name: string) => {
//     console.log('Sign up:', { email, password, name });
//   };

//   const handleLogin = (email: string, password: string) => {
//     console.log('Sign in:', { email, password });
//   };

//   const handleClose = () => {
//     console.log('Modal closed');
//   };

//   const switchToSignUp = () => {
//     console.log('Switching to SignUp');
//     setShowSignIn(false);
//     setShowSignUp(true);
//   };

//   const switchToSignIn = () => {
//     console.log('Switching to SignIn');
//     setShowSignUp(false);
//     setShowSignIn(true);
//   };

//   if (showSplash) {
//     return <SplashScreen />;
//   }

//   return (
//     <View style={{ flex: 1 }}>
//       {showSignIn && (
//         <Login
//           visible={true}
//           onClose={handleClose}
//           {...({ onLogin: handleLogin } as any)}
//           onSwitchToSignUp={switchToSignUp}
//         />
//       )}
//       {showSignUp && (
//         <SignUp
//           visible={true}
//           onClose={handleClose}
//           {...({ onSignUp: handleSignUp } as any)}
//           onSwitchToSignIn={switchToSignIn}
//         />
//       )}
//     </View>
//   );
// }


//---------------------------------------------------------------------------------------------------

// index.tsx

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Login } from './Login';
import { SignUp } from './SignUp';
import { SplashScreen } from './SplashScreen';
import { useAuth } from '../contexts/AuthContext'
import { router } from 'expo-router';

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const { authState } = useAuth(); 

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      console.log('Splash screen timed out, waiting for Auth state...');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('Auth state:', authState);
    
    if (authState?.authenticated === null) {
      console.log('Still loading auth state...');
      return; 
    }

    console.log('Auth state determined:', {
      authenticated: authState?.authenticated,
      profileCompleted: authState?.profileCompleted
    });

    setShowSplash(false);
    setShowSignIn(false);
    setShowSignUp(false);

    if (authState?.authenticated) {
      if (authState?.profileCompleted) {
        console.log('Navigating to tabs');
        router.replace('/(tabs)/offer');
      } else {
        console.log('Navigating to profile completion');
        router.replace('/profile-completion');
      }
    } else {
      console.log('Navigating to login/signup');
      if (!showSplash) {
        setShowSignIn(true);
      }
    }
  }, [authState?.authenticated, authState?.profileCompleted, showSplash]); 

  const { onLogin, onRegister } = useAuth();

  if (showSplash) {
    return <SplashScreen />;
  }

  if (showSplash || authState?.authenticated === null) {
    return <SplashScreen />;
}

  // Use a fallback login/signup function if they are undefined (shouldn't happen with AuthProvider)
  // const loginFn = onLogin || (() => Promise.resolve({ error: true, msg: "Login context missing" }));
  // const registerFn = onRegister || (() => Promise.resolve({ error: true, msg: "Register context missing" }));

  return (
    <View style={{ flex: 1 }}>
      {showSignIn && (
        <Login
          visible={true}
          onClose={() => setShowSignIn(false)} 
          onLogin={onLogin ? onLogin : () => Promise.resolve({ error: true, msg: "Login context not fully initialized." })} 
          onSwitchToSignUp={() => {
            setShowSignIn(false);
            setShowSignUp(true);
          }}
        />
      )}
      {showSignUp && (
        <SignUp
          visible={true}
          onClose={() => setShowSignUp(false)}
          onSignUp={onRegister ? onRegister : () => Promise.resolve({ error: true, msg: "Register context not fully initialized." })}
          onSwitchToSignIn={() => {
            setShowSignUp(false);
            setShowSignIn(true);
          }}
        />
      )}
    </View>
  );
}

