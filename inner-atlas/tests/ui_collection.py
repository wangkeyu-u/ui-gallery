"""Explicit-consent collection and creator review; simulated AI and synthetic participants only."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,subprocess,shutil,tempfile,os
BASE=os.environ.get('COLLECTION_PREVIEW_URL','http://127.0.0.1:4192').rstrip('/')
OWNER_KEY='1'*64
OUT=Path(tempfile.mkdtemp(prefix='inner-atlas-collection-ui-'))
fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {fixtureSession} from './tests/fixtures/ai.mjs';import {activeQuestions} from './src/data.js';const s=fixtureSession({jung:false,health:true,remember:true});console.log(JSON.stringify({session:s,questions:activeQuestions(s.config)}));"],text=True))
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 errors=[]
 # No collection without an explicit affirmative choice.
 guest=browser.new_page();guest.on('pageerror',lambda e:errors.append(str(e)));guest.goto(BASE+'/#/setup');guest.locator('.collection-setup:not([hidden])').wait_for()
 guest.locator('input[name=adult]').check();guest.get_by_role('button',name='准备好了，开始',exact=True).click();guest.keyboard.press('4');guest.wait_for_timeout(1400)
 before=guest.request.get(BASE+'/api/owner/submissions',headers={'Authorization':'Bearer '+OWNER_KEY}).json();assert before['records']==[]
 guest.close()
 page=browser.new_page(viewport={'width':390,'height':844},accept_downloads=True);page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/#/setup');page.locator('.collection-setup:not([hidden])').wait_for()
 page.locator('input[name=jung]').uncheck();page.locator('input[name=health]').check();page.locator('input[name=remember]').check();page.locator('input[name=participantLabel]').fill('测试朋友 <svg>')
 page.locator('input[name=collect]').check();page.locator('input[name=adult]').check();page.get_by_role('button',name='准备好了，开始',exact=True).click()
 for i,q in enumerate(fixture['questions']):
  value=fixture['session']['answers'][q['id']];page.keyboard.press(str(value-q['min']+1))
  if i==0:
   page.wait_for_timeout(1400);draft=page.request.get(BASE+'/api/owner/submissions',headers={'Authorization':'Bearer '+OWNER_KEY}).json()['records'];assert len(draft)==1;assert draft[0]['status']=='draft'
  page.keyboard.press('Enter')
 page.wait_for_url('**/#/review');page.get_by_role('button',name='查看我的报告与综合分析',exact=True).click();page.locator('#ai-service-status[data-state=ready]').wait_for()
 assert OWNER_KEY not in page.content()
 page.locator('#ai-analysis-form input[name=consent]').check();page.get_by_role('button',name='生成我的 AI 综合分析',exact=True).click();page.locator('.ai-portrait-core').wait_for()
 page.get_by_text('答卷与报告已保存', exact=False).wait_for()
 for width,h in [(390,844),(1440,980)]:
  page.set_viewport_size({'width':width,'height':h})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.locator('.reader-report-bar').evaluate("(el) => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 80)")
  page.screenshot(path=str(OUT / f'participant-{width}.png'))
 actual=page.evaluate('JSON.parse(localStorage.getItem("inner-atlas.v1.session"))');assert actual['answers']==fixture['session']['answers']
 owner=browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True);owner.on('pageerror',lambda e:errors.append(str(e)));owner.goto(BASE+'/#/owner')
 owner.locator('#owner-login input[name=ownerKey]').fill(OWNER_KEY);owner.get_by_role('button',name='查看答卷和报告',exact=True).click();owner.locator('.owner-record').wait_for()
 assert owner.locator('.owner-record').count()==1;assert owner.locator('.owner-record svg').count()==0
 with owner.expect_download() as d:owner.get_by_role('button',name='导出全部JSON备份',exact=True).click()
 d.value.save_as(str(OUT/'all.json'));export=json.loads((OUT/'all.json').read_text());record=export['records'][0]
 assert record['answers']['phq-1']==0;assert record['analysis']['report']['overall']['portrait'];assert 'editTokenHash' not in record
 owner.locator('.owner-record').click();owner.locator('#owner-detail').wait_for();assert owner.locator('.ai-portrait-core').is_visible()
 with owner.expect_download() as d:owner.get_by_role('button',name='导出逐题CSV',exact=True).click()
 d.value.save_as(str(OUT/'answers.csv'));assert 'phq-1' in (OUT/'answers.csv').read_text();assert '"0","完全没有"' in (OUT/'answers.csv').read_text()
 with owner.expect_download() as d:owner.get_by_role('button',name='导出报告Markdown',exact=True).click()
 d.value.save_as(str(OUT/'report.md'));assert '整体画像' in (OUT/'report.md').read_text()
 for width in [360,390,768,1440]:
  owner.set_viewport_size({'width':width,'height':844});assert owner.evaluate('document.documentElement.scrollWidth<=innerWidth')
 owner.screenshot(path=str(OUT/'owner-report.png'))
 page.reload();page.locator('.collection-message').wait_for();page.wait_for_function('document.querySelector(".collection-message").textContent.includes("已保存")')
 persisted=page.request.get(BASE+'/api/owner/submissions/'+record['id'],headers={'Authorization':'Bearer '+OWNER_KEY}).json();assert persisted['analysis']['report']['overall']['portrait']
 page.goto(BASE+'/#/privacy');page.locator('.collection-status').wait_for()
 with page.expect_download() as d:
  page.get_by_role('button',name='下载当前答题备份',exact=True).click()
 d.value.save_as(str(OUT/'portable.json'))
 portable=json.loads((OUT/'portable.json').read_text())
 assert 'collection' not in portable and portable['answers']==fixture['session']['answers']
 page.get_by_role('button',name='停止共享并撤回记录',exact=True).click();page.get_by_text('服务器记录已撤回',exact=False).wait_for()
 after=page.request.get(BASE+'/api/owner/submissions',headers={'Authorization':'Bearer '+OWNER_KEY}).json();assert after['records']==[]
 assert not errors,errors
 print(json.dumps({'no_upload_without_consent':'passed','actual_questions':158,'draft_and_report_saved':'passed','owner_only':'passed','json_csv_markdown':'passed','refresh_preserves_server_report':'passed','withdrawal':'passed','viewports':[360,390,768,1440],'errors':errors,'artifacts':str(OUT)},ensure_ascii=False))
 browser.close()
