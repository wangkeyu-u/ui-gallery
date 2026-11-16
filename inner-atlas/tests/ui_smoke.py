from playwright.sync_api import sync_playwright
from pathlib import Path
import json, os, tempfile, shutil
BASE=os.environ.get('PREVIEW_URL','http://localhost:4173').rstrip('/')
OUT=Path(os.environ.get('UI_ARTIFACT_DIR',tempfile.mkdtemp(prefix='inner-atlas-ui-')));OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1365,'height':960},accept_downloads=True)
 page=context.new_page();errors=[];network=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:network.append((r.method,r.url)))
 page.goto(BASE)
 assert '你比一个标签' in page.locator('h1').inner_text()
 page.get_by_role('link',name='开启自我探索').click()
 page.locator('input[name=health]').check();page.locator('input[name=trauma]').check();page.locator('input[name=remember]').check()
 assert page.locator('#setup-count').inner_text()=='178题'
 page.locator('input[name=adult]').check();page.get_by_role('button',name='准备好了，开始').click()
 assert '/quiz' in page.url
 assert page.get_by_role('button',name='下一题',exact=True).is_disabled()
 page.get_by_role('button',name='跳过这题').click()
 assert '很少关心' in page.locator('#question-title').inner_text()
 page.get_by_role('button',name='上一题',exact=True).click()
 assert '聚会中' in page.locator('#question-title').inner_text()
 for i in range(178):
  # Key 1 is always a valid option, maps to raw 1 for traits and 0 for symptom/scenario items.
  page.keyboard.press('1')
  if i==150:
   # Actual PHQ ninth is zero-based 150 (142 core + 8), force raw 1 to exercise immediate support.
   page.keyboard.press('2')
   page.get_by_role('heading',name='先照顾此刻的安全').wait_for(state='visible')
  page.keyboard.press('Enter')
 page.wait_for_url('**/#/review')
 assert '已回答 178 / 178' in page.locator('#main').inner_text()
 # Save/restore correctly keeps raw zero answers, every chapter and the final index.
 page.reload();assert '/review' in page.url
 assert '已回答 178 / 178' in page.locator('#main').inner_text()
 page.get_by_role('button',name='查看我的报告与综合分析').click();page.wait_for_url('**/#/report/synthesis')
 page.get_by_role('heading',name='先照顾此刻的安全').wait_for(state='visible')
 for tab in ['synthesis','personality','relationships','emotion','health','actions']:
  page.goto(BASE+'/#/report/'+tab)
  assert page.locator('.report-tab-panel.shown').count()==1
  assert 'NaN' not in page.locator('#main').inner_text()
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
 page.goto(BASE+'/#/report/health')
 assert page.locator('.screen-number').nth(0).inner_text().strip()=='1 / 27'
 assert page.locator('.screen-number').nth(1).inner_text().strip()=='0 / 21'
 assert page.locator('.screen-number').nth(2).inner_text().strip()=='0 / 80'
 page.screenshot(path=str(OUT/'health-desktop.png'),full_page=True)
 # Markdown download includes full report and reference limitations.
 with page.expect_download() as d:page.get_by_role('button',name='导出报告').click()
 dest=OUT/'report.md';d.value.save_as(str(dest));assert '人格底色' in dest.read_text();assert '不是诊断' in dest.read_text()
 # Print media exposes all report sections.
 page.emulate_media(media='print');assert page.locator('.report-tab-panel:visible').count()==6
 page.pdf(path=str(OUT/'report.pdf'),format='A4',print_background=True)
 page.emulate_media(media='screen')
 # Export full backup and roundtrip through real file input.
 page.goto(BASE+'/#/privacy')
 with page.expect_download() as d:page.get_by_role('button',name='下载当前答题备份').click()
 backup=OUT/'backup.json';d.value.save_as(str(backup));data=json.loads(backup.read_text());assert len(data['answers'])==178
 page.get_by_role('button',name='清除当前页面与已保存的答题数据').click();page.get_by_role('button',name='清除数据',exact=True).click()
 page.wait_for_url('**/#/');page.wait_for_function('localStorage.getItem("inner-atlas.v1.session") === null')
 page.goto(BASE+'/#/privacy');page.locator('#import-file').set_input_files(str(backup));page.get_by_role('button',name='导入并替换').click();page.wait_for_url('**/#/report/synthesis')
 assert '178 / 178 题已答' in page.locator('#main').inner_text()
 # All responsive pages including sources and 7-option questions stay within viewport.
 for width in [360,390,768,1024,1440]:
  page.set_viewport_size({'width':width,'height':844})
  for route in ['/','/modules','/setup','/sources','/report/synthesis','/report/overview','/report/relationships','/report/health','/privacy','/quiz']:
   page.goto(BASE+'/#'+route)
   assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'),(width,route,page.evaluate('document.documentElement.scrollWidth'))
 page.set_viewport_size({'width':390,'height':844});page.goto(BASE+'/#/review');page.get_by_role('button',name='总体依恋第1题，已回答',exact=True).click();page.locator('#question-title').wait_for();page.screenshot(path=str(OUT/'quiz-mobile.png'),full_page=True)
 assert page.locator('input[name=answer]').count()==7
 # Fresh memory-only session does not leave answers in storage after refresh.
 fresh=browser.new_context(viewport={'width':390,'height':844});fp=fresh.new_page();fp.goto(BASE+'/#/setup');fp.locator('input[name=adult]').check();fp.get_by_role('button',name='准备好了，开始').click();fp.keyboard.press('1');assert fp.evaluate('localStorage.length')==0;fp.reload();fp.wait_for_url('**/#/setup')
 assert not errors,errors
 assert all(method=='GET' and url.startswith(BASE) for method,url in network),[(m,u) for m,u in network if m!='GET' or not u.startswith(BASE)]
 print(json.dumps({'completed_questions':178,'checked_viewports':[360,390,768,1024,1440],'page_errors':errors,'external_or_write_requests':0,'backup_roundtrip':'passed','print_sections':6,'memory_default':'passed'},ensure_ascii=False))
 browser.close()
