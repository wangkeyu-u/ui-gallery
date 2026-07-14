// build-dataset.js — 汇总「组件库 + 获奖项目」总清单 -> preview-data.json
// 复用: 66 个旧库(从 ui-components-hub.html 提取) + 大量新增 + 获奖项目
const fs = require('fs');
const path = require('path');

// ---------- 1) 提取已有 66 个库 ----------
const hub = fs.readFileSync('ui-components-hub.html', 'utf8');
const m = hub.match(/const LIBRARIES = (\[[\s\S]*?\n\];)/);
const EXIST = eval('(' + m[1].replace(/;\s*$/, '') + ')');
const existingItems = EXIST.map(l => ({
  id: l.id, name: l.name, fw: l.fw, theme: l.theme, vendor: l.vendor,
  link: l.docs || l.repo, kind: 'item',
  img: 'previews/' + l.id + '.png',
  chips: (l.components || []).slice(0, 9),
  repo: l.repo, desc: l.desc
}));
console.log('existing libs:', existingItems.length);

// ---------- 2) 新增库（紧凑元组: [id,name,vendor,fw,theme,link,repo,license,chips]）----------
const G = (a) => ({ id:a[0], name:a[1], vendor:a[2], fw:a[3], theme:a[4], link:a[5], repo:a[6], license:a[7]||'—', chips:a[8]||['Button','Input','Card','Modal'], kind:'item', img:'previews/'+a[0]+'.png' });
const DEF_CHIPS = ['Button','Input','Card','Modal','Table'];

