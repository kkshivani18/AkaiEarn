# 🎯 Offer-Wall Frontend

A React Native mobile application that allows users to earn tokens by completing various tasks and offers. Built with Expo and TypeScript.

## 📱 Features

- **User Authentication** - Secure login/signup with JWT tokens
- **Profile Management** - Complete user profiles with IQ tracking and streaks
- **Task Completion** - Label offers, social tasks, and creative tasks
- **Rewards System** - Interactive spin wheel, coupons, and referral system
- **Real-time Balance** - Token and INR balance tracking
- **Dark Theme** - Beautiful dark UI with blur effects and gradients

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AKAI-admin/Offer-Wall-Frontend-upd.git
   cd Offer-Wall-Frontend-upd
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment**
   ```bash
   # Update API_BASE_URL in config/environment.ts
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
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
│   │   ├── offer.tsx      # Main offers screen
│   │   ├── profile.tsx    # User profile screen
│   │   └── rewards.tsx    # Rewards and spin wheel
│   ├── Login.tsx          # Authentication screens
│   ├── SignUp.tsx         # Registration screen
│   └── profile-completion.tsx
├── components/            # Reusable components
│   ├── SpinWheel.tsx     # Interactive spin wheel
│   ├── CouponModal.tsx   # Coupon display modal
│   └── IQMeter.tsx       # IQ level display
├── contexts/             # React contexts
│   ├── AuthContext.tsx   # Authentication state
│   └── BalanceContext.tsx # User balance state
├── services/             # API services
│   └── api.ts            # API endpoints and integrations
├── types/                # TypeScript definitions
│   └── Offer.ts          # Data type definitions
└── config/               # Configuration files
    └── environment.ts    # Environment configuration
```

## 🔧 Configuration

### Environment Setup

Update `config/environment.ts` with your backend URL:

```typescript
const environments = {
  development: {
    API_BASE_URL: 'https://your-backend-url.com/api',
    DEBUG: true,
  }
}
```

### Backend Integration

This frontend connects to the Offer-Wall Backend API. Ensure the backend is running and accessible.

**Key API Endpoints:**
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration  
- `GET /auth/user` - Get user profile
- `GET /offers/get-all-label-offers` - Get available offers
- `GET /rewards/spin-wheel` - Get spin wheel coupons
- `POST /rewards/spin-wheel/select` - Select spin wheel coupon

## 📱 App Flow

### Authentication
1. **Splash Screen** → Check authentication status
2. **Login/Signup** → User authentication
3. **Profile Completion** → Collect user information and referrals
4. **Main App** → Access to all features

### Main Features
- **Offers Tab** - Browse and complete available tasks
- **Profile Tab** - User information, IQ meter, and statistics  
- **Rewards Tab** - Spin wheel, coupons, and referral system

## 🎨 Key Components

### SpinWheel Component
- Interactive spinning wheel with realistic physics
- 6 reward segments with company logos
- Daily spin limitation with countdown timer
- Integration with backend coupon selection

### CouponModal Component  
- Beautiful coupon display with company branding
- Copy coupon code functionality
- Animated glass morphism design

### IQMeter Component
- Visual representation of user IQ level
- Dynamic color-coded progress indicator
- Smooth animations and transitions

## 🛠️ Development

### Code Style
- TypeScript for type safety
- Functional components with React Hooks
- Consistent naming conventions
- Component-based architecture

### State Management
- React Context for global state (Auth, Balance)
- Local state for component-specific data
- Expo SecureStore for sensitive data persistence

### API Integration
- Axios for HTTP requests with interceptors
- Automatic token attachment for authenticated requests
- Comprehensive error handling and retry logic

## 🚀 Building for Production

### Configure Environment
```typescript
// config/environment.ts
production: {
  API_BASE_URL: 'https://your-production-api.com/api',
  DEBUG: false,
}
```

### Build Commands
```bash
# Build for production
expo build:android
expo build:ios

# Or using EAS Build (recommended)
eas build --platform all
```

### Deployment
```bash
# Submit to app stores
eas submit --platform all
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Related Repositories

- [Offer-Wall-Backend](https://github.com/AKAI-admin/Offer-Wall-Backend) - Backend API

---

Made with ❤️ by the AKAI Team
