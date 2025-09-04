(() => {
  const totp = new TOTP();

  function getStoredAccounts() {
    return new Promise(resolve => {
      try {
        chrome.storage.local.get('accounts', data => {
          try {
            const raw = data && data.accounts ? JSON.parse(data.accounts) : {};
            resolve(raw || {});
          } catch (e) {
            resolve({});
          }
        });
      } catch (e) {
        resolve({});
      }
    });
  }

  function buildUppercaseMap(accountsObj) {
    const map = {};
    Object.keys(accountsObj || {}).forEach(name => {
      map[name.toUpperCase()] = accountsObj[name];
    });
    return map;
  }

  function readDisplayedAccountName() {
    try {
      // Try to find an element that contains the "Account:" label and a span with the username
      const candidates = Array.from(document.querySelectorAll('div, span, p, h1, h2, h3, h4, h5'));
      for (const el of candidates) {
        const txt = (el.textContent || '').trim();
        if (!txt) continue;
        if (/(^|\s)Account:/i.test(txt)) {
          const span = el.querySelector('span');
          if (span && span.textContent) {
            return span.textContent.trim();
          }
          // Fallback: attempt to parse after colon
          const match = txt.match(/Account:\s*([^\s]+)/i);
          if (match && match[1]) return match[1].trim();
        }
      }
    } catch (_) {}

    // Old login fields fallback
    const legacyUser = document.getElementById('input_username') || document.getElementById('steamAccountName');
    if (legacyUser && legacyUser.value) return legacyUser.value.trim();

    return null;
  }

  function findFiveCharInputs() {
    // Find containers that hold at least 5 inputs with maxlength="1"
    const allCharInputs = Array.from(document.querySelectorAll('input[maxlength="1"]'));
    if (allCharInputs.length < 5) return null;

    function inputsUnder(node) {
      return Array.from(node.querySelectorAll('input[maxlength="1"]'));
    }

    // Ascend a few levels from each input to find a container with exactly 5 inputs
    for (const input of allCharInputs) {
      let container = input;
      for (let i = 0; i < 4 && container; i += 1) {
        container = container.parentElement;
        if (!container) break;
        const inputs = inputsUnder(container).filter(el => el.type === 'text' || el.type === 'tel' || !el.type);
        if (inputs.length >= 5) {
          // Prefer exactly 5
          const five = inputs.slice(0, 5);
          return five;
        }
      }
    }
    return null;
  }

  function setInputValueReactSafe(input, value) {
    const proto = window.HTMLInputElement && Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    if (proto && proto.set) {
      proto.set.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  }

  async function attemptFill() {
    const accountsObj = await getStoredAccounts();
    const uppercaseAccounts = buildUppercaseMap(accountsObj);

    // Determine which account to use
    let username = readDisplayedAccountName();
    let accountRecord = null;
    if (username && uppercaseAccounts[username.toUpperCase()]) {
      accountRecord = uppercaseAccounts[username.toUpperCase()];
    } else {
      const names = Object.keys(accountsObj);
      if (names.length === 1) {
        accountRecord = accountsObj[names[0]];
      }
    }

    if (!accountRecord || !accountRecord.shared_secret) {
      return; // No usable account
    }

    const code = String(totp.getOTP(accountRecord.shared_secret) || '').trim();
    if (!code) return;

    // New UI: five single-character inputs
    const charInputs = findFiveCharInputs();
    if (charInputs && charInputs.length >= 5) {
      const chars = code.split('').slice(0, 5);
      for (let i = 0; i < 5; i += 1) {
        if (!charInputs[i]) continue;
        setInputValueReactSafe(charInputs[i], chars[i] || '');
      }
      return;
    }

    // Old UI fallback: a single input field
    const legacyAuth = document.getElementById('twofactorcode_entry');
    if (legacyAuth) {
      setInputValueReactSafe(legacyAuth, code);
      return;
    }
  }

  // Initial attempt
  attemptFill();

  // Observe DOM changes as Steam renders dynamically
  try {
    const observer = new MutationObserver(() => {
      // Only try to fill if inputs exist and are empty
      const newUiInputs = findFiveCharInputs();
      if (newUiInputs && newUiInputs.every(i => !i.value)) {
        attemptFill();
      }

      const legacyAuth = document.getElementById('twofactorcode_entry');
      if (legacyAuth && !legacyAuth.value) {
        attemptFill();
      }
    });
    observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
  } catch (_) {}
})();