import React from 'react';
import { createRoot } from 'react-dom/client';
import MarketingLayout from './app/(marketing)/layout';
import LandingPage from './app/(marketing)/inicio/page';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <MarketingLayout>
        <LandingPage />
      </MarketingLayout>
    </React.StrictMode>
  );
}