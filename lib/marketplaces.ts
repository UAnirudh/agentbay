export interface MarketplaceInfo {
  id: string;
  name: string;
  color: string;
  domain: string;
  searchUrl: (query: string) => string;
  logoChar: string;
}

export const MARKETPLACES: Record<string, MarketplaceInfo> = {
  agentbay: {
    id: "agentbay",
    name: "AgentBay",
    color: "brand",
    domain: "agentbay.ai",
    searchUrl: (q) => `/test/marketplace?q=${encodeURIComponent(q)}`,
    logoChar: "A",
  },
  ebay: {
    id: "ebay",
    name: "eBay",
    color: "amber",
    domain: "ebay.com",
    searchUrl: (q) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}`,
    logoChar: "e",
  },
  facebook: {
    id: "facebook",
    name: "Facebook Marketplace",
    color: "blue",
    domain: "facebook.com",
    searchUrl: (q) => `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(q)}`,
    logoChar: "f",
  },
  craigslist: {
    id: "craigslist",
    name: "Craigslist",
    color: "purple",
    domain: "craigslist.org",
    searchUrl: (q) => `https://www.craigslist.org/search/sss?query=${encodeURIComponent(q)}`,
    logoChar: "C",
  },
  offerup: {
    id: "offerup",
    name: "OfferUp",
    color: "green",
    domain: "offerup.com",
    searchUrl: (q) => `https://offerup.com/search?q=${encodeURIComponent(q)}`,
    logoChar: "O",
  },
  mercari: {
    id: "mercari",
    name: "Mercari",
    color: "pink",
    domain: "mercari.com",
    searchUrl: (q) => `https://www.mercari.com/search/?keyword=${encodeURIComponent(q)}`,
    logoChar: "M",
  },
  amazon: {
    id: "amazon",
    name: "Amazon",
    color: "amber",
    domain: "amazon.com",
    searchUrl: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
    logoChar: "a",
  },
  etsy: {
    id: "etsy",
    name: "Etsy",
    color: "amber",
    domain: "etsy.com",
    searchUrl: (q) => `https://www.etsy.com/search?q=${encodeURIComponent(q)}`,
    logoChar: "E",
  },
  poshmark: {
    id: "poshmark",
    name: "Poshmark",
    color: "pink",
    domain: "poshmark.com",
    searchUrl: (q) => `https://poshmark.com/search?query=${encodeURIComponent(q)}`,
    logoChar: "P",
  },
};

export function resolveMarketplace(source: string): MarketplaceInfo {
  const key = source.toLowerCase().trim();
  return MARKETPLACES[key] || {
    id: key,
    name: source,
    color: "slate",
    domain: source,
    searchUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q + " " + source)}`,
    logoChar: source.charAt(0).toUpperCase(),
  };
}

export function buildSearchUrl(source: string, query: string): string {
  return resolveMarketplace(source).searchUrl(query);
}
