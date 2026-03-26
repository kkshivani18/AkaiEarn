# 🎯 Offer-Wall Frontend

A React Native mobile application that allows users to earn tokens by completing various tasks and offers. Built with Expo and TypeScript.

## 📱 Features

- **User Authentication** - Secure login/signup with JWT tokens
- **Profile Management** - Complete user profiles with IQ tracking
- **Task Completion** - Label offers, social tasks, and creative tasks
- **Rewards System** - Spin wheel, coupons, and referral system
- **Real-time Balance** - Token and INR balance tracking
- **Dark Theme** - Beautiful dark UI with blur effects

## Figma Link for UI of the app

- [UI of AkaiEarn](https://www.figma.com/design/LMyeoDCZwwhI3J4NJLxxiM/AkaiEarn?node-id=0-1&p=f&t=kQYGNWRWEkdq5AOq-0)

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/Offer-Wall-Frontend.git
   cd Offer-Wall-Frontend-upd
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   # Copy environment template
   cp .env.example .env

   # Update API_BASE_URL in config/environment.ts
   ```

4. **Start the app**

   ```bash
   npx expo start
   ```

5. **Run on device/simulator**

   ```bash
   # iOS
   npm run ios

   # Android
   npm run android

   # Web
   npm run web
   ```

## 🏗️ Project Structure

```
├── app/                    # App screens and navigation
│   ├── (tabs)/            # Tab navigation screens
│   ├── Login.tsx          # Authentication screens
│   └── profile-completion.tsx
├── components/            # Reusable components
│   ├── SpinWheel.tsx     # Spin wheel component
│   ├── CouponModal.tsx   # Coupon display modal
│   └── IQMeter.tsx       # IQ level display
├── contexts/             # React contexts
│   ├── AuthContext.tsx   # Authentication state
│   └── BalanceContext.tsx # User balance state
├── services/             # API services
│   └── api.ts            # API endpoints
├── types/                # TypeScript definitions
└── config/               # Configuration files
    └── environment.ts    # Environment config
```

## 🔧 Configuration

### Environment Variables

Update `config/environment.ts` with your backend URL:

```typescript
const environments = {
  development: {
    API_BASE_URL: "https://your-backend-url.com/api",
    // ...other config
  },
};
```

### Backend Integration

This frontend connects to the Offer-Wall Backend. Ensure the backend is running and accessible.

**Required Backend Endpoints:**

- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `GET /auth/user` - Get user profile
- `GET /offers/get-all-label-offers` - Get available offers
- `GET /rewards/spin-wheel` - Get spin wheel coupons
- `POST /rewards/spin-wheel/select` - Select spin wheel coupon

## 📱 App Features

### Authentication Flow

1. **Splash Screen** → Check authentication status
2. **Login/Signup** → User authentication
3. **Profile Completion** → Collect user information
4. **Main App** → Access to all features

### Main Screens

- **Offers** - Browse and complete available tasks
- **Profile** - User information and statistics
- **Rewards** - Spin wheel, coupons, and referrals

### Key Components

- **SpinWheel** - Interactive spinning wheel with rewards
- **CouponModal** - Display and copy coupon codes
- **IQMeter** - Visual IQ level indicator

## 🛠️ Development

### Code Style

- TypeScript for type safety
- Functional components with hooks
- Consistent naming conventions
- Component-based architecture

### State Management

- React Context for global state
- Local state for component-specific data
- Secure storage for sensitive data

### API Integration

- Axios for HTTP requests
- Interceptors for token management
- Error handling and retry logic

## 🎨 UI/UX

### Design System

- **Colors**: Dark theme with blue accents
- **Typography**: System fonts with weight hierarchy
- **Components**: Blur effects, gradients, and shadows
- **Icons**: Ionicons for consistent iconography

### Responsive Design

- Supports various screen sizes
- Optimized for mobile devices
- Cross-platform compatibility

## 🚀 Deployment

### Building for Production

1. **Configure environment for production**

```typescript
// config/environment.ts
production: {
  API_BASE_URL: 'https://your-production-api.com/api',
  DEBUG: false,
  // ...
}
```

2. **Build the app**

   ```bash
   # Build for production
   expo build:android
   expo build:ios

   # Or using EAS Build
   eas build --platform all
   ```

3. **Deploy to app stores**
   ```bash
   # Submit to stores
   eas submit --platform all
   ```

---
