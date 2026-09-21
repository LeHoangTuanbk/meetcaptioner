import { Toaster } from "sonner";
import {
  SessionList,
  SessionDetail,
  HistoryHeader,
  HistoryToolbar,
  StorageWarning,
} from "./components";
import { useHistory } from "./use-history";

export default function App() {
  const {
    sessions,
    loading,
    historyError,
    selectedSession,
    setSelectedSession,
    searchQuery,
    setSearchQuery,
    storageInfo,
    filteredSessions,
    deleteSession,
    clearAllHistory,
    exportAllHistory,
    restoreHistoryBackup,
    retryHistory,
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
        <HistoryHeader
          meetingCount={sessions.length}
          bytesUsed={storageInfo.bytesUsed}
          quota={storageInfo.quota}
          onOpenSettings={() =>
            void chrome.runtime.sendMessage({ action: "openOptions" })
          }
        />

        <StorageWarning
          bytesUsed={storageInfo.bytesUsed}
          quota={storageInfo.quota}
          onBackup={exportAllHistory}
        />

        {selectedSession ? (
          <SessionDetail
            session={selectedSession}
            onBack={() => setSelectedSession(null)}
            onDelete={() => deleteSession(selectedSession.id)}
          />
        ) : (
          <>
            <HistoryToolbar
              searchQuery={searchQuery}
              isHistoryAvailable={sessions.length > 0}
              onSearchChange={setSearchQuery}
              onBackup={exportAllHistory}
              onRestore={restoreHistoryBackup}
              onClear={clearAllHistory}
            />

            {historyError ? (
              <div className="py-16 text-center">
                <p className="mb-4 text-red-300">{historyError}</p>
                <button
                  type="button"
                  onClick={retryHistory}
                  className="cursor-pointer rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
                >
                  Retry
                </button>
              </div>
            ) : filteredSessions.length === 0 ? (
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
