/**
 * Мобильное меню: открытие/закрытие по кнопке и при клике по ссылке
 */
(function () {
    const toggle = document.querySelector('.navbar-toggle');
    const menu = document.querySelector('.navbar-menu');
    const links = document.querySelectorAll('.navbar-link');

    function openMenu() {
        if (!menu || !toggle) return;
        menu.classList.add('active');
        toggle.classList.add('active');
        toggle.setAttribute('aria-label', 'Закрыть меню');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        if (!menu || !toggle) return;
        menu.classList.remove('active');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-label', 'Открыть меню');
        document.body.style.overflow = '';
    }

    function toggleMenu() {
        if (menu && menu.classList.contains('active')) closeMenu();
        else openMenu();
    }

    if (toggle && menu) {
        toggle.addEventListener('click', toggleMenu);
        links.forEach(function (link) {
            link.addEventListener('click', closeMenu);
        });
        document.addEventListener('click', function (e) {
            if (menu.classList.contains('active') && !menu.contains(e.target) && !toggle.contains(e.target)) {
                closeMenu();
            }
        });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 900) closeMenu();
        });
    }
})();

/**
 * Герой-карусель: автопрокрутка
 */
(function () {
    const slides = document.querySelectorAll('.hero-carousel .carousel-slide');
    if (slides.length === 0) return;

    let currentIndex = 0;
    const intervalMs = 6000;

    function showSlide(index) {
        slides.forEach(function (slide, i) {
            slide.classList.toggle('active', i === index);
        });
        currentIndex = index;
    }

    function nextSlide() {
        const next = (currentIndex + 1) % slides.length;
        showSlide(next);
    }

    showSlide(0);
    setInterval(nextSlide, intervalMs);
})();

/**
 * Карусель участников: автопрокрутка + стрелки
 */
(function () {
    const track = document.querySelector('.team-carousel-track');
    const slides = track ? track.querySelectorAll('.team-slide') : [];
    const btnPrev = document.querySelector('.team-carousel-arrow--left');
    const btnNext = document.querySelector('.team-carousel-arrow--right');

    if (slides.length === 0) return;

    let currentIndex = 0;
    const intervalMs = 5000;
    let intervalId = null;

    function showSlide(index) {
        currentIndex = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
            slide.classList.toggle('active', i === currentIndex);
        });
    }

    function nextSlide() {
        showSlide(currentIndex + 1);
        resetInterval();
    }

    function prevSlide() {
        showSlide(currentIndex - 1);
        resetInterval();
    }

    function resetInterval() {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(nextSlide, intervalMs);
    }

    showSlide(0);
    intervalId = setInterval(nextSlide, intervalMs);

    if (btnPrev) btnPrev.addEventListener('click', prevSlide);
    if (btnNext) btnNext.addEventListener('click', nextSlide);
})();

/**
 * Подсветка заголовков: плавно 1 с появление, затем 1 с затухание (класс section-highlight)
 */
(function () {
    var sectionIds = ['about', 'team', 'robot', 'contacts'];
    var highlightVisibleMs = 800;
    var removeHighlightTimer = null;

    function applyHighlight() {
        var hash = window.location.hash.slice(1);
        if (sectionIds.indexOf(hash) === -1) return;
        var el = document.getElementById(hash);
        if (!el) return;
        if (removeHighlightTimer) clearTimeout(removeHighlightTimer);
        el.classList.add('section-highlight');
        history.replaceState(null, '', window.location.pathname + window.location.search);
        removeHighlightTimer = setTimeout(function () {
            removeHighlightTimer = null;
            el.classList.remove('section-highlight');
        }, highlightVisibleMs);
    }

    window.addEventListener('hashchange', applyHighlight);
    if (window.location.hash) applyHighlight();
})();
