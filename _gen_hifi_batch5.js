// Batch 5 hifi generator — produces build.hifi.v1.html for 11 sites.
const fs = require('fs');
const path = require('path');
const ROOT = '/Users/wangkeyu/WorkBuddy/2026-07-12-02-47-36';

const SEMANTIC_KF = `@-webkit-keyframes labeled-button-icon-loading  {
  0%  {
  transform: translateY(-50%) rotate(0deg);
  } 100%  {
  transform: translateY(-50%) rotate(360deg);
  }
}
@-webkit-keyframes icon-loading  {
  0%  {
  transform: rotate(0deg);
  } 100%  {
  transform: rotate(360deg);
  }
}
@-webkit-keyframes loader  {
  0%  {
  transform: rotate(0deg);
  } 100%  {
  transform: rotate(360deg);
  }
}
@-webkit-keyframes placeholderShimmer  {
  0%  {
  background-position: -1200px 0px;
  } 100%  {
  background-position: 1200px 0px;
  }
}
@-webkit-keyframes progress-active  {
  0%  {
  opacity: 0.3;
  width: 0px;
  } 100%  {
  opacity: 0;
  width: 100%;
  }
}
@-webkit-keyframes browseIn  {
  0%  {
  transform: scale(0.8) translateZ(0px);
  z-index: -1;
  } 10%  {
  transform: scale(0.8) translateZ(0px);
  z-index: -1;
  opacity: 0.7;
  } 80%  {
  transform: scale(1.05) translateZ(0px);
  opacity: 1;
  z-index: 999;
  } 100%  {
  transform: scale(1) translateZ(0px);
  z-index: 999;
  }
}
@-webkit-keyframes browseOutLeft  {
  0%  {
  z-index: 999;
  transform: translateX(0px) rotateY(0deg) rotateX(0deg);
  } 50%  {
  z-index: -1;
  transform: translateX(-105%) rotateY(35deg) rotateX(10deg) translateZ(-10px);
  } 80%  {
  opacity: 1;
  } 100%  {
  z-index: -1;
  transform: translateX(0px) rotateY(0deg) rotateX(0deg) translateZ(-10px);
  opacity: 0;
  }
}
@-webkit-keyframes browseOutRight  {
  0%  {
  z-index: 999;
  transform: translateX(0px) rotateY(0deg) rotateX(0deg);
  } 50%  {
  z-index: 1;
  transform: translateX(105%) rotateY(35deg) rotateX(10deg) translateZ(-10px);
  } 80%  {
  opacity: 1;
  } 100%  {
  z-index: 1;
  transform: translateX(0px) rotateY(0deg) rotateX(0deg) translateZ(-10px);
  opacity: 0;
  }
}
@-webkit-keyframes dropIn  {
  0%  {
  opacity: 0;
  transform: scale(0);
  } 100%  {
  opacity: 1;
  transform: scale(1);
  }
}
@-webkit-keyframes dropOut  {
  0%  {
  opacity: 1;
  transform: scale(1);
  } 100%  {
  opacity: 0;
  transform: scale(0);
  }
}
@-webkit-keyframes fadeIn  {
  0%  {
  opacity: 0;
  } 100%  {
  opacity: 1;
  }
}
@-webkit-keyframes fadeInUp  {
  0%  {
  opacity: 0;
  transform: translateY(10%);
  } 100%  {
  opacity: 1;
  transform: translateY(0px);
  }
}
@-webkit-keyframes fadeInDown  {
  0%  {
  opacity: 0;
  transform: translateY(-10%);
  } 100%  {
  opacity: 1;
  transform: translateY(0px);
  }
}
@-webkit-keyframes fadeInLeft  {
  0%  {
  opacity: 0;
  transform: translateX(10%);
  } 100%  {
  opacity: 1;
  transform: translateX(0px);
  }
}`;

const SPECTRE_KF = `@keyframes loading  {
  0%  {
  transform: rotate(0deg);
  } 100%  {
  transform: rotate(360deg);
  }
}
@keyframes slide-down  {
  0%  {
  opacity: 0;
  transform: translateY(-1.6rem);
  } 100%  {
  opacity: 1;
  transform: translateY(0px);
  }
}
@keyframes carousel-slidein  {
  0%  {
  transform: translateX(100%);
  } 100%  {
  transform: translateX(0px);
  }
}
@keyframes carousel-slideout  {
  0%  {
  opacity: 1;
  transform: translateX(0px);
  } 100%  {
  opacity: 1;
  transform: translateX(-50%);
  }
}
@keyframes first-run  {
  0%  {
  width: 0px;
  } 25%  {
  width: 2.4rem;
  } 50%  {
  width: 0.8rem;
  } 75%  {
  width: 1.2rem;
  } 100%  {
  width: 0px;
  }
}
@keyframes progress-indeterminate  {
  0%  {
  background-position: 200% 0px;
  } 100%  {
  background-position: -200% 0px;
  }
}
@keyframes sbx-reset-in  {
  0%  {
  opacity: 0;
  transform: translate3d(-20%, 0px, 0px);
  } 100%  {
  opacity: 1;
  transform: none;
  }
}`;

const FLUENT_KF = `@keyframes rb7n1on  {
  0%  {
  transform: rotate(0deg);
  } 100%  {
  transform: rotate(360deg);
  }
}
@keyframes r1gx3jof  {
  0%  {
  transform: rotate(0deg);
  } 100%  {
  transform: rotate(-360deg);
  }
}
@keyframes r15mim6k  {
  0%  {
  transform: rotate(-135deg);
  } 50%  {
  transform: rotate(0deg);
  } 100%  {
  transform: rotate(225deg);
  }
}
@keyframes r18vhmn8  {
  0%  {
  transform: rotate(0deg);
  } 50%  {
  transform: rotate(105deg);
  } 100%  {
  transform: rotate(0deg);
  }
}
@keyframes rkgrvoi  {
  0%  {
  transform: rotate(0deg);
  } 50%  {
  transform: rotate(225deg);
  } 100%  {
  transform: rotate(0deg);
  }
}
@keyframes r109gmi5  {
  0%  {
  transform: rotate(135deg);
  } 50%  {
  transform: rotate(0deg);
  } 100%  {
  transform: rotate(-225deg);
  }
}
@keyframes r17whflh  {
  0%  {
  transform: rotate(0deg);
  } 50%  {
  transform: rotate(-105deg);
  } 100%  {
  transform: rotate(0deg);
  }
}
@keyframes re4odhl  {
  0%  {
  transform: rotate(0deg);
  } 50%  {
  transform: rotate(-225deg);
  } 100%  {
  transform: rotate(0deg);
  }
}
@keyframes f1efwx7q  {
  100%  {
  transform: translate(100%);
  }
}
@keyframes f1kkgpz1  {
  100%  {
  transform: translate(-100%);
  }
}
@keyframes f12o7gg6  {
  0%  {
  opacity: 1;
  } 50%  {
  opacity: 0.4;
  } 100%  {
  opacity: 1;
  }
}`;

