/**
 * Mufina's Artistry - Main Entry Script
 * Initializes all modular JavaScript components on DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof initBusinessInfo === 'function') initBusinessInfo();
  if (typeof initNavigation === 'function') initNavigation();
  if (typeof initServicesTabs === 'function') initServicesTabs();
  if (typeof initPricingFilter === 'function') initPricingFilter();
  if (typeof initGallery === 'function') initGallery();
  if (typeof initBookingForm === 'function') initBookingForm();
  if (typeof initOwnerPortal === 'function') initOwnerPortal();
});
