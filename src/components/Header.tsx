'use client'

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Menu, Coins, Leaf, Search, Bell, User, ChevronDown, LogIn, LogOut } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { 
  Web3Auth, 
  WALLET_CONNECTORS,
  Web3AuthOptions ,
  IWeb3AuthModal
} from "@web3auth/modal"
import { 
  CHAIN_NAMESPACES, 
  IProvider, 
  WEB3AUTH_NETWORK,
  UserInfo,
  
} from "@web3auth/base"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { 
  createUser, 
  getUnreadNotifications, 
  markNotificationAsRead, 
  getUserByEmail, 
  getUserBalance 
} from "../utils/db/actions"

// Types
interface HeaderProps {
  onMenuClick: () => void;
  totalEarnings: number;
}

interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface Web3AuthError extends Error {
  code?: string;
  message: string;
}

// Constants
const CLIENT_ID: string = process.env.NEXT_PUBLIC_CLIENT_ID

// Chain Configuration
// const chainConfig = {
//   chainNamespace: CHAIN_NAMESPACES.EIP155,
//   chainId: "0x1", // Ethereum Mainnet
//   rpcTarget: "https://rpc.ankr.com/eth",
//   displayName: "Ethereum Mainnet",
//   blockExplorerUrl: "https://etherscan.io/",
//   ticker: "ETH",
//   tickerName: "Ethereum",
//   logo: "https://images.web3auth.io/chains/1.png",
// };

// Private Key Provider
// const privateKeyProvider = new EthereumPrivateKeyProvider({
//   config: { chainConfig },
// });

// Web3Auth Configuration
const web3AuthOptions: Web3AuthOptions = {
  clientId: CLIENT_ID,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  ///privateKeyProvider,
  modalConfig: {
    connectors: {
      [WALLET_CONNECTORS.AUTH]: {
        label: "auth",
        loginMethods: {
          email_passwordless: {
            name: "email passwordless login",
            authConnectionId: "nehal-auth-id",
          },
        },
      },
    },
  },
};

// Initialize Web3Auth
const web3auth: IWeb3AuthModal = new Web3Auth(web3AuthOptions);

