import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/layout/Header';
import { LoginPage } from './components/auth/LoginPage';
import { ChatInterface } from './components/chat/ChatInterface';
import { useAilockStore } from './store/ailockStore';
import { useAuthStore } from './store/authStore';
import { socketService } from './services/socketService';

function App() {
  const { updateContextActions } = useAilockStore();
  const { isAuthenticated, loadToken, accessToken } = useAuthStore();
  
  useEffect(() => {
    loadToken();
  }, [loadToken]);

  useEffect(() => {
    if (accessToken) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }
    
    return () => {
      socketService.disconnect();
    };
  }, [accessToken]);

  useEffect(() => {
    if (isAuthenticated) {
      updateContextActions();
    }
  }, [isAuthenticated, updateContextActions]);

  return (
    <>
      <Toaster position="bottom-right" />
      <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="flex-1 overflow-hidden">
          {isAuthenticated ? <ChatInterface /> : <LoginPage />}
        </main>
      </div>
    </>
  );
}

export default App;