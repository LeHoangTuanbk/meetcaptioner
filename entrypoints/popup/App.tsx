export default function App() {
  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="w-72 bg-slate-900 text-slate-100 p-5">
      <header className="mb-5">
        <h1 className="text-lg font-semibold text-white">MeetCaptioner</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time caption translation for Google Meet
        </p>
      </header>

      <div className="space-y-4">
        <section className="bg-slate-800/50 rounded-lg p-3.5">
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">CC</span>
            <div>
              <h2 className="text-sm font-medium text-white mb-1">
                Get Captions
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Turn on{" "}
                <span className="text-slate-300 font-medium">
                  Closed Captions
                </span>{" "}
                in your Google Meet call
              </p>
            </div>
          </div>
        </section>

        <section className="bg-slate-800/50 rounded-lg p-3.5">
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">AI</span>
            <div>
              <h2 className="text-sm font-medium text-white mb-1.5">
                Get Translations
              </h2>
              <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
                <li>
                  Configure in Settings:{" "}
                  <span className="text-slate-300 font-medium">
                    AI Provider, API Key, Model
                  </span>
                </li>
                <li>Choose target language in overlay</li>
                <li>
                  Turn <span className="text-emerald-400 font-medium">ON</span>{" "}
                  translation toggle
                </li>
              </ol>
            </div>
          </div>
        </section>
      </div>

      <button
        onClick={openSettings}
        className="w-full mt-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <span>Open Settings</span>
      </button>
    </div>
  );
}
