import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { db, initializeSampleData } from '@/lib/database';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Sales from '@/pages/Sales';
import Products from '@/pages/Products';
import Inventory from '@/pages/Inventory';
import Customers from '@/pages/Customers';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import LoadingScreen from '@/components/LoadingScreen';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Open database and initialize sample data
        await db.open();
        await initializeSampleData();
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbError('Failed to initialize the application. Please refresh the page.');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
          <p className="text-gray-600 mb-4">{dbError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/products" element={<Products />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;