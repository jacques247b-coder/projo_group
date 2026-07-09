// PROJO GROUP — Panic Alert real-time layer
// Monitors (admin/security dashboard) join "panic_monitors" to receive
// alerts the instant they're triggered, regardless of SMS/WhatsApp
// provider status — this is the one channel fully within our control.
//
// Family/friend watch pages join "panic_alert:<alertId>" instead — scoped
// to just the one alert they were sent a link to, nothing more.

function registerPanicSocket(io) {
  io.on("connection", (socket) => {
    socket.on("panic:join_monitor", () => {
      socket.join("panic_monitors");
    });
    socket.on("panic:leave_monitor", () => {
      socket.leave("panic_monitors");
    });
    socket.on("panic:join_watch", ({ alertId }) => {
      if (!alertId) return;
      socket.join(`panic_alert:${alertId}`);
    });
    socket.on("panic:leave_watch", ({ alertId }) => {
      if (!alertId) return;
      socket.leave(`panic_alert:${alertId}`);
    });
  });
}

module.exports = { registerPanicSocket };
