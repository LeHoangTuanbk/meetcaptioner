import { AppToaster } from "../shared/app-toaster";
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
    updateSessionNotes,
  } = useHistory();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--mc-app-canvas)">
        <div className="text-(--mc-app-text-secondary)">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-(--mc-app-canvas) text-(--mc-app-text)">
      <AppToaster />

      <div className="mx-auto w-full max-w-225 px-6 py-6">
        <HistoryHeader
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
            onUpdateNotes={updateSessionNotes}
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

            {sessions.length > 0 && (
              <p className="mb-3 text-xs leading-4.5 text-(--mc-app-text-secondary)">
                {sessions.length} meeting{sessions.length !== 1 ? "s" : ""}{" "}
                saved
              </p>
            )}

            {historyError ? (
              <div className="py-16 text-center">
                <p className="mb-4 text-red-300">{historyError}</p>
                <button
                  type="button"
                  onClick={retryHistory}
                  className="cursor-pointer rounded-lg bg-(--mc-secondary) px-4 py-2 text-sm hover:bg-(--mc-secondary-hover)"
                >
                  Retry
                </button>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-medium text-(--mc-app-text-emphasis)">
                  {searchQuery
                    ? "No meetings match your search"
                    : "No meeting history yet"}
                </p>
                <p className="mt-1 text-xs leading-4.5 text-(--mc-app-text-secondary)">
                  {searchQuery
                    ? "Try another meeting title or caption."
                    : "Captured meetings will appear here."}
                </p>
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
    </main>
  );
}
