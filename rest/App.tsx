import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { MenuPage } from './pages/MenuPage';
import { CheckoutPage } from './pages/CheckoutPage';

const App = () => {
  return (
    <CartProvider>
      <Router>
        <div className="antialiased text-gray-900 bg-gray-50 min-h-screen">
          <Routes>
            <Route
              path="/"
              element={
                <MenuPage
                  onCheckout={() => (window.location.hash = '#/checkout')}
                  onProfile={() => (window.location.hash = '#/')}
                />
              }
            />
            <Route path="/checkout" element={<CheckoutPage onBackToMenu={() => (window.location.hash = '#/')} />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
};

export default App;
