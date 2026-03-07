import React from 'react';
import { AppProvider, useAppStore } from './context/AppStore';
import { MatchList } from './components/MatchList';
import { CreateMatch } from './components/CreateMatch';
import { MatchDetails } from './components/MatchDetails';
import { TeamGenerator } from './components/TeamGenerator';
import { PaymentSummary } from './components/PaymentSummary';
import { ShareSummary } from './components/ShareSummary';

function Shell() {
  const { screen } = useAppStore();

  const renderScreen = () => {
    switch (screen.name) {
      case 'list':    return <MatchList />;
      case 'create':  return <CreateMatch />;
      case 'match':   return <MatchDetails id={screen.id} />;
      case 'teams':   return <TeamGenerator id={screen.id} />;
      case 'payment': return <PaymentSummary id={screen.id} />;
      case 'share':   return <ShareSummary id={screen.id} />;
      default:        return <MatchList />;
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-start justify-center"
      style={{ background: '#E0E0E0' }}
    >
      <div
        className="relative w-full max-w-[430px] min-h-screen flex flex-col overflow-hidden shadow-2xl"
        style={{ background: '#F7F7F7' }}
      >
        {renderScreen()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