const Header: React.FC<HeaderProps> = ({ onMenuClick, totalEarnings }) => {
  // State Management
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<Partial<UserInfo> | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  // Hooks
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Helper Functions
  const isConnected = useCallback((): boolean => {
    return !!(web3auth && web3auth.connected && provider);
  }, [provider]);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const handleError = useCallback((error: Web3AuthError, context: string): void => {
    console.error(`${context}:`, error);
    setError(`${context}: ${error.message}`);
  }, []);

  // Web3Auth Initialization
  useEffect(() => {
    let mounted = true;

    const initWeb3Auth = async (): Promise<void> => {
      try {
        console.log("Initializing Web3Auth...");
        await web3auth.init();
        
        if (!mounted) return;

        const currentProvider = web3auth.provider;
        setProvider(currentProvider);

        if (web3auth.connected && currentProvider) {
          console.log("Web3Auth already connected");
          setLoggedIn(true);
          
          const user = await web3auth.getUserInfo();
          setUserInfo(user);
          
          if (user.email) {
            localStorage.setItem('userEmail', user.email);
            try {
              await createUser(user.email, user.name || 'Anonymous User');
            } catch (createUserError) {
              handleError(createUserError as Web3AuthError, "Error creating user");
            }
          }
        }
      } catch (initError) {
        if (mounted) {
          handleError(initError as Web3AuthError, "Error initializing Web3Auth");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initWeb3Auth();

    return () => {
      mounted = false;
    };
  }, [handleError]);

  // Fetch Notifications
  useEffect(() => {
    let mounted = true;
    let notificationInterval: NodeJS.Timeout;

    const fetchNotifications = async (): Promise<void> => {
      if (!userInfo?.email) return;

      try {
        const user = await getUserByEmail(userInfo.email);
        if (user && mounted) {
          const unreadNotifications = await getUnreadNotifications(user.id);
          setNotifications(unreadNotifications);
        }
      } catch (fetchError) {
        handleError(fetchError as Web3AuthError, "Error fetching notifications");
      }
    };

    if (userInfo?.email) {
      fetchNotifications();
      notificationInterval = setInterval(fetchNotifications, 30000);
    }

    return () => {
      mounted = false;
      if (notificationInterval) {
        clearInterval(notificationInterval);
      }
    };
  }, [userInfo, handleError]);

  // Fetch User Balance
  useEffect(() => {
    let mounted = true;

    const fetchUserBalance = async (): Promise<void> => {
      if (!userInfo?.email) return;

      try {
        const user = await getUserByEmail(userInfo.email);
        if (user && mounted) {
          const userBalance = await getUserBalance(user.id);
          setBalance(userBalance);
        }
      } catch (balanceError) {
        handleError(balanceError as Web3AuthError, "Error fetching balance");
      }
    };

    const handleBalanceUpdate = (event: Event): void => {
      const customEvent = event as CustomEvent<number>;
      if (mounted) {
        setBalance(customEvent.detail);
      }
    };

    if (userInfo?.email) {
      fetchUserBalance();
    }

    window.addEventListener('balanceUpdated', handleBalanceUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
    };
  }, [userInfo, handleError]);

  // Authentication Functions
  const login = async (): Promise<void> => {
    if (!web3auth) {
      setError("Web3Auth not initialized");
      return;
    }

    try {
      clearError();
      console.log("Attempting to connect...");
      
      const web3authProvider = await web3auth.connect();
      
      if (!web3authProvider) {
        throw new Error("Failed to get provider after connection");
      }

      setProvider(web3authProvider);
      setLoggedIn(true);

      // Verify connection
      if (web3auth.connected) {
        const user = await web3auth.getUserInfo();
        setUserInfo(user);
        
        if (user.email) {
          localStorage.setItem('userEmail', user.email);
          try {
            await createUser(user.email, user.name || 'Anonymous User');
          } catch (createUserError) {
            handleError(createUserError as Web3AuthError, "Error creating user");
          }
        }
        
        console.log("Login successful", { connected: web3auth.connected, user });
      } else {
        throw new Error("Connection failed - Web3Auth not connected after login attempt");
      }
    } catch (loginError) {
      handleError(loginError as Web3AuthError, "Login failed");
    }
  };

  const logout = async (): Promise<void> => {
    if (!web3auth) {
      setError("Web3Auth not initialized");
      return;
    }

    try {
      clearError();
      await web3auth.logout();
      setProvider(null);
      setLoggedIn(false);
      setUserInfo(null);
      setBalance(0);
      setNotifications([]);
      localStorage.removeItem('userEmail');
      console.log("Logout successful");
    } catch (logoutError) {
      handleError(logoutError as Web3AuthError, "Logout failed");
    }
  };

  const getUserInfo = async (): Promise<void> => {
    if (!isConnected()) {
      setError("Wallet is not connected. Please login first.");
      return;
    }

    try {
      clearError();
      const user = await web3auth.getUserInfo();
      setUserInfo(user);
      
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
        try {
          await createUser(user.email, user.name || 'Anonymous User');
        } catch (createUserError) {
          handleError(createUserError as Web3AuthError, "Error creating user");
        }
      }
    } catch (userInfoError) {
      handleError(userInfoError as Web3AuthError, "Error fetching user info");
    }
  };

  const handleNotificationClick = async (notificationId: number): Promise<void> => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
    } catch (notificationError) {
      handleError(notificationError as Web3AuthError, "Error marking notification as read");
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-center px-4 py-4">
          <div className="text-gray-600">Loading Web3Auth...</div>
        </div>
      </div>
    );
  }

  // Error Display
  const ErrorBanner: React.FC = () => (
    error ? (
      <div className="bg-red-50 border-l-4 border-red-400 p-2 mb-2">
        <div className="flex">
          <div className="text-sm text-red-700">
            {error}
          </div>
          <button
            onClick={clearError}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      </div>
    ) : null
  );

  return (
    <>
      <ErrorBanner />
      <header className="bg-gray-500 border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2 md:mr-4" onClick={onMenuClick}>
              <Menu className="h-6 w-6" />
            </Button>
            <Link href="/" className="flex items-center">
              <Leaf className="h-6 w-6 md:h-8 md:w-8 text-green-500 mr-1 md:mr-2" />
              <div className="flex flex-col">
                <span className="font-bold text-base md:text-lg text-gray-50">Swachh Bharat</span>
                <span className="text-[8px] md:text-[10px] text-gray-500 -mt-1"></span>
              </div>
            </Link>
          </div>
          
          {!isMobile && (
            <div className="flex-1 max-w-xl mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          )}
          
          <div className="flex items-center">
            {isMobile && (
              <Button variant="ghost" size="icon" className="mr-2">
                <Search className="h-5 w-5" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2 relative">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5">
                      {notifications.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{notification.type}</span>
                        <span className="text-sm text-gray-500">{notification.message}</span>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem>No new notifications</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="mr-2 md:mr-4 flex items-center bg-gray-100 rounded-full px-2 md:px-3 py-1">
              <Coins className="h-4 w-4 md:h-5 md:w-5 mr-1 text-green-500" />
              <span className="font-semibold text-sm md:text-base text-gray-800">
                {balance.toFixed(2)}
              </span>
            </div>
            
            {!loggedIn ? (
              <Button 
                onClick={login} 
                className="bg-green-600 hover:bg-green-700 text-white text-sm md:text-base"
                disabled={loading}
              >
                {loading ? "Connecting..." : "Login"}
                <LogIn className="ml-1 md:ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="flex items-center">
                    <User className="h-5 w-5 mr-1" />
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={getUserInfo}>
                    {userInfo?.name || "Fetch User Info"}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/settings">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;