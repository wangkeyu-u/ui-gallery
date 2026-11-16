"""Optional-chapter migration and cross-theory UI regression; simulated upstream only."""
from playwright.sync_api import sync_playwright
import os,json,subprocess,shutil,tempfile
from pathlib import Path
BASE=os.environ.get('AI_PREVIEW_URL','http://127.0.0.1:4188').rstrip('/')
OUT=Path(tempfile.mkdtemp(prefix='inner-atlas-jung-ui-'))
fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {fixtureSession} from './tests/fixtures/ai.mjs';const s=fixtureSession({jung:false,remember:true});delete s.config.jung;console.log(JSON.stringify(s));"],text=True))
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},accept_downloads=True)
 errors=[];posts=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:posts.append(r) if r.method=='POST' else None)
 page.goto(BASE);page.evaluate('(s)=>localStorage.setItem("inner-atlas.v1.session",JSON.stringify(s))',fixture)
 page.goto(BASE+'/#/report/jung');page.reload()
 assert '没有开启八维' in page.locator('#report-jung').inner_text()
 page.get_by_role('button',name='补充八维题，保留已有回答',exact=True).click()
 page.locator('#question-title').wait_for()
 started=page.evaluate('JSON.parse(localStorage.getItem("inner-atlas.v1.session"))')
 assert started['config']['jung'] is True
 assert started['answers']==fixture['answers']
 for i in range(24):page.keyboard.press('4');page.keyboard.press('Enter')
 page.wait_for_url('**/#/review')
 actual=page.evaluate('JSON.parse(localStorage.getItem("inner-atlas.v1.session"))')
 assert actual['config']['jung'] is True
 assert len(actual['answers'])==166
 for key,value in fixture['answers'].items():assert actual['answers'][key]==value,key
 page.get_by_role('button',name='查看我的报告与综合分析',exact=True).click()
 page.locator('#ai-service-status[data-state=ready]').wait_for()
 assert not posts
 page.goto(BASE+'/#/report/jung')
 assert page.locator('.jung-function').count()==8
 assert '功能栈' in page.locator('#report-jung').inner_text()
 for width in [360,390,768,1440]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.goto(BASE+'/#/report/synthesis')
 form=page.locator('#ai-analysis-form');form.locator('details.ai-connection > summary').click()
 form.locator('input[name=accessCode]').fill('ui-test-access-code-1234567890');form.locator('input[name=consent]').check()
 page.get_by_role('button',name='生成我的 AI 综合分析',exact=True).click()
 page.locator('.ai-theory-perspective').wait_for()
 assert len(posts)==1
 request=json.loads(posts[0].post_data);assert len([k for k in request['session']['answers'] if k.startswith('jung-')])==24
 assert page.locator('.ai-analysis-section').count()==12
 with page.expect_download() as d:page.get_by_role('button',name='下载 AI 综合报告',exact=True).click()
 d.value.save_as(str(OUT/'jung-ai.md'));assert '理论视角：荣格功能视角' in (OUT/'jung-ai.md').read_text()
 page.locator('.ai-theory-perspective > summary').click()
 page.evaluate("window.dispatchEvent(new Event('beforeprint'))");assert page.locator('.ai-theory-perspective').get_attribute('open') is not None
 page.evaluate("window.dispatchEvent(new Event('afterprint'))");assert page.locator('.ai-theory-perspective').get_attribute('open') is None
 for width in [360,390,768,1440]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(OUT/'jung-integrated-mobile.png'),full_page=True)
 assert not errors,errors
 print(json.dumps({'legacy_answers_preserved':142,'new_items_completed':24,'function_cards':8,'ai_chapters':12,'perspectives':1,'real_provider_calls':0,'print_export':'passed','viewports':[360,390,768,1440],'errors':errors,'artifacts':str(OUT)},ensure_ascii=False))
 browser.close()