const NEW = [
  // ===== React =====
  ['primereact','PrimeReact','PrimeTek',['React'],'企业级 / 数据密集','https://primereact.org','https://github.com/primefaces/primereact','MIT',['Button','DataTable','Chart','Form','Dialog']],
  ['untitledui','Untitled UI','Untitled UI',['React'],'设计系统 / Figma 组件','https://www.untitledui.com','https://www.untitledui.com','商用',['Button','Input','Card','Dropdown','Avatar']],
  ['reshaped','Reshaped','Reshaped',['React'],'现代产品 UI / 设计系统','https://reshaped.dev','https://github.com/reshaped/reshaped','商用',['Button','Input','Select','Modal','Toast']],
  ['alignui','AlignUI','AlignUI',['React'],'设计系统组件 / Figma','https://alignui.com','https://github.com/align-ui/align-ui','MIT',['Button','Input','Card','Tabs','Dialog']],
  ['baseui-primitives','Base UI','MUI',['React'],'无样式原语 / Headless','https://base-ui.com','https://github.com/mui/base-ui','MIT',['Menu','Select','Dialog','Popover','Tooltip']],
  ['kiboui','Kibo UI','Kibo',['React'],'shadcn 风格区块','https://www.kibo-ui.com','https://github.com/kibocode/kibo-ui','MIT',['Accordion','Carousel','Command','Calendar']],
  ['tailark','Tailark','Tailark',['React'],'营销 / 落地页区块','https://tailark.com','https://tailark.com','商用',['Hero','Pricing','Feature','CTA']],
  ['aceternity','Aceternity UI','Aceternity',['React'],'动画组件 / 炫酷','https://ui.aceternity.com','https://github.com/aceternity-ai/aceternity-ui','MIT',['Card','Background','3D','Carousel']],
  ['tremor','Tremor','Tremor',['React'],'数据仪表盘 / 图表','https://tremor.so','https://github.com/tremorlabs/tremor','Apache',['Chart','Metric','Table','DatePicker']],
  ['parkui','Park UI','Park UI / Chakra',['React'],'可移植组件 / 多框架','https://park-ui.com','https://github.com/park-ui/park-ui','MIT',['Button','Input','Select','Tabs']],
  ['magicui','Magic UI','Magic UI',['React'],'动画 / 落地页组件','https://magicui.design','https://github.com/magicuidesign/magicui','MIT',['Marquee','Border','Blur','Ripple']],
  ['floatui','Float UI','Float UI',['React'],'Tailwind 组件','https://floatui.com','https://floatui.com','商用',['Dropdown','Modal','Tooltip','Datepicker']],
  ['flowbite-react','Flowbite React','Flowbite',['React'],'Tailwind 组件','https://flowbite.com','https://github.com/themesberg/flowbite-react','MIT',['Button','Input','Card','Navbar']],
  ['preline','Preline UI','Preline',['React'],'Tailwind 组件 / 设计系统','https://preline.co','https://github.com/htmlstreamofficial/preline','MIT',['Button','Input','Modal','Offcanvas']],
  ['keepreact','Keep React','Keep',['React'],'Tailwind 组件','https://keepdesign.io','https://github.com/Believe-ds/Keep-React','MIT',['Button','Input','Card','Table']],
  ['originui','Origin UI','Origin UI',['React'],'免费组件 / 现代','https://originui.com','https://github.com/origin-space/originui','MIT',['Button','Input','Select','Sheet']],
  ['react-spectrum','React Spectrum','Adobe',['React'],'企业设计系统','https://react-spectrum.adobe.com','https://github.com/adobe/react-spectrum','Apache',['Button','TextField','TableView','Dialog']],
  ['recharts','Recharts','Recharts',['React'],'图表 / 数据可视化','https://recharts.org','https://github.com/recharts/recharts','MIT',['Line','Bar','Area','Pie']],
  ['nivo','Nivo','Plouc',['React'],'图表 / 数据可视化','https://nivo.rocks','https://github.com/plouc/nivo','MIT',['Line','Bar','Heatmap','Sankey']],
  ['visx','Visx','Airbnb',['React'],'图表 / D3 底层','https://airbnb.io/visx','https://github.com/airbnb/visx','MIT',['Axis','Shape','Scale','Tooltip']],
  ['tanstack-ui','TanStack UI','TanStack',['React'],'Headless / 表格表单','https://tanstack.com','https://github.com/TanStack/ui','MIT',['Table','Form','Query','Router']],
  ['cmdk','cmdk','pacocoursey',['React'],'命令面板 / 快捷键','https://cmdk.paco.me','https://github.com/pacocoursey/cmdk','MIT',['Command','Dialog']],
  ['sonner','Sonner','emilkowalski',['React'],'Toast 通知','https://sonner.emilkowalkski.com','https://github.com/emilkowalski/sonner','MIT',['Toast']],
  ['plate','Plate','Plate',['React'],'富文本编辑器','https://platejs.org','https://github.com/udecode/plate','MIT',['Editor','Toolbar','Mention','Slash']],
  ['mambaui','Mamba UI','Mamba',['React'],'Tailwind 区块','https://mambaui.com','https://github.com/MambaUI/MambaUI','MIT',['Hero','Feature','Pricing','CTA']],
  ['kokonutui','Kokonut UI','Kokonut',['React'],'动画 / 现代组件','https://kokonutui.com','https://github.com/KokonutUI/kokonutui','MIT',['Card','Chart','Calendar','Command']],
  ['diceui','Dice UI','Dice',['React'],'Radix 风格组件','https://diceui.com','https://github.com/diceui/dice-ui','MIT',['Combobox','DatePicker','Tags','Slider']],
  ['paper-rn','React Native Paper','Callstack',['React'],'移动端 / 跨端','https://reactnativepaper.com','https://github.com/callstack/react-native-paper','MIT',['Button','Card','TextInput','Modal']],

  // ===== Vue =====
  ['varlet','Varlet','Varlet',['Vue'],'移动端 / Vue3','https://varletjs.org','https://github.com/varletjs/varlet','MIT',['Button','Input','Picker','ActionSheet']],
  ['wave-ui','Wave UI','Antoniandre',['Vue'],'Material 风 / Vue3','https://antoniandre.github.io/wave-ui','https://github.com/antoniandre/wave-ui','MIT',['Button','Card','Dialog','Tabs']],
  ['balmui','BalmUI','BalmJS',['Vue'],'Material 风 / Vue3','https://next-material.balmjs.com','https://github.com/balmjs/balm-ui','MIT',['Button','Input','Menu','Dialog']],
  ['vue-final-modal','Vue Final Modal','Vue Final',['Vue'],'模态框 / 动画','https://vue-final-modal.org','https://github.com/vue-final/vue-final-modal','MIT',['Modal','Drawer','Teleport']],
  ['veevalidate','VeeValidate','Logaretm',['Vue'],'表单校验 / Headless','https://vee-validate.logaretm.com','https://github.com/logaretm/vee-validate','MIT',['Form','Field','ErrorMessage']],
  ['tailgrids-vue','TailGrids Vue','TailGrids',['Vue'],'Tailwind 组件','https://tailgrids.com','https://github.com/TailGrids/tailgrids-vue','MIT',['Button','Card','Hero','Pricing']],
  ['volt-vue','Volt Vue','Themesberg',['Vue'],'免费 Bootstrap 风','https://demos.creative-tim.com/volt','https://github.com/themesberg/volt-bootstrap-5-dashboard','MIT',['Button','Card','Table','Chart']],
  ['flowbite-vue','Flowbite Vue','Flowbite',['Vue'],'Tailwind 组件','https://flowbite-vue.com','https://github.com/themesberg/flowbite-vue','MIT',['Button','Input','Card','Navbar']],

  // ===== Angular =====
  ['nebular','Nebular','Akveo',['Angular'],'企业级 / 主题化','https://akveo.github.io/nebular','https://github.com/akveo/nebular','MIT',['Button','Card','Layout','Auth']],
  ['devextreme','DevExtreme','DevExpress',['Angular'],'企业级 / 商业','https://js.devexpress.com/Angular','https://github.com/DevExpress/DevExtreme','商用',['DataGrid','Charts','Scheduler','Form']],
  ['kendo-angular','Kendo UI for Angular','Telerik',['Angular'],'企业级 / 商业','https://www.telerik.com/kendo-angular-ui','https://www.telerik.com/kendo-angular-ui','商用',['Grid','Chart','Editor','Scheduler']],
  ['syncfusion-ng','Syncfusion EJ2','Syncfusion',['Angular'],'企业级 / 商业','https://www.syncfusion.com/angular-components','https://github.com/syncfusion/ej2-angular','商用',['Grid','Chart','Diagram','PDF']],
  ['ag-grid','AG Grid','AG Grid',['Angular'],'数据表格 / 高性能','https://www.ag-grid.com/angular-data-grid','https://github.com/ag-grid/ag-grid','MIT',['DataGrid','Tree','Pivot','Charts']],
  ['ionic-ng','Ionic Angular','Ionic',['Angular'],'移动 / 混合应用','https://ionicframework.com','https://github.com/ionic-team/ionic-framework','MIT',['App','Tabs','Card','Modal']],
  ['covalent','Covalent','Teradata',['Angular'],'企业级 / 数据','https://teradata.github.io/covalent','https://github.com/Teradata/covalent','MIT',['Layout','DataTable','Chart','File']],
  ['fundamental-ngx','Fundamental NGX','SAP',['Angular'],'企业设计系统','https://sap.github.io/fundamental-ngx','https://github.com/SAP/fundamental-ngx','Apache',['Button','Input','Table','Modal']],
  ['agnosui','AgnosUI','AgnosUI',['Angular'],'Headless / 可定制','https://agnosui.github.io','https://github.com/agnosui/agnosui','MIT',['Accordion','Datepicker','Rating','Slider']],
  ['ng-aquila','ng-aquila','Nationwide',['Angular'],'金融设计系统','https://designsystem.nationwide.com','https://github.com/klabrecque/ng-aquila','Apache',['Button','Input','Card','Stepper']],
  ['devui-ng','DevUI','华为 Huawei',['Angular'],'企业级 / 华为','https://devui.design','https://github.com/DevCloudFE/ng-devui','MIT',['Button','Input','Table','Tree']],
  ['oblique','Oblique','Swiss Post',['Angular'],'政府 / 企业','https://oblique.obs.ch','https://github.com/obliqueOTypescript/oblique','MIT',['MasterLayout','Nav','Form','Notification']],
  ['sbb-angular','sbb-angular','SBB',['Angular'],'交通 / 公共设计','https://angular.sbb.ch','https://github.com/sbb-design-systems/angular','MIT',['Button','Train','Map','Form']],
  ['ngx-bootstrap','ngx-bootstrap','ValorSoftware',['Angular'],'Bootstrap 风','https://valor-software.com/ngx-bootstrap','https://github.com/valor-software/ngx-bootstrap','MIT',['Modal','Tabs','Tooltip','Datepicker']],

  // ===== Svelte =====
  ['meltui','Melt UI','Melt',['Svelte'],'Headless / 无样式','https://melt-ui.com','https://github.com/melt-ui/melt-ui','MIT',['Menu','Dialog','Select','Tooltip']],
  ['bitsui','Bits UI','Bits UI',['Svelte'],'无样式 / 可定制','https://www.bits-ui.com','https://github.com/huntabyte/bits-ui','MIT',['Accordion','Dialog','Datepicker','Toast']],
  ['svar','SVAR','SVAR',['Svelte'],'数据组件 / 表格','https://svar.dev','https://github.com/svar-widget/svar-svelte','MIT',['Grid','Gantt','Kanban','FileManager']],
  ['sveltestrap','Sveltestrap','Sveltestrap',['Svelte'],'Bootstrap 风','https://sveltestrap.js.org','https://github.com/bestguy/sveltestrap','MIT',['Button','Card','Modal','Navbar']],
  ['smelte','Smelte','Smelte',['Svelte'],'Material 风','https://smeltejs.com','https://github.com/matyunya/smelte','MIT',['Button','Card','Input','DataTable']],
  ['attractions','Attractions','illright',['Svelte'],'现代 / 轻量','https://attractions.scalar.dev','https://github.com/illright/attractions','MIT',['Button','Card','Tooltip','Notification']],
  ['svelteui','SvelteUI','SvelteUI',['Svelte'],'现代组件','https://svelteui.dev','https://github.com/svelteuidev/svelteui','MIT',['Button','Card','Modal','AppShell']],
  ['grailui','Grail UI','Grail UI',['Svelte'],'Headless / 可访问','https://grail-ui.vercel.app','https://github.com/grail-ui/grail-ui','MIT',['Accordion','Dialog','Slider','Tooltip']],
  ['atoui','Ato UI','Ato UI',['Svelte'],'现代 / 主题化','https://ato-ui.com','https://github.com/ato-ui/ato-ui','MIT',['Button','Card','Modal','Toast']],
  ['m3-svelte','M3 Svelte','techniq',['Svelte'],'Material 3','https://github.com/techniq/m3-svelte','https://github.com/techniq/m3-svelte','MIT',['Button','Card','Switch','Slider']],
  ['konsta','Konsta','Konsta',['Svelte'],'移动 / 原生风','https://konsta.io','https://github.com/konstaui/konsta','MIT',['Button','Navbar','Card','Sheet']],
  ['yesvelte','Yesvelte','Yesvelte',['Svelte'],'现代组件','https://yesvelte.com','https://github.com/yesvelte/yesvelte','MIT',['Button','Card','Modal','Alert']],

  // ===== Solid =====
  ['solid-ui','Solid UI','Solid UI',['Solid'],'Radix 风格','https://solid-ui.com','https://github.com/solidjs-community/solid-ui','MIT',['Dialog','Dropdown','Select','Toast']],
  ['hope-ui','Hope UI','Hope UI',['Solid'],'Chakra 风格','https://hope-ui.com','https://github.com/hope-ui/hope-ui','MIT',['Button','Card','Input','Modal']],
  ['solid-headless-ui','Solid Headless','solidjs',['Solid'],'无样式原语','https://github.com/solidjs/solid-headless','https://github.com/solidjs/solid-headless','MIT',['Disclosure','Dialog','Listbox','Menu']],

  // ===== Qwik =====
  ['qwik-ui','Qwik UI','Qwik',['Qwik'],'Headless / 可访问','https://qwikui.com','https://github.com/QwikDev/qwik-ui','MIT',['Accordion','Dialog','Tabs','Tooltip']],

  // ===== Lit / Web Components =====
  ['spectrum-wc','Spectrum Web Components','Adobe',['Web Components'],'企业设计系统','https://opensource.adobe.com/spectrum-web-components','https://github.com/adobe/spectrum-web-components','Apache',['Button','Card','Dialog','Picker']],
  ['ui5-wc','UI5 Web Components','SAP',['Web Components'],'企业设计系统','https://sap.github.io/ui5-webcomponents','https://github.com/SAP/ui5-webcomponents','Apache',['Button','Card','Table','Calendar']],
  ['axa-pl','AXA Pattern Library','AXA',['Web Components'],'金融 / 企业','https://github.com/axa-ch/patterns-library','https://github.com/axa-ch/patterns-library','MIT',['Button','Card','Modal','Stepper']],
  ['brightspace-ui','Brightspace UI','D2L',['Web Components'],'教育 / 企业','https://github.com/BrightspaceUI/core','https://github.com/BrightspaceUI/core','Apache',['Button','Card','Dialog','Dropdown']],
  ['clarity-core','Clarity Core','VMware',['Web Components'],'企业设计系统','https://clarity.design','https://github.com/vmware-clarity/core','Apache',['Button','Card','Modal','Alert']],
  ['kor','Kor','Microfrontend',['Web Components'],'设计系统','https://kor-ui.com','https://github.com/micro-lc/kor','MIT',['Button','Card','Dialog','Toast']],
  ['momentum-ui','Momentum UI','Cisco',['Web Components'],'企业设计系统','https://momentum.design','https://github.com/momentum-design/momentum-ui','Apache',['Button','Card','Modal','Chart']],
  ['pharos','Pharos','JSTOR',['Web Components'],'学术 / 企业','https://pharos.jstor.org','https://github.com/ithaka/pharos','Apache',['Button','Card','Dialog','Tabs']],
  ['redhat-ds','Red Hat Design System','Red Hat',['Web Components'],'企业 / 开源','https://www.redhat.com/designsystem','https://github.com/redhat-design-system/red-hat-design-system','CC-BY',['Button','Card','Form','Modal']],
  ['calcite','Calcite Components','Esri',['Web Components'],'地图 / GIS','https://developers.arcgis.com/calcite-design-system','https://github.com/Esri/calcite-design-system','Apache',['Button','Card','Map','Panel']],
  ['vaadin-wc','Vaadin Components','Vaadin',['Web Components'],'企业级','https://vaadin.com/components','https://github.com/vaadin/web-components','Apache',['Button','Grid','Form','DatePicker']],
  ['agnosticui','AgnosticUI','AgnosticUI',['Web Components'],'框架无关','https://agnosticui.com','https://github.com/AgnosticUI/agnosticui','MIT',['Button','Card','Modal','Tabs']],
  ['dile-wc','Dile Components','Dile',['Web Components'],'框架无关','https://dile.github.io','https://github.com/OpenWebComponents/dile-components','MIT',['Button','Card','Modal','Tabs']],
  ['wired-elements','wired-elements','wiredjs',['Web Components'],'手绘风 / 趣味','https://wiredjs.com','https://github.com/wiredjs/wired-elements','MIT',['Button','Input','Card','Slider']],

  // ===== CSS / 纯样式 =====
  ['unocss','UnoCSS','UnoCSS',['CSS'],'原子化 CSS 引擎','https://unocss.dev','https://github.com/unocss/unocss','MIT',['Utility','Icon','Attributify']],
  ['open-props','Open Props','Open Props',['CSS'],'CSS 变量 / 设计令牌','https://open-props.style','https://github.com/argyleink/open-props','MIT',['Theme','Tokens','Gradients']],
  ['panda-css','Panda CSS','Chakra',['CSS'],'原子化 / 类型安全','https://panda-css.com','https://github.com/chakra-ui/panda','MIT',['Utility','Recipe','Tokens']],
  ['vanilla-extract','Vanilla Extract','Vanilla Extract',['CSS'],'零运行时 / TS','https://vanilla-extract.style','https://github.com/vanilla-extract-css/vanilla-extract','MIT',['Style','Theme','Recipe']],
  ['stylex','StyleX','Meta',['CSS'],'原子化 / 规模化','https://stylexjs.dev','https://github.com/facebook/stylex','MIT',['Style','Create','Attrs']],
  ['lightning-css','Lightning CSS','Lightning CSS',['CSS'],'CSS 编译器 / 工具','https://lightningcss.dev','https://github.com/parcel-bundler/lightningcss','MIT',['Bundler','Minify','Transform']],
  ['halfmoon','Halfmoon','Halfmoon',['CSS'],'框架 / 暗色','https://www.gethalfmoon.com','https://github.com/halfmoonui/halfmoon','MIT',['Button','Card','Form','Navbar']],
  ['milligram','Milligram','Milligram',['CSS'],'极简 / 轻量','https://milligram.io','https://github.com/milligram/milligram','MIT',['Button','Card','Form','Table']],
  ['beer-css','Beer CSS','Beer',['CSS'],'Material 风','https://www.beercss.com','https://github.com/beercss/beercss','MIT',['Button','Card','Dialog','App']],
  ['materialize','Materialize','Materialize',['CSS'],'Material 风','https://materializecss.com','https://github.com/Dogfalo/materialize','MIT',['Button','Card','Modal','Carousel']],
  ['chota','Chota','Chota',['CSS'],'微框架 / 极简','https://jenil.github.io/chota','https://github.com/jenil/chota','MIT',['Button','Card','Grid','Nav']],
  ['pure-css','Pure.css','Yahoo',['CSS'],'极简 / 模块化','https://purecss.io','https://github.com/pure-css/pure','BSD',['Button','Grid','Form','Menu']],
  ['tachyons','Tachyons','Tachyons',['CSS'],'原子化 / 古典','https://tachyons.io','https://github.com/tachyons-css/tachyons','MIT',['Utility','Layout','Type']],

  // ===== 设计系统 / 大厂 =====
  ['material-design','Material Design','Google',['Multi'],'设计语言 / 规范','https://m3.material.io','https://m3.material.io','Apache',['Button','Card','Color','Type']],
  ['sap-fiori','SAP Fiori','SAP',['Multi'],'企业设计系统','https://experience.sap.com/fiori-design','https://experience.sap.com/fiori-design','Apache',['Launchpad','Card','List','Object']],
  ['sap-fundamental','SAP Fundamental','SAP',['Multi'],'企业样式','https://sap.github.io/fundamental-styles','https://github.com/SAP/fundamental-styles','Apache',['Button','Card','Table','Modal']],
  ['oracle-redwood','Oracle Redwood','Oracle',['Multi'],'企业设计系统','https://www.oracle.com/redwood','https://www.oracle.com/redwood','商用',['Button','Card','Form','Page']],
  ['twilio-paste','Twilio Paste','Twilio',['React'],'通信 / 企业','https://paste.twilio.com','https://github.com/twilio-labs/paste','Apache',['Button','Card','Form','Grid']],
  ['hubspot-canvas','HubSpot Canvas','HubSpot',['React'],'营销 / 企业','https://canvas.hubspot.com','https://github.com/HubSpot/canvas','Apache',['Button','Card','Form','Modal']],
  ['audi-ui','Audi UI','Audi',['Multi'],'汽车 / 品牌','https://www.audi.com/ci','https://www.audi.com/ci','商用',['Button','Card','Grid','Type']],
  ['backpack','Backpack','Skyscanner',['React'],'旅行 / 企业','https://backpack.github.io','https://github.com/Skyscanner/backpack','Apache',['Button','Card','Breadcrumb','Dialog']],
  ['devui-design','DevUI Design','华为 Huawei',['Vue'],'企业级 / 华为','https://devui.design','https://github.com/DevCloudFE/devui','MIT',['Button','Card','Table','Tree']],
  ['mand-mobile','Mand Mobile','滴滴 Didi',['Vue'],'移动端 / 滴滴','https://didi.github.io/mand-mobile','https://github.com/didi/mand-mobile','Apache',['Button','Tab','Toast','Popup']],
  ['ke-design','Ke.Design','贝壳 Beike',['React'],'房产 / 企业','https://ke.design','https://github.com/ke-cloud/ke-design','MIT',['Button','Card','Form','Modal']],
  ['vercel-geist','Vercel Geist','Vercel',['Multi'],'极简 / 开发者','https://vercel.com/geist','https://github.com/vercel/geist','MIT',['Button','Card','Font','Color']],
  ['workday-canvas','Workday Canvas','Workday',['React'],'企业 HR','https://designsystem.workday.com','https://github.com/Workday/canvas-kit','Apache',['Button','Card','Form','Modal']],
  ['zendesk-garden','Zendesk Garden','Zendesk',['React'],'企业 / 客服','https://garden.zendesk.com','https://github.com/zendeskgarden/react-components','Apache',['Button','Card','Form','Modal']],
  ['bbc-gel','BBC GEL','BBC',['Multi'],'媒体 / 公共','https://www.bbc.co.uk/gel','https://www.bbc.co.uk/gel','CC-BY',['Button','Card','Grid','Type']],
  ['uswds','U.S. Web Design System','U.S. GSA',['Web Components'],'政府 / 公共','https://designsystem.digital.gov','https://github.com/uswds/uswds','CC0',['Button','Card','Form','Banner']],
  ['govuk','GOV.UK Design System','UK Gov',['Multi'],'政府 / 公共','https://design-system.service.gov.uk','https://github.com/alphagov/govuk-frontend','MIT',['Button','Card','Form','Footer']],
  ['nord','Nord Design System','Nordhealth',['React'],'医疗 / 企业','https://nordhealth.design','https://github.com/nordhealth-design/nord','MIT',['Button','Card','Form','Modal']]
];

