(function () {
  const root = document.documentElement;
  const themeButton = document.getElementById('theme');
  const navLinks = Array.from(document.querySelectorAll('nav a'));

  /* Chuyển ngôn ngữ Việt / Anh: mỗi phần tử có data-en chứa bản tiếng Anh */
  const ARIA = {
    vi: { nav: 'Điều hướng', theme: 'Đổi giao diện sáng/tối', lang: 'Đổi ngôn ngữ sang tiếng Anh', projects: 'Dự án', portrait: 'Ảnh chân dung Thiện Anh' },
    en: { nav: 'Navigation', theme: 'Toggle light/dark theme', lang: 'Switch language to Vietnamese', projects: 'Projects', portrait: 'Portrait of Thiện Anh' }
  };
  const langButton = document.getElementById('lang');
  let currentLang = 'vi';

  document.querySelectorAll('[data-en]').forEach(function (el) {
    el.setAttribute('data-vi', el.innerHTML);
  });

  function applyLang(lang, relayout) {
    currentLang = lang;
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-en]').forEach(function (el) {
      el.innerHTML = lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-vi');
    });

    const text = ARIA[lang];
    const nav = document.querySelector('header nav');
    const projects = document.getElementById('projects');
    const portrait = document.querySelector('.portrait img');
    if (nav) { nav.setAttribute('aria-label', text.nav); }
    if (themeButton) { themeButton.setAttribute('aria-label', text.theme); }
    if (projects) { projects.setAttribute('aria-label', text.projects); }
    if (portrait) { portrait.setAttribute('alt', text.portrait); }
    if (langButton) {
      langButton.setAttribute('aria-label', text.lang);
      langButton.querySelectorAll('[data-l]').forEach(function (part) {
        part.classList.toggle('on', part.getAttribute('data-l') === lang);
      });
    }
    try {
      localStorage.setItem('lang', lang);
    } catch (error) {}
    if (relayout) {
      window.dispatchEvent(new Event('resize'));
    }
  }

  try {
    const savedLang = localStorage.getItem('lang');
    if (savedLang === 'en' || savedLang === 'vi') {
      currentLang = savedLang;
    }
  } catch (error) {}
  applyLang(currentLang, false);

  if (langButton) {
    langButton.addEventListener('click', function () {
      applyLang(currentLang === 'vi' ? 'en' : 'vi', true);
    });
  }

  /* Chưa có ảnh avatar.jpg thì hiện khung chữ cái đầu thay thế */
  document.querySelectorAll('.portrait img').forEach(function (img) {
    const showFallback = function () { img.parentNode.classList.add('empty'); };
    if (img.complete && img.naturalWidth === 0) {
      showFallback();
    } else {
      img.addEventListener('error', showFallback);
    }
  });

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {}
  }

  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      root.setAttribute('data-theme', savedTheme);
    }
  } catch (error) {}

  if (themeButton) {
    themeButton.addEventListener('click', function () {
      const currentTheme = root.getAttribute('data-theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = currentTheme === 'dark' || (!currentTheme && prefersDark);
      applyTheme(isDark ? 'light' : 'dark');
    });
  }

  if (window.IntersectionObserver) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        navLinks.forEach(function (link) {
          const href = link.getAttribute('href');
          link.classList.toggle('on', href === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    document.querySelectorAll('section[id]').forEach(function (section) {
      io.observe(section);
    });
  } else if (navLinks.length) {
    const homeLink = navLinks.find(function (link) {
      return link.getAttribute('href') === '#home';
    });

    if (homeLink) {
      homeLink.classList.add('on');
    }
  }

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Hiện dần các khối khi cuộn tới */
  if (!reduceMotion && window.IntersectionObserver) {
    const revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        const el = entry.target;
        el.classList.add('in');
        revealer.unobserve(el);
        setTimeout(function () { el.style.transitionDelay = ''; }, 1000);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    document.querySelectorAll(
      'section:not(#home) h2, section:not(#home) .lead, section:not(#home) .body, section:not(#home) .rule, .stack > div, #experience .row, .info, .mail'
    ).forEach(function (el) {
      const index = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.transitionDelay = Math.min(index * 70, 280) + 'ms';
      el.classList.add('rv');
      revealer.observe(el);
    });
  }

  /* Dải dự án tự chạy ngang, lặp vô hạn */
  const marquee = document.getElementById('projects');
  if (marquee) {
    const track = marquee.querySelector('.track');
    const originals = Array.from(track.children);
    const SPEED = 36; // px mỗi giây
    const canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    let loopW = 0;
    let pos = 0;
    let lastTime = 0;
    let paused = false;
    let visible = true;
    let resumeTimer = 0;

    function wrapPos() {
      if (pos >= 2 * loopW) {
        pos -= loopW;
      } else if (pos < loopW) {
        pos += loopW;
      }
    }

    function setup() {
      track.querySelectorAll('[data-clone]').forEach(function (node) { node.remove(); });
      loopW = 0;
      if (reduceMotion || !originals.length) {
        return;
      }
      const first = originals[0];
      const tail = originals[originals.length - 1];
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      loopW = tail.offsetLeft + tail.offsetWidth + gap - first.offsetLeft;
      if (loopW <= 0) {
        loopW = 0;
        return;
      }
      const sets = Math.ceil(marquee.clientWidth / loopW) + 2;
      for (let s = 1; s < sets; s++) {
        originals.forEach(function (el) {
          const copy = el.cloneNode(true);
          copy.setAttribute('aria-hidden', 'true');
          copy.setAttribute('tabindex', '-1');
          copy.dataset.clone = '1';
          track.appendChild(copy);
        });
      }
      pos = loopW;
      marquee.scrollLeft = pos;
    }

    function pause() {
      clearTimeout(resumeTimer);
      paused = true;
    }

    function resume(delay) {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () {
        pos = marquee.scrollLeft;
        paused = false;
      }, delay || 0);
    }

    function tick(time) {
      requestAnimationFrame(tick);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      if (paused || !visible || !loopW) {
        return;
      }
      pos += SPEED * dt;
      wrapPos();
      marquee.scrollLeft = pos;
    }

    setup();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(setup);
    }
    let resizeTimer = 0;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setup, 200);
    });

    if (reduceMotion) {
      return;
    }

    /* Người dùng cuộn tay: đồng bộ vị trí và giữ vòng lặp liền mạch */
    marquee.addEventListener('scroll', function () {
      if (!paused || !loopW) {
        return;
      }
      pos = marquee.scrollLeft;
      const before = pos;
      wrapPos();
      if (pos !== before) {
        marquee.scrollLeft = pos;
      }
    }, { passive: true });

    if (canHover) {
      marquee.addEventListener('mouseenter', pause);
      marquee.addEventListener('mouseleave', function () { resume(300); });
    }
    marquee.addEventListener('focusin', pause);
    marquee.addEventListener('focusout', function () { resume(300); });
    marquee.addEventListener('touchstart', pause, { passive: true });
    marquee.addEventListener('touchend', function () { resume(2500); }, { passive: true });
    marquee.addEventListener('touchcancel', function () { resume(2500); }, { passive: true });

    /* Kéo bằng chuột */
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;

    marquee.addEventListener('mousedown', function (event) {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      dragging = true;
      moved = false;
      startX = event.clientX;
      startScroll = marquee.scrollLeft;
      pause();
      marquee.classList.add('drag');
    });

    document.addEventListener('mousemove', function (event) {
      if (!dragging) {
        return;
      }
      const dx = event.clientX - startX;
      if (Math.abs(dx) > 5) {
        moved = true;
      }
      marquee.scrollLeft = startScroll - dx;
    });

    document.addEventListener('mouseup', function () {
      if (!dragging) {
        return;
      }
      dragging = false;
      marquee.classList.remove('drag');
      if (!marquee.matches(':hover')) {
        resume(300);
      }
    });

    marquee.addEventListener('click', function (event) {
      if (moved) {
        event.preventDefault();
        event.stopPropagation();
        moved = false;
      }
    }, true);

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }).observe(marquee);
    }

    requestAnimationFrame(tick);
  }
})();