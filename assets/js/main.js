/**
 * WISE EXIM - Core JavaScript Functionality
 * Author: Deepmind Antigravity Pair Programmer
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileMenu();
  initQuoteModal();
  initFormValidation();
  initProductFilterTabs();
});

/* 1. Sticky Header Scroll Effect */
function initStickyHeader() {
  const header = document.querySelector('.main-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/* 2. Mobile Menu Navigation */
function initMobileMenu() {
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const closeBtn = document.querySelector('.mobile-nav-close');
  const overlay = document.querySelector('.mobile-nav-overlay');
  const drawer = document.querySelector('.mobile-nav-drawer');

  if (!hamburgerBtn || !drawer) return;

  function openMenu() {
    overlay.classList.add('active');
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    overlay.classList.remove('active');
    drawer.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);

  // Close on clicking links
  const mobileLinks = drawer.querySelectorAll('a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

/* 3. Quote Request Modal (Event Delegation) */
function initQuoteModal() {
  const modalOverlay = document.getElementById('quoteModal');
  if (!modalOverlay) return;

  // Global event delegation for all static and dynamically generated quote buttons
  document.addEventListener('click', (e) => {
    const openBtn = e.target.closest('.open-quote-modal');
    if (!openBtn) return;

    e.preventDefault();
    const productName = openBtn.getAttribute('data-product') || openBtn.dataset.product;
    const productInput = modalOverlay.querySelector('#modalRequirement');
    
    if (productInput) {
      if (productName && productName.trim() !== '') {
        productInput.value = `Enquiry for: ${productName}`;
      } else {
        productInput.value = '';
      }
    }
    
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  // Close handlers
  const closeBtns = modalOverlay.querySelectorAll('.modal-close, .modal-close-trigger');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

/* 4. Form Validation & Honeypot Spam Protection */
function initFormValidation() {
  const forms = document.querySelectorAll('.validate-form');

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Check honeypot field
      const honeypot = form.querySelector('.hp-field');
      if (honeypot && honeypot.value !== '') {
        // Spam detected silently reject
        return false;
      }

      // Simple required field check
      let isValid = true;
      const requiredInputs = form.querySelectorAll('[required]');
      
      requiredInputs.forEach(input => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = '#EF4444';
        } else {
          input.style.borderColor = '';
        }
      });

      if (!isValid) {
        showToast(form, 'Please fill in all required fields.', 'error');
        return;
      }

      // Successful submission handling
      showToast(form, 'Thank you for your enquiry. Our team will get back to you shortly.', 'success');
      form.reset();

      // If in modal, close after 3 seconds
      const modal = form.closest('.modal-overlay');
      if (modal) {
        setTimeout(() => {
          modal.classList.remove('active');
          document.body.style.overflow = '';
          const toast = form.querySelector('.alert-toast');
          if (toast) toast.style.display = 'none';
        }, 3000);
      }
    });
  });
}

function showToast(form, message, type) {
  let toast = form.querySelector('.alert-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'alert-toast';
    form.prepend(toast);
  }

  toast.textContent = message;
  toast.className = `alert-toast ${type}`;
  toast.style.display = 'block';
}

/* 5. Product Category Filter Tabs */
function initProductFilterTabs() {
  const filterBtns = document.querySelectorAll('.product-filter-btn');
  const categoryBlocks = document.querySelectorAll('.product-category-block');

  if (filterBtns.length === 0 || categoryBlocks.length === 0) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active', 'btn-gold'));
      filterBtns.forEach(b => b.classList.add('btn-outline-navy'));
      
      btn.classList.add('active', 'btn-gold');
      btn.classList.remove('btn-outline-navy');

      const filterValue = btn.dataset.filter;

      categoryBlocks.forEach(block => {
        if (filterValue === 'all' || block.dataset.category === filterValue) {
          block.style.display = 'block';
        } else {
          block.style.display = 'none';
        }
      });
    });
  });
}

/* 6. Product Brochure Download Handler */
function initBrochureDownloads() {
  document.addEventListener('click', (e) => {
    const downloadBtn = e.target.closest('.btn-download-brochure');
    if (!downloadBtn) return;

    e.preventDefault();

    const brochureUrl = downloadBtn.getAttribute('href');
    const downloadFileName = downloadBtn.getAttribute('download') || 'product-brochure.pdf';
    const productName = downloadBtn.getAttribute('aria-label') || 'Product brochure';

    if (!brochureUrl || brochureUrl === '#' || brochureUrl === '') {
      showFloatingNotification('Brochure is currently unavailable. Please contact us for product information.', 'error');
      return;
    }

    // Verify brochure file availability asynchronously to avoid broken links or 404 pages
    fetch(brochureUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          const tempLink = document.createElement('a');
          tempLink.href = brochureUrl;
          tempLink.download = downloadFileName;
          tempLink.target = '_blank';
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);

          showFloatingNotification('Brochure download started.', 'success');
        } else {
          showFloatingNotification('Brochure is currently unavailable. Please contact us for product information.', 'error');
        }
      })
      .catch(() => {
        // Direct download fallback for static environments
        const tempLink = document.createElement('a');
        tempLink.href = brochureUrl;
        tempLink.download = downloadFileName;
        tempLink.target = '_blank';
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
      });
  });
}

/* Global Floating Toast Notification */
function showFloatingNotification(message, type = 'info') {
  let toastContainer = document.querySelector('.floating-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'floating-toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `floating-toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? 'ℹ' : 'ℹ'}</span>
    <span class="toast-message">${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

// Call brochure downloads initialization inside DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initBrochureDownloads();
});

