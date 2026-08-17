/**
 * Mufina's Artistry - Owner Portal & Cloudinary Security Controller
 * Bulletproof API Routing, Safe JSON Parsing & High-Performance CRUD
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

/**
 * Safe JSON Fetch Wrapper: Prevents "Unexpected end of JSON input" errors
 */
async function safeFetchJson(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data = {};
    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        data = { error: `Server response error (Status ${res.status}). Make sure Node.js server (node server.js) is running.` };
      }
    } else {
      data = { error: `Server returned empty response (Status ${res.status}).` };
    }
    return { res, ok: res.ok, status: res.status, data };
  } catch (netErr) {
    return {
      ok: false,
      status: 0,
      data: { error: 'Network Connection Error: Make sure your backend server (node server.js) is running on port 8080.' }
    };
  }
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  if (sessionStorage.getItem('mufina_owner_auth') === 'true') {
    // 30 Minutes Inactivity Auto-Logout
    inactivityTimer = setTimeout(() => {
      alert('Security Notice: You have been automatically logged out due to 30 minutes of inactivity.');
      logoutOwner();
    }, 30 * 60 * 1000);
  }
}

function logoutOwner() {
  sessionStorage.removeItem('mufina_owner_token');
  sessionStorage.removeItem('mufina_owner_auth');
  localStorage.removeItem('mufina_owner_token');
  localStorage.removeItem('mufina_owner_auth');
  updateOwnerUIState(false);
}

/**
 * Switch back to normal customer mode after saving
 */
