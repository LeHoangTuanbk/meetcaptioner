import { ClosedCaptioningIcon, RobotIcon } from "@phosphor-icons/react";

export default function App() {
  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <main className="flex w-79.5 flex-col gap-5 bg-(--mc-app-canvas) p-5 text-(--mc-app-text) shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
      <header className="flex flex-col gap-0.5">
        <h1 className="text-2xl leading-7 font-semibold">Meet Captioner</h1>
        <p className="text-xs leading-4.5 text-(--mc-app-text-secondary)">
          Real-time caption translation for Google Meet
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <section className="rounded-lg bg-(--mc-app-surface) p-3.5">
          <div className="flex items-start gap-3">
            <ClosedCaptioningIcon className="mt-0.5 size-6 shrink-0" weight="regular" />
            <div>
              <h2 className="mb-1 text-lg leading-5 font-medium">
                Get Captions
              </h2>
              <p className="text-xs leading-4.5 text-(--mc-app-text-secondary)">
                Turn on{" "}
                <span className="font-medium text-(--mc-app-text-emphasis)">
                  Closed Captions
                </span>{" "}
                in your Google Meet call
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-(--mc-app-surface) p-3.5">
          <div className="flex items-start gap-3">
            <RobotIcon className="mt-0.5 size-6 shrink-0" weight="regular" />
            <div>
              <h2 className="mb-1.5 text-lg leading-5 font-medium">
                Get Translations
              </h2>
              <ol className="list-inside list-decimal space-y-1.5 text-xs leading-4.5 text-(--mc-app-text-secondary)">
                <li>
                  Configure in Settings:{" "}
                  <span className="font-medium text-(--mc-app-text-emphasis)">
                    AI Provider, API Key, Model
                  </span>
                </li>
                <li>Choose target language in overlay</li>
                <li>
                  Turn <span className="font-medium text-(--mc-positive)">ON</span>{" "}
                  translation toggle
                </li>
              </ol>
            </div>
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={openSettings}
          className="flex h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-(--mc-primary) text-sm font-medium transition-colors hover:bg-(--mc-primary-hover)"
        >
          <span>Open Settings</span>
        </button>
        <button
          onClick={() =>
            chrome.tabs.create({ url: chrome.runtime.getURL("meeting-history.html") })
          }
          className="flex h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-(--mc-secondary) text-sm font-medium transition-colors hover:bg-(--mc-secondary-hover)"
        >
          <span>View Meeting Caption History</span>
        </button>
      </div>
    </main>
  );
}
