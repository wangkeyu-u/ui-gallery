"""Explicit paid follow-up test: replay a previously real report, then make two real chat requests. Not CI."""
import os
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,shutil,time
D=Path(os.environ.get('CHAT_REPORT_DIR','/tmp/inner-atlas-prior-real-report'))
OUT=Path(os.environ.get('CHAT_OUTPUT_DIR','/tmp/inner-atlas-live-chat-check'));OUT.mkdir(parents=True,exist_ok=True)
request=json.loads((D/'submitted-request.json').read_text());report=json.loads((D/'real-report.json').read_text())
base=os.environ.get('CHAT_TEST_URL','http://127.0.0.1:4180').rstrip('/')
questions=[
 '我补充一个具体情况：我对恋人少谈心主要发生在对方上班时；周末我能说出自己的难过和需要，也会听对方说完。请根据这条补充修订整体画像，哪些判断需要收窄？',
 '你记得我上一条补充的两个场景吗？结合本次测试和这条补充，用一句话重新概括我，并给一个可以观察效果的小行动。'
]
(OUT/'preset-questions.json').write_text(json.dumps(questions,ensure_ascii=False,indent=2))
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,accept_downloads=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/analyze',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps(report,ensure_ascii=False)))
 res=page.goto(base,wait_until='networkidle');assert res.status==200
 page.evaluate('(s)=>localStorage.setItem("inner-atlas.v1.session",JSON.stringify({...s,config:{...s.config,remember:true}}))',request['session'])
 page.goto(base+'/#/report/synthesis');page.reload();page.locator('#ai-service-status[data-state=ready]').wait_for()
 for key,value in request['context'].items():page.locator(f'textarea[data-ai-context={key}]').fill(value)
 if request['consent']['health']:page.locator('#ai-analysis-form input[name=health]').check()
 page.locator('#ai-analysis-form input[name=consent]').check();page.get_by_role('button',name='生成我的 AI 综合分析',exact=True).click();page.locator('.ai-portrait-core').wait_for()
 page.get_by_role('button',name='继续问 AI',exact=True).click()
 records=[]
 for i,question in enumerate(questions):
  page.locator('#ai-chat-form textarea').fill(question);start=time.monotonic()
  print(json.dumps({'event':'starting-real-chat','turn':i+1,'analysis_replayed':True,'new_analysis_calls':0}),flush=True)
  with page.expect_response(lambda r:r.request.method=='POST' and r.url.endswith('/api/chat'),timeout=20000) as info:
   page.get_by_role('button',name='发送追问',exact=True).click()
  response=info.value;data=response.json();posted=json.loads(response.request.post_data)
  (OUT/f'turn-{i+1}-reply.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
  (OUT/f'turn-{i+1}-request.json').write_text(json.dumps(posted,ensure_ascii=False,indent=2))
  assert not data.get('code'),data
  assert data['inputHash']==report['inputHash'];assert len(posted['history'])==i*2
  assert 'authorization' not in response.request.headers
  if i:assert posted['history'][0]['content']==questions[0]
  page.wait_for_function('(n)=>document.querySelectorAll(".ai-chat-message.assistant").length===n',arg=i+1)
  records.append({'turn':i+1,'http':response.status,'elapsedSeconds':round(time.monotonic()-start,1),'requestBytes':len(response.request.post_data.encode()),'usage':data.get('usage')})
  print(json.dumps(records[-1],ensure_ascii=False),flush=True)
 for width in [360,390,768,1440]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 with page.expect_download() as d:page.get_by_role('button',name='下载追问记录',exact=True).click()
 d.value.save_as(str(OUT/'real-chat.md'))
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(OUT/'chat-mobile.png'),full_page=True)
 assert not errors,errors
 summary={'initialReportReplay':True,'initialReportWasRealVersion':'2026-11-16.4','newAnalysisProviderCalls':0,'realChatProviderCalls':2,'records':records,'historySent':True,'pageErrors':errors,'viewports':[360,390,768,1440]}
 (OUT/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(json.dumps(summary,ensure_ascii=False),flush=True)
 browser.close()
