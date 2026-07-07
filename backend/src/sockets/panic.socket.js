// PROJO GROUP — Panic Alert real-time layer
// Monitors (admin/security dashboard) join "panic_monitors" to receive
// alerts the instant they're triggered, regardless of SMS/WhatsApp
// provider status — this is the one channel fully within our control.

function registerPanicSocket(io) {
  io.on("connection", (socket) => {
    socket.on("panic:join_monitor", () => {
      socket.join("panic_monitors");
    });
    socket.on("panic:leave_monitor", () => {
      socket.leave("panic_monitors");
    });
  });
}

module.exports = { registerPanicSocket };
