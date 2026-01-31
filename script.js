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
