/**
 * Second batch of candidate URLs — from Awwwards agency collection
 * and 2024 annual awards
 */

const CANDIDATES_BATCH2 = [
  // Awwwards agency collection
  { id: 'awd-driftime', name: 'Driftime®', url: 'https://driftime.com', theme: '创意机构', source: 'Awwwards HM Sep 2025' },
  { id: 'awd-martin-briceno', name: 'Martin Briceno Portfolio', url: 'https://martinbriceno.com', theme: '作品集', source: 'Awwwards SOTD Aug 2025' },
  { id: 'awd-aker-oimachi', name: 'Aker Oimachi', url: 'https://aker-oimachi.com', theme: '建筑', source: 'Awwwards SOTD Nov 2024' },
  { id: 'awd-vucko', name: 'Vucko™', url: 'https://vucko.com', theme: '创意机构', source: 'Awwwards SOTD Oct 2023' },
  { id: 'awd-better-off', name: 'Better Off®', url: 'https://betteroff.studio', theme: '创意机构', source: 'Awwwards SOTD Aug 2024' },
  { id: 'awd-humaan', name: 'Humaan', url: 'https://humaan.com', theme: '创意机构', source: 'Awwwards SOTD Feb 2024' },
  { id: 'awd-alpha-tango', name: 'Alpha Tango', url: 'https://alphatango.com', theme: '创意机构', source: 'Awwwards SOTD Nov 2023' },
  { id: 'awd-duo-studio', name: 'Duo Studio', url: 'https://duostudio.co', theme: '创意机构', source: 'Awwwards HM Jun 2023' },
  { id: 'awd-unikorns', name: 'Unikorns Agency', url: 'https://unikorns.com', theme: '创意机构', source: 'Awwwards SOTD Aug 2023' },
  { id: 'awd-makepill', name: 'Makepill', url: 'https://makepill.com', theme: '创意机构', source: 'Awwwards SOTD Aug 2023' },
  { id: 'awd-bright-digital', name: 'BRIGHT Digital Studio', url: 'https://brights.studio', theme: '创意机构', source: 'Awwwards SOTD Sep 2023' },
  { id: 'awd-cenitz', name: 'Cenitz Studio', url: 'https://cenitz.studio', theme: '创意机构', source: 'Awwwards SOTD Oct 2023' },
  { id: 'awd-pandapay', name: 'PandaPay®', url: 'https://pandapay.io', theme: '产品', source: 'Awwwards SOTD Jun 2023' },
  { id: 'awd-spring-summer', name: 'Spring/Summer', url: 'https://springsummer.studio', theme: '创意机构', source: 'Awwwards SOTD Sep 2023' },
  { id: 'awd-qude', name: 'Qude', url: 'https://qude.co', theme: '创意机构', source: 'Awwwards SOTD Jun 2023' },
  { id: 'awd-lightship', name: 'Lightship', url: 'https://lightship.com', theme: '产品', source: 'Awwwards SOTD Apr 2023' },
  { id: 'awd-resonant-link', name: 'Resonant Link', url: 'https://resonant-link.com', theme: '产品', source: 'Awwwards SOTD Feb 2023' },
  { id: 'awd-base-creative', name: 'Base Creative® Portfolio', url: 'https://base-creative.co', theme: '作品集', source: 'Awwwards HM Mar 2023' },
  
  // Awwwards 2024 Annual Awards
  { id: 'awd-2024-igloo', name: 'Igloo Inc', url: 'https://igloocorp.co', theme: '创意机构', source: 'Awwwards SOTY 2024' },
  { id: 'awd-2024-opal', name: 'Opal Tadpole', url: 'https://opal.com', theme: '产品', source: 'Awwwards E-commerce of the Year' },
  { id: 'awd-2024-dont-board', name: 'Don\'t Board Me', url: 'https://dontboardme.com', theme: '品牌体验', source: 'Awwwards Users\' Choice' },
  
  // Louis Paquet works
  { id: 'awd-silent-house', name: 'Silent House', url: 'https://silenthouse.global', theme: '创意机构', source: 'Awwwards SOTD Apr 2026' },
  { id: 'awd-adovasio', name: 'Adovasio', url: 'https://adovasio.com', theme: '文化展览', source: 'Awwwards SOTD Mar 2026' },
  { id: 'awd-heloise', name: 'Héloïse Thibodeau Architecte', url: 'https://heloisethibodeau.com', theme: '建筑', source: 'Awwwards SOTD Oct 2024' },
  { id: 'awd-afterglo', name: 'Afterglo', url: 'https://afterglo.co', theme: '品牌', source: 'Awwwards SOTD Jun 2021' },
  { id: 'awd-maxima', name: 'Maxima Therapy', url: 'https://maximatherapy.com', theme: '产品', source: 'Awwwards SOTD Apr 2026' },
  { id: 'awd-vazzi', name: 'Vazzi', url: 'https://vazzi.com', theme: '品牌', source: 'Awwwards SOTD Nov 2024' },
  { id: 'awd-c2-montreal', name: 'C2 Montréal', url: 'https://c2montreal.com', theme: '品牌体验', source: 'Awwwards SOTM May 2023' },
  { id: 'awd-mana-yerba', name: 'Mana Yerba Mate', url: 'https://manayerbamate.com', theme: '品牌', source: 'Awwwards SOTY 2023' },
  { id: 'awd-ma-saigon', name: 'Má Sài Gòn', url: 'https://masaigon.space', theme: '品牌', source: 'Awwwards SOTD Apr 2024' },
  
  // Recent Awwwards homepage
  { id: 'awd-razorpay-sprint', name: 'Razorpay Sprint 26', url: 'https://razorpay.com/sprint', theme: '产品', source: 'Awwwards' },
  { id: 'awd-cartier-watches', name: 'Cartier Watches & Wonders 2026', url: 'https://watchesandwonders.cartier.com', theme: '奢侈品牌', source: 'Awwwards' },
  { id: 'awd-cleo-ai', name: 'Cleo AI', url: 'https://web.archive.org/web/2024/https://web.meetcleo.com', theme: '金融科技', source: 'Awwwards' },
  { id: 'awd-sidewave', name: 'Sidewave', url: 'https://sidewave.com', theme: '创意机构', source: 'Awwwards' },
  { id: 'awd-la-revoltosa', name: 'La Revoltosa', url: 'https://larevoltosa.com', theme: '品牌', source: 'Awwwards' },
  { id: 'awd-air-vide-infra', name: 'AIR — Vide Infra', url: 'https://air.videinfra.com', theme: '3D / WebGL', source: 'Awwwards SOTD May 2026' },
  
  // More notable sites
  { id: 'extra-dennis-snellenberg', name: 'Dennis Snellenberg Portfolio', url: 'https://dennissnellenberg.com', theme: '作品集', source: 'Developer Portfolio' },
  { id: 'extra-jesper-landberg', name: 'Jesper Landberg', url: 'https://jesperlandberg.dev', theme: '作品集', source: 'Awwwards Independent of the Year' },
  { id: 'extra-paper-tiger', name: 'Paper Tiger', url: 'https://papertiger.com', theme: '创意机构', source: 'Studio' },
  { id: 'extra-locus', name: 'Locus', url: 'https://locus.studio', theme: '创意机构', source: 'Studio' },
  { id: 'extra-richter', name: 'Richter Studio', url: 'https://richterstudio.com', theme: '创意机构', source: 'Studio' },
  { id: 'extra-hornet', name: 'Hornet', url: 'https://hornet.com', theme: '创意', source: 'Animation Studio' },
  { id: 'extra-mediamonks', name: 'MediaMonks', url: 'https://www.mediamonks.com', theme: '数字代理', source: 'Agency' },
  { id: 'extra-hello-monday', name: 'Hello Monday', url: 'https://www.hellomonday.com', theme: '创意机构', source: 'Agency' },
  
  // Product / tech
  { id: 'extra-raycast', name: 'Raycast', url: 'https://www.raycast.com', theme: '产品', source: 'Developer Tools' },
  { id: 'extra-cursor', name: 'Cursor', url: 'https://cursor.com', theme: '产品', source: 'AI / Developer Tools' },
  { id: 'extra-v0', name: 'v0 by Vercel', url: 'https://v0.dev', theme: '产品', source: 'AI / Developer Tools' },
  { id: 'extra-bolt', name: 'Bolt', url: 'https://bolt.new', theme: '产品', source: 'AI / Developer Tools' },
  { id: 'extra-windsurf', name: 'Windsurf', url: 'https://windsurf.com', theme: '产品', source: 'AI / Developer Tools' },
  { id: 'extra-lemonsqueezy', name: 'Lemon Squeezy', url: 'https://lemonsqueezy.com', theme: '产品', source: 'SaaS' },
  { id: 'extra-mux', name: 'Mux', url: 'https://www.mux.com', theme: '产品', source: 'SaaS / Video' },
  { id: 'extra-dub', name: 'Dub', url: 'https://dub.co', theme: '产品', source: 'SaaS' },
  { id: 'extra-plain', name: 'Plain', url: 'https://plain.com', theme: '产品', source: 'SaaS' },
  { id: 'extra-convex', name: 'Convex', url: 'https://convex.dev', theme: '产品', source: 'Developer Tools' },
  { id: 'extra-trigger', name: 'Trigger.dev', url: 'https://trigger.dev', theme: '产品', source: 'Developer Tools' },
  { id: 'extra-inngest', name: 'Inngest', url: 'https://www.inngest.com', theme: '产品', source: 'Developer Tools' },
  
  // E-commerce / fashion
  { id: 'extra-allbirds', name: 'Allbirds', url: 'https://www.allbirds.com', theme: '电商', source: 'eCommerce' },
  { id: 'extra-outdoor-voices', name: 'Outdoor Voices', url: 'https://www.outdoorvoices.com', theme: '电商', source: 'eCommerce' },
  { id: 'extra-glossier-d', name: 'Glossier (DTC)', url: 'https://glossier.com', theme: '电商', source: 'eCommerce' },
  { id: 'extra-warby-parker', name: 'Warby Parker', url: 'https://www.warbyparker.com', theme: '电商', source: 'eCommerce' },
  { id: 'extra-casper', name: 'Casper', url: 'https://casper.com', theme: '电商', source: 'eCommerce' },
  { id: 'extra-everlane', name: 'Everlane', url: 'https://everlane.com', theme: '电商', source: 'eCommerce' },
  
  // More creative
  { id: 'extra-uniqlo', name: 'Uniqlo', url: 'https://www.uniqlo.com', theme: '时尚', source: 'Fashion' },
  { id: 'extra-muji', name: 'Muji', url: 'https://www.muji.com', theme: '品牌', source: 'Lifestyle' },
  { id: 'extra-kinfolk', name: 'Kinfolk', url: 'https://kinfolk.com', theme: '编辑设计', source: 'Magazine' },
  { id: 'extra-aesop-d', name: 'Aesop (alternate)', url: 'https://www.aesop.com/cn', theme: '品牌', source: 'Beauty/Lifestyle' },
];

module.exports = CANDIDATES_BATCH2;
