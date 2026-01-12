import { Toaster } from "sonner";
import { SessionList, SessionDetail, StorageIndicator } from "./components";
import { useHistory } from "./use-history";

export default function App() {
  const {
    sessions,
    loading,
    selectedSession,
    setSelectedSession,
    searchQuery,
    setSearchQuery,
    storageInfo,
    filteredSessions,
    deleteSession,
    clearAllHistory,
    updateSessionTitle,
  } = useHistory();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Toaster
        position="top-center"
        theme="dark"
        richColors
        toastOptions={{
          style: {
            background: "#1e293b",
            border: "1px solid #334155",
          },
        }}
      />

      <div className="max-w-6xl mx-auto py-8 px-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">
              Meeting History
            </h1>
            <p className="text-slate-400 text-sm">
              {sessions.length} meeting{sessions.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StorageIndicator
              bytesUsed={storageInfo.bytesUsed}
              quota={storageInfo.quota}
            />
            <button
              onClick={() =>
                chrome.runtime.sendMessage({ action: "openOptions" })
              }
              className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Settings
            </button>
          </div>
        </header>

        {selectedSession ? (
          <SessionDetail
            session={selectedSession}
            onBack={() => setSelectedSession(null)}
            onDelete={() => deleteSession(selectedSession.id)}
          />
        ) : (
          <>
            <div className="mb-6 flex items-center gap-4">
              <input
                type="text"
                placeholder="Search captions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600"
              />
              {sessions.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="px-4 py-2 text-sm bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {filteredSessions.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                {searchQuery
                  ? "No meetings match your search"
                  : "No meeting history yet"}
              </div>
            ) : (
              <SessionList
                sessions={filteredSessions}
                onSelect={setSelectedSession}
                onDelete={deleteSession}
                onUpdateTitle={updateSessionTitle}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