const ALIGNUI_KF = `@keyframes cm-blink  {
  50%  {
  opacity: 0;
  }
}
@keyframes cm-blink2  {
  50%  {
  opacity: 0;
  }
}
@keyframes flash-code  {
  0%  {
  background-color: rgba(46, 46, 15, 0.18);
  } 100%  {
  background-color: transparent;
  }
}
@keyframes heroBlock  {
  100%  {
  transform: translateZ(0px);
  opacity: 1;
  }
}
@keyframes heroDynamicIsland  {
  100%  {
  filter: blur(0px);
  opacity: 1;
  }
}
@keyframes heroDynamicIslandExit  {
  100%  {
  filter: blur(4px);
  transform: translate3d(-50%, 0px, 0px) scale(0.95);
  opacity: 0;
  }
}
@keyframes heroTemplates  {
  0%  {
  transform: translateZ(0px) scale(0.98);
  filter: blur(4px);
  opacity: 0.8;
  } 100%  {
  transform: translateZ(0px) scale(1);
  filter: blur(0px);
  opacity: 1;
  }
}
@keyframes spark  {
  0%  {
  transform: translateY(-100%);
  } 100%  {
  transform: translateY(var(--to,1000px));
  }
}
@keyframes enter  {
  0%  {
  opacity: var(--tw-enter-opacity,1);
  transform: translate3d(var(--tw-enter-translate-x,0),var(--tw-enter-translate-y,0),0) scale3d(var(--tw-enter-scale,1),var(--tw-enter-scale,1),var(--tw-enter-scale,1)) rotate(var(--tw-enter-rotate,0));
  }
}
@keyframes exit  {
  100%  {
  opacity: var(--tw-exit-opacity,1);
  transform: translate3d(var(--tw-exit-translate-x,0),var(--tw-exit-translate-y,0),0) scale3d(var(--tw-exit-scale,1),var(--tw-exit-scale,1),var(--tw-exit-scale,1)) rotate(var(--tw-exit-rotate,0));
  }
}
@keyframes rapid-b-item  {
  100%  {
  opacity: 1;
  transform: translateZ(0px);
  filter: blur(0px);
  }
}
@keyframes mobile-menu-open  {
  0%  {
  opacity: 0;
  transform: translate3d(-100%, 0px, 0px);
  } 100%  {
  opacity: 1;
  transform: translateZ(0px);
  }
}
@keyframes mobile-menu-close  {
  0%  {
  opacity: 1;
  transform: translateZ(0px);
  } 100%  {
  opacity: 0;
  transform: translate3d(-100%, 0px, 0px);
  }
}
@keyframes mobile-menu-item-in  {
  100%  {
  opacity: 1;
  filter: blur(0px);
  transform: translateZ(0px);
  }
}`;

const BASEUI_KF = `@keyframes spin  {
  100%  {
  transform: rotate(1turn);
  }
}`;

const KIBOUI_KF = `@keyframes ping  {
  75%, 100%  {
  opacity: 0;
  transform: scale(2);
  }
}
@keyframes pulse  {
  50%  {
  opacity: 0.5;
  }
}
@keyframes fd-sidebar-in  {
  0%  {
  transform: translateX(var(--fd-sidebar-drawer-offset));
  }
}
@keyframes fd-sidebar-out  {
  100%  {
  transform: translateX(var(--fd-sidebar-drawer-offset));
  }
}
@keyframes fd-dialog-in  {
  0%  {
  opacity: 0;
  transform: scale(1.06);
  } 100%  {
  transform: scale(1);
  }
}
@keyframes fd-dialog-out  {
  0%  {
  transform: scale(1);
  } 100%  {
  opacity: 0;
  transform: scale(1.04);
  }
}
@keyframes fd-popover-in  {
  0%  {
  opacity: 0;
  transform: scale(0.9);
  }
}
@keyframes fd-popover-out  {
  100%  {
  opacity: 0;
  transform: scale(0.9);
  }
}
@keyframes fd-fade-in  {
  0%  {
  opacity: 0;
  } 100%  {
  opacity: 1;
  }
}
@keyframes fd-fade-out  {
  0%  {
  opacity: 1;
  } 100%  {
  opacity: 0;
  }
}
@keyframes fd-enterFromRight  {
  0%  {
  opacity: 0;
  transform: translate(200px);
  } 100%  {
  opacity: 1;
  transform: translate(0px);
  }
}
@keyframes fd-enterFromLeft  {
  0%  {
  opacity: 0;
  transform: translate(-200px);
  } 100%  {
  opacity: 1;
  transform: translate(0px);
  }
}
@keyframes fd-exitToRight  {
  0%  {
  opacity: 1;
  transform: translate(0px);
  } 100%  {
  opacity: 0;
  transform: translate(200px);
  }
}
@keyframes fd-exitToLeft  {
  0%  {
  opacity: 1;
  transform: translate(0px);
  } 100%  {
  opacity: 0;
  transform: translate(-200px);
  }
}`;

const RESHAPED_KF = ``;

