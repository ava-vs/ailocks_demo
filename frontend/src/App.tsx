import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/layout/Header';
import { ChatInterface } from './components/chat/ChatInterface';
import { LoginPage } from './components/auth/LoginPage';
import { useGeolocation } from './hooks/useGeolocation';
import { useSocket } from './hooks/useSocket';
import { useAilockStore } from './store/ailockStore';
import { useAuthStore } from './store/authStore';

function App() {
  const { updateContextActions } = useAilockStore();
  const { isAuthenticated, loadToken } = useAuthStore();
  
  // Initialize authentication state from localStorage
  useEffect(() => {
    loadToken();
  }, [loadToken]);

  // Initialize geolocation and socket only when authenticated
  useGeolocation();
  useSocket();

  useEffect(() => {
    if (isAuthenticated) {
      // Update context actions on app load
      updateContextActions();
    }
  }, [updateContextActions, isAuthenticated]);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        <ChatInterface />
      </main>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

export default App;