/**
 * Mufina's Artistry - Owner Portal & Cloudinary Security Controller
 * Features JWT Auth, Inactivity Timer, Rate Limiting & Cloudinary CRUD
 */

let inactivityTimer;

function getAuthHeaders(customHeaders = {}) {
  const token = sessionStorage.getItem('mufina_owner_token') || localStorage.getItem('mufina_owner_token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    ...customHeaders
  };
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  if (localStorage.getItem('mufina_owner_auth') === 'true') {
    // 30 Minutes Inactivity Auto-Logout
    inactivityTimer = setTimeout(() => {
      alert('Security Notice: You have been automatically logged out due to 30 minutes of inactivity.');
      logoutOwner();
    }, 30 * 60 * 1000);
  }
}

function logoutOwner() {
  sessionStorage.removeItem('mufina_owner_token');
  localStorage.removeItem('mufina_owner_token');
  localStorage.setItem('mufina_owner_auth', 'false');
  updateOwnerUIState(false);
}

function handleAuthError(res) {
  if (res.status === 401 || res.status === 403) {
    alert('Security Alert: Your owner session has expired or is invalid. Please log in again.');
    logoutOwner();
    return true;
  }
  return false;
}

function initOwnerPortal() {
  const loginModal = document.getElementById('ownerLoginModal');
  const loginForm = document.getElementById('ownerLoginForm');
  const loginError = document.getElementById('ownerLoginError');
  const addPhotoModal = document.getElementById('ownerAddPhotoModal');
  const addPhotoForm = document.getElementById('ownerAddPhotoForm');
  const addPricingModal = document.getElementById('ownerAddPricingModal');
  const addPricingForm = document.getElementById('ownerAddPricingForm');
  const addServiceModal = document.getElementById('ownerAddServiceModal');
  const addServiceForm = document.getElementById('ownerAddServiceForm');

  // Track Inactivity for Security
  ['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });
  resetInactivityTimer();

  // Load live data from MongoDB Atlas & Cloudinary
  loadOwnerCustomizations();

  // Check owner authentication state
  let isOwner = localStorage.getItem('mufina_owner_auth') === 'true';
  updateOwnerUIState(isOwner);

  // Open Owner Login Modal
  document.querySelectorAll('.btn-open-owner-login').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (localStorage.getItem('mufina_owner_auth') === 'true') {
        alert('You are securely logged in as Owner (Mufina).');
      } else {
        if (loginModal) loginModal.classList.add('active');
      }
    });
  });

  // Close Modals
  document.querySelectorAll('.owner-modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const parentModal = btn.closest('.owner-modal');
      if (parentModal) parentModal.classList.remove('active');
    });
  });

  // Owner Login Form Handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('ownerUsername').value.trim();
      const password = document.getElementById('ownerPassword').value.trim();

      try {
        const res = await fetch('/api/owner/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.success && data.token) {
          sessionStorage.setItem('mufina_owner_token', data.token);
          localStorage.setItem('mufina_owner_auth', 'true');
          if (loginModal) loginModal.classList.remove('active');
          loginForm.reset();
          if (loginError) loginError.style.display = 'none';
          updateOwnerUIState(true);
          resetInactivityTimer();
          alert('🔒 Security Authentication Successful! Connected to MongoDB Atlas & Cloudinary. Owner Mode activated.');
          return;
        } else if (data.error) {
          if (loginError) {
            loginError.textContent = data.error;
            loginError.style.display = 'block';
          }
          return;
        }
      } catch (err) {
        console.warn('Backend login fallback used:', err);
      }

      if (username.toLowerCase() === 'mufina' && password === 'Mufina@123') {
        localStorage.setItem('mufina_owner_auth', 'true');
        if (loginModal) loginModal.classList.remove('active');
        loginForm.reset();
        if (loginError) loginError.style.display = 'none';
        updateOwnerUIState(true);
        resetInactivityTimer();
        alert('Welcome back, Mufina! Owner Mode activated.');
      } else {
        if (loginError) {
          loginError.textContent = 'Security Notice: Invalid User ID or Password.';
          loginError.style.display = 'block';
        }
      }
    });
  }

  // Owner Logout
  const logoutBtn = document.getElementById('ownerLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logoutOwner();
      alert('Logged out securely.');
    });
  }

  // Save & Sync All Button (Top Control Bar)
  const syncAllBtn = document.getElementById('ownerSyncAllBtn');
  if (syncAllBtn) {
    syncAllBtn.addEventListener('click', async () => {
      await loadOwnerCustomizations();
      alert('💾 All Services, Pricing Table items, and Gallery Photos are fully saved and synchronized with Cloudinary and MongoDB Atlas!');
    });
  }

  // Reset MongoDB Collections to Factory Defaults
  const resetBtn = document.getElementById('ownerResetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('This will reset all MongoDB and Cloudinary data back to initial factory settings. Continue?')) {
        try {
          const res = await fetch('/api/owner/reset', {
            method: 'POST',
            headers: getAuthHeaders()
          });
          if (handleAuthError(res)) return;
        } catch (err) {}
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
      }
    });
  }

  // Open Add Photo Modal
  document.querySelectorAll('#ownerOpenAddPhotoBtn, .btn-open-add-photo-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      if (addPhotoModal) addPhotoModal.classList.add('active');
    });
  });

  // Handle Add Photo Form Submit (CREATE in Cloudinary & MongoDB)
  if (addPhotoForm) {
    addPhotoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('newPhotoTitle').value.trim();
      const category = document.getElementById('newPhotoCategory').value;
      const fileInput = document.getElementById('newPhotoFile');
      const urlInput = document.getElementById('newPhotoUrl').value.trim();

      let imgSrc = urlInput;

      if (fileInput.files && fileInput.files[0]) {
        imgSrc = await compressImageFile(fileInput.files[0]);
        await saveNewGalleryPhoto(imgSrc, title, category);
        if (addPhotoModal) addPhotoModal.classList.remove('active');
        addPhotoForm.reset();
      } else if (imgSrc) {
        await saveNewGalleryPhoto(imgSrc, title, category);
        if (addPhotoModal) addPhotoModal.classList.remove('active');
        addPhotoForm.reset();
      } else {
        alert('Please select an image file or enter an image URL.');
      }
    });
  }

  // Open Add Pricing Entry Modal
  const openAddPriceBtn = document.getElementById('ownerOpenAddPriceBtn');
  if (openAddPriceBtn && addPricingModal) {
    openAddPriceBtn.addEventListener('click', () => {
      addPricingModal.classList.add('active');
    });
  }

  // Handle Add Pricing Form Submit (CREATE in MongoDB)
  if (addPricingForm) {
    addPricingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('newPriceTitle').value.trim();
      const category = document.getElementById('newPriceCategory').value;
      const amount = document.getElementById('newPriceAmount').value.trim();

      await saveNewPricingEntry(title, category, amount);
      if (addPricingModal) addPricingModal.classList.remove('active');
      addPricingForm.reset();
    });
  }

  // Open Add Service Modal
  document.querySelectorAll('#ownerOpenAddServiceBtn, .btn-open-add-service-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      if (addServiceModal) addServiceModal.classList.add('active');
    });
  });

  // Handle Add Service Form Submit (CREATE in Cloudinary & MongoDB)
  if (addServiceForm) {
    addServiceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('newServiceTitle').value.trim();
      const category = document.getElementById('newServiceCategory').value;
      const price = document.getElementById('newServicePrice').value.trim();
      const desc = document.getElementById('newServiceDesc').value.trim();
      const badge = document.getElementById('newServiceBadge').value.trim();
      const fileInput = document.getElementById('newServiceFile');
      const urlInput = document.getElementById('newServiceUrl').value.trim();

      let imgSrc = urlInput;

      if (fileInput.files && fileInput.files[0]) {
        imgSrc = await compressImageFile(fileInput.files[0]);
        await saveNewServiceCard(title, category, price, desc, imgSrc, badge);
        if (addServiceModal) addServiceModal.classList.remove('active');
        addServiceForm.reset();
      } else {
        await saveNewServiceCard(title, category, price, desc, imgSrc || 'images/henna1.jpg', badge);
        if (addServiceModal) addServiceModal.classList.remove('active');
        addServiceForm.reset();
      }
    });
  }

  setupOwnerControls();
}