const newLibs = NEW.map(G);
console.log('new libs:', newLibs.length);

// ---------- 3) 获奖项目 ----------
// 本地克隆(已有真实截图) -> 直接用 previews/proj-*.png
const localClones = [
  { id:'proj-2021-two-good-co', name:'Two Good Co', agency:'Two Good Co', year:2021, award:'Awwwards SOTD', theme:'作品集 / 电商', tech:['Next.js','GSAP','平滑动画'], link:'https://www.twogoodco.com', img:'previews/proj-2021-two-good-co.png' },
  { id:'proj-2023-atmos', name:'Atmos', agency:'Wawa', year:2023, award:'Awwwards', theme:'3D / WebGL', tech:['React Three Fiber','GLSL','GSAP'], link:'https://atmos.studio', img:'previews/proj-2023-atmos.png' },
  { id:'proj-2023-obys', name:'Obys Agency', agency:'Obys', year:2023, award:'Awwwards', theme:'创意机构', tech:['Vanilla JS','GSAP','WebGL'], link:'https://obys.agency', img:'previews/proj-2023-obys.png' },
  { id:'proj-2024-gentlerain', name:'Gentle Rain', agency:'Manish', year:2024, award:'Awwwards', theme:'3D / WebGL', tech:['R3F','GLSL','Lenis'], link:'https://gentlerain.ai', img:'previews/proj-2024-gentlerain.png' },
  { id:'proj-2025-adidas', name:'Adidas (Clone)', agency:'Ali Sanati', year:2025, award:'Awwwards', theme:'产品落地页', tech:['Three.js','GSAP','Lenis'], link:'https://github.com/Ali-Sanati/awwwards-adidas', img:'previews/proj-2025-adidas.png' },
  { id:'proj-template-portfolio', name:'Portfolio Template', agency:'Community', year:2024, award:'模板', theme:'作品集模板', tech:['Vite','GSAP','Three.js'], link:'https://github.com', img:'previews/proj-template-portfolio.png' },
  { id:'proj-bruno-folio-2019', name:'Bruno Simon Folio 2019', agency:'Bruno Simon', year:2019, award:'Awwwards SOTM', theme:'3D / WebGL 标杆', tech:['Three.js','Cannon.js','GSAP'], link:'https://bruno-simon.com', img:'previews/proj-bruno-folio-2019.png' },
  { id:'proj-bruno-folio-2025', name:'Bruno Simon Folio 2025', agency:'Bruno Simon', year:2025, award:'Awwwards SOTM', theme:'3D / WebGL 标杆', tech:['React Three Fiber','Rapier','GSAP'], link:'https://bruno-simon.com', img:'previews/proj-bruno-folio-2025.png' }
].map(a => ({ ...a, kind:'proj', fw:[], vendor:a.agency }));

