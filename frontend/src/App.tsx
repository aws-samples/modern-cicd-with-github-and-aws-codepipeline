import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { apiClient } from './services/api';
import config from './config';

function App() {
  const [hotelName, setHotelName] = useState(config.hotelName);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Starting application...');

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 30; // 30 attempts = ~30 seconds with 1 second delay
    
    const checkBackendHealth = async () => {
      setLoadingMessage(`Connecting to backend services... (attempt ${retryCount + 1}/${maxRetries})`);
      
      const isHealthy = await apiClient.healthCheck();
      
      if (isHealthy) {
        setLoadingMessage('Backend connected! Loading configuration...');
        
        // Fetch config and update document title
        try {
          const appConfig = await apiClient.getConfig();
          setHotelName(appConfig.hotelName);
          document.title = `${appConfig.hotelName} - Hotel Management`;
        } catch (err) {
          console.error('Failed to fetch config:', err);
          // Use default hotel name
          document.title = `${config.hotelName} - Hotel Management`;
        }
        
        setIsBackendReady(true);
      } else {
        retryCount++;
        
        if (retryCount < maxRetries) {
          // Retry after 1 second
          setTimeout(checkBackendHealth, 1000);
        } else {
          // Max retries reached, show app anyway with default config
          console.warn('Backend health check failed after maximum retries. Using default configuration.');
          setLoadingMessage('Could not connect to backend. Using default configuration...');
          document.title = `${config.hotelName} - Hotel Management`;
          
          // Show app after 2 seconds even if backend is not ready
          setTimeout(() => setIsBackendReady(true), 2000);
        }
      }
    };
    
    checkBackendHealth();
  }, []);

  if (!isBackendReady) {
    return (
      <LoadingScreen 
        message={loadingMessage}
        subMessage="The backend services are starting up. This usually takes 5-10 seconds."
      />
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <MainLayout hotelName={hotelName}>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </MainLayout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
