import { useState } from "react";
import "./UpgradeBadge.css";

// Wraps a nav label with a small glowing "Upgrade available" pill.
// Purely informational — does not lock or gate anything. Clicking the pill
// shows the upgrade note (why it's not real-time/first-party yet) rather
// than a paywall, since nothing here is actually paid today.
export default function UpgradeBadge({ label, note }) {
  const [showNote, setShowNote] = useState(false);

  return (
    <span className="upgrade-badge-wrap">
      <span>{label}</span>
      <button
        type="button"
        className="upgrade-pill"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowNote(!showNote);
        }}
        title="This feature works fully today via a free approach — see why a paid upgrade would improve it later"
      >
        ⚡ Upgrade available
      </button>
      {showNote && <div className="upgrade-note">{note}</div>}
    </span>
  );
}