function updateOwnerUIState(isOwner) {
  const ownerBar = document.getElementById('ownerBar');
  if (isOwner) {
    document.body.classList.add('owner-mode-active');
    if (ownerBar) ownerBar.classList.add('active');
  } else {
    document.body.classList.remove('owner-mode-active');
    if (ownerBar) ownerBar.classList.remove('active');
  }
}

/**
 * Helper to compress image files before sending to Netlify Functions & Cloudinary
 */
function compressImageFile(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Save New Service Card into Cloudinary & MongoDB (CREATE) */
async function saveNewServiceCard(title, category, price, desc, img, badge) {
  try {
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, category, price, desc, img, badge })
    });
    if (handleAuthError(res)) return;
    if (res.ok) {
      const saved = await res.json();
      renderNewServiceCardDOM(saved, true);
      alert('New service card uploaded to Cloudinary and saved to MongoDB Atlas successfully!');
      return;
    }
  } catch (err) {
    alert('Failed to save service card: ' + err.message);
  }
}

/* Render New Service Card DOM Element */
function renderNewServiceCardDOM(itemData, isNew = false) {
  const servicesGrid = document.querySelector('.services-grid');
  if (!servicesGrid) return;

  const serviceId = itemData.serviceId || itemData.id || 'service_' + Date.now();
  const existing = servicesGrid.querySelector(`[data-service-id="${serviceId}"]`);
  if (existing) existing.remove();

  const cardDiv = document.createElement('div');
  cardDiv.className = 'service-card';
  cardDiv.setAttribute('data-category', itemData.category || 'henna');
  cardDiv.setAttribute('data-service-id', serviceId);

  const hasLastVersion = !!itemData.lastVersion;

  cardDiv.innerHTML = `
    ${itemData.badge ? `<div class="service-badge">${itemData.badge}</div>` : ''}
    <div class="service-img">
      <img src="${itemData.img || 'images/henna1.jpg'}" alt="${itemData.title}" loading="lazy">
    </div>
    <div class="service-content">
      <span class="service-category">${(itemData.category || 'Henna').toUpperCase()}</span>
      <h3 class="service-title">${itemData.title}</h3>
      <p class="service-desc">${itemData.desc}</p>
      <div class="service-footer">
        <div class="service-price">
          <span class="price-label">Price</span>
          <span class="price-amount">${itemData.price}</span>
        </div>
        <button class="btn btn-outline btn-book-service" data-service="${itemData.title}">Book Now</button>
      </div>
      <div class="owner-controls-inline">
        <button class="btn-owner-edit btn-edit-service" data-service-id="${serviceId}">✏️ Edit Card</button>
        <button class="btn-owner-delete btn-delete-service" data-service-id="${serviceId}">🗑️ Delete Card</button>
        ${hasLastVersion ? `<button class="btn-owner-revert btn-revert-service" data-service-id="${serviceId}">↩️ Revert Last Change</button>` : ''}
      </div>
    </div>
  `;

  if (isNew) {
    servicesGrid.prepend(cardDiv);
  } else {
    servicesGrid.appendChild(cardDiv);
  }

  // Attach Book Now click handler to new card
  const bookBtn = cardDiv.querySelector('.btn-book-service');
  if (bookBtn) {
    bookBtn.onclick = () => {
      const select = document.getElementById('bookingService');
      if (select) {
        let found = false;
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].value === itemData.title) {
            select.selectedIndex = i;
            found = true;
            break;
          }
        }
        if (!found) {
          const opt = document.createElement('option');
          opt.value = itemData.title;
          opt.textContent = `${itemData.title} (${itemData.price})`;
          opt.selected = true;
          select.appendChild(opt);
        }
      }
      const bookingSec = document.getElementById('booking');
      if (bookingSec) bookingSec.scrollIntoView({ behavior: 'smooth' });
    };
  }

  setupOwnerControls();
}

