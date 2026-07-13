const fs = require("fs");
const rows = JSON.parse(fs.readFileSync("repro/_rows.json", "utf8"));
const total = rows.length;
const passed = rows.filter(r => r.status === "passed").length;
const failed = rows.filter(r => r.status === "failed").length;
const unreach = rows.filter(r => r.status === "unreachable").length;
const reachable = total - unreach;
const convRate = Math.round((passed / reachable) * 100);
const att = { 0: 0, 1: 0, 2: 0, 3: 0 };
rows.forEach(r => { att[r.attempts] = (att[r.attempts] || 0) + 1; });
const samples = rows.filter(r => r.status === "passed" && r.ref && r.rebuild).slice(0, 12);
const dataStr = JSON.stringify(rows.map(r => ({
  id: r.id, name: r.name, kind: r.kind, status: r.status, attempts: r.attempts,
  notes: r.notes, ref: r.ref, rebuild: r.rebuild, prompt: r.prompt
})));
const sampStr = JSON.stringify(samples.map(r => ({ name: r.name, ref: r.ref, rebuild: r.rebuild })));

const html = `<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UI 复现报告 · Prompt to AI 重建验证</title>
<style>
:root{--paper:#F3EFE6;--ink:#17150F;--red:#E0401C;--line:rgba(23,21,15,.15);}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;}
.wrap{max-width:1100px;margin:0 auto;padding:32px 24px 80px;}
header{border-bottom:2px solid var(--ink);padding-bottom:18px;margin-bottom:8px;}
h1{font:700 30px/1.1 Georgia,"Times New Roman",serif;margin:0 0 6px;letter-spacing:-.01em;}
.sub{color:#6b6457;font-size:14px;}
.stats{display:flex;gap:14px;flex-wrap:wrap;margin:22px 0;}
.card{flex:1;min-width:150px;border:1px solid var(--line);border-radius:10px;padding:14px 16px;background:#fffdf8;}
.card .n{font:700 30px/1 Georgia,serif;}
.card .l{font-size:12px;color:#6b6457;text-transform:uppercase;letter-spacing:.06em;margin-top:4px;}
.card.red .n{color:var(--red);}
.bar{height:10px;background:var(--line);border-radius:6px;overflow:hidden;margin:8px 0 4px;}
.bar>span{display:block;height:100%;background:var(--red);}
.controls{display:flex;gap:10px;align-items:center;margin:26px 0 14px;flex-wrap:wrap;}
.controls input,.controls select{padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:#fffdf8;font-size:14px;}
.controls input{flex:1;min-width:180px;}
table{width:100%;border-collapse:collapse;font-size:14px;}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top;}
th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b6457;cursor:pointer;user-select:none;}
.tag{display:inline-block;font-size:11px;padding:2px 8px;border-radius:999px;font-weight:600;}
.tag.passed{background:#e4efe4;color:#2f6b2f;}
.tag.failed{background:#fbe3da;color:var(--red);}
.tag.unreachable{background:#eee;color:#888;}
button.copy{font:13px/1 sans-serif;border:1px solid var(--ink);background:var(--ink);color:var(--paper);border-radius:7px;padding:6px 10px;cursor:pointer;}
button.copy:hover{background:var(--red);border-color:var(--red);}
a.lk{color:var(--ink);text-decoration:underline;}
.modal{position:fixed;inset:0;background:rgba(23,21,15,.6);display:none;align-items:center;justify-content:center;padding:24px;z-index:50;}
.modal.open{display:flex;}
.modal .box{background:var(--paper);max-width:760px;width:100%;max-height:86vh;overflow:auto;border-radius:12px;padding:22px 24px;}
.modal pre{white-space:pre-wrap;background:#fffdf8;border:1px solid var(--line);border-radius:8px;padding:14px;font:13px/1.6 ui-monospace,Menlo,Consolas,monospace;}
.modal h3{margin:0 0 4px;font-family:Georgia,serif;}
.sec-h{font:700 18px Georgia,serif;margin:34px 0 12px;border-top:1px solid var(--line);padding-top:18px;}
.cmp{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;}
.cmp figure{margin:0;}
.cmp img{width:100%;border:1px solid var(--line);border-radius:8px;background:#fff;display:block;}
.cmp figcaption{font-size:12px;color:#6b6457;margin-top:5px;text-align:center;}
</style></head><body><div class="wrap">
<header><h1>UI 复现验证报告</h1><div class="sub">方法：读取真实站点 HTML to 生成可复制提示词 to 仅用提示词 AI 重建首屏 to 对比真实截图 to 最多迭代 3 次。共 ${total} 个站点。</div></header>
<div class="stats">
<div class="card"><div class="n">${total}</div><div class="l">总站点</div></div>
<div class="card red"><div class="n">${passed}</div><div class="l">复现成功</div></div>
<div class="card"><div class="n">${reachable}</div><div class="l">可访问站点</div></div>
<div class="card"><div class="n">${convRate}%</div><div class="l">可访问站点复现率</div></div>
<div class="card"><div class="n">${unreach}</div><div class="l">不可达(读取失败)</div></div>
</div>
<div class="bar"><span style="width:${Math.round(passed / total * 100)}%"></span></div>
<div class="sub">尝试次数分布 — 首次即通过 ${att[1]} · 二次通过 ${att[2]} · 三次 ${att[3]} · 未构建 ${att[0]}</div>

<div class="sec-h">样本对比（真实截图 vs 提示词重建）</div>
<div id="samples"></div>

<div class="controls">
<input id="q" placeholder="搜索站点名 / id …">
<select id="f"><option value="all">全部状态</option><option value="passed">复现成功</option><option value="failed">复现失败</option><option value="unreachable">不可达</option></select>
<select id="k"><option value="all">全部类型</option><option value="item">组件库</option><option value="proj">获奖项目</option></select>
<span id="cnt" class="sub"></span>
</div>
<table><thead><tr><th data-s="name">站点</th><th data-s="kind">类型</th><th data-s="status">状态</th><th data-s="attempts">尝试</th><th>提示词 / 截图</th></tr></thead><tbody id="tb"></tbody></table>
</div>

<div class="modal" id="m"><div class="box"><h3 id="mh"></h3><div class="sub" id="ms"></div><pre id="mp"></pre><div style="margin-top:14px"><button class="copy" onclick="copyPrompt()">复制提示词</button></div></div></div>

<script>
const ROWS=${dataStr};
const SAMPLES=${sampStr};
let cur=null;
const tb=document.getElementById("tb"),q=document.getElementById("q"),f=document.getElementById("f"),k=document.getElementById("k"),cnt=document.getElementById("cnt");
function tag(s){return s==="passed"?'<span class="tag passed">成功</span>':s==="failed"?'<span class="tag failed">失败</span>':'<span class="tag unreachable">不可达</span>';}
function render(){
  const Q=q.value.toLowerCase(),F=f.value,K=k.value;
  let list=ROWS.filter(r=>(!Q||r.name.toLowerCase().includes(Q)||r.id.includes(Q))&&(F==="all"||r.status===F)&&(K==="all"||r.kind===K));
  cnt.textContent=list.length+" / "+ROWS.length;
  tb.innerHTML=list.map(r=>'<tr><td>'+r.name+'<br><span class="sub">'+r.id+'</span></td><td>'+(r.kind==="proj"?"获奖":"组件库")+'</td><td>'+tag(r.status)+'</td><td>'+(r.attempts||"-")+'</td><td><button class="copy" onclick="openPrompt(\''+r.id+'\')">查看提示词</button> '+(r.ref?'<a class="lk" href="'+r.ref+'" target="_blank">原图</a>':'')+' '+(r.rebuild?'<a class="lk" href="'+r.rebuild+'" target="_blank">重建</a>':'')+'</td></tr>').join("");
}
function openPrompt(id){const r=ROWS.find(x=>x.id===id);cur=r;document.getElementById("mh").textContent=r.name;document.getElementById("ms").textContent=r.id+" · "+tag(r.status)+" · 尝试 "+(r.attempts||0);document.getElementById("mp").textContent=r.prompt||"(无提示词)";document.getElementById("m").classList.add("open");}
function copyPrompt(){if(cur&&cur.prompt)navigator.clipboard.writeText(cur.prompt);}
document.getElementById("m").addEventListener("click",e=>{if(e.target.id==="m")e.target.classList.remove("open");});
[q,f,k].forEach(el=>el.addEventListener("input",render));
document.querySelectorAll("th[data-s]").forEach(th=>th.addEventListener("click",()=>{const s=th.dataset.s;ROWS.sort((a,b)=>(a[s]+"").localeCompare(b[s]+""));render();}));
document.getElementById("samples").innerHTML=SAMPLES.map(s=>'<div class="cmp"><figure><img src="'+s.ref+'" loading="lazy"><figcaption>真实截图</figcaption></figure><figure><img src="'+s.rebuild+'" loading="lazy"><figcaption>提示词重建</figcaption></figure></div><div class="sub" style="margin:-6px 0 4px">'+s.name+'</div>').join("");
render();
</script></body></html>`;

fs.writeFileSync("repro-report.html", html);
console.log("report bytes:", html.length);
