document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Toast notifications (shared across all pages) ---------- */
  let toastStack = document.querySelector('.toast-stack');
  if (!toastStack) {
    toastStack = document.createElement('div');
    toastStack.className = 'toast-stack';
    toastStack.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastStack);
  }
  function showToast(message, type = 'success', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = 'toast' + (type === 'error' ? ' toast--error' : '');
    toast.innerHTML = `
      <span class="toast-icon">${type === 'error' ? '!' : '✓'}</span>
      <span class="toast-body">${message}</span>
      <button class="toast-close" aria-label="Dismiss">&times;</button>
    `;
    toastStack.appendChild(toast);
    const remove = () => {
      toast.classList.add('is-leaving');
      setTimeout(() => toast.remove(), 220);
    };
    toast.querySelector('.toast-close').addEventListener('click', remove);
    const timer = setTimeout(remove, duration);
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
  }
  window.showToast = showToast;

  /* ---------- Live "pending requests" badge on the sidebar ---------- */
  // In a real app this count would come from the backend on every page.
  // Here we seed it from the same numbers requests.html renders, and
  // recompute it live if we're actually on the requests page.
  const requestsSideLink = document.querySelector('.side-link[href="requests.html"]');
  if (requestsSideLink) {
    let badge = requestsSideLink.querySelector('.nav-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'nav-badge';
      requestsSideLink.appendChild(badge);
    }
    badge.id = 'pendingBadge';

    const seedCount = document.getElementById('requestList')
      ? document.querySelectorAll('#requestList .request-row[data-status="pending"]').length
      : 2; // fallback used on every other page
    badge.textContent = seedCount;
    badge.hidden = seedCount === 0;
  }
  function bumpPendingBadge(delta) {
    const badge = document.getElementById('pendingBadge');
    if (!badge) return;
    const next = Math.max(0, (parseInt(badge.textContent, 10) || 0) + delta);
    badge.textContent = next;
    badge.hidden = next === 0;
  }

  /* ---------- Header date ---------- */
  const headerDate = document.getElementById('headerDate');
  if (headerDate) {
    headerDate.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  }

  /* ---------- Hamburger / collapsible sidebar (present on every page) ---------- */
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('backdrop');

  if (hamburgerBtn && sidebar && backdrop) {
    const SIDEBAR_KEY = 'td-sidebar-collapsed';
    const isMobile = () => window.innerWidth <= 768;

    const applySidebarState = (collapsed) => {
      sidebar.classList.toggle('is-collapsed', collapsed);
      hamburgerBtn.setAttribute('aria-expanded', String(!collapsed));
      if (!collapsed && isMobile()) {
        backdrop.classList.add('is-open');
      } else {
        backdrop.classList.remove('is-open');
      }
    };

    const stored = localStorage.getItem(SIDEBAR_KEY);
    let collapsed = stored === null ? isMobile() : stored === 'true';
    applySidebarState(collapsed);

    hamburgerBtn.addEventListener('click', () => {
      collapsed = !collapsed;
      localStorage.setItem(SIDEBAR_KEY, String(collapsed));
      applySidebarState(collapsed);
    });

    document.querySelectorAll('.side-link').forEach((link) => {
      link.addEventListener('click', () => {
        if (!isMobile()) return;
        collapsed = true;
        localStorage.setItem(SIDEBAR_KEY, 'true');
        applySidebarState(collapsed);
      });
    });

    backdrop.addEventListener('click', () => {
      collapsed = true;
      localStorage.setItem(SIDEBAR_KEY, 'true');
      applySidebarState(collapsed);
    });

    window.addEventListener('resize', () => {
      if (!isMobile()) backdrop.classList.remove('is-open');
      else if (!collapsed) backdrop.classList.add('is-open');
    });
  }

  /* ---------- Login / Logout button ---------- */
  const authBtn = document.getElementById('authBtn');
  if (authBtn) {
    const iconLogout = authBtn.querySelector('.icon-logout');
    const iconLogin = authBtn.querySelector('.icon-login');
    const authLabel = authBtn.querySelector('.auth-label');
    const AUTH_KEY = 'td-logged-in';

    const applyAuthState = (loggedIn) => {
      authBtn.classList.toggle('is-logged-out', !loggedIn);
      authBtn.setAttribute('aria-pressed', String(loggedIn));
      if (authLabel) authLabel.textContent = loggedIn ? 'Logout' : 'Login';
      if (iconLogout) iconLogout.hidden = !loggedIn;
      if (iconLogin) iconLogin.hidden = loggedIn;
    };

    let loggedIn = localStorage.getItem(AUTH_KEY) !== 'false';
    applyAuthState(loggedIn);

    authBtn.addEventListener('click', () => {
      loggedIn = !loggedIn;
      localStorage.setItem(AUTH_KEY, String(loggedIn));
      applyAuthState(loggedIn);
      showToast(loggedIn ? 'Logged back in — welcome, Tannvi!' : 'You have been logged out.');
    });
  }

  /* ---------- Placeholder links (pages not yet built) — sidebar items and shortcut tiles ---------- */
  document.querySelectorAll('[data-placeholder]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href !== '#' && href !== '') {
        return;
      }
      e.preventDefault();
      showToast(`${link.dataset.placeholder} is coming soon.`);
    });
  });

  /* ---------- Generic dot-indicator builder ---------- */
  function buildDots(container, count, activeIndex, onClick) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.className = 'dot-btn' + (i === activeIndex ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', () => onClick(i));
      container.appendChild(dot);
    }
  }

  /* ==========================================================
     DASHBOARD ONLY — Container 1: auto-rotating carousel
     ========================================================== */
  const track1 = document.getElementById('carousel1Track');
  const dots1 = document.getElementById('carousel1Dots');
  if (track1 && dots1) {
    const slides1 = track1.children.length;
    let index1 = 0;
    let auto1Timer;
    function goTo1(i) {
      index1 = (i + slides1) % slides1;
      track1.style.transform = `translateX(-${index1 * 100}%)`;
      buildDots(dots1, slides1, index1, (n) => { goTo1(n); resetAuto1(); });
    }
    function resetAuto1() {
      clearInterval(auto1Timer);
      auto1Timer = setInterval(() => goTo1(index1 + 1), 4500);
    }
    goTo1(0);
    resetAuto1();
    const carousel1El = document.getElementById('carousel1');
    if (carousel1El) {
      carousel1El.addEventListener('mouseenter', () => clearInterval(auto1Timer));
      carousel1El.addEventListener('mouseleave', resetAuto1);
    }
  }

  /* ==========================================================
     DASHBOARD ONLY — Container 3: manual arrow slider
     ========================================================== */
  const updatesTrack = document.getElementById('updatesTrack');
  const updatesDots = document.getElementById('updatesDots');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (updatesTrack && updatesDots && prevBtn && nextBtn) {
    const updatesCount = updatesTrack.children.length;
    let updatesIndex = 0;
    function goToUpdate(i) {
      updatesIndex = (i + updatesCount) % updatesCount;
      updatesTrack.style.transform = `translateX(-${updatesIndex * 100}%)`;
      buildDots(updatesDots, updatesCount, updatesIndex, goToUpdate);
    }
    prevBtn.addEventListener('click', () => goToUpdate(updatesIndex - 1));
    nextBtn.addEventListener('click', () => goToUpdate(updatesIndex + 1));
    goToUpdate(0);
  }

  /* ==========================================================
     DASHBOARD ONLY — Container 5: two action buttons
     ========================================================== */
  const btnA = document.getElementById('btnA');
  const btnB = document.getElementById('btnB');
  const leaveRequestModal = document.getElementById('leaveRequestModal');
  const ticketRequestModal = document.getElementById('ticketRequestModal');
  const leaveRequestForm = document.getElementById('leaveRequestForm');
  const ticketRequestForm = document.getElementById('ticketRequestForm');
  const leaveCloseModal = document.getElementById('leaveCloseModal');
  const leaveCancelModal = document.getElementById('leaveCancelModal');
  const ticketCloseModal = document.getElementById('ticketCloseModal');
  const ticketCancelModal = document.getElementById('ticketCancelModal');

  function setActiveQuickAction(activeButton) {
    const isLeave = activeButton === btnA;
    btnA.classList.toggle('btn-a', isLeave);
    btnA.classList.toggle('btn-b', !isLeave);
    btnB.classList.toggle('btn-a', !isLeave);
    btnB.classList.toggle('btn-b', isLeave);
    btnA.setAttribute('aria-pressed', String(isLeave));
    btnB.setAttribute('aria-pressed', String(!isLeave));
  }

  if (btnA && btnB) {
    setActiveQuickAction(btnA);

    btnA.addEventListener('click', () => {
      setActiveQuickAction(btnA);
      if (leaveRequestModal) leaveRequestModal.classList.add('show');
      if (ticketRequestModal) ticketRequestModal.classList.remove('show');
    });

    btnB.addEventListener('click', () => {
      setActiveQuickAction(btnB);
      if (ticketRequestModal) ticketRequestModal.classList.add('show');
      if (leaveRequestModal) leaveRequestModal.classList.remove('show');
      showToast('Ticket form ready — describe the issue below to notify IT Support.');
    });
  }

  if (leaveCloseModal && leaveRequestModal) {
    leaveCloseModal.addEventListener('click', () => leaveRequestModal.classList.remove('show'));
  }

  if (leaveCancelModal && leaveRequestModal) {
    leaveCancelModal.addEventListener('click', () => leaveRequestModal.classList.remove('show'));
  }

  if (ticketCloseModal && ticketRequestModal) {
    ticketCloseModal.addEventListener('click', () => ticketRequestModal.classList.remove('show'));
  }

  if (ticketCancelModal && ticketRequestModal) {
    ticketCancelModal.addEventListener('click', () => ticketRequestModal.classList.remove('show'));
  }

  if (leaveRequestForm && leaveRequestModal) {
    leaveRequestForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const leaveType = document.getElementById('leaveType')?.value?.trim() || 'Leave';
      const fromDate = document.getElementById('leaveFromDate')?.value;
      const toDate = document.getElementById('leaveToDate')?.value;
      const reason = document.getElementById('leaveReason')?.value?.trim() || 'No reason provided';

      showToast(`${leaveType} requested for ${fromDate || 'selected dates'}${toDate ? ` to ${toDate}` : ''} — pending approval.`);

      leaveRequestForm.reset();
      leaveRequestModal.classList.remove('show');
      bumpPendingBadge(1);
    });
  }

  if (ticketRequestForm && ticketRequestModal) {
    ticketRequestForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const ticketType = document.getElementById('ticketType')?.value?.trim() || 'Ticket';
      const ticketSubject = document.getElementById('ticketSubject')?.value?.trim() || 'Untitled';

      showToast(`${ticketType} ticket raised: "${ticketSubject}". IT Support has been notified.`);

      ticketRequestForm.reset();
      ticketRequestModal.classList.remove('show');
    });
  }

  window.addEventListener('click', (e) => {
    if (leaveRequestModal && e.target === leaveRequestModal) {
      leaveRequestModal.classList.remove('show');
    }
    if (ticketRequestModal && e.target === ticketRequestModal) {
      ticketRequestModal.classList.remove('show');
    }
  });

  /* ==========================================================
     DASHBOARD ONLY — Container 4: real "days away" holiday countdown
     ========================================================== */
  document.querySelectorAll('.holiday-row[data-date]').forEach(row => {
    const target = new Date(row.dataset.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysAway = Math.round((target - today) / 86400000);
    const chip = document.createElement('span');
    chip.className = 'holiday-countdown';
    chip.textContent = daysAway <= 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `in ${daysAway}d`;
    row.appendChild(chip);
  });

  /* ---------- "Today at a glance" — live-feeling relative timestamp ---------- */
  const footnote = document.getElementById('glanceFootnote');
  if (footnote) {
    const start = Date.now();
    const render = () => {
      const mins = Math.floor((Date.now() - start) / 60000);
      footnote.textContent = mins < 1 ? 'Updated just now' : `Updated ${mins} minute${mins === 1 ? '' : 's'} ago`;
    };
    render();
    setInterval(render, 30000);
  }

  /* ==========================================================
     DASHBOARD ONLY — Container 6: fade spotlight
     ========================================================== */
  const spotlightSlides = document.querySelectorAll('.spotlight-slide');
  const spotlightDots = document.getElementById('spotlightDots');
  if (spotlightSlides.length && spotlightDots) {
    let spotlightIndex = 0;
    function goToSpotlight(i) {
      spotlightIndex = (i + spotlightSlides.length) % spotlightSlides.length;
      spotlightSlides.forEach((s, n) => s.classList.toggle('is-active', n === spotlightIndex));
      buildDots(spotlightDots, spotlightSlides.length, spotlightIndex, goToSpotlight);
    }
    goToSpotlight(0);
    setInterval(() => goToSpotlight(spotlightIndex + 1), 5000);
  }

  /* ==========================================================
     REQUESTS PAGE — filter tabs + new request panel
     ========================================================== */
  const filterTabs = document.getElementById('filterTabs');
  const requestList = document.getElementById('requestList');
  const emptyState = document.getElementById('emptyState');
  if (filterTabs && requestList) {
    filterTabs.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        const filter = tab.dataset.filter;
        let visibleCount = 0;
        requestList.querySelectorAll('.request-row').forEach(row => {
          const show = filter === 'all' || row.dataset.status === filter;
          row.style.display = show ? 'flex' : 'none';
          if (show) visibleCount++;
        });
        if (emptyState) emptyState.hidden = visibleCount !== 0;
      });
    });
  }

  const newRequestBtn = document.getElementById('newRequestBtn');
  const newRequestModal = document.getElementById('newRequestModal');
  const closeModal = document.getElementById('closeModal');
  const cancelModal = document.getElementById('cancelModal');
  const requestForm = document.getElementById('requestForm');

  if (newRequestBtn && newRequestModal) {
    newRequestBtn.addEventListener('click', () => {
      newRequestModal.classList.add('show');
    });
  }

  if (closeModal && newRequestModal) {
    closeModal.addEventListener('click', () => {
      newRequestModal.classList.remove('show');
    });
  }

  if (cancelModal && newRequestModal) {
    cancelModal.addEventListener('click', () => {
      newRequestModal.classList.remove('show');
    });
  }

  if (requestForm && requestList && filterTabs) {
    requestForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const requestType = document.getElementById('requestType')?.value?.trim() || 'New Request';
      const fromDate = document.getElementById('fromDate')?.value;
      const toDate = document.getElementById('toDate')?.value;
      const reason = document.getElementById('reason')?.value?.trim() || '';

      const parseDate = (value) => {
        if (!value) return '';
        const date = new Date(value + 'T00:00:00');
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      };

      const fromLabel = parseDate(fromDate);
      const toLabel = parseDate(toDate);
      const requestLine = fromDate && toDate
        ? `${fromLabel} – ${toLabel}`
        : fromLabel || 'Date pending';

      const iconClass = requestType.includes('Leave') ? 'request-icon--indigo'
        : requestType.includes('Work From Home') ? 'request-icon--teal'
        : requestType.includes('Travel') ? 'request-icon--amber'
        : 'request-icon--rose';

      // Simple generic document/request glyph — reused for any request type
      // added at runtime so we never depend on an external icon CDN.
      const iconSvg = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 3.5h6l4 4V20a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M14 3.5V8h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M9.5 12h5M9.5 15.5h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>`;

      const row = document.createElement('div');
      row.className = 'request-row';
      row.dataset.status = 'pending';
      row.innerHTML = `
        <div class="request-icon ${iconClass}">${iconSvg}</div>
        <div class="request-info">
          <h4>${requestType}</h4>
          <p>${reason ? `${requestLine} · ${reason}` : requestLine}</p>
        </div>
        <span class="status-badge status-badge--pending">Pending</span>
      `;

      requestList.prepend(row);
      requestForm.reset();

      const activeFilter = filterTabs.querySelector('.filter-tab.is-active')?.dataset.filter || 'all';
      row.style.display = activeFilter === 'all' || activeFilter === 'pending' ? 'flex' : 'none';

      if (newRequestModal) newRequestModal.classList.remove('show');
      if (emptyState) emptyState.hidden = true;

      showToast(`${requestType} request submitted — awaiting approval.`);
      bumpPendingBadge(1);
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === newRequestModal) {
      newRequestModal.classList.remove('show');
    }
  });

  /* ==========================================================
     DOCUMENTS PAGE — search filter + download feedback
     ========================================================== */
  const docSearch = document.getElementById('docSearch');
  const docGrid = document.getElementById('docGrid') || document.querySelector('.doc-grid');
  const docEmptyState = document.getElementById('docEmptyState');
  const docResultsCount = document.getElementById('docResultsCount');
  const docNounLabel = document.body.contains(document.getElementById('newFormRequestBtn')) ? 'forms' : 'documents';
  if (docSearch && docGrid) {
    const allDocCards = () => document.querySelectorAll('.doc-card');
    const allDocGrids = () => document.querySelectorAll('.doc-grid');
    const totalDocs = allDocCards().length;
    let docDebounce;
    docSearch.addEventListener('input', () => {
      clearTimeout(docDebounce);
      docDebounce = setTimeout(() => {
        const q = docSearch.value.trim().toLowerCase();
        let visibleCount = 0;
        allDocCards().forEach(card => {
          const match = card.dataset.name.includes(q);
          card.style.display = match ? '' : 'none';
          if (match) visibleCount++;
        });
        // Hide a whole section title if every card in that grid is filtered out.
        allDocGrids().forEach(grid => {
          const anyVisible = Array.from(grid.querySelectorAll('.doc-card')).some(c => c.style.display !== 'none');
          const heading = grid.previousElementSibling;
          if (heading && heading.classList && heading.classList.contains('forms-section-title')) {
            heading.style.display = anyVisible ? '' : 'none';
          }
          grid.style.display = anyVisible ? '' : 'none';
        });
        if (docEmptyState) docEmptyState.hidden = visibleCount !== 0;
        if (docResultsCount) {
          docResultsCount.textContent = q
            ? `${visibleCount} of ${totalDocs} ${docNounLabel}`
            : `${totalDocs} ${docNounLabel}`;
        }
      }, 180);
    });
    document.querySelectorAll('.doc-download').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.doc-card');
        const docName = card?.querySelector('h4')?.textContent || 'Document';
        const original = btn.textContent;
        btn.textContent = 'Preparing…';
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = original;
          btn.disabled = false;
          showToast(`${docName} downloaded.`);
        }, 1100);
      });
    });
  }

  /* ==========================================================
     DIRECTORY PAGE — search filter + message feedback
     ========================================================== */
  const directorySearch = document.getElementById('directorySearch');
  const directoryList = document.getElementById('directoryList');
  const directoryEmptyState = document.getElementById('directoryEmptyState');
  const dirResultsCount = document.getElementById('dirResultsCount');
  if (directorySearch && directoryList) {
    const totalPeople = directoryList.querySelectorAll('.directory-row').length;
    let dirDebounce;
    directorySearch.addEventListener('input', () => {
      clearTimeout(dirDebounce);
      dirDebounce = setTimeout(() => {
        const q = directorySearch.value.trim().toLowerCase();
        let visibleCount = 0;
        directoryList.querySelectorAll('.directory-row').forEach(row => {
          const match = row.dataset.name.includes(q);
          row.style.display = match ? 'flex' : 'none';
          if (match) visibleCount++;
        });
        if (directoryEmptyState) directoryEmptyState.hidden = visibleCount !== 0;
        if (dirResultsCount) {
          dirResultsCount.textContent = q
            ? `${visibleCount} of ${totalPeople} people`
            : `${totalPeople} people`;
        }
      }, 180);
    });
    directoryList.querySelectorAll('.dir-message-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.directory-row');
        const avatarEl = row.querySelector('.directory-avatar');
        openChatWindow({
          id: row.dataset.name,
          name: row.querySelector('h4')?.textContent || 'Colleague',
          role: row.querySelector('p')?.textContent || '',
          avatarHTML: avatarEl.innerHTML,
          avatarStyle: avatarEl.getAttribute('style') || ''
        });
      });
    });
  }

  /* ==========================================================
     FLOATING CHAT POPUPS (Directory — Message action)
     ========================================================== */
  const chatDock = document.getElementById('chatDock');
  const openChats = new Map(); // id -> { el, messages, hasGreeted }
  const MAX_OPEN_CHATS = 3;

  const greetings = [
    "Hey! What's up?",
    "Hi there — got a sec to chat?",
    "Hello! How can I help?",
    "Hey, saw your message come through 👋"
  ];
  const autoReplies = [
    "Got it, thanks for the heads up!",
    "Sure, I can take a look this afternoon.",
    "Makes sense — let's sync after standup.",
    "On it! I'll follow up shortly.",
    "Thanks! I'll loop in the team.",
    "Sounds good, appreciate you flagging it."
  ];
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function timeNow() {
    return new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }

  function openChatWindow(person) {
    if (!chatDock) return;

    // Already open — just un-minimize and focus it.
    if (openChats.has(person.id)) {
      const existing = openChats.get(person.id);
      existing.el.classList.remove('is-minimized');
      existing.el.querySelector('textarea')?.focus();
      return;
    }

    // Cap simultaneous windows like a real chat dock — close the oldest.
    if (openChats.size >= MAX_OPEN_CHATS) {
      const oldestId = openChats.keys().next().value;
      closeChatWindow(oldestId);
    }

    const firstName = person.name.split(' ')[0];
    const el = document.createElement('div');
    el.className = 'chat-window';
    el.innerHTML = `
      <div class="chat-window-header" data-role="header">
        <div class="chat-window-avatar" style="${person.avatarStyle}">${person.avatarHTML}</div>
        <div class="chat-window-who">
          <h5>${person.name}</h5>
          <span class="chat-window-status">Active now</span>
        </div>
        <div class="chat-window-controls">
          <button type="button" class="chat-window-minimize" aria-label="Minimize">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 15l6-6 6 6"/></svg>
          </button>
          <button type="button" class="chat-window-close" aria-label="Close">&times;</button>
        </div>
      </div>
      <div class="chat-window-body"></div>
      <div class="chat-window-typing" hidden><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
      <div class="chat-window-input-row">
        <textarea rows="1" placeholder="Message ${firstName}…"></textarea>
        <button type="button" class="chat-window-send" aria-label="Send">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7Z"/></svg>
        </button>
      </div>
    `;
    chatDock.prepend(el);

    const body = el.querySelector('.chat-window-body');
    const typingIndicator = el.querySelector('.chat-window-typing');
    const textarea = el.querySelector('textarea');

    function addMessage(text, kind) {
      const msg = document.createElement('div');
      msg.className = `chat-msg ${kind}`;
      msg.textContent = text;
      const time = document.createElement('div');
      time.className = `chat-msg-time ${kind}`;
      time.textContent = timeNow();
      body.appendChild(msg);
      body.appendChild(time);
      body.scrollTop = body.scrollHeight;
    }

    // Opening greeting from the colleague, so the window doesn't open empty.
    addMessage(pick(greetings), 'received');

    function sendReplyAfterDelay() {
      typingIndicator.hidden = false;
      body.scrollTop = body.scrollHeight;
      setTimeout(() => {
        typingIndicator.hidden = true;
        addMessage(pick(autoReplies), 'received');
      }, 1100 + Math.random() * 900);
    }

    function handleSend() {
      const text = textarea.value.trim();
      if (!text) return;
      addMessage(text, 'sent');
      textarea.value = '';
      textarea.style.height = 'auto';
      sendReplyAfterDelay();
    }

    el.querySelector('.chat-window-send').addEventListener('click', handleSend);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 70) + 'px';
    });

    el.querySelector('.chat-window-minimize').addEventListener('click', (e) => {
      e.stopPropagation();
      el.classList.toggle('is-minimized');
    });
    el.querySelector('[data-role="header"]').addEventListener('click', () => {
      el.classList.toggle('is-minimized');
    });
    el.querySelector('.chat-window-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeChatWindow(person.id);
    });

    openChats.set(person.id, { el });
    textarea.focus();
  }

  function closeChatWindow(id) {
    const entry = openChats.get(id);
    if (!entry) return;
    entry.el.remove();
    openChats.delete(id);
  }

  /* ==========================================================
     SETTINGS PAGE — save form + toggle switches
     ========================================================== */
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Profile changes saved successfully.');
    });
  }
  document.querySelectorAll('.toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const isOn = toggle.classList.toggle('is-on');
      toggle.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    });
  });

  /* =======================================================
     EXTRA FEATURES — Shortcuts strip + Calendar widget
     ======================================================= */

  // Shortcuts strip: buttons with data-open-modal reuse the existing
  // leave / ticket request modals already wired up above.
  document.querySelectorAll('.shortcut-tile[data-open-modal]').forEach(tile => {
    tile.addEventListener('click', () => {
      const modalId = tile.getAttribute('data-open-modal');
      const modal = document.getElementById(modalId);
      if (!modal) return;
      document.querySelectorAll('.request-modal').forEach(m => m.classList.remove('show'));
      modal.classList.add('show');
    });
  });

  // Mini calendar widget — renders a navigable month view with
  // colour-coded event dots (Annual Leave / Unplanned Leave / Holiday /
  // Sick Leave), similar to the reference ESS dashboard.
  const calendarGrid = document.getElementById('calendarGrid');
  const calMonthLabel = document.getElementById('calMonthLabel');
  const calPrevBtn = document.getElementById('calPrev');
  const calNextBtn = document.getElementById('calNext');
  const calTodayBtn = document.getElementById('calToday');

  if (calendarGrid) {
    const today = new Date();
    let viewYear = today.getFullYear();
    let viewMonth = today.getMonth();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    // Sample event data — swap for real data from your backend.
    // key: day-of-month (only applied to the current real month), value: legend colour
    const sampleEvents = { 5: 'teal', 12: 'indigo', 18: 'amber', 24: 'rose' };

    function renderCalendar() {
      if (calMonthLabel) calMonthLabel.textContent = `${monthNames[viewMonth]} ${viewYear}`;

      const firstDay = new Date(viewYear, viewMonth, 1).getDay();
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

      const dows = ['S','M','T','W','T','F','S'];
      let html = dows.map(d => `<span class="cal-dow">${d}</span>`).join('');

      for (let i = 0; i < firstDay; i++) {
        html += `<span class="cal-day is-blank"></span>`;
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const isToday = isCurrentMonth && day === today.getDate();
        const eventColor = isCurrentMonth ? sampleEvents[day] : null;
        const style = eventColor ? ` style="--event-color:var(--${eventColor})"` : '';
        html += `<span class="cal-day${isToday ? ' is-today' : ''}${eventColor ? ' has-event' : ''}"${style}>${day}</span>`;
      }
      calendarGrid.innerHTML = html;
    }

    if (calPrevBtn) calPrevBtn.addEventListener('click', () => {
      viewMonth -= 1;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      renderCalendar();
    });
    if (calNextBtn) calNextBtn.addEventListener('click', () => {
      viewMonth += 1;
      if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
      renderCalendar();
    });
    if (calTodayBtn) calTodayBtn.addEventListener('click', () => {
      viewYear = today.getFullYear();
      viewMonth = today.getMonth();
      renderCalendar();
    });

    renderCalendar();
  }

  /* ==========================================================
     TIMESHEETS PAGE — live total, week nav, submit for approval
     ========================================================== */
  const timesheetTable = document.getElementById('timesheetTable');
  const tsTotalCell = document.getElementById('tsTotalHours');
  const timesheetForm = document.getElementById('timesheetForm');
  const tsHistoryBody = document.getElementById('tsHistoryBody');
  const tsWeekLabel = document.getElementById('tsWeekLabel');
  const tsSaveDraftBtn = document.getElementById('tsSaveDraft');

  if (timesheetTable && tsTotalCell) {
    const hourInputs = () => Array.from(timesheetTable.querySelectorAll('input[type="number"]'));

    const tsStatThisWeek = document.getElementById('statThisWeek');
    function recalcTimesheetTotal() {
      const total = hourInputs().reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);
      tsTotalCell.textContent = total.toFixed(1) + ' hrs';
      if (tsStatThisWeek) tsStatThisWeek.textContent = total.toFixed(1) + ' hrs';
    }
    hourInputs().forEach(input => input.addEventListener('input', recalcTimesheetTotal));
    recalcTimesheetTotal();

    if (tsSaveDraftBtn) {
      tsSaveDraftBtn.addEventListener('click', () => {
        showToast('Timesheet saved as draft.');
      });
    }

    if (timesheetForm) {
      timesheetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const total = hourInputs().reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);
        if (total <= 0) {
          showToast('Add at least a few hours before submitting.', 'error');
          return;
        }
        const weekLabel = tsWeekLabel ? tsWeekLabel.textContent : 'This week';

        if (tsHistoryBody) {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td class="dt-primary">${weekLabel}</td>
            <td>${total.toFixed(1)} hrs</td>
            <td>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
            <td><span class="status-badge status-badge--pending">Pending</span></td>
          `;
          tsHistoryBody.prepend(row);
        }
        showToast(`Timesheet for ${weekLabel} submitted — awaiting manager approval.`);
        bumpPendingBadge(1);
      });
    }
  }

  /* ==========================================================
     CHECKLISTS PAGE — check off items, live progress bars
     ========================================================== */
  document.querySelectorAll('.checklist-card').forEach(card => {
    const items = Array.from(card.querySelectorAll('.checklist-item'));
    const fill = card.querySelector('.progress-fill');
    const metaDone = card.querySelector('.progress-meta-done');
    const badge = card.querySelector('.checklist-status-badge');
    if (!items.length) return;

    function updateProgress() {
      const doneCount = items.filter(i => i.classList.contains('is-done')).length;
      const pct = Math.round((doneCount / items.length) * 100);
      if (fill) {
        fill.style.width = pct + '%';
        fill.classList.toggle('is-complete', pct === 100);
      }
      if (metaDone) metaDone.textContent = `${doneCount} of ${items.length} complete`;
      if (badge) {
        if (pct === 100) {
          badge.textContent = 'Completed';
          badge.className = 'status-badge status-badge--approved checklist-status-badge';
        } else if (doneCount === 0) {
          badge.textContent = 'Not started';
          badge.className = 'status-badge status-badge--pending checklist-status-badge';
        } else {
          badge.textContent = 'In progress';
          badge.className = 'status-badge status-badge--pending checklist-status-badge';
        }
      }
    }

    items.forEach(item => {
      item.addEventListener('click', () => {
        const wasComplete = items.every(i => i.classList.contains('is-done'));
        item.classList.toggle('is-done');
        updateProgress();
        const nowComplete = items.every(i => i.classList.contains('is-done'));
        if (nowComplete && !wasComplete) {
          showToast(`"${card.querySelector('h4')?.textContent}" checklist completed 🎉`);
        }
      });
    });

    updateProgress();
  });

  /* ==========================================================
     EXPENSES PAGE — filter tabs, new claim modal, live totals
     ========================================================== */
  const expenseFilterTabs = document.getElementById('expenseFilterTabs');
  const expenseList = document.getElementById('expenseList');
  const expenseEmptyState = document.getElementById('expenseEmptyState');

  if (expenseFilterTabs && expenseList) {
    expenseFilterTabs.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        expenseFilterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        const filter = tab.dataset.filter;
        let visibleCount = 0;
        expenseList.querySelectorAll('.request-row').forEach(row => {
          const show = filter === 'all' || row.dataset.status === filter;
          row.style.display = show ? 'flex' : 'none';
          if (show) visibleCount++;
        });
        if (expenseEmptyState) expenseEmptyState.hidden = visibleCount !== 0;
      });
    });
  }

  const newExpenseBtn = document.getElementById('newExpenseBtn');
  const expenseModal = document.getElementById('expenseModal');
  const expenseCloseModal = document.getElementById('expenseCloseModal');
  const expenseCancelModal = document.getElementById('expenseCancelModal');
  const expenseForm = document.getElementById('expenseForm');
  const expenseFileInput = document.getElementById('expenseFile');
  const expenseFileDrop = document.getElementById('expenseFileDrop');
  const expenseFileName = document.getElementById('expenseFileName');

  if (newExpenseBtn && expenseModal) {
    newExpenseBtn.addEventListener('click', () => expenseModal.classList.add('show'));
  }
  if (expenseCloseModal && expenseModal) {
    expenseCloseModal.addEventListener('click', () => expenseModal.classList.remove('show'));
  }
  if (expenseCancelModal && expenseModal) {
    expenseCancelModal.addEventListener('click', () => expenseModal.classList.remove('show'));
  }
  window.addEventListener('click', (e) => {
    if (expenseModal && e.target === expenseModal) expenseModal.classList.remove('show');
  });
  if (expenseFileDrop && expenseFileInput) {
    expenseFileDrop.addEventListener('click', () => expenseFileInput.click());
    expenseFileInput.addEventListener('change', () => {
      if (expenseFileInput.files.length && expenseFileName) {
        expenseFileName.textContent = expenseFileInput.files[0].name;
        expenseFileName.hidden = false;
      }
    });
  }

  if (expenseForm && expenseList) {
    expenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const category = document.getElementById('expenseCategory')?.value || 'Other';
      const amount = parseFloat(document.getElementById('expenseAmount')?.value) || 0;
      const date = document.getElementById('expenseDate')?.value;
      const desc = document.getElementById('expenseDescription')?.value?.trim() || 'No description provided';

      const dateLabel = date
        ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Date pending';

      const catMap = {
        'Travel': 'travel', 'Meals & Entertainment': 'meals',
        'Office Supplies': 'supplies', 'Software & Subscriptions': 'software'
      };
      const catKey = catMap[category] || 'travel';
      const iconSvgMap = {
        travel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16.5 9 8l3 2 3-5 5 11.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 16.5h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
        meals: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5v7a2.5 2.5 0 0 0 5 0v-7M9.5 10.5V20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M16.5 3.5c-1.4 0-2.5 2-2.5 5s1.1 4.6 2.5 4.6V20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        supplies: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
        software: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 20h6M12 17v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
      };

      const row = document.createElement('div');
      row.className = 'request-row';
      row.dataset.status = 'pending';
      row.innerHTML = `
        <div class="request-icon expense-cat-icon--${catKey}">${iconSvgMap[catKey]}</div>
        <div class="request-info">
          <h4>${category}</h4>
          <p>${dateLabel} · ${desc}</p>
        </div>
        <div class="expense-row-meta">
          <span class="expense-amount">₹${amount.toLocaleString('en-IN')}</span>
          <span class="status-badge status-badge--pending">Pending</span>
        </div>
      `;
      expenseList.prepend(row);
      expenseForm.reset();
      if (expenseFileName) { expenseFileName.hidden = true; expenseFileName.textContent = ''; }

      const activeFilter = expenseFilterTabs?.querySelector('.filter-tab.is-active')?.dataset.filter || 'all';
      row.style.display = activeFilter === 'all' || activeFilter === 'pending' ? 'flex' : 'none';
      if (expenseEmptyState) expenseEmptyState.hidden = true;

      expenseModal.classList.remove('show');
      showToast(`${category} claim for ₹${amount.toLocaleString('en-IN')} submitted for reimbursement.`);
    });
  }

  /* ==========================================================
     FORMS PAGE — request-a-form modal (IT/HR/Finance custom forms)
     ========================================================== */
  const newFormBtn = document.getElementById('newFormRequestBtn');
  const formRequestModal = document.getElementById('formRequestModal');
  const formRequestClose = document.getElementById('formRequestCloseModal');
  const formRequestCancel = document.getElementById('formRequestCancelModal');
  const formRequestForm = document.getElementById('formRequestForm');

  if (newFormBtn && formRequestModal) {
    newFormBtn.addEventListener('click', () => formRequestModal.classList.add('show'));
  }
  if (formRequestClose && formRequestModal) {
    formRequestClose.addEventListener('click', () => formRequestModal.classList.remove('show'));
  }
  if (formRequestCancel && formRequestModal) {
    formRequestCancel.addEventListener('click', () => formRequestModal.classList.remove('show'));
  }
  window.addEventListener('click', (e) => {
    if (formRequestModal && e.target === formRequestModal) formRequestModal.classList.remove('show');
  });
  if (formRequestForm) {
    formRequestForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const which = document.getElementById('formRequestType')?.value || 'Form';
      showToast(`Request sent — a custom "${which}" will be emailed to you shortly.`);
      formRequestForm.reset();
      formRequestModal.classList.remove('show');
    });
  }

});