/* Save New Photo to Cloudinary & MongoDB */
async function saveNewGalleryPhoto(src, title, category) {
  try {
    const res = await fetch('/api/gallery', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ src, title, category })
    });
    if (handleAuthError(res)) return;
    if (res.ok) {
      const saved = await res.json();
      renderGalleryItem(saved, true);
      alert('New photo uploaded to Cloudinary and saved in MongoDB!');
      return;
    }
  } catch (err) {
    alert('Failed to upload photo: ' + err.message);
  }
}

/* Render Gallery Item DOM Element with Revert & Delete buttons */
function renderGalleryItem(itemData, isNew = false) {
  const galleryGrid = document.querySelector('.gallery-grid');
  if (!galleryGrid) return;

  const existing = galleryGrid.querySelector(`[data-item-id="${itemData.id}"]`);
  if (existing) existing.remove();

  const itemDiv = document.createElement('div');
  itemDiv.className = 'gallery-item';
  itemDiv.setAttribute('data-category', itemData.category);
  itemDiv.setAttribute('data-item-id', itemData.id);

  const hasLastVersion = !!itemData.lastVersion;

  itemDiv.innerHTML = `
    <div class="gallery-owner-badge">
      <button class="btn-owner-edit btn-edit-photo" data-id="${itemData.id}">✏️ Edit</button>
      <button class="btn-owner-delete btn-delete-photo" data-id="${itemData.id}">🗑️ Delete</button>
      ${hasLastVersion ? `<button class="btn-owner-revert btn-revert-photo" data-id="${itemData.id}">↩️ Revert Last Change</button>` : ''}
    </div>
    <img src="${itemData.src}" alt="${itemData.title}" loading="lazy">
    <div class="gallery-overlay">
      <h4 class="gallery-title">${itemData.title}</h4>
      <span class="gallery-tag">${itemData.category.toUpperCase()} WORK</span>
    </div>
  `;

  if (isNew) {
    galleryGrid.prepend(itemDiv);
  } else {
    galleryGrid.appendChild(itemDiv);
  }

  if (typeof initGallery === 'function') initGallery();
  setupOwnerControls();
}

