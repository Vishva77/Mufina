/**
 * Mufina's Artistry - Booking Form Validation & Instant WhatsApp Integration
 */
function initBookingForm() {
  const bookingForm = document.getElementById('bookingForm');
  if (!bookingForm) return;

  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('bookingName');
    const phoneInput = document.getElementById('bookingPhone');
    const serviceInput = document.getElementById('bookingService');
    const dateInput = document.getElementById('bookingDate');
    const timeInput = document.getElementById('bookingTime');
    const guestsInput = document.getElementById('bookingGuests');
    const messageInput = document.getElementById('bookingMessage');

    document.querySelectorAll('.form-group').forEach(group => group.classList.remove('error'));

    let isValid = true;

    if (!nameInput.value.trim()) {
      showError(nameInput, 'Full Name is required');
      isValid = false;
    }

    const phoneClean = phoneInput.value.replace(/\D/g, '');
    if (!phoneClean || phoneClean.length < 10) {
      showError(phoneInput, 'Valid 10-digit Mobile Number is required');
      isValid = false;
    }

    if (!serviceInput.value) {
      showError(serviceInput, 'Please select a service');
      isValid = false;
    }

    if (!dateInput.value) {
      showError(dateInput, 'Preferred Date is required');
      isValid = false;
    }

    if (!isValid) return;

    // Formatted WhatsApp Message
    const formattedMessage = 
`*New Booking Request - ${businessInfo.name}*
──────────────────────────
👤 *Name:* ${nameInput.value.trim()}
📱 *Phone:* ${phoneInput.value.trim()}
💅 *Service:* ${serviceInput.value}
📅 *Preferred Date:* ${dateInput.value}
⏰ *Preferred Time:* ${timeInput.value || 'Not specified'}
👥 *Number of People:* ${guestsInput.value || '1'}
💬 *Additional Notes:* ${messageInput.value.trim() || 'None'}
──────────────────────────
Please confirm availability and booking details. Thank you!`;

    const encodedMsg = encodeURIComponent(formattedMessage);
    const whatsappURL = `https://wa.me/${businessInfo.whatsapp}?text=${encodedMsg}`;

    // Save booking payload to MongoDB Atlas asynchronously
    try {
      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.value.trim(),
          phone: phoneInput.value.trim(),
          service: serviceInput.value,
          date: dateInput.value,
          time: timeInput.value || '',
          guests: parseInt(guestsInput.value || '1'),
          message: messageInput.value.trim() || ''
        })
      });
    } catch (err) {}

    // Open WhatsApp in new tab
    window.open(whatsappURL, '_blank');

    // Clear all booking form fields after submission
    bookingForm.reset();
  });

  function showError(inputElement, errorMessage) {
    const parentGroup = inputElement.closest('.form-group');
    if (parentGroup) {
      parentGroup.classList.add('error');
      const errorSpan = parentGroup.querySelector('.form-error');
      if (errorSpan) {
        errorSpan.textContent = errorMessage;
      }
    }
  }
}