// 外部获奖站(生成风格卡)。元组: [id,name,agency,year,award,theme,tech,link,accent]
const normTech = (t) => Array.isArray(t) ? t : String(t || '').split('/').map(s => s.trim()).filter(Boolean);
const A = (a) => ({ id:a[0], name:a[1], agency:a[2], year:a[3], award:a[4], theme:a[5], tech:normTech(a[6]), link:a[7], accent:a[8], kind:'proj', fw:[], vendor:a[2], img:'previews/'+a[0]+'.png' });
const AW = [
  ['awd-lusion-oryzo','Lusion — Oryzo AI','Lusion',2024,'Awwwards SOTM','WebGL / AI','Three.js','https://lusion.com/work/oryzo','#6ee7b7'],
  ['awd-immersive-gq','Immersive Garden — GQ&AP','Immersive Garden',2023,'Awwwards','创意机构','WebGL','https://www.immersive-garden.com','#ff6b9d'],
  ['awd-immersive-cartier','Immersive Garden — Cartier','Immersive Garden',2022,'Awwwards','奢侈品牌','Three.js','https://www.cartier.com','#c9a227'],
  ['awd-resn-tracing','Resn — Tracing Art','Resn',2023,'FWA','实验 / WebGL','Canvas','https://www.resn.co.nz','#ff3e00'],
  ['awd-noomo','Noomo Agency','Noomo',2023,'Awwwards','机构作品集','Nuxt3 / Three','https://noomo.agency','#22d3ee'],
  ['awd-unknown','THE UN KNOWN','The Unknown',2023,'Awwwards','创意机构','Astro','https://www.the-unknown.studio','#a78bfa'],
  ['awd-jeton','Jeton','Bürocratik',2022,'Awwwards','金融科技','WebGL','https://jeton.com','#f59e0b'],
  ['awd-activetheory','Active Theory','Active Theory',2023,'Awwwards / FWA','互动体验','WebGL','https://activetheory.net','#f472b6'],
  ['awd-cuberto','Cuberto','Cuberto',2022,'Awwwards','创意机构','GSAP','https://cuberto.com','#22d3ee'],
  ['awd-akqa','AKQA','AKQA',2023,'Awwwards','数字代理','WebGL','https://www.akqa.com','#ef4444'],
  ['awd-hellomonday','Hello Monday','Hello Monday',2022,'Awwwards','品牌体验','Three.js','https://hellomonday.com','#34d399'],
  ['awd-dogstudio','Dogstudio','Dogstudio',2021,'Awwwards','创意机构','WebGL','https://dogstudio.co','#60a5fa'],
  ['awd-makemepulse','Makemepulse','Makemepulse',2022,'Awwwards','创意机构','GSAP','https://www.makemepulse.com','#fb7185'],
  ['awd-rga','R/GA','R/GA',2021,'Awwwards','数字代理','Web','https://www.rga.com','#f59e0b'],
  ['awd-webflow','Webflow','Webflow',2023,'Awwwards','建站平台','WebGL','https://webflow.com','#4353ff'],
  ['awd-waaark','Waaark','Waaark',2020,'Awwwards','作品集','GSAP','https://waaark.com','#a78bfa'],
  ['awd-locomotive','Locomotive','Locomotive',2022,'Awwwards','作品集 / 平滑滚动','Lenis','https://locomotive.ca','#f97316'],
  ['awd-huge','Huge Inc','Huge',2021,'Awwwards','数字代理','Web','https://www.hugeinc.com','#f43f5e'],
  ['awd-antinomy','Antinomy','Antinomy',2023,'Awwwards','实验','WebGL','https://antinomy.studio','#22d3ee'],
  ['awd-qode','Qode','Qode',2022,'Awwwards','模板 / 作品集','GSAP','https://qodeinteractive.com','#8b5cf6'],
  ['awd-cleave','Cleave','Cleave',2023,'Awwwards','创意','Three.js','https://cleave.me','#34d399'],
  ['awd-aristide','Aristide','Aristide',2023,'Awwwards','作品集','GSAP','https://aristidebenoist.com','#60a5fa'],
  ['awd-tolus','Tolus','Tolus',2023,'Awwwards','机构','WebGL','https://tolus.studio','#f472b6'],
  ['awd-crafted','Crafted','Crafted',2022,'Awwwards','创意','GSAP','https://crafted.works','#fb923c'],
  ['awd-hakuhodo','Hakuhodo','Hakuhodo',2022,'Awwwards','广告 / 创意','WebGL','https://www.hakuhodo.fr','#ef4444'],
  ['awd-fashionawards','Fashion Awards','British Fashion Council',2023,'Awwwards','时尚','Three.js','https://fashionawards.com','#d946ef'],
  ['awd-cupra','Cupra','Cupra',2023,'Awwwards','汽车','WebGL','https://www.cupra.fr','#f59e0b'],
  ['awd-volvo','Volvo','Volvo',2023,'Awwwards','汽车','WebGL','https://www.volvocars.com','#60a5fa'],
  ['awd-gucci','Gucci','Gucci',2022,'Awwwards','奢侈','GSAP','https://www.gucci.com','#c9a227'],
  ['awd-balenciaga','Balenciaga','Balenciaga',2022,'Awwwards','奢侈','WebGL','https://www.balenciaga.com','#9ca3af'],
  ['awd-louisvuitton','Louis Vuitton','Louis Vuitton',2023,'Awwwards','奢侈','Three.js','https://www.louisvuitton.com','#c9a227'],
  ['awd-apple','Apple','Apple',2023,'Awwwards','产品','WebGL','https://www.apple.com','#9ca3af'],
  ['awd-cybernauts','cybērnauts','Cybernauts',2023,'Awwwards','创意','WebGL','https://cybernauts.studio','#22d3ee'],
  ['awd-instrument','Instrument','Instrument',2022,'Awwwards','数字代理','WebGL','https://instrument.com','#60a5fa'],
  ['awd-field','Field.io','Field',2022,'Awwwards','创意','Three.js','https://field.io','#22d3ee'],
  ['awd-animade','Animade','Animade',2021,'Awwwards','创意','GSAP','https://animade.tv','#f472b6'],
  ['awd-unseen','Unseen','Unseen',2023,'Awwwards','机构','WebGL','https://unseen.co','#a78bfa'],
  ['awd-haus','Haus','Haus',2023,'Awwwards','品牌','Three.js','https://haus.studio','#f59e0b'],
  ['awd-buck','Buck','Buck',2022,'Awwwards','创意','WebGL','https://buck.co','#60a5fa'],
  ['awd-raggededge','Ragged Edge','Ragged Edge',2022,'Awwwards','品牌','Web','https://raggededge.com','#34d399'],
  ['awd-velvet','Velvet','Velvet',2023,'Awwwards','创意','GSAP','https://velvet.studio','#fb7185'],
  ['awd-bureau-borsche','Bureau Borsche','Bureau Borsche',2022,'Awwwards','设计','WebGL','https://bureau-borsche.com','#f59e0b'],
  ['awd-studio-lumio','Studio Lumio','Lumio',2023,'Awwwards','工作室','Three.js','https://studiolumio.com','#34d399'],
  ['awd-buzzed','Buzzed','Buzzed',2023,'Awwwards','互动','WebGL','https://buzzed.studio','#f472b6'],
  ['awd-verve','Verve','Verve',2023,'Awwwards','音乐','WebGL','https://verve.com','#a78bfa']
];
const awards = [...localClones, ...AW.map(A)];
console.log('awards:', awards.length);