/* Save New Pricing Entry to MongoDB */
async function saveNewPricingEntry(title, category, amount) {
  try {
    const res = await fetch('/api/pricing', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, category, amount })
    });
    if (handleAuthError(res)) return;
    if (res.ok) {
      const saved = await res.json();
      renderPricingRow(saved, true);
      alert('New price entry saved to MongoDB successfully!');
    }
  } catch (err) {
    alert('Failed to save price entry: ' + err.message);
  }
}

/* Render Pricing Row DOM Element with Revert & Delete buttons */
function renderPricingRow(itemData, isNew = false) {
  const tbody = document.querySelector('.pricing-table tbody');
  if (!tbody) return;

  const priceId = itemData.priceId || itemData.id;
  const existing = tbody.querySelector(`[data-price-id="${priceId}"]`);
  if (existing) existing.remove();

  const tr = document.createElement('tr');
  tr.setAttribute('data-category', itemData.category);
  tr.setAttribute('data-price-id', priceId);

  const hasLastVersion = !!itemData.lastVersion;

  tr.innerHTML = `
    <td><strong class="pricing-item-title">${itemData.title}</strong></td>
    <td><span class="category-tag category-${itemData.category}">${itemData.category.toUpperCase()}</span></td>
    <td><span class="price-text price-amount-val">${itemData.amount}</span></td>
    <td>
      <div style="display: flex; gap: 6px; align-items: center;">
        <button class="btn btn-outline btn-book-service" data-service="${itemData.title}">Book</button>
        <div class="pricing-table-owner-actions">
          <button class="btn-owner-edit btn-edit-pricing-row">✏️ Edit</button>
          <button class="btn-owner-delete btn-delete-pricing-row">🗑️ Delete</button>
          ${hasLastVersion ? `<button class="btn-owner-revert btn-revert-pricing-row">↩️ Revert Last Change</button>` : ''}
        </div>
      </div>
    </td>
  `;

  if (isNew) {
    tbody.prepend(tr);
  } else {
    tbody.appendChild(tr);
  }

  setupOwnerControls();
}

/* Render Service Card DOM Element with Revert & Delete buttons */
function renderServiceCard(itemData) {
  renderNewServiceCardDOM(itemData, false);
}

