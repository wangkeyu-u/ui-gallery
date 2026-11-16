"""Report -> continued conversation regression; entirely simulated upstream."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import os,json,subprocess,shutil,tempfile
BASE=os.environ.get('AI_PREVIEW_URL','http://127.0.0.1:4190').rstrip('/')
OUT=Path(tempfile.mkdtemp(prefix='inner-atlas-chat-ui-'))
session=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {fixtureSession} from './tests/fixtures/ai.mjs';console.log(JSON.stringify(fixtureSession({health:true,remember:true})));"],text=True))
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},accept_downloads=True)
 errors=[];posts=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:posts.append(r) if r.method=='POST' else None)
 page.goto(BASE);page.evaluate('(s)=>localStorage.setItem("inner-atlas.v1.session",JSON.stringify(s))',session)
 page.goto(BASE+'/#/report/synthesis');page.reload();page.locator('#ai-service-status[data-state=ready]').wait_for()
 assert page.locator('#ai-chat').count()==0
 form=page.locator('#ai-analysis-form');form.locator('details.ai-connection > summary').click();form.locator('input[name=accessCode]').fill('ui-test-access-code-1234567890');form.locator('input[name=consent]').check()
 page.get_by_role('button',name='生成我的 AI 综合分析',exact=True).click();page.locator('.ai-portrait-core').wait_for()
 page.get_by_role('button',name='继续问 AI',exact=True).click();assert page.locator('#ai-chat').get_attribute('open') is not None
 assert len(posts)==1
 page.locator('[data-chat-action=suggest]').first.click();assert len(posts)==1
 question=page.locator('#ai-chat-form textarea')
 first='我补充：周末我能表达难过。<img src=x onerror=alert(1)> '
 question.fill(first);page.get_by_role('button',name='发送追问',exact=True).click()
 page.locator('.ai-chat-message.assistant').wait_for();assert page.locator('.ai-chat-message.assistant').count()==1
 chats=[r for r in posts if r.url.endswith('/api/chat')];assert len(chats)==1
 sent=json.loads(chats[0].post_data);assert sent['history']==[];assert sent['report']['overall']['portrait'];assert sent['assessment']['consent']['health'] is False
 assert not any(k.startswith('phq-') for k in sent['assessment']['session']['answers'])
 assert 'ui-test-access' not in chats[0].post_data
 assert page.locator('.ai-chat-messages img').count()==0;assert '<img src=x' in page.locator('.ai-chat-messages').inner_text()
 question=page.locator('#ai-chat-form textarea');question.fill('我刚才补充了什么，这会怎样修订你的判断？');page.get_by_role('button',name='发送追问',exact=True).click();page.wait_for_function('document.querySelectorAll(".ai-chat-message.assistant").length===2')
 chats=[r for r in posts if r.url.endswith('/api/chat')];sent=json.loads(chats[-1].post_data);assert len(sent['history'])==2;assert sent['history'][0]['content']==first.strip()
 assert first.strip() in page.locator('.ai-chat-message.assistant').last.inner_text()
 with page.expect_download() as d:page.get_by_role('button',name='下载追问记录',exact=True).click()
 d.value.save_as(str(OUT/'chat.md'));assert first.strip() in (OUT/'chat.md').read_text()
 for width in [360,390,768,1440]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 question=page.locator('#ai-chat-form textarea');question.fill('新的问题')
 goal=page.locator('textarea[data-ai-context=goal]');goal.fill('新目标');assert page.locator('.ai-chat-stale').is_visible();assert page.get_by_role('button',name='发送追问',exact=True).is_disabled();goal.fill('');assert page.get_by_role('button',name='发送追问',exact=True).is_enabled()
 form=page.locator('#ai-analysis-form');form.locator('input[name=health]').check();assert page.get_by_role('button',name='发送追问',exact=True).is_disabled();form.locator('input[name=health]').uncheck()
 answers_before=page.evaluate('JSON.parse(localStorage.getItem("inner-atlas.v1.session")).answers')
 page.get_by_role('button',name='清空对话，保留测试记忆',exact=True).click();assert page.locator('.ai-chat-message').count()==0;assert page.locator('.ai-portrait-core').is_visible()
 assert page.evaluate('JSON.parse(localStorage.getItem("inner-atlas.v1.session")).answers')==answers_before
 # HTTP200 with an explicit error remains a failure, and a failed question is retained for retry.
 def failure(route):route.fulfill(status=200,content_type='application/json',body=json.dumps({'code':'PROVIDER_UNAVAILABLE','message':'模拟服务失败'}))
 page.route('**/api/chat',failure);page.locator('#ai-chat-form textarea').fill('失败时保留这个问题');page.get_by_role('button',name='发送追问',exact=True).click();page.get_by_text('模拟服务失败',exact=True).wait_for();assert page.locator('.ai-chat-message.assistant').count()==0;assert page.locator('#ai-chat-form textarea').input_value()=='失败时保留这个问题';page.unroute('**/api/chat',failure)
 held=[]
 def hold(route):held.append(route)
 page.route('**/api/chat',hold);page.get_by_role('button',name='发送追问',exact=True).click();page.get_by_role('button',name='取消等待',exact=True).wait_for();page.get_by_role('button',name='取消等待',exact=True).click();assert page.locator('.ai-chat-message.assistant').count()==0
 for route in held:
  try:route.abort()
  except Exception:pass
 page.wait_for_timeout(100)
 page.unroute('**/api/chat',hold)
 page.get_by_role('button',name='清空对话，保留测试记忆',exact=True).click()
 # No silent context eviction: the UI stops after a bounded full conversation.
 for i in range(12):
  page.locator('#ai-chat-form textarea').fill(f'第{i+1}次追问');page.get_by_role('button',name='发送追问',exact=True).click();page.wait_for_function('(n)=>document.querySelectorAll(".ai-chat-message.assistant").length===n',arg=i+1)
 page.locator('#ai-chat-form textarea').fill('第十三次');assert page.get_by_role('button',name='发送追问',exact=True).is_disabled()
 page.goto(BASE+'/#/privacy');page.get_by_role('button',name='清除当前页面与已保存的答题数据').click();page.get_by_role('button',name='清除数据',exact=True).click();page.wait_for_url('**/#/');page.goto(BASE+'/#/report');assert page.locator('#ai-chat').count()==0
 assert not errors,errors
 print(json.dumps({'mock_provider':True,'real_calls':0,'memory_and_history':'passed','correction':'passed','health_isolation':'passed','literal_html':'passed','stale_disabled':'passed','cancel_retry':'passed','clear_preserves_answers':'passed','download':'passed','12_turn_limit':'passed','viewports':[360,390,768,1440],'errors':errors,'artifacts':str(OUT)},ensure_ascii=False))
 browser.close()
