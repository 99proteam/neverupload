import { useRegisterSW } from 'virtual:pwa-register/react';

/** Registers the service worker and tells the user when the app works offline. */
export function OfflineStatus() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (needRefresh) {
    return (
      <div role="status" className="flex flex-wrap items-center gap-2 text-sm">
        A new version is available.
        <button
          type="button"
          className="font-semibold underline"
          onClick={() => updateServiceWorker(true)}
        >
          Reload
        </button>
      </div>
    );
  }
  if (offlineReady) {
    return (
      <div role="status" className="flex flex-wrap items-center gap-2 text-sm">
        Ready to work offline.
        <button type="button" className="underline" onClick={() => setOfflineReady(false)}>
          OK
        </button>
      </div>
    );
  }
  return null;
}
