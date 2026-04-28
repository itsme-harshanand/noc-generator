// ─── LOGO LIBRARY CONFIG ─────────────────────────────────
// Maps normalised company name keywords → known domain
export const LOGO_LIBRARY_CONFIG = {
  "DELL": "dell.com",
  "DELL INTERNATIONAL": "dell.com",
  "TCS": "tcs.com",
  "TATA CONSULTANCY": "tcs.com",
  "INFOSYS": "infosys.com",
  "WIPRO": "wipro.com",
  "ACCENTURE": "accenture.com",
  "COGNIZANT": "cognizant.com",
  "HCL": "hcltech.com",
  "HCL TECHNOLOGIES": "hcltech.com",
  "AMAZON": "amazon.com",
  "GOOGLE": "google.com",
  "MICROSOFT": "microsoft.com",
  "IBM": "ibm.com",
  "CAPGEMINI": "capgemini.com",
  "TECH MAHINDRA": "techmahindra.com",
  "MPHASIS": "mphasis.com",
  "HEXAWARE": "hexaware.com",
  "MINDTREE": "mindtree.com",
  "L&T INFOTECH": "ltimindtree.com",
  "LTI": "ltimindtree.com",
  "LTIMINDTREE": "ltimindtree.com",
  "ORACLE": "oracle.com",
  "SAP": "sap.com",
  "SAMSUNG": "samsung.com",
  "FLIPKART": "flipkart.com",
  "ZOMATO": "zomato.com",
  "SWIGGY": "swiggy.com",
  "PAYTM": "paytm.com",
  "HDFC": "hdfc.com",
  "ICICI": "icicibank.com",
  "SBI": "sbi.co.in",
  "AXIS BANK": "axisbank.com",
  "KOTAK": "kotak.com",
};

const STOP_WORDS = /\b(PVT|PRIVATE|LTD|LIMITED|PTE|INC|CORP|LLC|LLP|CO|THE|OF|AND|FOR|INDIA|SERVICES|TECHNOLOGIES|SOLUTIONS|SYSTEMS|ENTERPRISES|INDUSTRIES|GROUP|INTERNATIONAL|GLOBAL)\b\.?/g;

const MIN_WIDTH = 200;
const MIN_HEIGHT = 80;

export class LogoManager {
  constructor(extraLibrary = {}) {
    this.library = { ...LOGO_LIBRARY_CONFIG, ...extraLibrary };
  }

  // Normalise company name for matching
  _normalise(name) {
    return name.toUpperCase()
      .replace(STOP_WORDS, " ")
      .replace(/[^A-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Find best-matching domain from library
  _findDomain(companyName) {
    const norm = this._normalise(companyName);
    // Exact key match
    if (this.library[norm]) return this.library[norm];
    // Key is contained in company name
    for (const [key, domain] of Object.entries(this.library)) {
      if (norm.includes(key)) return domain;
    }
    // First significant word matches a key
    const firstWord = norm.split(" ")[0];
    for (const [key, domain] of Object.entries(this.library)) {
      if (key.startsWith(firstWord) || firstWord === key.split(" ")[0]) return domain;
    }
    return null;
  }

  // Validate logo quality by loading it as an Image
  validate_logo_quality(url) {
    return new Promise(resolve => {
      const img = new Image();
      const timer = setTimeout(() => resolve({ valid: false, width: 0, height: 0 }), 4000);
      img.onload = () => {
        clearTimeout(timer);
        resolve({
          valid: img.naturalWidth >= MIN_WIDTH && img.naturalHeight >= MIN_HEIGHT,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = () => { clearTimeout(timer); resolve({ valid: false, width: 0, height: 0 }); };
      img.src = url;
    });
  }

  // Try to get a high-quality logo URL for a domain
  async _fetchBestLogo(domain) {
    const sources = [
      `https://img.logo.dev/${domain}?token=pk_anonymous&size=400&format=png`,
      `https://logo.clearbit.com/${domain}?size=400`,
      `https://logo.clearbit.com/${domain}`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    ];
    for (const src of sources) {
      const q = await this.validate_logo_quality(src);
      if (q.valid) return src;
    }
    // Accept any that loads, even if below quality threshold
    for (const src of sources) {
      const loaded = await new Promise(res => {
        const img = new Image();
        const t = setTimeout(() => res(false), 3000);
        img.onload = () => { clearTimeout(t); res(img.naturalWidth > 0); };
        img.onerror = () => { clearTimeout(t); res(false); };
        img.src = src;
      });
      if (loaded) return src;
    }
    return null;
  }

  // Main entry point — returns { url, source, domain } or null
  async get_logo(companyName) {
    const domain = this._findDomain(companyName);
    if (!domain) return null;
    const url = await this._fetchBestLogo(domain);
    if (!url) return null;
    return { url, source: "library", domain };
  }

  // Add a company → domain mapping at runtime
  add_logo_to_library(companyName, domain) {
    this.library[this._normalise(companyName)] = domain;
  }
}

export const logoManager = new LogoManager();
