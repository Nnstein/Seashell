import React from 'react';
import { useApp } from './context/AppContext';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import ConfirmationScreen from './components/ConfirmationScreen';
import MenuView from './views/MenuView';

function App() {
  const { view } = useApp();

  let content;
  switch (view) {
    case 'HOME':
      content = <LandingPage />;
      break;
    case 'MENU':
      content = <MenuView />;
      break;
    case 'CONFIRMATION':
      content = <ConfirmationScreen />;
      break;
    default:
      content = <LandingPage />;
  }

  return (
    <Layout>
      {content}
    </Layout>
  );
}

export default App;