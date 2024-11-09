import React from 'react';
import TodoApp from './Todoapp.jsx'; // Importing the TodoApp component we created earlier
import { Card } from './components/ui/cards';
import { AlertCircle } from "lucide-react";

const App = () => {
  const [error, setError] = React.useState(null);

  // Global error boundary
  const handleError = (error) => {
    console.error('Application Error:', error);
    setError(error.message);
  };

  React.useEffect(() => {
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // If there's an error, show error UI
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur-lg p-6 rounded-lg border border-red-500/50">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle size={24} />
            <h2 className="text-xl font-semibold">Something went wrong</h2>
          </div>
          <p className="mt-4 text-gray-200">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Reload Application
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg animate-pulse" />
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                TodoMaster
              </h1>
            </div>
            
            {/* Add any header actions/navigation here */}
            <nav className="space-x-4">
              <button className="text-white/70 hover:text-white transition-colors">
                Dashboard
              </button>
              <button className="text-white/70 hover:text-white transition-colors">
                Settings
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TodoApp />
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-lg border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-white/50 text-sm">
            <p>© 2024 TodoMaster. All rights reserved.</p>
            <div className="space-x-4">
              <button className="hover:text-white transition-colors">Privacy Policy</button>
              <button className="hover:text-white transition-colors">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;