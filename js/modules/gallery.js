/**
 * Mufina's Artistry - Portfolio Gallery & Lightbox Controller
 */
let currentGalleryIndex = 0;
let visibleGalleryItems = [];

function initGallery() {
  const filterChips = document.querySelectorAll('.gallery-filters .filter-chip');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const category = item.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
      updateVisibleGalleryItems();
    });
  });

  updateVisibleGalleryItems();
  initLightbox();
}

function updateVisibleGalleryItems() {
  visibleGalleryItems = Array.from(document.querySelectorAll('.gallery-item')).filter(item => {
    return item.style.display !== 'none';
  });

  visibleGalleryItems.forEach((item, index) => {
    item.setAttribute('data-index', index);
    item.onclick = (e) => {
      if (document.body.classList.contains('owner-mode-active') && e.target.classList.contains('btn-owner-action')) {
        return;
      }
      openLightbox(index);
    };
  });
}

function initLightbox() {
  const modal = document.getElementById('lightboxModal');
  const closeBtn = document.querySelector('.lightbox-close');
  const prevBtn = document.querySelector('.lightbox-prev');
  const nextBtn = document.querySelector('.lightbox-next');

  if (closeBtn) closeBtn.onclick = closeLightbox;
  if (prevBtn) prevBtn.onclick = showPrevImage;
  if (nextBtn) nextBtn.onclick = showNextImage;

  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) closeLightbox();
    };
  }

  document.addEventListener('keydown', (e) => {
    if (!modal || !modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrevImage();
    if (e.key === 'ArrowRight') showNextImage();
  });
}

function openLightbox(index) {
  const modal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');

  if (!modal || !visibleGalleryItems[index]) return;

  currentGalleryIndex = index;
  const targetItem = visibleGalleryItems[index];
  const imgEl = targetItem.querySelector('img');
  const titleEl = targetItem.querySelector('.gallery-title');

  if (lightboxImg && imgEl) {
    lightboxImg.src = imgEl.src;
    lightboxImg.alt = imgEl.alt;
  }

  if (lightboxCaption && titleEl) {
    lightboxCaption.textContent = titleEl.textContent;
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const modal = document.getElementById('lightboxModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function showPrevImage() {
  if (visibleGalleryItems.length === 0) return;
  currentGalleryIndex = (currentGalleryIndex - 1 + visibleGalleryItems.length) % visibleGalleryItems.length;
  openLightbox(currentGalleryIndex);
}

function showNextImage() {
  if (visibleGalleryItems.length === 0) return;
  currentGalleryIndex = (currentGalleryIndex + 1) % visibleGalleryItems.length;
  openLightbox(currentGalleryIndex);
}
