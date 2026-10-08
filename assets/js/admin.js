/**
 * WISE EXIM - Administration Panel Engine (admin.js)
 * Enables complete control over Products, Email, Phone, Address, WhatsApp, Map URL, and Enquiry Leads.
 */

// Global State
let ADMIN_PRODUCTS = [];
let ADMIN_SETTINGS = {};
let ADMIN_ENQUIRIES = [];
let EDITING_PRODUCT_ID = null;

// Initial Passcode setup
function getAdminPasscode() {
  return localStorage.getItem('wiseexim_admin_passcode') || '1234';
}

function checkAdminAuth() {
  const isAuthed = sessionStorage.getItem('wiseexim_admin_authed') === 'true';
  const loginModal = document.getElementById('loginModal');
  const adminApp = document.getElementById('adminApp');

  if (isAuthed) {
    if (loginModal) loginModal.style.display = 'none';
    if (adminApp) adminApp.style.display = 'block';
    initAdminData();
  } else {
    if (loginModal) loginModal.style.display = 'flex';
    if (adminApp) adminApp.style.display = 'none';
  }
}

function handleLogin(e) {
  e.preventDefault();
  const pinInput = document.getElementById('adminPasscode');
  const errorMsg = document.getElementById('loginError');
  const entered = pinInput.value.trim();

  if (entered === getAdminPasscode()) {
    sessionStorage.setItem('wiseexim_admin_authed', 'true');
    pinInput.value = '';
    if (errorMsg) errorMsg.style.display = 'none';
    checkAdminAuth();
    showToastNotification('Login successful. Welcome to Wise Exim Admin.', 'success');
  } else {
    if (errorMsg) {
      errorMsg.textContent = 'Incorrect passcode. Try default: 1234';
      errorMsg.style.display = 'block';
    }
  }
}

function handleLogout() {
  sessionStorage.removeItem('wiseexim_admin_authed');
  checkAdminAuth();
  showToastNotification('Logged out successfully.', 'info');
}

/**
 * Initialize Admin Data
 */
async function initAdminData() {
  await loadAdminSettings();
  await loadAdminProducts();
  loadAdminEnquiries();
  initTabNavigation();
}

/**
 * 1. Company Settings Management
 */
async function loadAdminSettings() {
  const stored = localStorage.getItem('wiseexim_settings');
  if (stored) {
    try {
      ADMIN_SETTINGS = JSON.parse(stored);
    } catch (e) {
      ADMIN_SETTINGS = {};
    }
  } else {
    try {
      const res = await fetch('data/settings.json?v=' + Date.now());
      if (res.ok) {
        ADMIN_SETTINGS = await res.json();
      }
    } catch (e) {
      ADMIN_SETTINGS = {};
    }
  }

  // Populate settings form fields
  document.getElementById('setPhone').value = ADMIN_SETTINGS.phone || '';
  document.getElementById('setEmail').value = ADMIN_SETTINGS.email || '';
  document.getElementById('setAddress').value = ADMIN_SETTINGS.address || '';
  document.getElementById('setWhatsapp').value = ADMIN_SETTINGS.whatsapp || '';
  document.getElementById('setMapUrl').value = ADMIN_SETTINGS.map_url || '';
}

function handleSaveSettings(e) {
  e.preventDefault();
  ADMIN_SETTINGS = {
    company_name: "Wise Exim",
    phone: document.getElementById('setPhone').value.trim(),
    email: document.getElementById('setEmail').value.trim(),
    address: document.getElementById('setAddress').value.trim(),
    whatsapp: document.getElementById('setWhatsapp').value.trim(),
    map_url: document.getElementById('setMapUrl').value.trim()
  };

  localStorage.setItem('wiseexim_settings', JSON.stringify(ADMIN_SETTINGS));
  showToastNotification('Company details & contact info updated successfully!', 'success');
}

function exportSettingsJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ADMIN_SETTINGS, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "settings.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToastNotification('Downloaded settings.json for project deployment!', 'success');
}

/**
 * 2. Products Management
 */
async function loadAdminProducts() {
  const stored = localStorage.getItem('wiseexim_products');
  if (stored) {
    try {
      ADMIN_PRODUCTS = JSON.parse(stored);
    } catch (e) {
      ADMIN_PRODUCTS = [];
    }
  } else {
    try {
      const res = await fetch('data/products.json?v=' + Date.now());
      if (res.ok) {
        ADMIN_PRODUCTS = await res.json();
      }
    } catch (e) {
      ADMIN_PRODUCTS = [];
    }
  }

  renderAdminProductsTable();
}

