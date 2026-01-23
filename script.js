// Smooth scroll and interactive functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add animation on scroll for member cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, observerOptions);
    
    // Observe member cards
    const memberCards = document.querySelectorAll('.member-card');
    memberCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // Observe photo sections
    const photoSections = document.querySelectorAll('.team-photo-wrapper, .robot-photo-wrapper');
    photoSections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'scale(0.95)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(section);
    });
    
    // Hide placeholders when images load successfully
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('load', function() {
            const placeholder = this.parentElement.querySelector('.photo-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        });
        img.addEventListener('error', function() {
            const placeholder = this.parentElement.querySelector('.photo-placeholder');
            if (placeholder) {
                placeholder.style.display = 'flex';
            }
            this.style.display = 'none';
        });
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
