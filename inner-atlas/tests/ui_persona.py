"""Explicit REAL provider browser test using a preregistered fictional person. Not CI.
Accelerated interactions include neutral answers, skipped/returned questions and revisions;
this is not a validated model of human response timing or clinical accuracy.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import os,json,subprocess,time,random,shutil,hashlib
BASE=os.environ.get('PERSONA_URL','http://127.0.0.1:4180').rstrip('/')
OUT=Path(os.environ.get('PERSONA_OUT','/workspace/work/persona-blind-2026-11-16'));OUT.mkdir(parents=True,exist_ok=True)
FIXTURE=os.environ.get('PERSONA_FIXTURE','./tests/fixtures/persona-lin.mjs')
fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',"const {persona,personaCase}=await import(process.env.PERSONA_FIXTURE||'./tests/fixtures/persona-lin.mjs');const {activeQuestions}=await import('./src/data.js');const c=personaCase();console.log(JSON.stringify({persona,case:c,questions:activeQuestions(c.request.session.config)}));"],text=True))
preregistered=json.dumps(fixture,ensure_ascii=False,indent=2)
(OUT/'preregistered-persona.json').write_text(preregistered)
preregistered_hash=hashlib.sha256(preregistered.encode()).hexdigest()
print(json.dumps({'event':'preregistered-before-provider','sha256':preregistered_hash,'fixture':FIXTURE}),flush=True)
start=time.monotonic();trace=[];rng=random.Random(9716);errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,accept_downloads=True)
 page.on('pageerror',lambda e:errors.append(str(e)))
 response=page.goto(BASE,wait_until='networkidle',timeout=30000)
 assert response.status==200
 page.get_by_role('link',name='开启自我探索').click()
 page.locator('input[name=health]').check();page.locator('input[name=remember]').check();page.locator('input[name=adult]').check()
 page.get_by_role('button',name='准备好了，开始').click()
 def choose(q,v,keyboard=False):
  if keyboard: page.keyboard.press(str(v-q['min']+1))
  else: page.locator(f'input[name=answer][value="{v}"]').check()
  trace.append({'id':q['id'],'answer':v,'interaction':'keyboard' if keyboard else 'tap','elapsedSeconds':round(time.monotonic()-start,2)})
 skips=set(fixture['case']['interactions']['skippedThenReturned'])
 revisions={x['id']:x for x in fixture['case']['interactions']['revised']}
 for i,q in enumerate(fixture['questions']):
  if q['id'] in skips:
   page.locator('[data-action=skip]').click();trace.append({'id':q['id'],'interaction':'skip'})
  else:
   v=revisions.get(q['id'],{}).get('initial',fixture['case']['request']['session']['answers'][q['id']])
   choose(q,v,i%7==3)
   page.wait_for_timeout(rng.choice([20,35,60,100,180]))
   page.locator('[data-action=next]').click()
  if i%35==0: print(json.dumps({'answeredThrough':i+1,'realProviderCalls':0}),flush=True)
 for qid in [*skips,*revisions]:
  page.locator(f'[data-action=jump][data-id="{qid}"]').click()
  q=next(q for q in fixture['questions'] if q['id']==qid)
  choose(q,fixture['case']['request']['session']['answers'][qid])
  trace.append({'id':qid,'interaction':'return-or-revise'})
  page.locator('[data-action=review]').click()
 page.locator('[data-action=finish]').click()
 page.locator('#ai-service-status[data-state=ready]').wait_for(timeout=20000)
 assert page.locator('#ai-analysis-form input[name=accessCode]').input_value()==''
 actual=page.evaluate('JSON.parse(localStorage.getItem("inner-atlas.v1.session"))')
 assert actual['answers']==fixture['case']['request']['session']['answers']
 (OUT/'interaction-trace.json').write_text(json.dumps(trace,ensure_ascii=False,indent=2))
 form=page.locator('#ai-analysis-form')
 for key,value in fixture['case']['request']['context'].items():
  form.locator(f'textarea[data-ai-context={key}]').fill(value)
 form.locator('input[name=health]').check();form.locator('input[name=consent]').check()
 print(json.dumps({'questionsCompleted':len(actual['answers']),'personaBiographySent':False,'contextFields':list(fixture['case']['request']['context']),'event':'starting-real-analysis','publicOrigin':BASE}),flush=True)
 ai_start=time.monotonic()
 with page.expect_response(lambda r:r.request.method=='POST' and r.url.endswith('/api/analyze'),timeout=20000) as info:
  page.get_by_role('button',name='生成我的 AI 综合分析').click()
 response=info.value
 data=response.json()
 (OUT/'real-report.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
 posted=json.loads(response.request.post_data)
 (OUT/'submitted-request.json').write_text(json.dumps(posted,ensure_ascii=False,indent=2))
 assert posted['context']==fixture['case']['request']['context'] and posted['session']['answers']==actual['answers']
 assert fixture['persona']['biography'] not in response.request.post_data
 assert 'authorization' not in response.request.headers
 assert not data.get('code'),data.get('message')
 page.locator('.ai-generated').wait_for(timeout=15000)
 assert page.locator('.ai-analysis-section').count()==12
 with page.expect_download() as download:
  page.get_by_role('button',name='下载 AI 综合报告',exact=True).click()
 download.value.save_as(str(OUT/'real-report.md'))
 for width in [390,768,1440]:
  page.set_viewport_size({'width':width,'height':900})
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  page.screenshot(path=str(OUT/f'persona-report-{width}.png'),full_page=True)
 assert not errors
 summary={'publicURL':BASE,'questions':len(actual['answers']),'skippedThenReturned':len(skips),'revisions':len(revisions),'personaBiographySent':False,'contextFields':list(posted['context']),'preregisteredSHA256':preregistered_hash,'promptVersion':data.get('promptVersion'),'inference':data.get('inference'),'formulations':len(data['report'].get('formulations',[])),'analysisSeconds':round(time.monotonic()-ai_start,1),'review':data.get('review'),'usage':data.get('usage'),'pageErrors':errors,'widths':[390,768,1440],'clinicalAccuracyEstablished':False}
 (OUT/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
 print(json.dumps(summary,ensure_ascii=False),flush=True)
 browser.close()
