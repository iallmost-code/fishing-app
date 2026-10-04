import { useEffect, useState } from "react";

/** Keep time-of-day advice current while the app stays open or resumes. */
export function useCurrentTime() {
  const [time, setTime] = useState(() => new Date().toISOString());
  useEffect(() => {
    const update = () => setTime(new Date().toISOString());
    const timer = window.setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return time;
}
