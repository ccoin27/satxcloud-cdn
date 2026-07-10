(function () {
  'use strict';

  var NS = '_kwas_eaglercraft';
  var PROFILE_LS_KEY = NS + '.p';
  var session = null;
  var sessionReady = false;
  var sessionPromise = null;
  var parentOrigin = null;

  function getParentOriginFromQuery() {
    try {
      var params = new URLSearchParams(window.location.search);
      var fromQuery = params.get('kwasParent');
      if (fromQuery) {
        return fromQuery.replace(/\/$/, '');
      }
    } catch (err) {
      // ignore
    }
    return null;
  }

  function getParentOrigin() {
    if (parentOrigin) {
      return parentOrigin;
    }

    var fromQuery = getParentOriginFromQuery();
    if (fromQuery) {
      parentOrigin = fromQuery;
      return parentOrigin;
    }

    try {
      if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
        parentOrigin = window.location.ancestorOrigins[0];
        return parentOrigin;
      }
    } catch (err) {
      // ignore
    }

    var script = document.currentScript;
    if (script && script.src) {
      try {
        var scriptOrigin = new URL(script.src).origin;
        if (scriptOrigin !== window.location.origin) {
          parentOrigin = scriptOrigin;
          return parentOrigin;
        }
      } catch (err) {
        // ignore
      }
    }

    try {
      if (window.parent && window.parent !== window) {
        parentOrigin = window.location.origin;
        return parentOrigin;
      }
    } catch (err) {
      parentOrigin = null;
    }

    return parentOrigin;
  }

  function usesParentBridge() {
    if (!window.parent || window.parent === window) {
      return false;
    }

    var origin = getParentOrigin();
    return Boolean(origin && origin !== window.location.origin);
  }

  function postToParent(requestType, responseType, payload) {
    var origin = getParentOrigin();
    if (!origin) {
      return Promise.reject(new Error('no parent origin'));
    }

    var reqId = Math.random().toString(36).slice(2);

    return new Promise(function (resolve, reject) {
      function onMessage(event) {
        if (event.origin !== origin) {
          return;
        }
        if (!event.data || event.data.type !== responseType || event.data.reqId !== reqId) {
          return;
        }
        window.removeEventListener('message', onMessage);
        if (event.data.error) {
          reject(new Error(event.data.error));
          return;
        }
        resolve(event.data.payload);
      }

      window.addEventListener('message', onMessage);
      window.parent.postMessage(Object.assign({ type: requestType, reqId: reqId }, payload || {}), origin);

      window.setTimeout(function () {
        window.removeEventListener('message', onMessage);
        reject(new Error('timeout'));
      }, 15000);
    });
  }

  function setSession(data) {
    if (!data || !data.username || !data.profileBlob) {
      session = null;
      sessionReady = true;
      window.__KWAS_EAGLER_SESSION__ = null;
      return;
    }

    session = data;
    sessionReady = true;
    window.__KWAS_EAGLER_SESSION__ = session;
    writeLocalProfile(session.profileBlob);
  }

  function readLocalProfile() {
    try {
      return localStorage.getItem(PROFILE_LS_KEY);
    } catch (err) {
      return null;
    }
  }

  function writeLocalProfile(blob) {
    if (!blob) {
      return;
    }
    try {
      localStorage.setItem(PROFILE_LS_KEY, blob);
    } catch (err) {
      // ignore quota errors
    }
  }

  function loadSessionDirect() {
    return fetch('/api/eaglecraft/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localProfile: readLocalProfile() }),
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('session');
        }
        return res.json();
      });
  }

  function loadSessionViaParent() {
    return postToParent('kwas-eaglecraft-session-request', 'kwas-eaglecraft-session', {
      localProfile: readLocalProfile(),
    });
  }

  function loadSession() {
    if (sessionPromise) {
      return sessionPromise;
    }

    var loader = usesParentBridge() ? loadSessionViaParent : loadSessionDirect;
    sessionPromise = loader()
      .then(function (data) {
        setSession(data);
        return data;
      })
      .catch(function () {
        setSession(null);
        return null;
      })
      .finally(function () {
        sessionPromise = null;
      });

    return sessionPromise;
  }

  function backupProfileDirect(blob) {
    return fetch('/api/eaglecraft/profile', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: blob }),
    }).then(function (res) {
      return res.json().then(function (body) {
        if (!res.ok) {
          throw new Error(body.error || 'save failed');
        }
        return body;
      });
    });
  }

  function backupProfileViaParent(blob) {
    return postToParent('kwas-eaglecraft-profile-save', 'kwas-eaglecraft-profile-saved', { data: blob });
  }

  function backupProfile(blob) {
    if (!session || !blob) {
      return;
    }

    var saver = usesParentBridge() ? backupProfileViaParent : backupProfileDirect;
    saver(blob)
      .then(function (body) {
        if (body && body.profileBlob) {
          session.profileBlob = body.profileBlob;
          writeLocalProfile(body.profileBlob);
        }
      })
      .catch(function () {
        // ignore
      });
  }

  loadSession();

  window.kwasEaglerProfile = {
    ready: function () {
      if (sessionReady) {
        return Promise.resolve(session);
      }
      return loadSession();
    },
    applyProfile: function () {
      if (!session || !session.profileBlob) {
        return false;
      }
      writeLocalProfile(session.profileBlob);
      return true;
    },
    onLoaded: function (key) {
      if (key !== 'p') {
        return null;
      }
      if (session && session.profileBlob) {
        return session.profileBlob;
      }
      return readLocalProfile();
    },
    onSaved: function (key, data) {
      if (key !== 'p' || !data || !session) {
        return;
      }
      backupProfile(data);
    },
  };
})();
