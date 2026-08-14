/**
 * Mufina's Artistry - Services Showcase & Tab Filters
 */
function initServicesTabs() {
  const tabBtns = document.querySelectorAll('.services-tabs .tab-btn');
  const serviceCards = document.querySelectorAll('.service-card');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.getAttribute('data-category');

      serviceCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Attach Book Now click events on Service Cards to populate Booking Select
  document.querySelectorAll('.btn-book-service').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const serviceName = btn.getAttribute('data-service');
      const bookingSelect = document.getElementById('bookingService');
      
      if (bookingSelect && serviceName) {
        let optionFound = false;
        for (let i = 0; i < bookingSelect.options.length; i++) {
          if (bookingSelect.options[i].value === serviceName || bookingSelect.options[i].text.includes(serviceName)) {
            bookingSelect.selectedIndex = i;
            optionFound = true;
            break;
          }
        }
        if (!optionFound) {
          const newOpt = document.createElement('option');
          newOpt.value = serviceName;
          newOpt.textContent = serviceName;
          newOpt.selected = true;
          bookingSelect.appendChild(newOpt);
        }
      }

      const bookingSection = document.getElementById('booking');
      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}