// ---------- 4) 合并输出 ----------
const ITEMS = [...existingItems, ...newLibs, ...awards];
fs.writeFileSync('preview-data.json', JSON.stringify(ITEMS, null, 1));

// ---------- 5) 合并复现提示词（来自 repro 闭环，保证重建不丢）----------
(function mergeReproPrompts() {
  let n = 0;
  for (const it of ITEMS) {
    const rj = path.join('repro', it.id, 'result.json');
    if (!fs.existsSync(rj)) continue;
    try {
      const r = JSON.parse(fs.readFileSync(rj, 'utf8'));
      let p = '';
      if (r.finalPrompt && fs.existsSync(r.finalPrompt)) {
        p = fs.readFileSync(r.finalPrompt, 'utf8').trim();
      } else {
        const dir = path.join('repro', it.id);
        if (fs.statSync(dir).isDirectory()) {
          const cand = fs.readdirSync(dir)
            .filter(f => /^prompt\.v\d+\.md$/.test(f))
            .sort((a, b) => +b.match(/v(\d+)/)[1] - +a.match(/v(\d+)/)[1]);
          if (cand.length) p = fs.readFileSync(path.join(dir, cand[0]), 'utf8').trim();
        }
      }
      if (p) { it.prompt = p; n++; }
    } catch (e) { /* ignore */ }
  }
  fs.writeFileSync('preview-data.json', JSON.stringify(ITEMS, null, 1));
  console.log('merged repro prompts:', n);
})();

console.log('TOTAL ITEMS:', ITEMS.length);
const fwCount = new Set();
ITEMS.forEach(i => (i.fw || []).forEach(f => fwCount.add(f)));
console.log('frameworks:', [...fwCount].join(', '));
