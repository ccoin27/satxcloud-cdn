(function () {
  'use strict';

  var started = false;

  function getParentOrigin() {
    try {
      var params = new URLSearchParams(window.location.search);
      var fromQuery = params.get('kwasParent');
      if (fromQuery) {
        return fromQuery;
      }
    } catch (err) {
      // ignore
    }

    try {
      if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
        return window.location.ancestorOrigins[0];
      }
    } catch (err) {
      // ignore
    }

    return window.location.origin;
  }

  function startGame() {
    if (started) {
      return;
    }
    started = true;

    function run() {
      try {
        if (window.kwasEaglerProfile && window.kwasEaglerProfile.applyProfile) {
          window.kwasEaglerProfile.applyProfile();
        }
      } catch (err) {
        // ignore
      }

      var unlock = document.getElementById('audio_unlock_screen');
      if (unlock) {
        unlock.style.display = 'none';
        unlock.setAttribute('aria-hidden', 'true');
      }
      document.body.style.backgroundColor = 'black';
      main();

      try {
        if (window.parent && window.parent !== window) {
          window.requestAnimationFrame(function () {
            window.parent.postMessage({ type: 'kwas-eaglecraft-started' }, getParentOrigin());
          });
        }
      } catch (err) {
        // ignore
      }
    }

    if (window.kwasEaglerProfile && window.kwasEaglerProfile.ready) {
      window.kwasEaglerProfile.ready().then(run).catch(run);
    } else {
      run();
    }
  }

  function bindUnlockScreen() {
    var unlock = document.getElementById('audio_unlock_screen');
    if (!unlock) {
      startGame();
      return;
    }

    var triggered = false;
    function trigger() {
      if (triggered) {
        return;
      }
      triggered = true;
      startGame();
    }

    window.kwasStartGame = trigger;
    unlock.addEventListener('pointerup', trigger);
    unlock.addEventListener('click', trigger);
    unlock.addEventListener('keydown', function (event) {
      if (event.code === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        trigger();
      }
    });
    unlock.focus();
  }

  window.kwasStartGame = startGame;

  if (document.readyState === 'loading') {
    window.addEventListener('load', bindUnlockScreen);
  } else {
    bindUnlockScreen();
  }
})();