// ---- Gallery card generator ----
function galleryCard({ id, title, subtitle, accent, tags, keyframes, decor }) {
  const tagsHtml = tags.map(t => `<span class="tag">${t}</span>`).join('');
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#161622;width:1280px;height:820px;overflow:hidden;display:flex;align-items:center;justify-content:center;}
.card{width:1100px;background:#1c1c2a;border:1px solid #2a2a3d;border-radius:14px;padding:22px 28px 28px;box-shadow:0 22px 60px rgba(0,0,0,.45);}
.chrome{display:flex;gap:8px;margin-bottom:18px;}
.dot{width:12px;height:12px;border-radius:50%;}
.dot.r{background:#FF5F57;} .dot.y{background:#FEBC2E;} .dot.g{background:#28C840;}
.header{margin-bottom:18px;}
.title{font-size:21px;font-weight:700;color:#fff;margin-bottom:5px;letter-spacing:-.01em;}
.subtitle{font-size:13.5px;color:#9ca3af;}
.showcase{background:#222235;border-radius:10px;padding:20px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;}
.btn-primary{background:${accent};color:#fff;border:none;border-radius:8px;padding:7px 18px;font-size:14px;font-weight:500;cursor:pointer;transition:transform .1s ease,filter .1s ease;}
.btn-primary:hover{transform:translateY(-1px);filter:brightness(1.08);}
.btn-default{background:#2a2a3d;color:#d1d1db;border:1px solid #3a3a52;border-radius:8px;padding:7px 18px;font-size:14px;cursor:pointer;}
.input{background:#252535;border:1px solid #3a3a52;border-radius:8px;color:#fff;padding:7px 14px;width:140px;font-size:14px;}
.input::placeholder{color:#9ca3af;}
.toggle{width:42px;height:22px;border-radius:999px;background:${accent};position:relative;cursor:pointer;flex:none;}
.toggle .knob{position:absolute;right:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;}
.badge{background:#0d7377;color:#fff;border-radius:999px;padding:3px 12px;font-size:13px;}
.select{background:#2a2a3d;color:#fff;border:1px solid #3a3a52;border-radius:8px;padding:7px 14px;font-size:14px;display:flex;align-items:center;gap:8px;}
.select svg{width:12px;height:12px;}
.preview{background:#1c1c2a;border:1px solid #2a2a3a;border-radius:10px;padding:16px;margin:18px 0;}
.preview h3{color:#fff;font-size:16px;font-weight:700;margin-bottom:6px;}
.preview p{color:#9ca3af;font-size:13px;}
.tags{display:flex;gap:10px;flex-wrap:wrap;}
.tag{background:#2a2a3d;border:1px solid #3a3a52;color:#d1d1db;border-radius:999px;padding:5px 14px;font-size:13px;cursor:pointer;transition:background .1s ease,color .1s ease;}
.tag:hover{background:#34344a;color:#fff;}
${keyframes}
</style>
</head>
<body>
<div class="card">
  <div class="chrome"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>
  <div class="header"><div class="title">${title}</div><div class="subtitle">${subtitle}</div></div>
  <div class="showcase">
    <button class="btn-primary">Primary</button>
    <button class="btn-default">Default</button>
    <input class="input" type="text" placeholder="Type here...">
    <div class="toggle" role="switch" aria-checked="true"><span class="knob"></span></div>
    <span class="badge">Badge</span>
    <div class="select">Select <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></div>
    ${decor || ''}
  </div>
  <div class="preview"><h3>Card title</h3><p>This is a preview of the component look.</p></div>
  <div class="tags">${tagsHtml}</div>
</div>
</body>
</html>`;
  return html;
}

const gallerySites = [
  {
    id: 'semantic-ui', title: 'Semantic UI', subtitle: 'CSS · 语义化', accent: '#F59E0B',
    tags: ['Button','Form','Input','Select','Checkbox','Radio','Table','Card','Label'],
    keyframes: SEMANTIC_KF,
    decor: `<div style="width:18px;height:18px;border:2px solid #3a3a52;border-top-color:#F59E0B;border-radius:50%;animation:loader 1s linear infinite;" title="loader"></div>`
  },
  {
    id: 'spectre', title: 'Spectre.css', subtitle: 'CSS · 轻量 / 现代', accent: '#6366F1',
    tags: ['Button','Form','Input','Select','Checkbox','Radio','Switch','Table','Card'],
    keyframes: SPECTRE_KF,
    decor: `<div style="width:18px;height:18px;border:2px solid #3a3a52;border-top-color:#6366F1;border-radius:50%;animation:loading 1s linear infinite;" title="loading"></div>`
  },
  {
    id: 'fluent-ds', title: 'Fluent 2 Design', subtitle: 'Multi · Microsoft 全平台', accent: '#EC4899',
    tags: ['Button','Input','Select','Checkbox','Radio','Switch','Slider','Form','Table'],
    keyframes: FLUENT_KF,
    decor: `<div style="width:20px;height:20px;border:2px solid rgba(236,72,153,.25);border-top-color:#EC4899;border-radius:50%;animation:rb7n1on 1.5s linear infinite;" title="rb7n1on"></div>`
  },
  {
    id: 'reshaped', title: 'Reshaped', subtitle: 'React · 现代产品 UI / 设计系统', accent: '#38BDF8',
    tags: ['Button','Input','Select','Modal','Toast'],
    keyframes: RESHAPED_KF,
    decor: ''
  },
  {
    id: 'alignui', title: 'AlignUI', subtitle: 'React · 设计系统组件 / Figma', accent: '#38BDF8',
    tags: ['Button','Input','Card','Tabs','Dialog'],
    keyframes: ALIGNUI_KF,
    decor: `<span style="display:inline-flex;align-items:center;gap:6px;color:#38BDF8;font:13px ui-monospace,monospace;">$<span style="display:inline-block;width:7px;height:14px;background:#38BDF8;animation:cm-blink .8s ease infinite;vertical-align:middle;"></span></span>`
  },
  {
    id: 'baseui-primitives', title: 'Base UI', subtitle: 'React · 无样式原语 / Headless', accent: '#38BDF8',
    tags: ['Menu','Select','Dialog','Popover','Tooltip'],
    keyframes: BASEUI_KF,
    decor: `<div style="width:18px;height:18px;border:2px solid #3a3a52;border-top-color:#38BDF8;border-radius:50%;animation:spin 1s linear infinite;" title="spin"></div>`
  },
  {
    id: 'kiboui', title: 'Kibo UI', subtitle: 'React · shadcn 风格区块', accent: '#38BDF8',
    tags: ['Accordion','Carousel','Command','Calendar'],
    keyframes: KIBOUI_KF,
    decor: `<span style="display:inline-flex;align-items:center;gap:7px;color:#d1d1db;font-size:13px;"><span style="position:relative;display:inline-flex;width:10px;height:10px;"><span style="position:absolute;inset:0;background:#38BDF8;border-radius:50%;animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite;"></span><span style="position:absolute;inset:0;background:#38BDF8;border-radius:50%;"></span></span>Live</span>`
  }
];

gallerySites.forEach(s => {
  const html = galleryCard(s);
  fs.writeFileSync(path.join(ROOT, 'repro', s.id, 'build.hifi.v1.html'), html);
  console.log('wrote', s.id);
});

// ---- Unique pages ----
const ATLASSIAN_KF = `@keyframes k3f15u2  {
  0%  {
  opacity: 0.3;
  } 50%  {
  opacity: 1;
  } 100%  {
  opacity: 0.3;
  }
}
@keyframes kpgn03l  {
  0%  {
  transform: scale(0);
  } 5.26316%  {
  transform: scale(1);
  } 78.9474%  {
  transform: scale(1);
  } 84.2105%  {
  transform: scale(0);
  } 100%  {
  transform: scale(0);
  }
}
@keyframes k1h9ztfy  {
  0%  {
  transform: scale(0);
  } 10.5263%  {
  transform: scale(0);
  } 15.7895%  {
  transform: scale(1);
  } 68.4211%  {
  transform: scale(1);
  } 73.6842%  {
  transform: scale(0);
  } 100%  {
  transform: scale(0);
  }
}
@keyframes kjt05w7  {
  0%  {
  stroke-width: 0;
  } 21.0526%  {
  stroke-width: 0;
  } 26.3158%  {
  stroke-width: 133.5;
  } 57.8947%  {
  stroke-width: 133.5;
  } 63.1579%  {
  stroke-width: 0;
  } 100%  {
  stroke-width: 0;
  }
}
@keyframes k1k6o5g7  {
  0%  {
  transform: rotate(0deg);
  } 31.5789%  {
  transform: rotate(0deg);
  } 36.8421%  {
  transform: rotate(90deg);
  } 47.3684%  {
  transform: rotate(90deg);
  } 52.6316%  {
  transform: rotate(0deg);
  } 100%  {
  transform: rotate(0deg);
  }
}
@keyframes kgnpaw5  {
  0%  {
  opacity: 0;
  } 100%  {
  opacity: 1;
  }
}
@keyframes SlideInTop8px  {
  0%  {
  transform: translateY(8px);
  } 100%  {
  transform: translateY(0px);
  }
}
@keyframes SlideInBottom8px  {
  0%  {
  transform: translateY(-8px);
  } 100%  {
  transform: translateY(0px);
  }
}
@keyframes SlideInLeft8px  {
  0%  {
  transform: translateX(8px);
  } 100%  {
  transform: translateX(0px);
  }
}
@keyframes SlideInRight8px  {
  0%  {
  transform: translateX(-8px);
  } 100%  {
  transform: translateX(0px);
  }
}
@keyframes SlideOutTop8px  {
  0%  {
  transform: translateY(0px);
  } 100%  {
  transform: translateY(4px);
  }
}
@keyframes SlideOutBottom8px  {
  0%  {
  transform: translateY(0px);
  } 100%  {
  transform: translateY(-4px);
  }
}
@keyframes SlideOutLeft8px  {
  0%  {
  transform: translateX(0px);
  } 100%  {
  transform: translateX(4px);
  }
}
@keyframes SlideOutRight8px  {
  0%  {
  transform: translateX(0px);
  } 100%  {
  transform: translateX(-4px);
  }
}`;

const atlassian = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Atlassian Design</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:"Atlassian Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#FFFFFF;color:#292A2E;width:1280px;height:820px;overflow:hidden;position:relative;}
.bg-dots{position:absolute;inset:0;background-image:radial-gradient(#E5E7EB 1px,transparent 1px);background-size:30px 30px;opacity:.7;z-index:0;}
.header{position:fixed;top:0;left:0;right:0;height:64px;background:rgba(255,255,255,.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:space-between;padding:0 48px;z-index:20;border-bottom:1px solid #E5E7EB;}
.brand{display:flex;align-items:center;gap:10px;font-size:18px;font-weight:700;color:#292A2E;}
.nav-right{display:flex;align-items:center;gap:26px;}
.nav-link{color:#292A2E;font-size:14px;text-decoration:none;}
.search-pill{display:flex;align-items:center;gap:8px;border:1px solid #E5E7EB;border-radius:999px;padding:7px 14px;color:#505258;font-size:13px;background:#fff;}
.search-pill svg{width:15px;height:15px;}
.hero{position:relative;z-index:1;padding:150px 0 0 48px;animation:kgnpaw5 .3s ease-in-out forwards;}
.headline{font-size:72px;font-weight:700;line-height:1.04;letter-spacing:-.02em;}
.headline .blue{color:#0065FF;}
.lozenge{position:absolute;display:inline-flex;align-items:center;gap:7px;padding:7px 15px;border-radius:999px;font-size:14px;color:#fff;font-weight:500;box-shadow:0 6px 18px rgba(0,0,0,.14);}
.lozenge .tri{width:0;height:0;}
.lozenge.tony{background:#A855F7;top:120px;left:430px;}
.lozenge.kyah{background:#0065FF;top:300px;left:560px;}
.lozenge.rovo{background:#1F2937;top:96px;left:800px;}
${ATLASSIAN_KF}
</style>
</head>
<body>
<div class="bg-dots"></div>
<header class="header">
  <div class="brand">
    <svg class="logo" width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="2" fill="#0065FF"/>
      <rect x="13" y="3" width="8" height="8" rx="2" fill="#A855F7"/>
      <rect x="3" y="13" width="8" height="8" rx="2" fill="#FF5630"/>
      <rect x="13" y="13" width="8" height="8" rx="2" fill="#36B37E"/>
    </svg>
    Atlassian Design
  </div>
  <nav class="nav-right">
    <a class="nav-link" href="#">Design system</a>
    <a class="nav-link" href="#">News</a>
    <span class="search-pill"><svg viewBox="0 0 24 24" fill="none" stroke="#505258" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>Search</span>
    <span class="search-pill" style="gap:6px;"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#505258" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>Theme</span>
  </nav>
</header>
<main class="hero">
  <div class="headline">Better teamwork<br>by <span class="blue">design</span></div>
  <div class="lozenge tony">Tony <span class="tri" style="border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #A855F7;transform:rotate(180deg);"></span></div>
  <div class="lozenge kyah">Kyah <span class="tri" style="border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #0065FF;transform:rotate(180deg);"></span></div>
  <div class="lozenge rovo">Rovo</div>
</main>
</body>
</html>`;
fs.writeFileSync(path.join(ROOT, 'repro', 'atlassian', 'build.hifi.v1.html'), atlassian);
console.log('wrote atlassian');

const LIGHTNING_KF = `@keyframes go2264125279  {
  0%  {
  transform: scale(0) rotate(45deg);
  opacity: 0;
  } 100%  {
  transform: scale(1) rotate(45deg);
  opacity: 1;
  }
}
@keyframes go3020080000  {
  0%  {
  transform: scale(0);
  opacity: 0;
  } 100%  {
  transform: scale(1);
  opacity: 1;
  }
}
@keyframes go463499852  {
  0%  {
  transform: scale(0) rotate(90deg);
  opacity: 0;
  } 100%  {
  transform: scale(1) rotate(90deg);
  opacity: 1;
  }
}
@keyframes go1268368563  {
  0%  {
  transform: rotate(0deg);
  } 100%  {
  transform: rotate(360deg);
  }
}
@keyframes go1310225428  {
  0%  {
  transform: scale(0) rotate(45deg);
  opacity: 0;
  } 100%  {
  transform: scale(1) rotate(45deg);
  opacity: 1;
  }
}
@keyframes go651618207  {
  0%  {
  height: 0px;
  width: 0px;
  opacity: 0;
  } 40%  {
  height: 0px;
  width: 6px;
  opacity: 1;
  } 100%  {
  opacity: 1;
  height: 10px;
  }
}
@keyframes go901347462  {
  0%  {
  transform: scale(0.6);
  opacity: 0.4;
  } 100%  {
  transform: scale(1);
  opacity: 1;
  }
}
@-webkit-keyframes token-inline-search-highlight-fade-out  {
  0%  {
  background-color: transparent;
  } 70%  {
  background-color: unset;
  } 100%  {
  background-color: unset;
  }
}
@-webkit-keyframes zheditor-search-highlight-fade-out  {
  0%  {
  padding: 8px;
  margin: -8px;
  background-color: var(--colors-blocks-content-background-search-highlight,#ffea6a);
  } 5%  {
  padding: 0px;
  margin: 0px;
  } 70%  {
  background-color: var(--colors-blocks-content-background-search-highlight,#ffea6a);
  } 100%  {
  background-color: unset;
  }
}
@-webkit-keyframes fEWCgj  {
  0%  {
  transform: rotate(0deg);
  } 100%  {
  transform: rotate(360deg);
  }
}
@keyframes appcues-beacon-pulse  {
  0%  {
  stroke-width: 22px;
  transform: scale(0.1);
  } 25%  {
  stroke-width: 0.5px;
  transform: scale(1);
  } 30%  {
  stroke-width: 0;
  } 100%  {
  stroke-width: 0;
  }
}
@keyframes ProseMirror-cursor-blink  {
  100%  {
  visibility: hidden;
  }
}`;

const lightning = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Lightning Design System 2</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:"DM Sans",system-ui,sans-serif;background:#FFFFFF;color:#292A2E;width:1280px;height:820px;overflow:hidden;display:flex;}
.sidebar{width:280px;background:#fff;border-right:1px solid #E5E7EB;padding:20px 24px;flex:none;}
.sb-kicker{font-size:12px;font-weight:700;letter-spacing:.05em;color:#0A2057;text-transform:uppercase;}
.sb-logo{display:flex;align-items:center;gap:8px;font-size:18px;font-weight:700;color:#0A2057;margin:10px 0;}
.sb-logo sup{font-size:11px;color:#0176D3;}
.search{display:flex;align-items:center;gap:8px;background:#F3F3F3;border-radius:999px;padding:8px 12px;margin:16px 0;color:#505258;font-size:13px;}
.search svg{width:15px;height:15px;}
.sb-nav{display:flex;flex-direction:column;gap:4px;}
.sb-item{display:flex;align-items:center;justify-content:space-between;font-size:14px;color:#292A2E;padding:7px 0;cursor:pointer;}
.sb-item svg{width:14px;height:14px;color:#706e6b;}
.main{flex:1;display:flex;flex-direction:column;min-width:0;}
.hero-banner{position:relative;background:linear-gradient(120deg,#1B2C7E,#3B4CBF);padding:40px 60px;border-radius:0;overflow:hidden;color:#fff;}
.hero-banner .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px);background-size:40px 40px;opacity:.5;}
.hero-banner .orb{position:absolute;border-radius:50%;background:#FF8A65;opacity:.85;}
.hero-banner .orb.a{width:90px;height:90px;top:-20px;right:120px;}
.hero-banner .orb.b{width:50px;height:50px;bottom:-10px;right:300px;}
.hero-inner{position:relative;z-index:1;}
.hero-title{font-size:42px;font-weight:700;color:#fff;}
.hero-sub1{font-size:14px;font-weight:600;color:#fff;margin-top:10px;}
.hero-sub2{font-size:14px;color:#fff;opacity:.9;}
.hero-tag{display:flex;align-items:center;gap:8px;font-size:18px;font-weight:700;color:#fff;margin-top:14px;}
.hero-tag .sq{width:12px;height:12px;background:#FF8A65;border-radius:2px;}
.hero-pill{position:absolute;top:24px;right:28px;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.92);color:#0A2057;border-radius:999px;padding:6px 12px;font-size:13px;font-weight:600;}
.below{padding:26px 40px;}
.below h2{font-size:28px;color:#0A2057;font-weight:700;}
.photo{margin-top:16px;height:170px;border-radius:12px;background:linear-gradient(135deg,#cbd5e1,#94a3b8);display:flex;align-items:flex-end;padding:14px;color:#334155;font-size:13px;overflow:hidden;position:relative;}
.photo .shelf{position:absolute;left:0;right:0;bottom:0;height:60px;background:repeating-linear-gradient(90deg,#64748b,#64748b 12px,#475569 12px,#475569 24px);}
${LIGHTNING_KF}
</style>
</head>
<body>
<aside class="sidebar">
  <div class="sb-kicker">Lightning Design System 2</div>
  <div class="sb-logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="#0176D3"><path d="M7 15a5 5 0 0 1 .6-9.6A6 6 0 0 1 19 7a4 4 0 0 1-.5 8H7z"/></svg>Lightning Design System<sup>2</sup></div>
  <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="#706e6b" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>Search...</div>
  <nav class="sb-nav">
    <div class="sb-item">Get Started <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
    <div class="sb-item">AI and SLDS 2 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
    <div class="sb-item">Foundations <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
    <div class="sb-item">Develop <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
    <div class="sb-item">Components <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
    <div class="sb-item">Patterns <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
    <div class="sb-item">Accessibility <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
    <div class="sb-item">Tools <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
    <div class="sb-item">SLDS 1 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M9 7h8v8"/></svg></div>
  </nav>
</aside>
<section class="main">
  <div class="hero-banner">
    <div class="grid"></div>
    <div class="orb a"></div>
    <div class="orb b"></div>
    <div class="hero-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A2057" stroke-width="2"><path d="M10 13a5 5 0 0 0 7 0l3 3-3 3-3-3M14 11a5 5 0 0 0-7 0L4 8l3-3 3 3"/></svg><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A2057" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></div>
    <div class="hero-inner">
      <div class="hero-title">Lightning Design System 2</div>
      <div class="hero-sub1">Summer '26 v2.9</div>
      <div class="hero-sub2">Styleguide updated 20 days ago</div>
      <div class="hero-tag"><span class="sq"></span>Bring your brand to life.</div>
    </div>
  </div>
  <div class="below">
    <h2>Welcome to SLDS 2</h2>
    <div class="photo">A team organising stock in a storage room<span class="shelf"></span></div>
  </div>
</section>
</body>
</html>`;
fs.writeFileSync(path.join(ROOT, 'repro', 'lightning', 'build.hifi.v1.html'), lightning);
console.log('wrote lightning');

const PRIMEREACT_KF = `@keyframes topbar-cta-text-shimmer  {
  0%  {
  background-position: 130% center;
  } 100%  {
  background-position: -130% center;
  }
}
@keyframes px-fadein  {
  0%  {
  opacity: 0;
  } 100%  {
  opacity: 1;
  }
}
@keyframes px-fadeout  {
  0%  {
  opacity: 1;
  } 100%  {
  opacity: 0;
  }
}
@keyframes px-scalein  {
  0%  {
  opacity: 0;
  transition: transform 0.12s cubic-bezier(0, 0, 0.2, 1), opacity 0.12s cubic-bezier(0, 0, 0.2, 1);
  transform: scaleY(0.8);
  } 100%  {
  opacity: 1;
  transform: scaleY(1);
  }
}
@keyframes px-slidedown  {
  0%  {
  max-height: 0px;
  } 100%  {
  }
}
@keyframes px-slideup  {
  0%  {
  max-height: 1000px;
  } 100%  {
  max-height: 0px;
  }
}
@keyframes px-animate-overlay-enter  {
  0%  {
  opacity: 0;
  transform: scale(0.93);
  }
}
@keyframes px-animate-overlay-leave  {
  100%  {
  opacity: 0;
  transform: scale(0.93);
  }
}
@keyframes p-features-order-animation  {
  0%  {
  clip-path: polygon(0% 100%, 15% 100%, 32% 100%, 54% 100%, 70% 100%, 84% 100%, 100% 100%, 100% 100%, 0% 100%);
  } 20%  {
  clip-path: polygon(0% 45%, 15% 44%, 32% 50%, 54% 60%, 70% 61%, 84% 59%, 100% 52%, 100% 100%, 0% 100%);
  } 40%  {
  clip-path: polygon(0% 60%, 16% 65%, 34% 66%, 51% 62%, 67% 50%, 84% 45%, 100% 46%, 100% 100%, 0% 100%);
  } 60%  {
  clip-path: polygon(0px 51%, 14% 31%, 33% 42%, 49% 53%, 68% 55%, 85% 50%, 100% 60%, 100% 100%, 0px 100%);
  } 100%  {
  clip-path: polygon(0px 0px, 18% 0px, 39% 0px, 53% 0px, 62% 0px, 87% 0px, 100% 0px, 100% 100%, 0px 100%);
  }
}
@keyframes pulse  {
  50%  {
  opacity: 0.5;
  }
}
@keyframes bounce  {
  0%, 100%  {
  animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  transform: translateY(-25%);
  } 50%  {
  animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  transform: none;
  }
}
@keyframes slideright  {
  0%  {
  inset-inline: -35% 100%;
  } 60%  {
  inset-inline: 100% -90%;
  } 100%  {
  inset-inline: 100% -90%;
  }
}
@keyframes star-rotate  {
  0%  {
  transform: rotateY(0deg);
  } 100%  {
  transform: rotateY(360deg);
  }
}
@keyframes p-animate-collapsible-expand  {
  0%  {
  grid-template-rows: 0fr;
  } 100%  {
  grid-template-rows: 1fr;
  }
}
@keyframes whouses-marquee  {
  from  {
  transform: translateX(0);
  } to  {
  transform: translateX(-50%);
  }
}`;

const primereact = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>PrimeReact</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Inter,system-ui,sans-serif;background:#F8FAFC;color:#0F172A;width:1280px;height:820px;overflow:hidden;}
.banner{height:36px;background:#0F172A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;position:relative;}
.banner .x{position:absolute;right:18px;top:50%;transform:translateY(-50%);cursor:pointer;opacity:.8;}
.header{height:64px;background:#fff;border-bottom:1px solid #E2E8F0;display:flex;align-items:center;justify-content:space-between;padding:0 40px;}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;color:#334155;font-size:16px;letter-spacing:.04em;}
.nav-center{display:flex;gap:24px;color:#334155;font-size:14px;}
.header-right{display:flex;align-items:center;gap:14px;}
.header-right svg{width:18px;height:18px;color:#334155;cursor:pointer;}
.cta{background:#334155;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:14px;cursor:pointer;}
.hero{text-align:center;padding-top:60px;animation:px-fadein .4s ease both;}
.ver{display:inline-flex;align-items:center;gap:6px;color:#EF4444;font-family:ui-monospace,monospace;font-size:13px;margin-bottom:10px;}
.ver .sq{width:8px;height:8px;background:#EF4444;}
.headline{font-size:48px;font-weight:700;color:#0F172A;}
.headline .suite{background:#F1F5F9;border:1px solid #E2E8F0;border-radius:8px;padding:0 8px;}
.sub{color:#64748B;font-size:18px;max-width:620px;margin:16px auto 0;line-height:1.5;}
.btns{display:flex;gap:12px;justify-content:center;margin-top:24px;}
.btn-dark{background:#0F172A;color:#fff;border:none;border-radius:8px;padding:12px 24px;font-size:15px;cursor:pointer;}
.btn-outline{background:#fff;color:#0F172A;border:1px solid #E2E8F0;border-radius:8px;padding:12px 24px;font-size:15px;cursor:pointer;}
.logos{display:flex;gap:48px;justify-content:center;align-items:center;margin-top:50px;overflow:hidden;}
.whouses-track{display:flex;gap:48px;align-items:center;animation:whouses-marquee 30s linear infinite;color:#94A3B8;font-weight:700;font-size:20px;}
.card-preview{margin:46px auto 0;width:760px;background:#fff;border:1px solid #E2E8F0;border-radius:14px;box-shadow:0 12px 30px rgba(15,23,42,.08);padding:18px 20px;display:flex;align-items:center;gap:14px;}
.card-preview .ic{width:34px;height:34px;border-radius:9px;background:#EEF2FF;display:flex;align-items:center;justify-content:center;color:#4F46E5;}
.card-preview .lbl{font-size:12px;color:#64748B;}
.card-preview .ttl{font-weight:600;font-size:15px;color:#0F172A;}
.live{display:flex;align-items:center;gap:6px;color:#22C55E;font-size:12px;margin-left:auto;}
.live .dot{width:8px;height:8px;border-radius:50%;background:#22C55E;animation:pulse 1.6s ease-in-out infinite;}
${PRIMEREACT_KF}
</style>
</head>
<body>
<div class="banner">Next Chapter Begins 🚀 Read the full story<span class="x">×</span></div>
<header class="header">
  <div class="brand"><svg width="22" height="22" viewBox="0 0 24 24" fill="#334155"><path d="M12 2l3 5-3 2-3-2 3-5zM4 9l3 5-3 2-3-2 3-5zM20 9l3 5-3 2-3-2 3-5zM12 13l3 5-3 4-3-4 3-5z"/></svg>PRIMEREACT</div>
  <nav class="nav-center"><span>Styled</span><span>Tailwind</span><span>Primitive</span><span>Headless</span></nav>
  <div class="header-right">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
    <button class="cta">Get PrimeUI</button>
  </div>
</header>
<main class="hero">
  <div class="ver"><span class="sq"></span>primereact@11.0.0-rc.1</div>
  <div class="headline">Premium UI <span class="suite">Suite</span> for React</div>
  <p class="sub">Enhance your web applications with PrimeReact's comprehensive suite of customizable, feature-rich UI components.</p>
  <div class="btns">
    <button class="btn-dark">Get Started</button>
    <button class="btn-outline">View Components</button>
  </div>
  <div class="logos">
    <div class="whouses-track">
      <span>✦ Mercedes</span><span>ebay</span><span>Ford</span>
      <span>✦ Mercedes</span><span>ebay</span><span>Ford</span>
    </div>
  </div>
  <div class="card-preview">
    <div class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></div>
    <div><div class="lbl">Overview</div><div class="ttl">Portfolio command</div></div>
    <div class="live"><span class="dot"></span>Live</div>
  </div>
</main>
</body>
</html>`;
fs.writeFileSync(path.join(ROOT, 'repro', 'primereact', 'build.hifi.v1.html'), primereact);
console.log('wrote primereact');

const TAILARK_KF = `@keyframes enter  {
  0%  {
  opacity: var(--tw-enter-opacity,1);
  transform: translate3d(var(--tw-enter-translate-x,0),var(--tw-enter-translate-y,0),0)scale3d(var(--tw-enter-scale,1),var(--tw-enter-scale,1),var(--tw-enter-scale,1))rotate(var(--tw-enter-rotate,0));
  }
}
@keyframes exit  {
  100%  {
  opacity: var(--tw-exit-opacity,1);
  transform: translate3d(var(--tw-exit-translate-x,0),var(--tw-exit-translate-y,0),0)scale3d(var(--tw-exit-scale,1),var(--tw-exit-scale,1),var(--tw-exit-scale,1))rotate(var(--tw-exit-rotate,0));
  }
}
@keyframes pulse  {
  50%  {
  opacity: 0.5;
  }
}
@keyframes accordion-down  {
  0%  {
  height: 0px;
  } 100%  {
  height: var(--radix-accordion-content-height);
  }
}
@keyframes accordion-up  {
  0%  {
  height: var(--radix-accordion-content-height);
  } 100%  {
  height: 0px;
  }
}
@keyframes source-to-logo  {
  0%  {
  stroke-dashoffset: 400px;
  } 100%  {
  stroke-dashoffset: 0;
  }
}
@keyframes logo-to-outputs  {
  0%  {
  stroke-dashoffset: 550px;
  } 10%  {
  stroke-dashoffset: 400px;
  } 100%  {
  stroke-dashoffset: 0;
  }
}`;

const tailark = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>tailark</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#ffffff;color:#0f172a;width:1280px;height:820px;overflow:hidden;}
.nav{height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 48px;}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:18px;letter-spacing:-.02em;}
.brand .diamond{width:20px;height:20px;background:linear-gradient(135deg,#14b8a6,#10b981);transform:rotate(45deg);border-radius:5px;}
.nav-links{display:flex;gap:28px;color:#334155;font-size:14px;}
.nav-cta{display:flex;align-items:center;gap:18px;}
.login{color:#334155;font-size:14px;}
.get{background:#0f172a;color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:14px;cursor:pointer;}
.hero{text-align:center;padding-top:64px;}
.badge{display:inline-flex;align-items:center;gap:8px;background:#f1f5f9;border-radius:999px;color:#475569;font-size:13px;padding:6px 14px;}
.badge svg{width:14px;height:14px;color:#14b8a6;}
.headline{font-size:52px;font-weight:700;line-height:1.1;max-width:700px;margin:22px auto 0;letter-spacing:-.02em;}
.headline .grad{background:linear-gradient(90deg,#14b8a6,#10b981);-webkit-background-clip:text;background-clip:text;color:transparent;}
.hero-btns{display:flex;gap:18px;justify-content:center;margin-top:28px;}
.hb-dark{background:#0f172a;color:#fff;border:none;border-radius:10px;padding:10px 18px;font-size:14px;cursor:pointer;}
.hb-ghost{background:transparent;color:#0f172a;border:none;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
.style-tabs{display:flex;gap:28px;justify-content:center;margin-top:42px;font-size:14px;color:#94a3b8;}
.style-tabs .active{color:#0f172a;font-weight:600;}
.bento{display:flex;gap:16px;max-width:1080px;margin:48px auto 0;}
.col-left{flex:0 0 55%;}
.col-right{flex:1;display:flex;flex-direction:column;gap:16px;}
.bcard{border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 6px 20px rgba(15,23,42,.05);}
.left-card{background:#f8fafc;padding:26px;min-height:300px;}
.left-card h3{font-size:22px;font-weight:700;max-width:320px;line-height:1.25;}
.left-card p{color:#475569;font-size:13px;margin-top:10px;max-width:300px;}
.left-card .pu-btn{display:inline-block;margin-top:14px;background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:#fff;padding:9px 16px;border-radius:10px;font-size:13px;font-weight:600;}
.illu{margin-top:18px;height:130px;display:flex;gap:10px;align-items:flex-end;}
.illu .b1{width:90px;height:90px;border-radius:12px;background:linear-gradient(135deg,#a78bfa,#6366f1);}
.illu .b2{width:70px;height:70px;border-radius:12px;background:linear-gradient(135deg,#60a5fa,#3b82f6);}
.illu .b3{width:60px;height:110px;border-radius:12px;background:linear-gradient(135deg,#c4b5fd,#818cf8);}
.tr-top{background:#fff;padding:26px;text-align:center;flex:1;}
.logocloud{display:flex;justify-content:center;gap:18px;margin-bottom:12px;}
.logocloud .s{width:26px;height:26px;border-radius:7px;background:#e2e8f0;}
.tr-top .cap{font-weight:600;}
.tr-top .sub2{color:#94a3b8;font-size:13px;}
.br-split{display:flex;gap:16px;}
.br-split .bcard{flex:1;background:#fff;padding:22px;}
.br-split .cap{font-weight:600;font-size:15px;}
.br-split .sub2{color:#94a3b8;font-size:13px;margin-top:4px;}
.connector{margin-top:14px;}
.connector path{stroke:#14b8a6;stroke-width:2;fill:none;stroke-dasharray:400;animation:logo-to-outputs 2.4s ease forwards;}
${TAILARK_KF}
</style>
</head>
<body>
<nav class="nav">
  <div class="brand"><span class="diamond"></span>tailark</div>
  <div class="nav-links"><span>Illustrations</span><span>Blocks</span><span>Pages</span><span>Pricing</span><span>Docs</span></div>
  <div class="nav-cta"><span class="login">Login</span><button class="get">Get full access</button></div>
</nav>
<section class="hero">
  <span class="badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 6.6L21 9.2l-5 4.4 1.5 6.9L12 17l-5.5 3.5L8 13.6 3 9.2l6.6-.6L12 2z"/></svg>13 new pages added to the Grid-2 style<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></span>
  <h1 class="headline">Build modern marketing<br>websites with <span class="grad">Shadcn blocks.</span></h1>
  <div class="hero-btns">
    <button class="hb-dark">Get full access</button>
    <button class="hb-ghost">Explore kits →</button>
  </div>
  <div class="style-tabs"><span class="active">Quartz</span><span>Dusk</span><span>Mist</span><span>Veil</span></div>
</section>
<div class="bento">
  <div class="col-left">
    <div class="bcard left-card">
      <h3>The Financial OS powering businesses on your platform</h3>
      <p>Unify payments, ledger and reporting into one composable surface.</p>
      <span class="pu-btn">Get started</span>
      <div class="illu"><div class="b1"></div><div class="b2"></div><div class="b3"></div></div>
    </div>
  </div>
  <div class="col-right">
    <div class="bcard tr-top">
      <div class="logocloud"><span class="s"></span><span class="s"></span><span class="s"></span><span class="s"></span></div>
      <div class="cap">Logo Cloud</div>
      <div class="sub2">10 blocks</div>
    </div>
    <div class="br-split">
      <div class="bcard"><div class="cap">Features</div><div class="sub2">14 blocks</div>
        <svg class="connector" viewBox="0 0 120 40"><path d="M10 20 H110"/></svg>
      </div>
      <div class="bcard"><div class="cap">Pricing</div><div class="sub2">8 blocks</div></div>
    </div>
  </div>
</div>
</body>
</html>`;
fs.writeFileSync(path.join(ROOT, 'repro', 'tailark', 'build.hifi.v1.html'), tailark);
console.log('wrote tailark');

console.log('ALL DONE');
