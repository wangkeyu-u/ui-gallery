"""End-to-end UI test with a simulated DeepSeek upstream. No real API call or real personal data."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,subprocess,tempfile,shutil,os
BASE=os.environ.get('AI_PREVIEW_URL','http://127.0.0.1:4175').rstrip('/')
OUT=Path(tempfile.mkdtemp(prefix='inner-atlas-ai-ui-'))
session=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {fixtureSession} from './tests/fixtures/ai.mjs'; console.log(JSON.stringify(fixtureSession({health:true,trauma:true,remember:true})))"],text=True))
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
 errors=[];requests=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:requests.append(r))
 page.goto(BASE)
 page.evaluate('(s)=>localStorage.setItem("inner-atlas.v1.session",JSON.stringify(s))',session)
 page.goto(BASE+'/#/report/synthesis');page.reload()
 form=page.locator('#ai-analysis-form');form.wait_for();page.locator('#ai-service-status[data-state=ready]').wait_for()
 assert page.get_by_role('button',name='生成我的 AI 综合分析').is_enabled()
 assert not [r for r in requests if r.method=='POST']
 form.locator('textarea[data-ai-context=goal]').fill('想理解恋人和朋友关系的不同反应。')
 form.locator('textarea[data-ai-context=history]').fill('最近三周出现，以前通常没有。')
 form.locator('textarea[data-ai-context=impact]').fill('两次影响工作安排。')
 form.locator('textarea[data-ai-context=example]').fill('我询问具体安排，对方解释后重新约定。')
 form.locator('textarea[data-ai-context=counterexample]').fill('有些时候我可以直接表达，不需要反复确认。')
 form.locator('details.ai-connection summary').click()
 form.locator('input[name=accessCode]').fill('ui-test-access-code-1234567890')
 # Required consent blocks the request, and preview excludes health despite having answered all health questions.
 page.get_by_role('button',name='生成我的 AI 综合分析').click()
 assert not [r for r in requests if r.method=='POST']
 preview=json.loads(page.locator('#ai-payload-preview').text_content())
 assert not any(q.startswith(('phq-','gad-','pcl-')) for q in preview['session']['answers'])
 assert 'ui-test-access' not in page.locator('#ai-payload-preview').inner_text()
 form.locator('input[name=consent]').check()
 page.get_by_role('button',name='生成我的 AI 综合分析').click()
 page.locator('.ai-generated').wait_for()
 assert page.locator('.ai-analysis-section').count()==12
 posts=[r for r in requests if r.method=='POST'];assert len(posts)==1
 posted=json.loads(posts[0].post_data);assert posted['consent']['health'] is False
 assert posted['context']['history']=='最近三周出现，以前通常没有。'
 assert posted['context']['impact']=='两次影响工作安排。'
 assert posted['context']['example']=='我询问具体安排，对方解释后重新约定。'
 assert not any(q.startswith(('phq-','gad-','pcl-')) for q in posted['session']['answers'])
 assert page.locator('.ai-portrait').is_visible()
 assert page.locator('.ai-theory-perspective').count()==1
 assert '功能栈' in page.locator('.ai-theory-perspective').inner_text()
 assert page.locator('.ai-theme-grid img').count()==0
 assert '<img src=x' in page.locator('.ai-theme-grid').inner_text()
 assert 'internal reasoning' not in page.locator('#main').inner_text()
 assert 'test-only-not-a-real-provider-key' not in page.content()
 with page.expect_download() as d:page.get_by_role('button',name='下载 AI 综合报告',exact=True).click()
 d.value.save_as(str(OUT/'ai-report.md'));report=(OUT/'ai-report.md').read_text();assert '模拟上游综合报告' in report;assert '近期状态与专业评估方向' in report
 # Draft context and health-sharing changes also mark the previous synthesis stale.
 goal=page.locator('textarea[data-ai-context=goal]');original=goal.input_value();goal.fill(original+' 新的补充。');assert page.locator('.ai-stale-indicator').is_visible();goal.fill(original);assert page.locator('.ai-stale-indicator').is_hidden()
 page.locator('#ai-analysis-form input[name=health]').check();assert page.locator('.ai-stale-indicator').is_visible();preview=json.loads(page.locator('#ai-payload-preview').text_content());assert len(preview['session']['answers'])==202;page.locator('#ai-analysis-form input[name=health]').uncheck();assert page.locator('.ai-stale-indicator').is_hidden()
 # The report starts with themes and opens details on demand.
 assert page.locator('.ai-review-summary').count()==1
 assert page.locator('details.ai-analysis-section[open]').count()==3
 page.get_by_role('button',name='展开全部',exact=True).click();assert page.locator('details.ai-analysis-section[open]').count()==12
 page.get_by_role('button',name='收起全部',exact=True).click();assert page.locator('details.ai-analysis-section[open]').count()==0
 page.locator('[data-ai-action=scroll][data-target=romance]').click();assert page.locator('#ai-section-romance').get_attribute('open') is not None
 # Correction fills a concrete theme reference, marks the old report stale and never resubmits by itself.
 counter=page.locator('textarea[data-ai-context=counterexample]');original_counter=counter.input_value()
 page.get_by_role('button',name='这点不符合我／补充反例').first.click()
 assert '关于主题' in counter.input_value();assert page.locator('.ai-stale-indicator').is_visible();assert not page.locator('#ai-analysis-form input[name=consent]').is_checked()
 assert len([r for r in requests if r.method=='POST'])==1
 counter.fill(original_counter);assert page.locator('.ai-stale-indicator').is_hidden()
 # Printing reveals every chapter and restores the reader's expanded state.
 page.evaluate("window.dispatchEvent(new Event('beforeprint'))");assert page.locator('details.ai-analysis-section[open]').count()==12
 page.evaluate("window.dispatchEvent(new Event('afterprint'))");assert page.locator('details.ai-analysis-section[open]').count()==1
 # All new report content and controls fit on small and large screens.
 for width in [360,390,768,1440]:
  page.set_viewport_size({'width':width,'height':844})
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth'),width
 page.set_viewport_size({'width':1440,'height':1000})
 page.screenshot(path=str(OUT/'mock-comprehensive-desktop.png'),full_page=True)
 # Missing experience data withholds functional explanations, while explicit episode details unlock a checkable card.
 assert page.locator('.ai-depth-boundary').is_visible()
 assert page.locator('.ai-formulation').count()==0
 page.locator('textarea[data-ai-context=example]').fill('对方晚回复，我发消息确认约定，随后重新协商。')
 page.locator('textarea[data-ai-context=meaning]').fill('我担心安排临时变动，也在意对方是否记得约定。')
 page.locator('textarea[data-ai-context=strategy]').fill('我想核实安排，收到回复后暂时放心，但仍需商量。')
 assert '已补充事件' in page.locator('#ai-depth-status').inner_text()
 assert page.locator('.ai-stale-indicator').is_visible()
 page.locator('#ai-analysis-form input[name=consent]').check()
 page.get_by_role('button',name='根据当前答卷重新综合',exact=True).click()
 page.locator('.ai-formulation').wait_for()
 assert '什么会改变当前判断' in page.locator('.ai-formulation').inner_text()
 assert page.locator('.ai-depth-boundary').count()==0
 assert page.locator('.ai-scope-note').is_visible()
 page.locator('.ai-formulation > summary').click()
 page.evaluate("window.dispatchEvent(new Event('beforeprint'))");assert page.locator('.ai-formulation').get_attribute('open') is not None
 page.evaluate("window.dispatchEvent(new Event('afterprint'))");assert page.locator('.ai-formulation').get_attribute('open') is None
 with page.expect_download() as d:page.get_by_role('button',name='下载 AI 综合报告',exact=True).click()
 d.value.save_as(str(OUT/'episode-report.md'));assert '会改变判断的信息' in (OUT/'episode-report.md').read_text()
 for width in [360,390,768,1440]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
 # Returned report becomes stale after an answer edit, rather than being reused against the changed questionnaire.
 page.goto(BASE+'/#/review');page.get_by_role('button',name='人格第1题，已回答',exact=True).click()
 page.locator('#question-title').wait_for();page.keyboard.press('5')
 page.goto(BASE+'/#/report/synthesis');assert page.get_by_text('你的答卷或补充背景已修改。',exact=False).is_visible()
 page.get_by_role('button',name='下载 AI 综合报告',exact=True).click()
 assert '请重新生成' in page.locator('#toast').inner_text()
 # An unavailable or unconfigured service disables generation without sending answers.
 second=browser.new_page(viewport={'width':390,'height':844})
 second_posts=[];second.on('request',lambda r:second_posts.append(r) if r.method=='POST' else None)
 second.route('**/api/status',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps({'provider':'DeepSeek','configured':False,'model':'deepseek-flash','reviewEnabled':True})))
 second.goto(BASE);second.evaluate('(s)=>localStorage.setItem("inner-atlas.v1.session",JSON.stringify(s))',session);second.goto(BASE+'/#/report/synthesis');second.reload()
 second.locator('#ai-service-status[data-state=unconfigured]').wait_for()
 assert second.get_by_role('button',name='生成我的 AI 综合分析').is_disabled();assert not second_posts
 second.unroute('**/api/status');second.get_by_role('button',name='检测连接',exact=True).click();second.locator('#ai-service-status[data-state=ready]').wait_for();assert second.get_by_role('button',name='生成我的 AI 综合分析').is_enabled()
 second.close()
 # Erasing local answers also removes AI report and token from the page state.
 page.goto(BASE+'/#/privacy');page.get_by_role('button',name='清除当前页面与已保存的答题数据').click();page.get_by_role('button',name='清除数据',exact=True).click();page.wait_for_url('**/#/')
 page.goto(BASE+'/#/report');assert page.locator('.ai-generated').count()==0
 assert not errors,errors
 print(json.dumps({'mock_upstream':True,'real_deepseek_calls':0,'sections':12,'post_requests':len([r for r in requests if r.method=='POST']),'separate_health_consent':'passed','literal_model_html':'passed','stale_report':'passed','chapter_disclosure':'passed','theme_correction':'passed','connection_preflight':'passed','episode_inference_boundary':'passed','viewport_widths':[360,390,768,1440],'errors':errors,'artifacts':str(OUT)},ensure_ascii=False))
 browser.close()
