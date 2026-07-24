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
    const label = requestsSideLink.textContent.trim();
    requestsSideLink.innerHTML = `<span class="side-link-label">${label}</span>`;
    const badge = document.createElement('span');
    badge.className = 'nav-badge';
    badge.id = 'pendingBadge';
    requestsSideLink.appendChild(badge);

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

  /* ---------- Hamburger / off-canvas sidebar (present on every page) ---------- */
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('backdrop');

  if (hamburgerBtn && sidebar && backdrop) {
    const openSidebar = () => {
      sidebar.classList.add('is-open');
      backdrop.classList.add('is-open');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
    };
    const closeSidebar = () => {
      sidebar.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
    };
    hamburgerBtn.addEventListener('click', () => {
      sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
    });
    backdrop.addEventListener('click', closeSidebar);
    window.addEventListener('resize', () => { if (window.innerWidth > 768) closeSidebar(); });
  }

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
  const docGrid = document.getElementById('docGrid');
  const docEmptyState = document.getElementById('docEmptyState');
  const docResultsCount = document.getElementById('docResultsCount');
  if (docSearch && docGrid) {
    const totalDocs = docGrid.querySelectorAll('.doc-card').length;
    let docDebounce;
    docSearch.addEventListener('input', () => {
      clearTimeout(docDebounce);
      docDebounce = setTimeout(() => {
        const q = docSearch.value.trim().toLowerCase();
        let visibleCount = 0;
        docGrid.querySelectorAll('.doc-card').forEach(card => {
          const match = card.dataset.name.includes(q);
          card.style.display = match ? '' : 'none';
          if (match) visibleCount++;
        });
        if (docEmptyState) docEmptyState.hidden = visibleCount !== 0;
        if (docResultsCount) {
          docResultsCount.textContent = q
            ? `${visibleCount} of ${totalDocs} documents`
            : `${totalDocs} documents`;
        }
      }, 180);
    });
    docGrid.querySelectorAll('.doc-download').forEach(btn => {
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


});