import { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../services/api";

interface BalanceContextType {
  balance: number;
  userData: {
    name: string;
    email: string;
    iq?: number;
    coins?: number;
  } | null;
  loading: boolean;
  refreshBalance: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
}

const BalanceContext = createContext<BalanceContextType>({
  balance: 0,
  userData: null,
  loading: false,
  refreshBalance: async () => {},
  updateBalance: () => {},
});

export const useBalance = () => {
  return useContext(BalanceContext);
};

export const BalanceProvider = ({ children }: { children: React.ReactNode }) => {
  const [balance, setBalance] = useState(0);
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    iq?: number;
    coins?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Function to refresh balance from backend
  const refreshBalance = async () => {
    try {
      setLoading(true);
      console.log('🔄 Refreshing balance from backend...');
      
      const response = await authAPI.getUser();
      const userData = response.user || response.data || response;
      
      if (userData && (userData.firstName || userData.email)) {
        const mappedUserData = {
          name: userData.firstName || 'User',
          email: userData.email,
          iq: userData.iq,
          coins: userData.coins || 0
        };
        
        setUserData(mappedUserData);
        setBalance(mappedUserData.coins || 0);
        
        console.log('✅ Balance refreshed from backend:', {
          name: mappedUserData.name,
          coins: mappedUserData.coins,
          balance: mappedUserData.coins
        });
      }
    } catch (error) {
      console.error('❌ Failed to refresh balance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to update balance locally (for immediate UI feedback)
  const updateBalance = (newBalance: number) => {
    setBalance(newBalance);
    console.log('💰 Balance updated locally:', newBalance);
  };

  // Initial load
  useEffect(() => {
    refreshBalance();
  }, []);

  const value: BalanceContextType = {
    balance,
    userData,
    loading,
    refreshBalance,
    updateBalance,
  };

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  );
};