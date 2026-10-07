import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

function OfflineIndicator() {
  const [online, setOnline] = useState(
    navigator.onLine
  );

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }

    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );
    };
  }, []);

  if (online) {
    return null;
  }

  return (
    <div className="offline-indicator">
      <WifiOff size={15} />
      <span>
        You're offline — your data is safe
        on this device
      </span>
    </div>
  );
}

export default OfflineIndicator;