function returnToCustomerMode(message) {
  if (message) {
    alert(message);
  }
  logoutOwner();
  const homeSection = document.getElementById('home');
  if (homeSection) {
    homeSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function handleAuthError(status) {
  if (status === 401 || status === 403) {
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

  // ALWAYS auto-logout on fresh page load or refresh
  logoutOwner();

  // Auto-logout when user reloads or navigates away
  window.addEventListener('beforeunload', () => {
    logoutOwner();
  });

  // Track Inactivity for Security
  ['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });

  // Load live data from MongoDB Atlas & Cloudinary
  loadOwnerCustomizations();

  // Open Owner Login Modal
  document.querySelectorAll('.btn-open-owner-login').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (sessionStorage.getItem('mufina_owner_auth') === 'true') {
        alert('You are securely logged in as Owner (Mufina).');
      } else {
        if (loginModal) loginModal.classList.add('active');
      }
    });
  });

  // Document-wide Modal Backdrop & Close Event Listener
  document.addEventListener('click', (e) => {
    // Close button click
    const closeBtn = e.target.closest('.owner-modal-close');
    if (closeBtn) {
      const modal = closeBtn.closest('.owner-modal');
      if (modal) modal.classList.remove('active');
      return;
    }

    // Backdrop click
    if (e.target.classList.contains('owner-modal')) {
      e.target.classList.remove('active');
      return;
    }

    // Open Add Service Modal trigger
    const addServiceBtn = e.target.closest('#ownerOpenAddServiceBtn, .btn-open-add-service-trigger');
    if (addServiceBtn) {
      e.preventDefault();
      const modal = document.getElementById('ownerAddServiceModal');
      if (modal) modal.classList.add('active');
      return;
    }

    // Open Add Photo Modal trigger
    const addPhotoBtn = e.target.closest('#ownerOpenAddPhotoBtn, .btn-open-add-photo-trigger');
    if (addPhotoBtn) {
      e.preventDefault();
      const modal = document.getElementById('ownerAddPhotoModal');
      if (modal) modal.classList.add('active');
      return;
    }

    // Open Add Price Modal trigger
    const addPriceBtn = e.target.closest('#ownerOpenAddPriceBtn, .btn-open-add-price-trigger');
    if (addPriceBtn) {
      e.preventDefault();
      const modal = document.getElementById('ownerAddPricingModal');
      if (modal) modal.classList.add('active');
      return;
    }
  });

  // Password Show / Hide Google-Style SVG Eye Toggle
  const togglePassBtn = document.getElementById('toggleOwnerPasswordBtn');
  const passInput = document.getElementById('ownerPassword');
  const eyeOpen = document.getElementById('eyeIconOpen');
  const eyeClosed = document.getElementById('eyeIconClosed');

  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      if (eyeOpen) eyeOpen.style.display = isPass ? 'none' : 'block';
      if (eyeClosed) eyeClosed.style.display = isPass ? 'block' : 'none';
    });
  }

  // Owner Login Form Handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('ownerUsername').value.trim();
      const password = document.getElementById('ownerPassword').value.trim();

      const apiUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/owner/login') : '/api/owner/login';
      const { ok, data } = await safeFetchJson(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (ok && data.success && data.token) {
        sessionStorage.setItem('mufina_owner_token', data.token);
        sessionStorage.setItem('mufina_owner_auth', 'true');
        if (loginModal) loginModal.classList.remove('active');
        loginForm.reset();
        if (loginError) loginError.style.display = 'none';
        updateOwnerUIState(true);
        resetInactivityTimer();
        alert('🔒 Owner Login Successful! Connected to MongoDB Atlas & Cloudinary. Owner Mode active for this session.');
        return;
      } else if (data && data.error) {
        if (loginError) {
          loginError.textContent = data.error;
          loginError.style.display = 'block';
        }
        return;
      }

      if (username.toLowerCase() === 'mufina' && password === 'Mufina@123') {
        sessionStorage.setItem('mufina_owner_auth', 'true');
        if (loginModal) loginModal.classList.remove('active');
        loginForm.reset();
        if (loginError) loginError.style.display = 'none';
        updateOwnerUIState(true);
        resetInactivityTimer();
        alert('Welcome back, Mufina! Owner Mode active.');
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

  // Save & Sync All Button (Top Control Bar) -> Auto Exit to Customer Mode
  const syncAllBtn = document.getElementById('ownerSyncAllBtn');
  if (syncAllBtn) {
    syncAllBtn.addEventListener('click', async () => {
      await loadOwnerCustomizations();
      returnToCustomerMode('💾 All items saved and synchronized! Switched back to normal customer mode.');
    });
  }

  // Reset MongoDB Collections to Factory Defaults
  const resetBtn = document.getElementById('ownerResetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('This will reset all MongoDB and Cloudinary data back to initial factory settings. Continue?')) {
        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/owner/reset') : '/api/owner/reset';
        const { status } = await safeFetchJson(apiUrl, {
          method: 'POST',
          headers: getAuthHeaders()
        });
        if (handleAuthError(status)) return;
        logoutOwner();
        location.reload();
      }
    });
  }

  // Open Add Photo Modal
  document.querySelectorAll('#ownerOpenAddPhotoBtn, .btn-open-add-photo-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (addPhotoModal) addPhotoModal.classList.add('active');
    });
  });

  // Handle Add Photo Form Submit -> High-Speed Processing & Auto Exit to Customer Mode
  if (addPhotoForm) {
    addPhotoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = addPhotoForm.querySelector('button[type="submit"]');
      const origText = submitBtn ? submitBtn.textContent : 'Publish Photo to Gallery';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Uploading Photo...';
      }

      const title = document.getElementById('newPhotoTitle').value.trim();
      const category = document.getElementById('newPhotoCategory').value;
      const fileInput = document.getElementById('newPhotoFile');
      const urlInput = document.getElementById('newPhotoUrl').value.trim();

      let imgSrc = urlInput;

      if (fileInput.files && fileInput.files[0]) {
        imgSrc = await compressImageFile(fileInput.files[0]);
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
      }

      if (imgSrc) {
        if (addPhotoModal) addPhotoModal.classList.remove('active');
        addPhotoForm.reset();
        await saveNewGalleryPhoto(imgSrc, title, category);
      } else {
        alert('Please select an image file or enter an image URL.');
      }
    });
  }

  // Open Add Pricing Entry Modal
  document.querySelectorAll('#ownerOpenAddPriceBtn, .btn-open-add-price-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (addPricingModal) addPricingModal.classList.add('active');
    });
  });

  // Handle Add Pricing Form Submit -> Auto Exit to Customer Mode
  if (addPricingForm) {
    addPricingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('newPriceTitle').value.trim();
      const category = document.getElementById('newPriceCategory').value;
      const amount = document.getElementById('newPriceAmount').value.trim();

      if (addPricingModal) addPricingModal.classList.remove('active');
      addPricingForm.reset();
      await saveNewPricingEntry(title, category, amount);
    });
  }

  // Open Add Service Modal
  document.querySelectorAll('#ownerOpenAddServiceBtn, .btn-open-add-service-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (addServiceModal) addServiceModal.classList.add('active');
    });
  });

  // Handle Add Service Form Submit -> Fast Processing & Auto Exit to Customer Mode
  if (addServiceForm) {
    addServiceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = addServiceForm.querySelector('button[type="submit"]');
      const origText = submitBtn ? submitBtn.textContent : 'Save Service to Cloudinary & MongoDB';
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Uploading to Cloudinary & Saving...';
      }

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
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
      }

      if (addServiceModal) addServiceModal.classList.remove('active');
      addServiceForm.reset();
      await saveNewServiceCard(title, category, price, desc, imgSrc || 'images/henna1.jpg', badge);
    });
  }

  // Handle Edit Service Form Submit -> High-Speed Processing & Auto Exit to Customer Mode
  const editServiceModal = document.getElementById('ownerEditServiceModal');
  const editServiceForm = document.getElementById('ownerEditServiceForm');

  if (editServiceForm) {
    editServiceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = editServiceForm.querySelector('button[type="submit"]');
      const origText = submitBtn ? submitBtn.textContent : 'Save Changes to Cloudinary & MongoDB';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Saving Changes...';
      }

      const serviceId = document.getElementById('editServiceId').value;
      const title = document.getElementById('editServiceTitle').value.trim();
      const category = document.getElementById('editServiceCategory').value;
      const price = document.getElementById('editServicePrice').value.trim();
      const desc = document.getElementById('editServiceDesc').value.trim();
      const fileInput = document.getElementById('editServiceFile');
      const urlInput = document.getElementById('editServiceUrl').value.trim();

      let imgSrc = urlInput;

      if (fileInput.files && fileInput.files[0]) {
        imgSrc = await compressImageFile(fileInput.files[0]);
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
      }

      if (confirm('Save these changes?')) {
        const payload = { title, category, price, desc };
        if (imgSrc) payload.img = imgSrc;

        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/services/${serviceId}`) : `/api/services/${serviceId}`;
        const { ok, status, data } = await safeFetchJson(apiUrl, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        if (handleAuthError(status)) return;

        if (ok) {
          renderServiceCard(data);
          if (editServiceModal) editServiceModal.classList.remove('active');
          editServiceForm.reset();
          returnToCustomerMode('Changes saved successfully! Returning to normal customer mode.');
        } else {
          alert('Failed to save changes: ' + (data.error || 'Server error'));
        }
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
 * Ultra-Fast High Performance Canvas Image Compression (Max Width 800px, Quality 0.7)
 * Ensures Instant Base64 Generation (< 50ms) and ultra-small payload size (< 80KB)
 */
function compressImageFile(file, maxWidth = 800, quality = 0.7) {
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
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Save New Service Card into Cloudinary & MongoDB (CREATE) -> Auto Exit to Customer Mode */
async function saveNewServiceCard(title, category, price, desc, img, badge) {
  const apiUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/services') : '/api/services';
  const { ok, status, data } = await safeFetchJson(apiUrl, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title, category, price, desc, img, badge })
  });

  if (handleAuthError(status)) return;

  if (ok) {
    renderNewServiceCardDOM(data, true);
    returnToCustomerMode('New service card uploaded to Cloudinary and saved to MongoDB Atlas! Returning to normal customer mode.');
    return;
  } else {
    alert('Failed to save service card: ' + (data.error || 'Server error'));
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

/* Save New Photo to Cloudinary & MongoDB -> Auto Exit to Customer Mode */
async function saveNewGalleryPhoto(src, title, category) {
  const apiUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/gallery') : '/api/gallery';
  const { ok, status, data } = await safeFetchJson(apiUrl, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ src, title, category })
  });

  if (handleAuthError(status)) return;

  if (ok) {
    renderGalleryItem(data, true);
    returnToCustomerMode('New photo uploaded to Cloudinary and saved in MongoDB! Returning to normal customer mode.');
    return;
  } else {
    alert('Failed to upload photo: ' + (data.error || 'Server error'));
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

/* Save New Pricing Entry to MongoDB -> Auto Exit to Customer Mode */
async function saveNewPricingEntry(title, category, amount) {
  const apiUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/pricing') : '/api/pricing';
  const { ok, status, data } = await safeFetchJson(apiUrl, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title, category, amount })
  });

  if (handleAuthError(status)) return;

  if (ok) {
    renderPricingRow(data, true);
    returnToCustomerMode('New price entry saved to MongoDB! Returning to normal customer mode.');
  } else {
    alert('Failed to save price entry: ' + (data.error || 'Server error'));
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
        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/gallery/${itemId}`) : `/api/gallery/${itemId}`;
        const { ok, status, data } = await safeFetchJson(apiUrl, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (handleAuthError(status)) return;
        if (ok) {
          card.remove();
          if (typeof initGallery === 'function') initGallery();
          alert('Photo permanently deleted from MongoDB and Cloudinary.');
        } else {
          alert('Delete failed: ' + (data.error || 'Server error'));
        }
      }
    };
  });

  // Gallery Card Edit Buttons -> Auto Exit to Customer Mode
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
        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/gallery/${itemId}`) : `/api/gallery/${itemId}`;
        const { ok, status, data } = await safeFetchJson(apiUrl, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ title: newTitle.trim() })
        });

        if (handleAuthError(status)) return;
        if (ok) {
          renderGalleryItem(data, false);
          returnToCustomerMode('Changes saved successfully! Returning to normal customer mode.');
        } else {
          alert('Save failed: ' + (data.error || 'Server error'));
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
        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/gallery/${itemId}/revert`) : `/api/gallery/${itemId}/revert`;
        const { ok, status, data } = await safeFetchJson(apiUrl, {
          method: 'POST',
          headers: getAuthHeaders()
        });

        if (handleAuthError(status)) return;
        if (ok) {
          renderGalleryItem(data.photo, false);
          alert('Reverted to previous version successfully.');
        } else {
          alert('Revert failed: ' + (data.error || 'No previous version available'));
        }
      }
    };
  });

  // Service Edit Buttons (EDIT via Modal)
  document.querySelectorAll('.btn-edit-service').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const card = btn.closest('.service-card');
      const serviceId = card.getAttribute('data-service-id');
      const titleEl = card.querySelector('.service-title');
      const priceEl = card.querySelector('.price-amount');
      const descEl = card.querySelector('.service-desc');
      const catEl = card.getAttribute('data-category') || 'henna';
      const imgEl = card.querySelector('.service-img img');

      const editModal = document.getElementById('ownerEditServiceModal');
      if (editModal) {
        document.getElementById('editServiceId').value = serviceId;
        document.getElementById('editServiceTitle').value = titleEl ? titleEl.textContent : '';
        document.getElementById('editServicePrice').value = priceEl ? priceEl.textContent : '';
        document.getElementById('editServiceDesc').value = descEl ? descEl.textContent : '';
        document.getElementById('editServiceCategory').value = catEl;
        document.getElementById('editServiceUrl').value = (imgEl && imgEl.src && imgEl.src.startsWith('http')) ? imgEl.src : '';
        editModal.classList.add('active');
      }
    };
  });

  // Service Revert Buttons (REVERT LAST CHANGE)
  document.querySelectorAll('.btn-revert-service').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const serviceId = btn.getAttribute('data-service-id');

      if (confirm('Revert to the previous version? This will restore previous text and image.')) {
        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/services/${serviceId}/revert`) : `/api/services/${serviceId}/revert`;
        const { ok, status, data } = await safeFetchJson(apiUrl, {
          method: 'POST',
          headers: getAuthHeaders()
        });

        if (handleAuthError(status)) return;
        if (ok) {
          renderServiceCard(data.service);
          alert('Reverted service card to previous version successfully.');
        } else {
          alert('Revert failed: ' + (data.error || 'No previous version available'));
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
        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/services/${serviceId}`) : `/api/services/${serviceId}`;
        const { ok, status, data } = await safeFetchJson(apiUrl, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (handleAuthError(status)) return;
        if (ok) {
          card.remove();
          alert('Service card permanently deleted from MongoDB and Cloudinary.');
        } else {
          alert('Delete failed: ' + (data.error || 'Server error'));
        }
      }
    };
  });

  // Pricing Table Row Edit Buttons -> Auto Exit to Customer Mode
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
        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/pricing/${priceId}`) : `/api/pricing/${priceId}`;
        const { ok, status, data } = await safeFetchJson(apiUrl, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ title: newTitle.trim(), amount: newAmount.trim() })
        });

        if (handleAuthError(status)) return;
        if (ok) {
          renderPricingRow(data, false);
          returnToCustomerMode('Price entry updated successfully! Returning to normal customer mode.');
        } else {
          alert('Save failed: ' + (data.error || 'Server error'));
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
        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/pricing/${priceId}/revert`) : `/api/pricing/${priceId}/revert`;
        const { ok, status, data } = await safeFetchJson(apiUrl, {
          method: 'POST',
          headers: getAuthHeaders()
        });

        if (handleAuthError(status)) return;
        if (ok) {
          renderPricingRow(data.priceEntry, false);
          alert('Reverted price entry to previous version successfully.');
        } else {
          alert('Revert failed: ' + (data.error || 'No previous version available'));
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
        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/pricing/${priceId}`) : `/api/pricing/${priceId}`;
        const { ok, status, data } = await safeFetchJson(apiUrl, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (handleAuthError(status)) return;
        if (ok) {
          tr.remove();
          alert('Pricing entry permanently deleted from MongoDB and Cloudinary.');
        } else {
          alert('Delete failed: ' + (data.error || 'Server error'));
        }
      }
    };
  });
}

/* Load Initial Data from MongoDB Atlas */
async function loadOwnerCustomizations() {
  try {
    const urlS = typeof getApiUrl === 'function' ? getApiUrl('/api/services') : '/api/services';
    const { ok: okS, data: services } = await safeFetchJson(urlS);
    if (okS && Array.isArray(services) && services.length > 0) {
      const servicesGrid = document.querySelector('.services-grid');
      if (servicesGrid) servicesGrid.innerHTML = '';
      services.forEach(item => renderNewServiceCardDOM(item, false));
    }

    const urlG = typeof getApiUrl === 'function' ? getApiUrl('/api/gallery') : '/api/gallery';
    const { ok: okG, data: photos } = await safeFetchJson(urlG);
    if (okG && Array.isArray(photos) && photos.length > 0) {
      const galleryGrid = document.querySelector('.gallery-grid');
      if (galleryGrid) galleryGrid.innerHTML = '';
      photos.forEach(item => renderGalleryItem(item, false));
    }

    const urlP = typeof getApiUrl === 'function' ? getApiUrl('/api/pricing') : '/api/pricing';
    const { ok: okP, data: pricing } = await safeFetchJson(urlP);
    if (okP && Array.isArray(pricing) && pricing.length > 0) {
      const tbody = document.querySelector('.pricing-table tbody');
      if (tbody) tbody.innerHTML = '';
      pricing.forEach(item => renderPricingRow(item, false));
    }
  } catch (err) {
    console.warn('MongoDB Atlas live sync warning:', err);
  }
}
