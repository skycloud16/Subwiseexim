/**
 * WISE EXIM - Central Settings & Contact Info Binder
 * Synchronizes company phone, email, address, WhatsApp, and Google Map settings dynamically across all pages.
 */

const DEFAULT_SETTINGS = {
  company_name: "Wise Exim",
  phone: "[CLIENT PHONE]",
  email: "[CLIENT EMAIL]",
  address: "E/7+E8/8, GIDC Estate, Sec 26, Gandhinagar 382028",
  whatsapp: "[CLIENT WHATSAPP NUMBER]",
  map_url: "https://maps.google.com/maps?q=GIDC+Estate+Sec+26+Gandhinagar+382028&t=&z=15&ie=UTF8&iwloc=&output=embed"
};

let SITE_SETTINGS = { ...DEFAULT_SETTINGS };

async function loadSiteSettings() {
  // Check local storage overrides first from admin panel
  const savedSettings = localStorage.getItem('wiseexim_settings');
  if (savedSettings) {
    try {
      SITE_SETTINGS = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      applySettingsToDOM();
      return;
    } catch (e) {
      console.warn('Failed to parse localStorage settings, falling back to JSON');
    }
  }

  // Fetch data/settings.json
  try {
    const res = await fetch('data/settings.json?v=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      SITE_SETTINGS = { ...DEFAULT_SETTINGS, ...data };
    }
  } catch (err) {
    console.warn('Could not load settings.json, using defaults');
  }

  applySettingsToDOM();
}

function applySettingsToDOM() {
  const s = SITE_SETTINGS;

  // Phone numbers (Text & Tel Links)
  document.querySelectorAll('.setting-phone-text').forEach(el => {
    el.textContent = s.phone;
  });
  document.querySelectorAll('a[href^="tel:"]').forEach(el => {
    el.href = `tel:${s.phone}`;
  });

  // Email addresses (Text & Mailto Links)
  document.querySelectorAll('.setting-email-text').forEach(el => {
    el.textContent = s.email;
  });
  document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
    el.href = `mailto:${s.email}`;
  });

  // Address
  document.querySelectorAll('.setting-address-text').forEach(el => {
    el.textContent = s.address;
  });

  // WhatsApp links
  document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
    const cleanNumber = s.whatsapp.replace(/[^0-9]/g, '');
    el.href = cleanNumber ? `https://wa.me/${cleanNumber}` : `https://wa.me/${s.whatsapp}`;
  });

  // Google Maps iFrame
  document.querySelectorAll('.setting-map-iframe').forEach(el => {
    if (s.map_url) {
      el.src = s.map_url;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadSiteSettings();
});
