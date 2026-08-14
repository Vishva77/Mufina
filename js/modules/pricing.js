/**
 * Mufina's Artistry - Pricing Table Filter
 */
function initPricingFilter() {
  const filterChips = document.querySelectorAll('.pricing-filter .filter-chip');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.getAttribute('data-filter');
      const tableRows = document.querySelectorAll('.pricing-table tbody tr');

      tableRows.forEach(row => {
        const category = row.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          row.style.display = 'table-row';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });
}
