/**
 * Mufina's Artistry - Central Business Configuration & Dynamic API Resolver
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

/**
 * Dynamically resolves API URL endpoints.
 * Automatically routes Live Server (127.0.0.1:5500) to local Express backend (http://localhost:8080)
 */
function getApiUrl(endpoint) {
  const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  const p = window.location.port;
  if (p === '5500' || p === '5501' || p === '3000' || window.location.protocol === 'file:') {
    return 'http://localhost:8080' + path;
  }
  return path;
}

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
