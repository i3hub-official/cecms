// src/lib/security/cspConfig.ts - UPDATED WITH WILDCARDS
export const cspConfig = {
  // Default source for everything
  defaultSrc: [
    "'self'",
    "blob:",
    "data:",
    "https://cecms.vercel.app",
    "https://cecportal.vercel.app",
    "https://apinigeria.vercel.app",
    "https://*.vercel.app",
    // Local development - wildcards
    "https://localhost:*",
    "http://localhost:*", 
    "https://127.0.0.1:*",
    "http://127.0.0.1:*",
    "https://192.168.*:*",
    "http://192.168.*:*",
    "https://10.*:*",
    "http://10.*:*",
    "https://va.vercel-scripts.com",
    "https://*.vercel-scripts.com",
  ],

  // JavaScript sources
  scriptSrc: [
    "'self'",
    "'report-sample'",
    "blob:",
    "'unsafe-inline'", // Required for Next.js/Tailwind
    "'unsafe-eval'", // Required for Next.js dev/runtime
    "https://cecms.vercel.app",
    "https://cecportal.vercel.app",
    "https://apinigeria.vercel.app",
    "https://*.vercel.app",
    // Local development - wildcards
    "https://localhost:*",
    "http://localhost:*",
    "https://127.0.0.1:*",
    "http://127.0.0.1:*", 
    "https://192.168.*:*",
    "http://192.168.*:*",
    "https://10.*:*",
    "http://10.*:*",
    // External services
    "https://apis.google.com",
    "https://www.googletagmanager.com",
    "https://va.vercel-scripts.com",
    "https://*.vercel-scripts.com",
  ],

  // Stylesheets
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind
    "blob:",
    "data:",
    "https://cecms.vercel.app",
    "https://cecportal.vercel.app", 
    "https://apinigeria.vercel.app",
    "https://*.vercel.app",
    // Local development - wildcards
    "https://localhost:*",
    "http://localhost:*",
    "https://127.0.0.1:*",
    "http://127.0.0.1:*",
    "https://192.168.*:*",
    "http://192.168.*:*",
    "https://10.*:*",
    "http://10.*:*",
    // Fonts
    "https://fonts.googleapis.com",
    "https://va.vercel-scripts.com",
    "https://*.vercel-scripts.com",
  ],

  // Images
  imgSrc: [
    "'self'",
    "data:",
    "blob:",
    "https://cecms.vercel.app",
    "https://cecportal.vercel.app",
    "https://apinigeria.vercel.app",
    "https://*.vercel.app",
    // Local development - wildcards
    "https://localhost:*",
    "http://localhost:*",
    "https://127.0.0.1:*",
    "http://127.0.0.1:*",
    "https://192.168.*:*",
    "http://192.168.*:*",
    "https://10.*:*",
    "http://10.*:*",
    // External image services
    "https://ui-avatars.com",
    "https://*.ui-avatars.com",
    "https://res.cloudinary.com",
    "https://*.cloudinary.com",
    "https://pravatar.cc",
    "https://*.pravatar.cc",
    "https://i.pravatar.cc",
    "https://*.i.pravatar.cc",
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://stats.g.doubleclick.net",
    "https://*.doubleclick.net",
  ],

  // Fonts
  fontSrc: [
    "'self'",
    "data:",
    "blob:",
    "https://cecms.vercel.app",
    "https://cecportal.vercel.app",
    "https://apinigeria.vercel.app",
    "https://*.vercel.app",
    // Local development - wildcards
    "https://localhost:*",
    "http://localhost:*",
    "https://127.0.0.1:*",
    "http://127.0.0.1:*",
    "https://192.168.*:*",
    "http://192.168.*:*",
    "https://10.*:*",
    "http://10.*:*",
    // Font providers
    "https://fonts.gstatic.com",
    "https://*.gstatic.com",
    "https://va.vercel-scripts.com",
    "https://*.vercel-scripts.com",
  ],

  // Connections - MOST IMPORTANT (for API calls)
  connectSrc: [
    "'self'",
    "blob:",
    "data:",
    "wss:", // Allow all WebSocket connections
    "ws:", // Allow all WebSocket connections
    // Your domains
    "https://cecms.vercel.app",
    "https://cecportal.vercel.app",
    "https://apinigeria.vercel.app",
    "https://*.vercel.app",
    // Local development - COMPLETE WILDCARDS
    "https://localhost:*",
    "http://localhost:*",
    "https://127.0.0.1:*",
    "http://127.0.0.1:*",
    "https://192.168.*:*",
    "http://192.168.*:*",
    "https://10.*:*",
    "http://10.*:*",
    // WebSocket wildcards
    "ws://localhost:*",
    "ws://127.0.0.1:*",
    "ws://192.168.*:*",
    "ws://10.*:*",
    "wss://localhost:*",
    "wss://127.0.0.1:*",
    "wss://192.168.*:*",
    "wss://10.*:*",
    // Analytics
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://stats.g.doubleclick.net",
    "https://*.doubleclick.net",
    // External IP APIs
    "https://api.ipify.org",
    "https://*.ipify.org",
    "https://api.my-ip.io",
    "https://*.my-ip.io",
    "https://ipecho.net",
    "https://*.ipecho.net",
    "https://ident.me",
    "https://*.ident.me",
    "https://icanhazip.com",
    "https://*.icanhazip.com",
    // Vercel
    "https://va.vercel-scripts.com",
    "https://*.vercel-scripts.com",
    "https://vercel.live",
    "wss://vercel.live",
  ],

  // Media
  mediaSrc: [
    "'self'",
    "blob:",
    "data:",
    "https://cecms.vercel.app",
    "https://cecportal.vercel.app",
    "https://apinigeria.vercel.app",
    "https://*.vercel.app",
    // Local development - wildcards
    "https://localhost:*",
    "http://localhost:*",
    "https://127.0.0.1:*",
    "http://127.0.0.1:*",
    "https://192.168.*:*",
    "http://192.168.*:*",
    "https://10.*:*",
    "http://10.*:*",
  ],

  // Frames
  frameSrc: [
    "'self'",
    "blob:",
    "https://cecms.vercel.app",
    "https://cecportal.vercel.app",
    "https://apinigeria.vercel.app",
    "https://*.vercel.app",
    // Local development - wildcards
    "https://localhost:*",
    "http://localhost:*",
    "https://127.0.0.1:*",
    "http://127.0.0.1:*",
    "https://192.168.*:*",
    "http://192.168.*:*",
    "https://10.*:*",
    "http://10.*:*",
    // Google services
    "https://www.google.com",
    "https://accounts.google.com",
  ],

  // Objects
  objectSrc: ["'self'", "blob:"],

  // Base URI
  baseUri: ["'self'"],

  // Form actions
  formAction: [
    "'self'",
    "https://cecms.vercel.app",
    "https://cecportal.vercel.app",
    "https://apinigeria.vercel.app",
    "https://*.vercel.app",
  ],

  // Security directives
  frameAncestors: ["'self'"],
  upgradeInsecureRequests: [],
  blockAllMixedContent: [],

  // Reporting
  reportUri: ["/api/csp-violation-report"],
  reportTo: ["default"],
};