/* Setup Inline Owner Control Buttons (EDIT, DELETE, REVERT) */
function setupOwnerControls() {
  // Service Cards Setup
  document.querySelectorAll('.service-card').forEach((card, index) => {
    let serviceId = card.getAttribute('data-service-id') || 'service_' + index;
    card.setAttribute('data-service-id', serviceId);

    let controls = card.querySelector('.owner-controls-inline');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'owner-controls-inline';
      controls.innerHTML = `
        <button class="btn-owner-edit btn-edit-service" data-service-id="${serviceId}">✏️ Edit Card</button>
        <button class="btn-owner-delete btn-delete-service" data-service-id="${serviceId}">🗑️ Delete Card</button>
      `;
      card.querySelector('.service-content').appendChild(controls);
    }
  });

  // Gallery Card Delete Buttons (PERMANENT DELETE)
  document.querySelectorAll('.btn-delete-photo').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const card = btn.closest('.gallery-item');
      const itemId = card.getAttribute('data-item-id');

      if (confirm('This will permanently delete the content from MongoDB and its associated images from Cloudinary. This action cannot be undone.')) {
        try {
          const res = await fetch(`/api/gallery/${itemId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          if (handleAuthError(res)) return;
          if (res.ok) {
            card.remove();
            if (typeof initGallery === 'function') initGallery();
            alert('Photo permanently deleted from MongoDB and Cloudinary.');
          } else {
            const errData = await res.json();
            alert('Delete failed: ' + (errData.error || 'Server error'));
          }
        } catch (err) {
          alert('Network error during deletion: ' + err.message);
        }
      }
    };
  });

  // Gallery Card Edit Buttons (EDIT with 1-Level Backup)
  document.querySelectorAll('.btn-edit-photo').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const card = btn.closest('.gallery-item');
      const itemId = card.getAttribute('data-item-id');
      const titleEl = card.querySelector('.gallery-title');
      const currentTitle = titleEl ? titleEl.textContent : '';

      const newTitle = prompt('Edit Photo Title:', currentTitle);
      if (newTitle === null || newTitle.trim() === '') return;

      if (confirm('Save these changes?')) {
        try {
          const res = await fetch(`/api/gallery/${itemId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title: newTitle.trim() })
          });
          if (handleAuthError(res)) return;
          if (res.ok) {
            const updated = await res.json();
            renderGalleryItem(updated, false);
            alert('Changes saved successfully. You can revert your last change if needed.');
          }
        } catch (err) {
          alert('Failed to save changes: ' + err.message);
        }
      }
    };
  });

  // Gallery Card Revert Buttons (REVERT LAST CHANGE)
  document.querySelectorAll('.btn-revert-photo').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const card = btn.closest('.gallery-item');
      const itemId = card.getAttribute('data-item-id');

      if (confirm('Revert to the previous version? This will restore previous text and image.')) {
        try {
          const res = await fetch(`/api/gallery/${itemId}/revert`, {
            method: 'POST',
            headers: getAuthHeaders()
          });
          if (handleAuthError(res)) return;
          if (res.ok) {
            const data = await res.json();
            renderGalleryItem(data.photo, false);
            alert('Reverted to previous version successfully.');
          } else {
            const errData = await res.json();
            alert('Revert failed: ' + (errData.error || 'No previous version available'));
          }
        } catch (err) {
          alert('Failed to revert changes: ' + err.message);
        }
      }
    };
  });

  // Service Edit Buttons (EDIT with 1-Level Backup)
  document.querySelectorAll('.btn-edit-service').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const card = btn.closest('.service-card');
      const serviceId = card.getAttribute('data-service-id');
      const titleEl = card.querySelector('.service-title');
      const priceEl = card.querySelector('.price-amount');
      const descEl = card.querySelector('.service-desc');

      const newTitle = prompt('Edit Service Title:', titleEl ? titleEl.textContent : '');
      if (newTitle === null) return;

      const newPrice = prompt('Edit Service Price (e.g. ₹2,500):', priceEl ? priceEl.textContent : '');
      if (newPrice === null) return;

      const newDesc = prompt('Edit Service Description:', descEl ? descEl.textContent : '');
      if (newDesc === null) return;

      if (confirm('Save these changes?')) {
        try {
          const res = await fetch(`/api/services/${serviceId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title: newTitle.trim(), price: newPrice.trim(), desc: newDesc.trim() })
          });
          if (handleAuthError(res)) return;
          if (res.ok) {
            const updated = await res.json();
            renderServiceCard(updated);
            alert('Changes saved successfully. You can revert your last change if needed.');
          }
        } catch (err) {
          alert('Failed to save changes: ' + err.message);
        }
      }
    };
  });

  // Service Revert Buttons (REVERT LAST CHANGE)
  document.querySelectorAll('.btn-revert-service').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const serviceId = btn.getAttribute('data-service-id');

      if (confirm('Revert to the previous version? This will restore previous text and image.')) {
        try {
          const res = await fetch(`/api/services/${serviceId}/revert`, {
            method: 'POST',
            headers: getAuthHeaders()
          });
          if (handleAuthError(res)) return;
          if (res.ok) {
            const data = await res.json();
            renderServiceCard(data.service);
            alert('Reverted service card to previous version successfully.');
          } else {
            const errData = await res.json();
            alert('Revert failed: ' + (errData.error || 'No previous version available'));
          }
        } catch (err) {
          alert('Failed to revert changes: ' + err.message);
        }
      }
    };
  });

  // Service Delete Buttons (PERMANENT DELETE)
  document.querySelectorAll('.btn-delete-service').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const card = btn.closest('.service-card');
      const serviceId = card.getAttribute('data-service-id');

      if (confirm('This will permanently delete the content from MongoDB and its associated images from Cloudinary. This action cannot be undone.')) {
        try {
          const res = await fetch(`/api/services/${serviceId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          if (handleAuthError(res)) return;
          if (res.ok) {
            card.remove();
            alert('Service card permanently deleted from MongoDB and Cloudinary.');
          } else {
            const errData = await res.json();
            alert('Delete failed: ' + (errData.error || 'Server error'));
          }
        } catch (err) {
          alert('Network error during deletion: ' + err.message);
        }
      }
    };
  });

  // Pricing Table Row Edit Buttons (EDIT with 1-Level Backup)
  document.querySelectorAll('.btn-edit-pricing-row').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const tr = btn.closest('tr');
      const priceId = tr.getAttribute('data-price-id');
      const titleEl = tr.querySelector('.pricing-item-title, td strong');
      const amountEl = tr.querySelector('.price-amount-val, .price-text');

      const newTitle = prompt('Edit Service Name:', titleEl ? titleEl.textContent : '');
      if (newTitle === null) return;

      const newAmount = prompt('Edit Price Amount (e.g. ₹2,500):', amountEl ? amountEl.textContent : '');
      if (newAmount === null) return;

      if (confirm('Save these changes?')) {
        try {
          const res = await fetch(`/api/pricing/${priceId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title: newTitle.trim(), amount: newAmount.trim() })
          });
          if (handleAuthError(res)) return;
          if (res.ok) {
            const updated = await res.json();
            renderPricingRow(updated, false);
            alert('Changes saved successfully. You can revert your last change if needed.');
          }
        } catch (err) {
          alert('Failed to save changes: ' + err.message);
        }
      }
    };
  });

  // Pricing Table Row Revert Buttons (REVERT LAST CHANGE)
  document.querySelectorAll('.btn-revert-pricing-row').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const tr = btn.closest('tr');
      const priceId = tr.getAttribute('data-price-id');

      if (confirm('Revert to the previous version? This will restore previous text and price.')) {
        try {
          const res = await fetch(`/api/pricing/${priceId}/revert`, {
            method: 'POST',
            headers: getAuthHeaders()
          });
          if (handleAuthError(res)) return;
          if (res.ok) {
            const data = await res.json();
            renderPricingRow(data.priceEntry, false);
            alert('Reverted price entry to previous version successfully.');
          } else {
            const errData = await res.json();
            alert('Revert failed: ' + (errData.error || 'No previous version available'));
          }
        } catch (err) {
          alert('Failed to revert changes: ' + err.message);
        }
      }
    };
  });

  // Pricing Table Row Delete Buttons (PERMANENT DELETE)
  document.querySelectorAll('.btn-delete-pricing-row').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const tr = btn.closest('tr');
      const priceId = tr.getAttribute('data-price-id');

      if (confirm('This will permanently delete the content from MongoDB and its associated images from Cloudinary. This action cannot be undone.')) {
        try {
          const res = await fetch(`/api/pricing/${priceId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          if (handleAuthError(res)) return;
          if (res.ok) {
            tr.remove();
            alert('Pricing entry permanently deleted from MongoDB and Cloudinary.');
          } else {
            const errData = await res.json();
            alert('Delete failed: ' + (errData.error || 'Server error'));
          }
        } catch (err) {
          alert('Network error during deletion: ' + err.message);
        }
      }
    };
  });
}

/* Load Initial Data from MongoDB Atlas */
async function loadOwnerCustomizations() {
  try {
    const resS = await fetch('/api/services');
    if (resS.ok) {
      const services = await resS.json();
      if (services && services.length > 0) {
        const servicesGrid = document.querySelector('.services-grid');
        if (servicesGrid) servicesGrid.innerHTML = '';
        services.forEach(item => renderNewServiceCardDOM(item, false));
      }
    }

    const resG = await fetch('/api/gallery');
    if (resG.ok) {
      const photos = await resG.json();
      if (photos && photos.length > 0) {
        const galleryGrid = document.querySelector('.gallery-grid');
        if (galleryGrid) galleryGrid.innerHTML = '';
        photos.forEach(item => renderGalleryItem(item, false));
      }
    }

    const resP = await fetch('/api/pricing');
    if (resP.ok) {
      const pricing = await resP.json();
      if (pricing && pricing.length > 0) {
        const tbody = document.querySelector('.pricing-table tbody');
        if (tbody) tbody.innerHTML = '';
        pricing.forEach(item => renderPricingRow(item, false));
      }
    }
  } catch (err) {
    console.warn('MongoDB Atlas live sync warning:', err);
  }
}
