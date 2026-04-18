// Mobile Menu Toggle
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    menuToggle.setAttribute('aria-expanded', String(!mobileMenu.classList.contains('hidden')));
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Dynamic copyright year
const yearEl = document.getElementById('copyright-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