function renderAdminProductsTable() {
  const tbody = document.getElementById('adminProductsTbody');
  const countBadge = document.getElementById('adminProductCount');
  if (!tbody) return;

  if (countBadge) countBadge.textContent = ADMIN_PRODUCTS.length;

  if (ADMIN_PRODUCTS.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 30px; color: var(--color-text-muted);">No products found. Click "Add New Product" to create one.</td></tr>`;
    return;
  }

  tbody.innerHTML = ADMIN_PRODUCTS.map(p => `
    <tr>
      <td><strong>#${p.id}</strong></td>
      <td>
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${p.image || 'assets/images/submersible-motor.png'}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 4px; border: 1px solid var(--color-border);" onerror="this.src='assets/images/submersible-motor.png';">
          <div>
            <div style="font-weight: 700; color: var(--color-primary);">${p.name}</div>
            <div style="font-size: 0.8rem; color: #6B7280;">/${p.slug}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-navy">${p.category}</span></td>
      <td>
        ${p.brochure ? `<span class="badge badge-gold">PDF Linked</span>` : `<span class="badge badge-grey">No PDF</span>`}
      </td>
      <td><strong style="color: var(--color-primary);">${p.sort_order || 1}</strong></td>
      <td>
        <button class="badge ${p.status ? 'badge-success' : 'badge-danger'}" onclick="toggleProductStatus(${p.id})" title="Click to toggle active status">
          ${p.status ? 'Active' : 'Hidden'}
        </button>
      </td>
      <td>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline-navy btn-sm" onclick="openEditProductModal(${p.id})">Edit</button>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteProduct(${p.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function saveProductsToStorage() {
  localStorage.setItem('wiseexim_products', JSON.stringify(ADMIN_PRODUCTS));
  renderAdminProductsTable();
}

function toggleProductStatus(id) {
  const prod = ADMIN_PRODUCTS.find(p => p.id === id);
  if (prod) {
    prod.status = !prod.status;
    saveProductsToStorage();
    showToastNotification(`Product "${prod.name}" status updated to ${prod.status ? 'Active' : 'Hidden'}.`, 'info');
  }
}

function deleteProduct(id) {
  const prod = ADMIN_PRODUCTS.find(p => p.id === id);
  if (!prod) return;
  if (confirm(`Are you sure you want to delete "${prod.name}"?`)) {
    ADMIN_PRODUCTS = ADMIN_PRODUCTS.filter(p => p.id !== id);
    saveProductsToStorage();
    showToastNotification('Product deleted successfully.', 'success');
  }
}

function openAddProductModal() {
  EDITING_PRODUCT_ID = null;
  document.getElementById('productModalTitle').textContent = 'Add New Product';
  document.getElementById('productForm').reset();
  document.getElementById('prodId').value = Date.now();
  document.getElementById('prodSortOrder').value = ADMIN_PRODUCTS.length + 1;
  document.getElementById('prodStatus').value = 'true';
  
  const modal = document.getElementById('productFormModal');
  if (modal) modal.classList.add('active');
}

function openEditProductModal(id) {
  const prod = ADMIN_PRODUCTS.find(p => p.id === id);
  if (!prod) return;

  EDITING_PRODUCT_ID = id;
  document.getElementById('productModalTitle').textContent = 'Edit Product';
  document.getElementById('prodId').value = prod.id;
  document.getElementById('prodName').value = prod.name || '';
  document.getElementById('prodSlug').value = prod.slug || '';
  document.getElementById('prodCategory').value = prod.category || 'Submersible Motors';
  document.getElementById('prodImage').value = prod.image || 'assets/images/submersible-motor.png';
  document.getElementById('prodBrochure').value = prod.brochure || '';
  document.getElementById('prodShortDesc').value = prod.short_description || '';
  document.getElementById('prodDesc').value = prod.description || '';
  document.getElementById('prodSortOrder').value = prod.sort_order || 1;
  document.getElementById('prodStatus').value = prod.status ? 'true' : 'false';

  const modal = document.getElementById('productFormModal');
  if (modal) modal.classList.add('active');
}

function closeProductFormModal() {
  const modal = document.getElementById('productFormModal');
  if (modal) modal.classList.remove('active');
}

function handleSaveProductForm(e) {
  e.preventDefault();

  const id = parseInt(document.getElementById('prodId').value) || Date.now();
  const name = document.getElementById('prodName').value.trim();
  const slug = document.getElementById('prodSlug').value.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const category = document.getElementById('prodCategory').value.trim();
  const image = document.getElementById('prodImage').value.trim() || 'assets/images/submersible-motor.png';
  const brochure = document.getElementById('prodBrochure').value.trim();
  const short_description = document.getElementById('prodShortDesc').value.trim();
  const description = document.getElementById('prodDesc').value.trim();
  const sort_order = parseInt(document.getElementById('prodSortOrder').value) || 1;
  const status = document.getElementById('prodStatus').value === 'true';

  const newProductObj = {
    id,
    name,
    slug,
    category,
    short_description,
    description,
    image,
    brochure,
    specifications: [
      { label: "Catalogue Note", value: "Product specifications will be updated based on the final product catalogue." }
    ],
    sort_order,
    status
  };

  const existingIndex = ADMIN_PRODUCTS.findIndex(p => p.id === id);
  if (existingIndex >= 0) {
    ADMIN_PRODUCTS[existingIndex] = newProductObj;
    showToastNotification(`Product "${name}" updated successfully!`, 'success');
  } else {
    ADMIN_PRODUCTS.push(newProductObj);
    showToastNotification(`Product "${name}" added successfully!`, 'success');
  }

  saveProductsToStorage();
  closeProductFormModal();
}

function exportProductsJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ADMIN_PRODUCTS, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "products.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToastNotification('Downloaded updated products.json file!', 'success');
}

/**
 * 3. Enquiries / Leads Manager
 */
function loadAdminEnquiries() {
  try {
    ADMIN_ENQUIRIES = JSON.parse(localStorage.getItem('wiseexim_enquiries') || '[]');
  } catch (e) {
    ADMIN_ENQUIRIES = [];
  }
  renderAdminEnquiriesTable();
}

function renderAdminEnquiriesTable() {
  const tbody = document.getElementById('adminEnquiriesTbody');
  const countBadge = document.getElementById('adminEnquiryCount');
  if (!tbody) return;

  if (countBadge) countBadge.textContent = ADMIN_ENQUIRIES.length;

  if (ADMIN_ENQUIRIES.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 30px; color: var(--color-text-muted);">No quote or contact enquiries received yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = ADMIN_ENQUIRIES.map(eq => `
    <tr>
      <td><small style="color: #6B7280;">${eq.date}</small></td>
      <td><strong>${eq.name}</strong><br><small style="color: #6B7280;">${eq.company}</small></td>
      <td><a href="mailto:${eq.email}">${eq.email}</a></td>
      <td><a href="tel:${eq.phone}">${eq.phone}</a></td>
      <td><span class="badge badge-gold">${eq.requirement}</span></td>
      <td><small>${eq.message ? eq.message.substring(0, 50) + '...' : 'N/A'}</small></td>
      <td>
        <button class="btn btn-outline-danger btn-sm" onclick="deleteEnquiry(${eq.id})">Remove</button>
      </td>
    </tr>
  `).join('');
}

function deleteEnquiry(id) {
  if (confirm('Delete this enquiry lead?')) {
    ADMIN_ENQUIRIES = ADMIN_ENQUIRIES.filter(e => e.id !== id);
    localStorage.setItem('wiseexim_enquiries', JSON.stringify(ADMIN_ENQUIRIES));
    renderAdminEnquiriesTable();
    showToastNotification('Enquiry lead removed.', 'info');
  }
}

function exportEnquiriesCSV() {
  if (ADMIN_ENQUIRIES.length === 0) {
    showToastNotification('No enquiries to export.', 'error');
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,Date,Name,Company,Email,Phone,Country,Quantity,Requirement,Message\n";
  ADMIN_ENQUIRIES.forEach(e => {
    const row = [
      `"${e.date}"`,
      `"${e.name}"`,
      `"${e.company}"`,
      `"${e.email}"`,
      `"${e.phone}"`,
      `"${e.country || 'N/A'}"`,
      `"${e.quantity || 'N/A'}"`,
      `"${e.requirement}"`,
      `"${(e.message || '').replace(/"/g, '""')}"`
    ].join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "wise_exim_enquiries.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToastNotification('Exported enquiries to CSV file.', 'success');
}

/**
 * 4. Passcode Security Management
 */
function handleSavePasscode(e) {
  e.preventDefault();
  const current = document.getElementById('passCurrent').value.trim();
  const newPass = document.getElementById('passNew').value.trim();

  if (current !== getAdminPasscode()) {
    showToastNotification('Current passcode is incorrect.', 'error');
    return;
  }

  if (newPass.length < 4) {
    showToastNotification('New passcode must be at least 4 characters long.', 'error');
    return;
  }

  localStorage.setItem('wiseexim_admin_passcode', newPass);
  document.getElementById('passCurrent').value = '';
  document.getElementById('passNew').value = '';
  showToastNotification('Admin passcode updated successfully!', 'success');
}

/**
 * Tab Navigation
 */
function initTabNavigation() {
  const tabs = document.querySelectorAll('.admin-tab-btn');
  const panes = document.querySelectorAll('.admin-tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.dataset.tab;
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

// DOMReady initialization
document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) settingsForm.addEventListener('submit', handleSaveSettings);

  const productForm = document.getElementById('productForm');
  if (productForm) productForm.addEventListener('submit', handleSaveProductForm);

  const passForm = document.getElementById('passcodeForm');
  if (passForm) passForm.addEventListener('submit', handleSavePasscode);
});
