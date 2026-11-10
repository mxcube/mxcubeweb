import { useEffect, useState } from 'react';

function format(seconds) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);

  return minutes > 0 ? `${minutes}m ${total % 60}s` : `${total}s`;
}

/** Time a task has been running for, or took. Timestamps in seconds. */
export default function ElapsedTime({ startedAt, endedAt, className }) {
  const running = Boolean(startedAt) && !endedAt;
  const [now, setNow] = useState(Date.now() / 1000);

  useEffect(() => {
    if (!running) {
      return undefined;
    }

    const timer = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(timer);
  }, [running]);

  if (!startedAt) {
    return null;
  }

  return (
    <span className={className}>{format((endedAt || now) - startedAt)}</span>
  );
}
