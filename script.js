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

  // ---- Sidebar navigation
  function navigate(target) {
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.section === target));
    pages.forEach(p => {
      const isActive = p.dataset.section === target;
      p.classList.toggle('active', isActive);
      if (isActive) p.scrollTop = 0;
    });
  }

  function requestNavigate(target) {
    // The trap ONLY fires for Work. About and Contact are always free.
    if (!trapPassed && target === 'work') {
      pendingNav = target;
      showTrap();
      return;
    }
    navigate(target);
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => requestNavigate(btn.dataset.section));
  });
  jumpBtns.forEach(btn => {
    btn.addEventListener('click', () => requestNavigate(btn.dataset.jump));
  });

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
        navigate(pendingNav);
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

  // ---- Parallax on the floating shapes
  const shapes = document.querySelectorAll('.shape');
  let ticking  = false;
  function applyParallax(scrollTop) {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      shapes.forEach((s, i) => {
        const speed = 0.04 + (i % 3) * 0.02;
        s.style.translate = `0 ${-scrollTop * speed}px`;
      });
      ticking = false;
    });
  }
  pages.forEach(p => {
    p.addEventListener('scroll', () => applyParallax(p.scrollTop), { passive: true });
  });

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