// Development-specific config (even more permissive)
export const devCspConfig = {
  ...cspConfig,
  // Even more permissive for development
  connectSrc: [
    ...cspConfig.connectSrc,
    "*", // Allow all connections in dev (BE CAREFUL!)
  ],
  scriptSrc: [
    ...cspConfig.scriptSrc,
    "'unsafe-inline'",
    "'unsafe-eval'",
  ],
  styleSrc: [
    ...cspConfig.styleSrc,
    "'unsafe-inline'",
  ],
};

// Production config (stricter)
export const prodCspConfig = {
  ...cspConfig,
  // Remove overly permissive rules for production
  connectSrc: cspConfig.connectSrc.filter(src => src !== "*"),
  scriptSrc: [...cspConfig.scriptSrc.filter(src => 
    src !== "'unsafe-inline'" && src !== "'unsafe-eval'"
  ), "'strict-dynamic'"],
};

// Pick config by environment
export const getCspConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    return prodCspConfig;
  }
  
  // For development, use dev config
  console.log('Using DEV CSP config with wildcards');
  return devCspConfig;
};

// Helper to generate CSP header
export const generateCspHeader = (config: any): string => {
  const directives = [
    `default-src ${config.defaultSrc.join(' ')}`,
    `script-src ${config.scriptSrc.join(' ')}`,
    `style-src ${config.styleSrc.join(' ')}`,
    `img-src ${config.imgSrc.join(' ')}`,
    `font-src ${config.fontSrc.join(' ')}`,
    `connect-src ${config.connectSrc.join(' ')}`,
    `media-src ${config.mediaSrc.join(' ')}`,
    `frame-src ${config.frameSrc.join(' ')}`,
    `object-src ${config.objectSrc.join(' ')}`,
    `base-uri ${config.baseUri.join(' ')}`,
    `form-action ${config.formAction.join(' ')}`,
    `frame-ancestors ${config.frameAncestors.join(' ')}`,
  ];

  // Add optional directives
  if (config.upgradeInsecureRequests?.length) {
    directives.push(`upgrade-insecure-requests`);
  }
  if (config.blockAllMixedContent?.length) {
    directives.push(`block-all-mixed-content`);
  }
  if (config.reportUri?.length) {
    directives.push(`report-uri ${config.reportUri.join(' ')}`);
  }
  if (config.reportTo?.length) {
    directives.push(`report-to ${config.reportTo.join(' ')}`);
  }

  return directives.join('; ') + ';';
};