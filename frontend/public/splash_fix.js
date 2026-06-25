// Replace this script block in index.html

// Hide splash after 2s regardless — don't wait for load event
setTimeout(function() {
  var splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('hidden');
    setTimeout(function() { splash.remove(); }, 500);
  }
}, 2000);

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(function(reg) { console.log('PROJO SW registered'); })
    .catch(function(err) { console.log('SW error:', err); });
}

// PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
  setTimeout(function() {
    var banner = document.getElementById('install-banner');
    if (banner) banner.classList.add('show');
  }, 3000);
});

function installApp() {
  var banner = document.getElementById('install-banner');
  if (banner) banner.classList.remove('show');
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function() { deferredPrompt = null; });
  }
}

function dismissBanner() {
  var banner = document.getElementById('install-banner');
  if (banner) banner.classList.remove('show');
}

window.addEventListener('appinstalled', function() {
  var banner = document.getElementById('install-banner');
  if (banner) banner.classList.remove('show');
});
