import { useState } from 'react';
import useSWR from 'swr';
import { fetchToday, fetchByDate, fetchHistory } from './api';
import type { DailyAnalysis } from './api';
import { Header } from './components/Header';
import { Headline } from './components/Headline';
import { CategoryCard } from './components/CategoryCard';
import { NotablePicks } from './components/NotablePicks';
import { RepoList } from './components/RepoList';
import { Archive } from './components/Archive';
import { About } from './components/About';
import { Footer } from './components/Footer';

export type View = 'today' | 'archive' | 'about';

function App() {
  const [view, setView] = useState<View>('today');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const {
    data: todayData,
    error: todayError,
    isLoading: todayLoading,
  } = useSWR(
    view === 'today' && !selectedDate ? 'today' : null,
    fetchToday,
    { refreshInterval: 300000 },
  );

  const {
    data: dateData,
    error: dateError,
    isLoading: dateLoading,
  } = useSWR(
    selectedDate ? ['date', selectedDate] : null,
    () => fetchByDate(selectedDate!),
  );

  const {
    data: historyData,
    error: historyError,
    isLoading: historyLoading,
  } = useSWR(
    view === 'archive' ? 'history' : null,
    () => fetchHistory(30),
  );

  const activeData: DailyAnalysis | undefined = selectedDate ? dateData : todayData;
  const isLoading = selectedDate ? dateLoading : todayLoading;
  const hasError = selectedDate ? dateError : todayError;

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setView('today');
  };

  const handleNavClick = (newView: View) => {
    if (newView === 'today') {
      setSelectedDate(null);
    }
    setView(newView);
  };

  return (
    <div className="min-h-screen bg-bg text-text font-body">
      <Header currentView={view} onNavigate={handleNavClick} selectedDate={selectedDate} />

      <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6">
        {view === 'about' && <About />}

        {view === 'archive' && (
          <Archive
            data={historyData?.data || []}
            loading={historyLoading}
            error={historyError}
            onDateSelect={handleDateSelect}
          />
        )}

        {view === 'today' && hasError && (
          <div className="text-center py-20">
            <h2 className="text-xl font-display font-bold text-red-400 mb-2">
              Connection Error
            </h2>
            <p className="text-text-secondary">Unable to fetch analysis data.</p>
          </div>
        )}

        {view === 'today' && !hasError && (
          <>
            <Headline
              headline={activeData?.analysis.headline}
              date={activeData?.date}
              pattern={activeData?.analysis.pattern}
              loading={isLoading}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {activeData &&
                Object.entries(activeData.analysis.categories).map(([category, items]) => (
                  <CategoryCard key={category} category={category} items={items} />
                ))}
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <CategoryCard key={i} category="" items={[]} loading={true} />
                ))}
            </div>

            <NotablePicks notable={activeData?.analysis.notable || []} loading={isLoading} />
            <RepoList categories={activeData?.analysis.categories || {}} loading={isLoading} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
