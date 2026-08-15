import React, { useState, useEffect } from 'react';
import { AppContainer } from './containers/AppContainer';
import { ControlContainer } from './containers/ControlContainer';

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  if (currentPath.startsWith('/control')) {
    return <ControlContainer />;
  }

  return <AppContainer />;
}
