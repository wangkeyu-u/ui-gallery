/**
 * Batch URL checker — verifies which candidate sites are accessible
 * Then Playwright will screenshot the accessible ones
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ============================================================
// CANDIDATE SITES — compiled from Awwwards, FWA, CSS Awards,
// Webby Awards, and notable design galleries
// ============================================================

const CANDIDATES = [
  // --- Awwwards 2025 SOTD ---
  { id: 'awd-2025-lando-norris', name: 'Lando Norris', url: 'https://lando-norris.com', theme: '产品', source: 'Awwwards SOTY 2025' },
  { id: 'awd-2025-somefolk', name: 'Somefolk®', url: 'https://somefolk.co.uk', theme: '创意机构', source: 'Awwwards SOTD' },
  { id: 'awd-2025-flowfest', name: 'FlowFest 2025', url: 'https://flowfest.co', theme: '品牌体验', source: 'Awwwards SOTD' },
  { id: 'awd-2025-365-cartier', name: '365 — A Year of Cartier', url: 'https://365.cartier.com', theme: '奢侈品牌', source: 'Awwwards SOTD' },
  { id: 'awd-2025-ottografie', name: 'Ottografie 2025', url: 'https://ottografie.nl', theme: '作品集', source: 'Awwwards SOTD' },
  { id: 'awd-2025-rejouice', name: 'REJOUICE®', url: 'https://rejouice.com', theme: '创意机构', source: 'Awwwards SOTD' },
  { id: 'awd-2025-burocratik', name: 'Büro Bürocratik', url: 'https://burocratik.com', theme: '创意机构', source: 'Awwwards SOTD' },
  { id: 'awd-2025-siena-film', name: 'Siena Film Foundation', url: 'https://sienafilmfoundation.com', theme: '文化展览', source: 'Awwwards SOTM' },
  { id: 'awd-2025-quechua', name: 'Quechua 2025 Lookbook', url: 'https://lookbook.quechua.com', theme: '产品', source: 'Awwwards SOTD' },
  { id: 'awd-2025-exat', name: 'Exat typeface', url: 'https://exat.xyz', theme: '品牌', source: 'Awwwards SOTD' },
  { id: 'awd-2025-filip-felbar', name: 'Filip Felbar Portfolio 2025', url: 'https://filipfelbar.com', theme: '作品集', source: 'Awwwards SOTD' },
  { id: 'awd-2025-25-residences', name: '25 Residences', url: 'https://25residences.com', theme: '建筑', source: 'Awwwards SOTD' },
  { id: 'awd-2025-faint-film', name: 'Faint Film', url: 'https://faintfilm.com', theme: '创意', source: 'Awwwards SOTD' },
  { id: 'awd-2025-gianluca', name: 'Gianluca Gradogna Portfolio', url: 'https://gianlucagradogna.com', theme: '作品集', source: 'Awwwards SOTD' },
  { id: 'awd-2025-telescope', name: 'Telescope — Louis Paquet', url: 'https://loupaquet.com', theme: '作品集', source: 'Awwwards SOTD' },
  { id: 'awd-2025-gini-vini', name: 'Gini Vini — ET Studio', url: 'https://etstudio.xyz', theme: '创意', source: 'Awwwards SOTD' },
  
  // --- CSS Awards 2025 ---
  { id: 'css-2025-cartapani', name: 'Cartapani', url: 'https://cartapani.it', theme: '创意机构', source: 'CSS Awards SOTD' },
  { id: 'css-2025-spylt', name: 'SPYLT Milk', url: 'https://spylt.com', theme: '产品', source: 'CSS Awards SOTD' },
  { id: 'css-2025-gufram', name: 'Gufram', url: 'https://gufram.it', theme: '品牌', source: 'CSS Awards SOTD' },
  { id: 'css-2025-bachoo', name: 'Báchoo Design', url: 'https://bachoodesign.com', theme: '创意机构', source: 'CSS Awards SOTD' },
  { id: 'css-2025-tat2', name: 'TAT2 Spirits', url: 'https://tat2spirits.com', theme: '品牌', source: 'CSS Awards SOTD' },
  { id: 'css-2025-soren-west', name: 'Soren West', url: 'https://sorenwest.com', theme: '品牌', source: 'CSS Awards SOTD' },
  { id: 'css-2025-bijou', name: 'Bijou Wines', url: 'https://bijouwines.com', theme: '品牌', source: 'CSS Awards SOTD' },
  { id: 'css-2025-ahadi', name: 'Ahadi', url: 'https://ahadi.fr', theme: '创意', source: 'CSS Awards SOTD' },
  { id: 'css-2025-takamitsu', name: 'Takamitsu Motoyoshi', url: 'https://takamitsumotoyoshi.com', theme: '作品集', source: 'CSS Awards SOTD' },
  
  // --- FWA winners ---
  { id: 'fwa-2024-foodforfish', name: 'Food for Fish', url: 'https://foodforfish.org', theme: '3D / WebGL', source: 'FWA of the Year 2024' },
  { id: 'fwa-2024-hatom', name: 'Hatom', url: 'https://www.hatom.com', theme: '3D / WebGL', source: 'FWA People\'s Choice 2024' },
  { id: 'fwa-2024-la-petite', name: 'La Petite Jumelle', url: 'https://lapetitejumelle.com', theme: '品牌', source: 'FWA of the Day' },
  
  // --- Webby Awards 2024 ---
  { id: 'webby-2024-suno', name: 'Suno AI', url: 'https://suno.com', theme: '产品', source: 'Webby Best Home Page' },
  { id: 'webby-2024-metamask', name: 'MetaMask Learn', url: 'https://learn.metamask.io', theme: '教育', source: 'Webby Best Practices' },
  { id: 'webby-2024-raw-materials', name: 'Raw Materials', url: 'https://therawmaterials.com', theme: '创意机构', source: 'Webby Best Navigation' },
  { id: 'webby-2024-sculpting', name: 'Sculpting Harmony — Disney Hall', url: 'https://gehry.getty.edu', theme: '文化展览', source: 'Webby Best Visual Design' },
  { id: 'webby-2024-shopify', name: 'Shopify Winter \'24 Edition', url: 'https://www.shopify.com/editions', theme: '产品', source: 'Webby Business Blog' },
  
  // --- SaaS / Product ---
  { id: 'prod-notion', name: 'Notion', url: 'https://www.notion.com', theme: '产品', source: 'SaaS' },
  { id: 'prod-runway', name: 'Runway', url: 'https://runwayml.com', theme: '产品', source: 'AI/Creative Tools' },
  { id: 'prod-jasper', name: 'Jasper AI', url: 'https://www.jasper.ai', theme: '产品', source: 'AI SaaS' },
  { id: 'prod-webflow', name: 'Webflow', url: 'https://webflow.com', theme: '产品', source: 'SaaS / Website Builder' },
  { id: 'prod-framer', name: 'Framer', url: 'https://www.framer.com', theme: '产品', source: 'SaaS / Design Tools' },
  { id: 'prod-figma', name: 'Figma', url: 'https://www.figma.com', theme: '产品', source: 'SaaS / Productivity' },
  { id: 'prod-midjourney', name: 'Midjourney', url: 'https://midjourney.com', theme: '产品', source: 'AI Art' },
  { id: 'prod-linear', name: 'Linear', url: 'https://linear.app', theme: '产品', source: 'SaaS / Developer Tools' },
  { id: 'prod-vercel', name: 'Vercel', url: 'https://vercel.com', theme: '产品', source: 'SaaS / Developer Tools' },
  { id: 'prod-stripe', name: 'Stripe', url: 'https://stripe.com', theme: '金融科技', source: 'Fintech' },
  { id: 'prod-loom', name: 'Loom', url: 'https://www.loom.com', theme: '产品', source: 'SaaS' },
  { id: 'prod-clay', name: 'Clay', url: 'https://www.clay.com', theme: '产品', source: 'SaaS' },
  { id: 'prod-attio', name: 'Attio', url: 'https://attio.com', theme: '产品', source: 'SaaS / CRM' },
  { id: 'prod-posthog', name: 'PostHog', url: 'https://posthog.com', theme: '产品', source: 'SaaS / Analytics' },
  { id: 'prod-beehiiv', name: 'Beehiiv', url: 'https://www.beehiiv.com', theme: '产品', source: 'SaaS / Newsletter' },
  { id: 'prod-paddle', name: 'Paddle', url: 'https://www.paddle.com', theme: '金融科技', source: 'Fintech / SaaS' },
  { id: 'prod-deepgram', name: 'Deepgram', url: 'https://deepgram.com', theme: '产品', source: 'AI / Voice' },
  { id: 'prod-github-copilot', name: 'GitHub Copilot', url: 'https://github.com/features/copilot', theme: '产品', source: 'Developer Tools' },
  { id: 'prod-monday', name: 'Monday.com', url: 'https://monday.com', theme: '产品', source: 'SaaS / PM' },
  { id: 'prod-asana', name: 'Asana', url: 'https://asana.com', theme: '产品', source: 'SaaS / PM' },
  { id: 'prod-mixpanel', name: 'Mixpanel', url: 'https://mixpanel.com', theme: '产品', source: 'SaaS / Analytics' },
  { id: 'prod-glossier', name: 'Glossier', url: 'https://glossier.com', theme: '电商', source: 'eCommerce / Beauty' },
  
  // --- Creative Studios / Portfolios ---
  { id: 'studio-drool', name: 'Drool Design Studio', url: 'https://drool.studio', theme: '创意机构', source: 'Web Design Awards' },
  { id: 'studio-non-objective', name: 'Non-Objective Studio', url: 'https://non-objective.studio', theme: '创意', source: 'Readymag WOTY 2024' },
  { id: 'studio-now-here', name: 'Now.Here Studio', url: 'https://nowhere.studio', theme: '创意机构', source: 'Readymag WOTY 2024' },
  { id: 'studio-69pixels', name: '69 Pixels Studio', url: 'https://69pixels.com', theme: '创意机构', source: 'Readymag WOTY 2024' },
  { id: 'studio-baran-ceylan', name: 'Baran Ceylan Portfolio', url: 'https://baranceylan.com', theme: '作品集', source: 'Readymag WOTY 2024' },
  { id: 'studio-aziiata', name: 'Aziiata Septel Portfolio', url: 'https://aziiata.com', theme: '作品集', source: 'Readymag WOTY 2024' },
  { id: 'studio-brittany', name: 'Brittany Chiang', url: 'https://brittanychiang.com', theme: '作品集', source: 'Developer Portfolio' },
  { id: 'studio-josh-comeau', name: 'Josh Comeau', url: 'https://joshwcomeau.com', theme: '作品集', source: 'Developer Portfolio' },
  { id: 'studio-adham', name: 'Adham Dannaway', url: 'https://adhamdannaway.com', theme: '作品集', source: 'Designer Portfolio' },
  { id: 'studio-emre-arolat', name: 'Emre Arolat', url: 'https://emrearolat.com', theme: '建筑', source: 'Horizon Awards' },
  { id: 'studio-complex-universe', name: 'Complex Universe', url: 'https://cxuni.com', theme: '实验', source: 'Horizon Awards' },
  { id: 'studio-stelo', name: 'Stelo', url: 'https://stelo.com', theme: '产品', source: 'Horizon Awards' },
  { id: 'studio-heavn', name: 'HEAVN One', url: 'https://heavn-one.webflow.io', theme: '产品', source: 'Awwwards SOTD' },
  
  // --- Additional notable sites ---
  { id: 'extra-porsche', name: 'Porsche', url: 'https://www.porsche.com', theme: '汽车', source: 'Automotive' },
  { id: 'extra-tesla', name: 'Tesla', url: 'https://www.tesla.com', theme: '汽车', source: 'Automotive' },
  { id: 'extra-audi', name: 'Audi', url: 'https://www.audi.com', theme: '汽车', source: 'Automotive' },
  { id: 'extra-bmw', name: 'BMW', url: 'https://www.bmw.com', theme: '汽车', source: 'Automotive' },
  { id: 'extra-mercedes', name: 'Mercedes-Benz', url: 'https://www.mercedes-benz.com', theme: '汽车', source: 'Automotive' },
  { id: 'extra-nike', name: 'Nike', url: 'https://www.nike.com', theme: '时尚', source: 'Fashion/Sport' },
  { id: 'extra-airbnb', name: 'Airbnb', url: 'https://www.airbnb.com', theme: '产品', source: 'Travel' },
  { id: 'extra-spotify', name: 'Spotify', url: 'https://www.spotify.com', theme: '音乐', source: 'Music' },
  { id: 'extra-netflix', name: 'Netflix', url: 'https://www.netflix.com', theme: '产品', source: 'Media' },
  { id: 'extra-rolex', name: 'Rolex', url: 'https://www.rolex.com', theme: '奢侈品牌', source: 'Luxury' },
  { id: 'extra-hermes', name: 'Hermès', url: 'https://www.hermes.com', theme: '奢侈品牌', source: 'Luxury' },
  { id: 'extra-chanel', name: 'Chanel', url: 'https://www.chanel.com', theme: '奢侈品牌', source: 'Luxury/Fashion' },
  { id: 'extra-tiffany', name: 'Tiffany & Co.', url: 'https://www.tiffany.com', theme: '奢侈品牌', source: 'Luxury/Jewelry' },
  { id: 'extra-omega', name: 'Omega', url: 'https://www.omegawatches.com', theme: '奢侈品牌', source: 'Luxury/Watches' },
  
  // --- More creative/interactive sites ---
  { id: 'extra-resn', name: 'Resn', url: 'https://resn.co.nz', theme: '创意机构', source: 'Interactive' },
  { id: 'extra-droga5', name: 'Droga5', url: 'https://droga5.com', theme: '广告 / 创意', source: 'Agency' },
  { id: 'extra-wieden', name: 'Wieden+Kennedy', url: 'https://www.wk.com', theme: '广告 / 创意', source: 'Agency' },
  { id: 'extra-active-theory', name: 'Active Theory', url: 'https://activetheory.net', theme: '互动体验', source: 'Interactive' },
  { id: 'extra-buck', name: 'Buck', url: 'https://buck.co', theme: '创意', source: 'Design Studio' },
  { id: 'extra-huge', name: 'Huge', url: 'https://huge.co', theme: '数字代理', source: 'Agency' },
  { id: 'extra-razorfish', name: 'Razorfish', url: 'https://www.razorfish.com', theme: '数字代理', source: 'Agency' },
  { id: 'extra-sapient', name: 'Publicis Sapient', url: 'https://www.publicissapient.com', theme: '数字代理', source: 'Agency' },
  
  // --- Tech / Developer ---
  { id: 'extra-github', name: 'GitHub', url: 'https://github.com', theme: '产品', source: 'Developer Tools' },
  { id: 'extra-vercel-docs', name: 'Vercel Docs', url: 'https://vercel.com/docs', theme: '产品', source: 'Developer Tools' },
  { id: 'extra-tailwind', name: 'Tailwind CSS', url: 'https://tailwindcss.com', theme: '产品', source: 'Developer Tools' },
  { id: 'extra-supabase', name: 'Supabase', url: 'https://supabase.com', theme: '产品', source: 'Developer Tools' },
  { id: 'extra-prisma', name: 'Prisma', url: 'https://www.prisma.io', theme: '产品', source: 'Developer Tools' },
  { id: 'extra-clerk', name: 'Clerk', url: 'https://clerk.com', theme: '产品', source: 'Developer Tools' },
  { id: 'extra-resend', name: 'Resend', url: 'https://resend.com', theme: '产品', source: 'Developer Tools' },
  { id: 'extra-shadcn', name: 'shadcn/ui', url: 'https://ui.shadcn.com', theme: '产品', source: 'Developer Tools' },
  
  // --- More award-winning / notable ---
  { id: 'extra-figma-config', name: 'Figma Config', url: 'https://config.figma.com', theme: '品牌体验', source: 'Event' },
  { id: 'extra-linear-method', name: 'Linear Method', url: 'https://linear.app/method', theme: '品牌体验', source: 'Brand' },
  { id: 'extra-stripe-atlas', name: 'Stripe Atlas', url: 'https://stripe.com/atlas', theme: '产品', source: 'Fintech' },
  { id: 'extra-apple-vision', name: 'Apple Vision Pro', url: 'https://www.apple.com/apple-vision-pro', theme: '产品', source: 'Tech' },
  { id: 'extra-openai', name: 'OpenAI', url: 'https://openai.com', theme: '产品', source: 'AI' },
  { id: 'extra-anthropic', name: 'Anthropic', url: 'https://www.anthropic.com', theme: '产品', source: 'AI' },
  { id: 'extra-perplexity', name: 'Perplexity AI', url: 'https://www.perplexity.ai', theme: '产品', source: 'AI' },
  
  // --- More creative sites ---
  { id: 'extra-codrops', name: 'Codrops', url: 'https://tympanus.net/codrops', theme: '实验', source: 'Web Design' },
  { id: 'extra-brutalist', name: 'Brutalist Websites', url: 'https://brutalistwebsites.com', theme: '粗野主义', source: 'Design' },
  { id: 'extra-hoverstats', name: 'HOVERSTAT.ES', url: 'https://hoverstat.es', theme: '实验', source: 'Alt Web' },
  { id: 'extra-web-design-museum', name: 'Web Design Museum', url: 'https://webdesignmuseum.org', theme: '复古互联网', source: 'History' },
  
  // --- More fashion/lifestyle ---
  { id: 'extra-zara', name: 'Zara', url: 'https://www.zara.com', theme: '时尚', source: 'Fashion' },
  { id: 'extra-cos', name: 'COS', url: 'https://www.cos.com', theme: '时尚', source: 'Fashion' },
  { id: 'extra-acne', name: 'Acne Studios', url: 'https://www.acnestudios.com', theme: '时尚', source: 'Fashion' },
  { id: 'extra-offwhite', name: 'Off-White', url: 'https://www.off---white.com', theme: '时尚', source: 'Fashion' },
  
  // --- More hospitality/food ---
  { id: 'extra-aires', name: 'Aesop', url: 'https://www.aesop.com', theme: '品牌', source: 'Beauty/Lifestyle' },
  { id: 'extra-noma', name: 'Noma', url: 'https://noma.dk', theme: '餐饮', source: 'Restaurant' },
  { id: 'extra-eleven-madison', name: 'Eleven Madison Park', url: 'https://www.elevenmadisonpark.com', theme: '餐饮', source: 'Restaurant' },
];

// --- Also try to fix broken existing links ---
const FIXED_LINKS = {
  'proj-2021-two-good-co': 'https://twogood.co',
  'proj-2024-gentlerain': 'https://gentlerain.ai',  // might still be down
  'awd-noomo': 'https://noomo.world',  // try .world
  'awd-tolus': 'https://tolus.co',  // try .co
  'awd-cybernauts': 'https://cybernauts.co',  // try .co
  'awd-velvet': 'https://velvet.co',  // try .co
  'awd-bureau-borsche': 'https://bureau-borsche.de',  // try .de
};

// ============================================================
// URL CHECKER
// ============================================================

function checkUrl(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }, (res) => {
      resolve({ status: res.statusCode, url, ok: res.statusCode >= 200 && res.statusCode < 400 });
    });
    req.on('error', (e) => resolve({ status: 0, url, ok: false, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, url, ok: false, error: 'timeout' }); });
  });
}

async function main() {
  console.log(`Checking ${CANDIDATES.length} candidate URLs...\n`);
  
  const results = [];
  const batchSize = 25;
  
  for (let i = 0; i < CANDIDATES.length; i += batchSize) {
    const batch = CANDIDATES.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(async c => {
      const check = await checkUrl(c.url);
      return { ...c, ...check };
    }));
    results.push(...batchResults);
    process.stdout.write(`Checked ${Math.min(i + batchSize, CANDIDATES.length)}/${CANDIDATES.length}\r`);
  }
  
  const accessible = results.filter(r => r.ok);
  const broken = results.filter(r => !r.ok);
  
  console.log(`\n\n=== RESULTS ===`);
  console.log(`Accessible: ${accessible.length}`);
  console.log(`Broken: ${broken.length}`);
  
  console.log(`\n=== ACCESSIBLE SITES ===`);
  accessible.forEach(r => console.log(`  ✓ ${r.id} | ${r.name} | ${r.url} | ${r.status}`));
  
  console.log(`\n=== BROKEN SITES ===`);
  broken.forEach(r => console.log(`  ✗ ${r.id} | ${r.name} | ${r.url} | ${r.error || r.status}`));
  
  // Save accessible list for screenshot script
  fs.writeFileSync(
    path.join(__dirname, 'accessible-sites.json'),
    JSON.stringify(accessible, null, 2)
  );
  
  console.log(`\nAccessible sites saved to scripts/accessible-sites.json`);
  
  // Also check fixed links for existing broken entries
  console.log(`\n=== CHECKING FIXED LINKS FOR EXISTING ENTRIES ===`);
  const fixedResults = [];
  for (const [id, url] of Object.entries(FIXED_LINKS)) {
    const check = await checkUrl(url);
    fixedResults.push({ id, url, ...check });
    console.log(`  ${check.ok ? '✓' : '✗'} ${id} | ${url} | ${check.status || check.error}`);
  }
  
  fs.writeFileSync(
    path.join(__dirname, 'fixed-links.json'),
    JSON.stringify(fixedResults.filter(r => r.ok), null, 2)
  );
}

main();
