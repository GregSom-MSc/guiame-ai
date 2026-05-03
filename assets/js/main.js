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



document.addEventListener("DOMContentLoaded", function () {
  const PASSWORD = "Vacaoreo26";

  const gate = document.getElementById("password-gate");
  const input = document.getElementById("password-input");
  const button = document.getElementById("password-btn");
  const error = document.getElementById("error-msg");

  if (!gate) return; // only runs on walks page

  button.addEventListener("click", checkPassword);
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") checkPassword();
  });


  function checkPassword() {
    if (input.value === PASSWORD) {
      gate.style.transition = "opacity 0.4s ease";
      gate.style.opacity = "0";
      setTimeout(() => {
        gate.style.display = "none";
      }, 400);
    } else {
      error.style.display = "block";
      input.style.animation = "shake 0.3s";
      input.value = "";
    }
  }
});

// WhatsApp tooltip after 4 seconds
document.addEventListener("DOMContentLoaded", function () {

  let tooltipShown = false;

  function showTooltip() {
    const tooltip = document.getElementById("waTooltip");
    if (tooltip && !tooltipShown && !localStorage.getItem("waShown")) {
      tooltip.classList.add("show");
      tooltipShown = true;
      localStorage.setItem("waShown", "true");
    }
  }

function hideTooltip() {
    const tooltip = document.getElementById("waTooltip");

    if (tooltip) {
      setTimeout(() => {
        tooltip.classList.remove("show");
      }, 300);
    }
  }

  // ⏱ Wait 4 seconds, then enable scroll trigger
  setTimeout(() => {

    window.addEventListener("scroll", function onScroll() {
      const scrollPosition = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;

      if (scrollPosition >= pageHeight * 0.5) {
        showTooltip();
        window.removeEventListener("scroll", onScroll); // ✅ prevent re-trigger
      }
    });

  }, 4000);

  // ❌ Hide on interaction
  window.addEventListener("click", hideTooltip);
  window.addEventListener("touchstart", hideTooltip);

});

// Buy Me a Coffee floating button
document.addEventListener("DOMContentLoaded", function () {
  const bmc = document.getElementById('bmc-floating');
  const closeBtn = document.getElementById('bmc-close');

  if (!bmc || !closeBtn) return;

  // Show after slight delay (elegant)
  setTimeout(() => {
    bmc.classList.add('show');
  }, 11000);

  // Close button
  closeBtn.addEventListener('click', () => {
    bmc.style.display = 'none';
  });
});