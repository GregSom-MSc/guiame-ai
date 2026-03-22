/* ============================================
   GUIAME.AI - JAVASCRIPT
   Handles interactivity for mobile menu, animations, etc.
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  initMobileMenu();
  initSmoothScroll();
});

/**
 * Initialize Mobile Menu Toggle
 */
function initMobileMenu() {
  const navToggle = document.getElementById('navToggle');
  const nav = document.querySelector('.nav');

  if (!navToggle) return;

  navToggle.addEventListener('click', function() {
    navToggle.classList.toggle('active');
    nav.classList.toggle('active');
  });

  // Close menu when a link is clicked
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      navToggle.classList.remove('active');
      nav.classList.remove('active');
    });
  });
}

/**
 * Smooth Scroll Enhancement
 */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      const target = document.querySelector(href);
      
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/**
 * Intersection Observer for Animations (for future feature cards)
 */
function initObserver() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements with animation class
  const animatedElements = document.querySelectorAll('[data-animate]');
  animatedElements.forEach(el => observer.observe(el));
}

// Call observer on load
window.addEventListener('load', initObserver);


  // Hamburger menu
document.getElementById('hamburger-btn')?.addEventListener('click', function () {
  document.getElementById('main-menu')?.classList.toggle('open');
});


// Update WhatsApp link with form data
function updateWhatsAppLink() {

  const name = document.getElementById('name')?.value;
  const email = document.getElementById('email')?.value;
  const whatsappBtn = document.getElementById('whatsapp-btn');

  if (!whatsappBtn) return;

  let message = '¡Hola, Samuel!%20Soy:%20';

  if (name || email) {
    message += '%0A';

    if (name) message += encodeURIComponent(name) + '%0A';
    if (email) message += 'Mi%20correo%20es:%20' + encodeURIComponent(email) + '%0A';
  }

  message += '¡Guiame%20ahi!';

  whatsappBtn.href = 'https://wa.me/5215513841895?text=' + message;
}


// Listeners
document.getElementById('name')?.addEventListener('input', updateWhatsAppLink);
document.getElementById('email')?.addEventListener('input', updateWhatsAppLink);

// Logo shrink on scroll (only if the element exists)
// Hero icon shrink on scroll
const heroIcon = document.querySelector('.hero-icon');

if (heroIcon) {
  const handleScroll = () => {
    if (window.scrollY > 80) {          // trigger a bit later (80px)
      heroIcon.classList.add('scrolled');
    } else {
      heroIcon.classList.remove('scrolled');
    }
  };

  handleScroll();                       // run immediately on load
  window.addEventListener('scroll', handleScroll, { passive: true });
}

// Buy Me a Coffee floating button
document.addEventListener("DOMContentLoaded", function () {
  const bmc = document.getElementById('bmc-floating');
  const closeBtn = document.getElementById('bmc-close');

  if (!bmc || !closeBtn) return;

  // Show after slight delay (elegant)
  setTimeout(() => {
    bmc.classList.add('show');
  }, 1000);

  // Close button
  closeBtn.addEventListener('click', () => {
    bmc.style.display = 'none';
  });
});