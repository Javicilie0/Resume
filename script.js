(() => {
  const trap     = document.getElementById('trap');
  const btnYes   = document.getElementById('btnYes');
  const btnNo    = document.getElementById('btnNo');
  const result   = document.getElementById('trapResult');
  const navBtns  = document.querySelectorAll('.nav-btn');
  const pages    = document.querySelectorAll('.page');
  const jumpBtns = document.querySelectorAll('[data-jump]');
  const workBtn  = document.querySelector('.nav-btn[data-section="work"]');

  let trapPassed = false;   // user has cleared the hire-me gate
  let pendingNav = null;    // section the user was trying to reach
  let swapping   = false;

  // ---- Sidebar navigation (hash-based routing)
  const VALID  = ['about', 'work', 'contact'];
  const TITLES = {
    about:   'About · Aykan Nedzhibov',
    work:    'Work · Aykan Nedzhibov',
    contact: 'Contact · Aykan Nedzhibov',
  };

  function showSection(target) {
    if (!VALID.includes(target)) target = 'about';
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.section === target));
    pages.forEach(p => {
      const isActive = p.dataset.section === target;
      p.classList.toggle('active', isActive);
      if (isActive) p.scrollTop = 0;
    });
    document.title = TITLES[target];
  }

  function setHash(target) {
    if (location.hash !== `#${target}`) {
      location.hash = target;          // triggers hashchange → showSection
    } else {
      showSection(target);             // hash unchanged, manually apply
    }
  }

  function requestNavigate(target) {
    // The trap ONLY fires for Work. About and Contact are always free.
    if (!trapPassed && target === 'work') {
      pendingNav = target;
      showTrap();
      return;
    }
    setHash(target);
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => requestNavigate(btn.dataset.section));
  });
  jumpBtns.forEach(btn => {
    btn.addEventListener('click', () => requestNavigate(btn.dataset.jump));
  });

  // React to back/forward and direct hash edits
  window.addEventListener('hashchange', () => {
    const target = (location.hash || '#about').replace('#', '');
    if (VALID.includes(target)) showSection(target);
  });

  // Initial route — honor the hash on first load, defaulting to About
  (function initRoute() {
    const hash = (location.hash || '').replace('#', '');
    showSection('about');
    if (!location.hash) history.replaceState(null, '', '#about');
    if (hash === 'work' || hash === 'contact') {
      setTimeout(() => requestNavigate(hash), 350);
    }
  })();

  // ---- The Trap
  function showTrap() {
    trap.classList.add('active');
    trap.setAttribute('aria-hidden', 'false');
  }

  function dismissTrap(message) {
    trapPassed = true;
    result.textContent = message;
    result.classList.add('show');

    // Remove the lock badge on the Work button
    if (workBtn) {
      workBtn.classList.remove('nav-locked');
      workBtn.setAttribute('aria-label', 'Work');
      const tip = workBtn.querySelector('.nav-tooltip');
      if (tip) tip.textContent = 'Work';
    }

    setTimeout(() => {
      trap.classList.remove('active');
      trap.setAttribute('aria-hidden', 'true');
      if (pendingNav) {
        setHash(pendingNav);
        pendingNav = null;
      }
    }, 950);
  }

  function handleYes() {
    if (swapping) return;
    btnYes.disabled = true;
    btnNo.disabled  = true;
    dismissTrap('Hired. Welcome aboard.');
  }

  function handleNo() {
    if (swapping) return;
    swapping = true;

    const yesRect = btnYes.getBoundingClientRect();
    const noRect  = btnNo.getBoundingClientRect();
    const dx      = noRect.left - yesRect.left;

    try {
      const lockPromise = document.body.requestPointerLock({ unadjustedMovement: false });
      if (lockPromise && typeof lockPromise.catch === 'function') {
        lockPromise.catch(() => {});
      }
    } catch (_) {}

    result.textContent = '…';
    result.classList.add('show');

    btnYes.classList.add('swapping');
    btnNo.classList.add('swapping');

    btnYes.style.transform = `translateX(${dx}px)`;
    btnNo.style.transform  = `translateX(${-dx}px)`;

    setTimeout(() => {
      try { document.exitPointerLock(); } catch (_) {}
      swapping = false;
      btnYes.disabled = true;
      btnNo.disabled  = true;
      dismissTrap('Knew it. Welcome aboard.');
    }, 720);
  }

  btnYes.addEventListener('click', handleYes);
  btnNo.addEventListener('click',  handleNo);

  // ---- Cursor-reactive background ----
  // Shapes drift away from the cursor when it gets close, and a soft glow
  // follows the mouse with a lag for a playful feel.
  const shapes      = document.querySelectorAll('.shape');
  const cursorGlow  = document.getElementById('cursorGlow');
  const cursorDot   = document.getElementById('cursorDot');

  const mouse  = { x: -9999, y: -9999 };       // raw mouse
  const glow   = { x: -9999, y: -9999 };       // lerped — for the soft halo
  const dot    = { x: -9999, y: -9999 };       // lerped tighter — for the dot
  const REPEL_RADIUS = 220;                    // px — how close before shapes react
  const REPEL_STRENGTH = 70;                   // max push distance in px

  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (cursorGlow && !cursorGlow.classList.contains('active')) {
      cursorGlow.classList.add('active');
      cursorDot.classList.add('active');
    }
  }
  function onMouseLeave() {
    mouse.x = -9999;
    mouse.y = -9999;
    if (cursorGlow) {
      cursorGlow.classList.remove('active');
      cursorDot.classList.remove('active');
    }
  }
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseleave', onMouseLeave);

  // Make the custom cursor swell over interactive elements
  const interactiveSel = 'a, button, .chip, .project, .skill-group, .award-card, .lang, .edu-card, .contact-list a';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactiveSel)) {
      cursorGlow.classList.add('grow');
      cursorDot.classList.add('grow');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactiveSel)) {
      cursorGlow.classList.remove('grow');
      cursorDot.classList.remove('grow');
    }
  });

  function loop() {
    // Lerp the cursor follower (soft halo trails, dot follows tighter)
    glow.x += (mouse.x - glow.x) * 0.18;
    glow.y += (mouse.y - glow.y) * 0.18;
    dot.x  += (mouse.x - dot.x)  * 0.45;
    dot.y  += (mouse.y - dot.y)  * 0.45;

    if (cursorGlow) {
      cursorGlow.style.transform = `translate(${glow.x}px, ${glow.y}px) translate(-50%, -50%)`;
      cursorDot.style.transform  = `translate(${dot.x}px,  ${dot.y}px) translate(-50%, -50%)`;
    }

    // Push each shape away from the cursor if it's close
    shapes.forEach(shape => {
      const rect = shape.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = cx - mouse.x;
      const dy = cy - mouse.y;
      const dist = Math.hypot(dx, dy);

      if (dist < REPEL_RADIUS) {
        const force = (1 - dist / REPEL_RADIUS);
        const eased = force * force;       // soften near the edges
        const angle = Math.atan2(dy, dx);
        const ox = Math.cos(angle) * eased * REPEL_STRENGTH;
        const oy = Math.sin(angle) * eased * REPEL_STRENGTH;
        shape.style.translate = `${ox}px ${oy}px`;
      } else {
        // gently ease back to rest
        const current = shape.style.translate;
        if (current && current !== '0px 0px') {
          const parts = current.match(/-?\d+(\.\d+)?/g);
          if (parts && parts.length >= 2) {
            const x = parseFloat(parts[0]) * 0.85;
            const y = parseFloat(parts[1]) * 0.85;
            if (Math.abs(x) < 0.3 && Math.abs(y) < 0.3) {
              shape.style.translate = '';
            } else {
              shape.style.translate = `${x}px ${y}px`;
            }
          }
        }
      }
    });

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---- Contact form
  const form     = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');

  function setNote(msg, isError) {
    if (!formNote) return;
    formNote.textContent = msg;
    formNote.classList.toggle('error', !!isError);
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const fields = ['name', 'email', 'subject', 'message'];
      const values = {};
      let firstInvalid = null;

      fields.forEach(name => {
        const el = form.elements[name];
        const v  = (el.value || '').trim();
        values[name] = v;

        const bad = !v || (name === 'email' && !isValidEmail(v));
        el.classList.toggle('invalid', bad);
        if (bad && !firstInvalid) firstInvalid = el;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        setNote(firstInvalid.name === 'email' && values.email
          ? 'That email looks off — please check it.'
          : 'Please fill in every field.', true);
        return;
      }

      // Build the mailto link and open the user's email client.
      const subject = encodeURIComponent(values.subject);
      const body = encodeURIComponent(
        `Hi Aykan,\n\n${values.message}\n\n— ${values.name} (${values.email})`
      );
      const mailto = `mailto:aykannedjibovv@gmail.com?subject=${subject}&body=${body}`;

      setNote('Opening your email app…', false);
      window.location.href = mailto;
    });

    // Clear invalid state as the user types
    form.addEventListener('input', (e) => {
      if (e.target.classList.contains('invalid')) {
        e.target.classList.remove('invalid');
        setNote('', false);
      }
    });
  }
})();
