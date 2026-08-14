/**
 * Mufina's Artistry - Central Business Configuration
 */
const businessInfo = {
  name: "Mufina's Artistry",
  phone: "7010763660",
  displayPhone: "+91 70107 63660",
  whatsapp: "917010763660",
  email: "mulfinaartistry@gmail.com",
  instagram: "mufiartistry",
  instagramUrl: "https://www.instagram.com/mufiartistry?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  location: "Tamil Nadu, India"
};

function initBusinessInfo() {
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  document.querySelectorAll('.phone-link').forEach(el => {
    el.href = `tel:${businessInfo.phone}`;
  });

  document.querySelectorAll('.phone-text').forEach(el => {
    el.textContent = businessInfo.displayPhone;
  });

  document.querySelectorAll('.whatsapp-link').forEach(el => {
    el.href = `https://wa.me/${businessInfo.whatsapp}`;
  });

  document.querySelectorAll('.email-link').forEach(el => {
    el.href = `mailto:${businessInfo.email}`;
  });

  document.querySelectorAll('.instagram-link').forEach(el => {
    el.href = businessInfo.instagramUrl;
  });

  document.querySelectorAll('.instagram-text').forEach(el => {
    el.textContent = `@${businessInfo.instagram}`;
  });
}
