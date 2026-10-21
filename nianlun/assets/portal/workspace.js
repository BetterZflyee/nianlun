/* Local task feedback and linked project views. No remote script or data service. */
function taskPanel(job) {
  const box=el('section',{class:'task-progress','aria-label':'任务进度'});
  const title=el('strong'), status=el('span'), clock=el('p',{class:'subtle'}), phase=el('p'), history=el('details',{},[el('summary',{text:'查看处理步骤'})]), lines=el('ol'), actions=el('div',{class:'actions'}), output=el('div',{class:'ai-answer'});
  history.append(lines);box.append(el('div',{class:'entry-top'},[title,status]),phase,clock,actions,history,output,el('p',{class:'form-help',text:'关闭窗口不会取消任务。在右上角通知或执行记录中，可查看状态、结果和接续步骤。'}));
  let latest=job, timer;
  function update(value) {
    latest=value;box.dataset.job=value.id;
    title.textContent=jobNames[value.op]||value.op;
    status.textContent=({queued:'排队中',running:'执行中',waiting_harness:'等待你的宿主',succeeded:'已完成',failed:'未完成',interrupted:'需要恢复'})[value.status]||value.status;
    if(value.status==='succeeded'&&value.result?.failed)status.textContent=value.result.succeeded?'部分成功，需处理失败项':'全部未完成，请查看原因';
    phase.textContent=value.error && value.status!=='waiting_harness' ? value.error : value.phase||status.textContent;
    lines.replaceChildren(...(value.progress||[]).map(p=>el('li',{text:p.at.replace('T',' ')+' · '+p.message})));
    actions.replaceChildren();
    if(value.status==='waiting_harness') {
      phase.textContent='当前停在宿主分析步骤，后台没有继续推理。';
      actions.append(el('p',{text:'① 复制请求 → ② 在 '+(boot.hosts?.[value.handoff.provider]?.name||value.handoff.provider)+' 处理并返回 → ③ 在这里继续原任务。'}),
        btn('复制接续请求',()=>copyRequest(handoffText(value))),
        btn(value.handoff_ready?'回复已收到，继续':'检查回复并继续',e=>quiet(withButton(e.currentTarget,async()=>{
          const fresh=await api('/api/jobs/'+value.id);
          if(!fresh.handoff_ready){toast('尚未收到宿主回答，请先完成第 2 步。');update(fresh);return;}
          const {job_id}=await api('/api/actions',{op:'resume',data:{job_id:value.id}});
          await pollJob(job_id,null,null);
          const next=await api('/api/jobs/'+value.id);update(next);if(next.status==='succeeded'){data=null;showTaskResult(output,next);} 
        })), 'primary'));
    } else if(value.can_resume) actions.append(btn('核验并重试原请求',e=>quiet(withButton(e.currentTarget,async()=>{
      const r=await run('resume',{job_id:value.id});update(r.value);if(r.value.status==='succeeded'){data=null;showTaskResult(output,r.value);}
    }))));
    if(value.status==='succeeded')showTaskResult(output,value);
    updateClock();
  }
  function updateClock(){const end=['succeeded','failed','interrupted','waiting_harness'].includes(latest.status)&&latest.finished_at?Date.parse(latest.finished_at):Date.now();const start=Date.parse(latest.started_at||latest.created_at);clock.textContent='本次执行 '+Math.max(0,Math.round((end-start)/1000))+' 秒'+(latest.phase_at?' · 当前步骤始于 '+new Date(latest.phase_at).toLocaleTimeString(): '');}
  timer=setInterval(()=>{if(!box.isConnected){clearInterval(timer);return;}updateClock();},1000);update(job);
  box.update=update;return box;
}
function handoffText(job){return '请处理年轮等待中的分析请求。配置：'+boot.config_path+'；请求编号：'+job.handoff.id+'。读取年轮 references/host-contract.md，使用 host.py pending --id 读取完整请求，分析后通过 answer 返回。只返回分析数据，不直接写业务数据；我会在工作台继续原任务。保持原来的权限、来源和操作开关。';}
function showTaskResult(box,job){
  const r=job.result||{};box.replaceChildren();
  if(r.answer||r.summary)box.append(el('p',{text:r.answer||r.summary}));
  if(r.url&&/^https:\/\//.test(r.url))box.append(el('a',{href:r.url,target:'_blank',rel:'noopener',text:'打开完整汇报 ↗'}));
  if(r.memory_pages)box.append(el('small',{text:'汇报结合 '+r.memory_pages.length+' 篇独立记忆页面。'}));
  if(r.failed)box.append(el('p',{class:'form-error',text:'成功 '+r.succeeded+' 项，失败 '+r.failed+' 项。'}),...r.items.filter(x=>!x.ok).map(x=>el('p',{text:'第 '+(x.index+1)+' 项：'+x.error})));
  if(r.pending?.length)box.append(el('p',{text:r.pending.join('\n')}));
}
async function pollJob(id,progress,panel){
  for(;;){const job=await api('/api/jobs/'+id);panel?.update(job);
    if(job.status==='succeeded'){notice('');return {value:job.result,job:id};}
    if(['waiting_harness','failed','interrupted'].includes(job.status)){const e=new Error(job.status==='waiting_harness'?'任务已保存，按上方步骤到 '+(boot.harness?.name||'AI 宿主')+' 接续。':job.error||'执行中断');e.job=job;throw e;}
    progress?.(job.status==='queued'?'已排队，等待前一项操作完成…':job.phase||'正在执行…');await new Promise(r=>setTimeout(r,1000));
  }
}
function applyRow(result){if(!data)return;const row=result.row;if(!row){data=null;return;}const list=data[result.role],i=list.findIndex(x=>x.id===row.id);if(i<0)list.push(row);else list[i]=row;}
function projectLabel(project){return project.title+(project.number?' · '+project.number:'');}
function quickRecords(rows,container){
  const selection=new Set(), options=data.fields.records.status.config.options.map(x=>x.name), choice=select(options), count=el('span',{class:'subtle'});
  const all=el('input',{type:'checkbox','aria-label':'选择当前项目全部记录'});
  const runBulk=btn('批量更新状态',()=>{
    const chosen=rows.filter(x=>selection.has(x.id));if(!chosen.length){toast('先勾选需要处理的记录');return;}
    bulkDialog('更新 '+chosen.length+' 条记录为“'+choice.value+'”',chosen.map(row=>({op:'update',role:'records',record_id:row.id,revision:row.revision,values:{status:choice.value}})),()=>{data=null;navigate('projects');});
  },'primary');
  const bar=el('div',{class:'toolbar'},[el('label',{class:'check'},[all,'全选']),count,choice,runBulk]);container.append(bar);
  function sync(){count.textContent='已选 '+selection.size+' 条';all.checked=selection.size===rows.length&&rows.length>0;all.indeterminate=selection.size>0&&!all.checked;}
  all.onchange=()=>{selection.clear();if(all.checked)rows.forEach(r=>selection.add(r.id));container.querySelectorAll('[data-record-select]').forEach(c=>c.checked=selection.has(c.dataset.recordSelect));sync();};sync();
  return row=>{
    const check=el('input',{type:'checkbox','aria-label':'选择 '+row.title,'data-record-select':row.id,onchange:e=>{e.target.checked?selection.add(row.id):selection.delete(row.id);sync();}});
    const status=select(options,row.status);status.setAttribute('aria-label','快速处理 '+row.title);
    status.onchange=()=>quiet((async()=>{status.disabled=true;try{const result=(await run('mutate',{request_id:crypto.randomUUID(),op:'update',role:'records',record_id:row.id,revision:row.revision,values:{status:status.value}})).value;applyRow(result);renderProject($('#content'));toast('状态已更新并回读');}catch(e){status.value=row.status;notice(e.message);throw e;}finally{status.disabled=false;}})());
    return el('div',{class:'actions'},[check,el('label',{},['快速处理 ',status]),btn('编辑',()=>editRow('records',row))]);
  };
}
function bulkDialog(title,items,done){
  let previousJob=null;
  const request={request_id:crypto.randomUUID(),items}, status=el('div');const submit=btn('确认处理',e=>quiet(withButton(e.currentTarget,async()=>{
    const response=previousJob?await run('resume',{job_id:previousJob}):await run('bulk_mutate',request);
    const r=previousJob?response.value.result:response.value;
    if(!previousJob)previousJob=response.job;
    r.items.filter(x=>x.ok).forEach(x=>{if(x.result.row)applyRow(x.result);});
    status.replaceChildren(el('p',{text:'成功 '+r.succeeded+' 项；失败 '+r.failed+' 项。'}),...r.items.filter(x=>!x.ok).map(x=>el('p',{class:'form-error',text:'第 '+(x.index+1)+' 项：'+x.error})));
    if(!r.failed){submit.hidden=true;status.append(btn('完成并刷新',()=>{$('#modal').close();done();}));}
  })),'primary');
  dialog(title,el('div',{},[el('p',{text:'将逐项更新并回读。已成功的项目保留，失败项单独显示；再次处理沿用同一请求。'}),submit,status]));
}

function svgNode(tag,attrs={}){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));return n;}
function projectGraph(project){
  const panel=el('section',{class:'panel relationship-panel'}), stage=el('div',{class:'graph-scroll'}), detail=el('div',{class:'graph-detail'});
  let mode='tree',focused=null;const projectRows={};for(const role of ['records','milestones','sites'])projectRows[role]=data[role].filter(x=>x.project_ids?.includes(project.id));
  const nodes=Object.entries(projectRows).flatMap(([role,rows])=>rows.map(row=>({key:role+':'+row.id,role,row}))), bykey=new Map(nodes.map(n=>[n.key,n]));
  const edges=[],keys=new Set();const add=(a,b,kind)=>{if(a===b||!bykey.has(a)||!bykey.has(b)||keys.has(a+'|'+b))return;keys.add(a+'|'+b);edges.push({a,b,kind});};
  for(const n of nodes){for(const [field,role]of [['milestone_ids','milestones'],['site_ids','sites']])for(const id of n.row[field]||[])add(n.key,role+':'+id,'表内关联');}
  // Records explicitly linked to both give a traceable path, not proof of a site upgrade.
  for(const r of projectRows.records)for(const mid of r.milestone_ids||[])for(const sid of r.site_ids||[])add('milestones:'+mid,'sites:'+sid,'共同记录：'+r.title);
  const unlinked=nodes.filter(n=>!edges.some(e=>e.a===n.key||e.b===n.key));
  const tree=btn('生长树',()=>{mode='tree';draw();}),sankey=btn('翻面 · 桑基关联',()=>{mode='sankey';draw();}),reset=btn('显示全部',()=>{focused=null;draw();});
  const search=el('input',{type:'search',placeholder:'查找节点名称或编码','aria-label':'查找关联节点',oninput:()=>draw()});
  panel.append(el('div',{class:'entry-top'},[el('h3',{text:'项目内在关系'}),el('div',{class:'actions'},[tree,sankey,reset])]),search,
    el('p',{class:'form-help',text:'点击节点查看依据并聚焦相关关系。实线为表内关联，虚线为共同记录；线宽固定，不代表完成率或升级收益。'}),stage,detail);
  function show(n){focused=n.key;detail.replaceChildren(el('h3',{text:roleNames[n.role]+' · '+n.row.title}),el('p',{text:projectLabel(project)+' · '+(n.row.number||n.row.code||'未填写编码')}),el('p',{text:n.row.description||n.row.notes||'暂无说明'}),badge(n.row.status),btn('编辑此项',()=>editRow(n.role,n.row)));draw();}
  function draw(){tree.className=mode==='tree'?'primary':'';sankey.className=mode==='sankey'?'primary':'';
    const query=search.value.trim().toLowerCase();let included=nodes.filter(n=>!query||(n.row.title+' '+(n.row.number||'')).toLowerCase().includes(query));
    if(focused){const related=new Set([focused,...edges.filter(e=>e.a===focused||e.b===focused).flatMap(e=>[e.a,e.b])]);included=included.filter(n=>related.has(n.key));}
    const positions=new Map(),branches=[];
    let height=Math.max(430,...['records','milestones','sites'].map(r=>included.filter(n=>n.role===r).length*65+110));
    if(mode==='tree'){
      const milestones=included.filter(n=>n.role==='milestones'),leaves=included.filter(n=>n.role!=='milestones'),used=new Set();let y=65;
      for(const m of milestones){const children=leaves.filter(n=>!used.has(n.key)&&edges.some(e=>(e.a===m.key&&e.b===n.key)||(e.b===m.key&&e.a===n.key)));const size=Math.max(1,children.length)*65;
        positions.set(m.key,{x:340,y:y+size/2-24});branches.push({x:340,y:y+size/2});
        children.forEach((n,i)=>{positions.set(n.key,{x:660,y:y+i*65});used.add(n.key);});y+=size+25;
      }
      const unassigned=leaves.filter(n=>!used.has(n.key));unassigned.forEach((n,i)=>positions.set(n.key,{x:660,y:y+i*65}));
      if(unassigned.length)branches.push({x:660,y:y+unassigned.length*32.5,unassigned:true});height=Math.max(430,y+unassigned.length*65+50);
    }else ['records','milestones','sites'].forEach((role,col)=>included.filter(n=>n.role===role).forEach((n,i)=>positions.set(n.key,{x:30+col*320,y:65+i*65})));
    const svg=svgNode('svg',{viewBox:`0 0 960 ${height}`,role:'group','aria-label':mode==='tree'?'项目生长树':'项目关联流'});
    if(mode==='tree'){
      const cy=height/2;for(const branch of branches)svg.append(svgNode('path',{d:`M270 ${cy} C310 ${cy} 290 ${branch.y} ${branch.x} ${branch.y}`,class:'graph-branch membership'}));
      const root=svgNode('g',{class:'graph-node projects'});root.append(svgNode('rect',{x:25,y:cy-32,width:245,height:64,rx:24}));const name=svgNode('text',{x:42,y:cy-4});name.textContent=project.title.slice(0,13);const code=svgNode('text',{x:42,y:cy+17,class:'graph-small'});code.textContent=project.number||'项目根节点';root.append(name,code);svg.append(root);
      [['项目',30],['里程碑分支',340],['记录 / 场地',660]].forEach(([text,x])=>{const label=svgNode('text',{x,y:28,class:'graph-label'});label.textContent=text;svg.append(label);});
    }else ['records','milestones','sites'].forEach((role,col)=>{const label=svgNode('text',{x:35+col*320,y:28,class:'graph-label'});label.textContent=roleNames[role]+' · '+included.filter(n=>n.role===role).length;svg.append(label);});
    for(const e of edges){const a=positions.get(e.a),b=positions.get(e.b);if(!a||!b)continue;const path=svgNode('path',{d:`M${a.x+135} ${a.y+20} C${a.x+300} ${a.y+20} ${b.x-20} ${b.y+20} ${b.x+135} ${b.y+20}`,class:'graph-link'+(e.kind==='表内关联'?'':' inferred')});const t=svgNode('title');t.textContent=e.kind;path.append(t);svg.append(path);}
    for(const n of included){const p=positions.get(n.key),group=svgNode('g',{class:'graph-node '+n.role,tabindex:0,role:'button','aria-label':n.row.title});group.append(svgNode('rect',{x:p.x,y:p.y,width:265,height:48,rx:12}));const label=svgNode('text',{x:p.x+12,y:p.y+21});label.textContent=n.row.title.length>16?n.row.title.slice(0,16)+'…':n.row.title;group.append(label);const sub=svgNode('text',{x:p.x+12,y:p.y+39,class:'graph-small'});sub.textContent=[roleNames[n.role],n.row.number||n.row.code,n.row.status,n.row.date].filter(Boolean).join(' · ').slice(0,32);group.append(sub);const title=svgNode('title');title.textContent=n.row.title;group.append(title);group.onclick=()=>show(n);group.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(n);}};svg.append(group);}
    stage.replaceChildren(svg);if(!included.length)stage.append(el('p',{text:'没有匹配的节点。'}));
  }
  panel.append(el('p',{class:'subtle',text:unlinked.length+' 项尚未关联其他节点。可点击节点编辑，补充关联里程碑或场地。'}));draw();return panel;
}
async function renderTodosV22(root,generation){
  const result=(await run('todos')).value;if(generation!==viewVersion)return;
  const chosen=new Set(), search=el('input',{type:'search',placeholder:'搜索待办标题','aria-label':'搜索待办'}),scope=select([['all','全部项目'],['unlinked','尚未匹配项目'],...data.projects.map(p=>[p.id,projectLabel(p)])]),count=el('span',{class:'subtle'}),panel=el('div',{class:'panel'});
  let visible=[];
  const done=()=>{data=null;navigate('todos');};
  const complete=items=>bulkDialog('完成 '+items.length+' 项待办',items.map(t=>({op:'complete_todo',task_id:t.id,title:t.title})),done);
  const bulk=btn('完成所选待办',()=>{const items=result.todos.filter(t=>chosen.has(t.id));if(items.length)complete(items);else toast('请先选择待办');},'primary');
  root.replaceChildren(heading('把下一步，落到行动。','同步丰声待办（DWS）。标题前的项目括号会自动匹配同名项目；同名歧义保持未关联。',[btn('+ 新建我的待办',todoDialog)]),el('div',{class:'toolbar'},[search,scope,btn('选择筛选结果（最多 100 项）',()=>{visible.slice(0,100).forEach(t=>chosen.add(t.id));draw();}),btn('清空选择',()=>{chosen.clear();draw();}),count,bulk]),panel);
  function draw(){visible=result.todos.filter(t=>t.title.toLowerCase().includes(search.value.toLowerCase())&&(scope.value==='all'||(scope.value==='unlinked'?!t.link:t.link?.project_id===scope.value)));count.textContent='已选 '+chosen.size+' / 显示 '+visible.length;
    panel.replaceChildren(...visible.map(t=>{const check=el('input',{type:'checkbox',checked:chosen.has(t.id),'aria-label':'选择 '+t.title,onchange:e=>{e.target.checked?chosen.add(t.id):chosen.delete(t.id);count.textContent='已选 '+chosen.size+' / 显示 '+visible.length;}}),project=data.projects.find(p=>p.id===t.link?.project_id);
      return el('div',{class:'todo-row'},[check,el('div',{class:'todo-text'},[el('strong',{text:t.title}),el('small',{text:project?projectLabel(project)+(t.link.inferred_from?' · 按标题匹配':' · 已关联'):'未匹配到唯一项目'})]),btn('完成',()=>complete([t]))]);}));
    if(!visible.length)panel.append(empty('没有匹配的未完成待办','尝试更换项目或搜索词。'));
  }search.oninput=scope.onchange=draw;draw();
}
function renderMemoryV22(root){
  const query=el('input',{placeholder:'输入项目名或关键词','aria-label':'检索项目记忆'}),results=el('div'),projectList=el('div',{class:'memory-projects'}),graph=el('div'),search=btn('检索记忆',e=>quiet(withButton(e.currentTarget,async()=>showMemory((await run('memory_query',{query:query.value})).value))));
  root.replaceChildren(heading('看看项目，已经记住了什么。','先按项目展开相关页面，再检索细节。页面之间只展示已有的明确引用。'),el('div',{class:'toolbar'},[query,search]),el('div',{class:'memory-graph'},[projectList,el('div',{},[graph,results])]));
  for(const project of data?.projects||[])projectList.append(btn(projectLabel(project),e=>quiet(withButton(e.currentTarget,async()=>{query.value=project.title;loading(graph,'正在查找项目记忆页面…');const r=(await run('memory_project',{project_id:project.id})).value;showMemory(r);})))) ;
  function showMemory(r){
    graph.replaceChildren(el('h3',{text:r.project?projectLabel(r.project):r.query}),el('p',{class:'subtle',text:r.scope||'关键词相关页面，并非整个记忆库。'}));results.replaceChildren();
    const cards=el('div',{class:'memory-pages'});
    for(const page of r.pages||[])cards.append(btn(page.title,()=>{results.replaceChildren(el('h3',{text:page.title}),el('p',{class:'subtle',text:page.slug+(page.full_page?' · 已读取全文':' · '+(page.note||'检索片段'))}),el('pre',{text:page.text}));}));
    if(r.pages?.length)graph.append(memoryMap(r,page=>{results.replaceChildren(el('h3',{text:page.title}),el('p',{class:'subtle',text:page.slug}),el('pre',{text:page.text}));}));
    graph.append(cards);
    if(r.edges?.length)graph.append(el('h4',{text:'页面间的明确引用'}),...r.edges.map(e=>el('p',{text:e.source+' → '+e.target})));
    if(!r.pages?.length)graph.append(empty('本次未命中相关页面','可用简称或另一关键词检索；这不代表记忆空间为空。'));
  }
}
function setupNotifications(){
  const button=$('#notifications');if(!button)return;
  const seenKey='nianlun.notifications.'+boot.config_path;let seen={};try{seen=JSON.parse(localStorage.getItem(seenKey)||'{}');}catch{}
  let jobs=[];
  const stamp=j=>j.status+':'+(j.finished_at||j.phase_at||'');
  async function check(){if(!token||document.hidden)return;try{jobs=(await api('/api/notifications')).jobs.filter(j=>!['snapshot','todos','memory_query','memory_project','setup_probe','profiles','inspect','capabilities','growth_status','recovery_status','harness_status','scheduler_request','group_search','mailboxes','cdbi_status','cdbi_datasets','cdbi_fields','cdbi_preview'].includes(j.op));const count=jobs.filter(j=>['succeeded','failed','interrupted','waiting_harness'].includes(j.status)&&seen[j.id]!==stamp(j)).length;$('#notification-count').textContent=count?String(count):'';}catch{}}
  button.onclick=async()=>{await check();const list=el('div',{class:'notification-list'});for(const j of jobs){const b=btn((jobNames[j.op]||j.op)+' · '+({succeeded:'已完成',failed:'未完成',waiting_harness:'等宿主回复',running:'正在执行',queued:'排队中',interrupted:'需要恢复'}[j.status]||j.status),async()=>{seen[j.id]=stamp(j);localStorage.setItem(seenKey,JSON.stringify(seen));if(j.scheduled){$('#modal').close();await navigate('setup');}else dialog(jobNames[j.op]||j.op,taskPanel(await api('/api/jobs/'+j.id)));check();});b.append(el('small',{text:j.phase||j.created_at}));list.append(b);}if(!jobs.length)list.append(el('p',{text:'目前没有任务通知。'}));dialog('任务通知',list);};
  check();setInterval(check,10000);
}
function cdbiPanel(){
 const status=el('p',{class:'subtle',text:'CDBI 用于读取组织授权的场地数据，先检查本机 CLI。'}),url=el('input',{type:'url',placeholder:'组织官方的当前系统单文件下载地址'}),hash=el('input',{placeholder:'官方 SHA-256 校验值'}),path=el('input',{placeholder:'已有 CDBI 可执行文件完整路径'});
 return el('section',{class:'panel'},[el('h3',{text:'丰景台 CDBI · 场地来源'}),status,el('div',{class:'actions'},[
 btn('检测 CDBI',e=>quiet(withButton(e.currentTarget,async()=>{const r=(await run('cdbi_status')).value;status.textContent=r.available?'已找到 CDBI '+r.version+'；'+(r.auth?.authenticated?'已登录':'需要登录'):'未安装 CDBI · '+r.platform;}))),
 btn('登录丰景台',e=>quiet(withButton(e.currentTarget,async()=>{await run('cdbi_login');status.textContent='登录流程已返回，点击检测核验。';}))),
 btn('安装 / 复用 CDBI',e=>quiet(withButton(e.currentTarget,async()=>{const r=(await run('cdbi_install',{url:url.value||undefined,sha256:hash.value||undefined})).value;status.textContent=r.reused?'已复用本机 CDBI':'CDBI 已安装并验证';}))) ]),
 el('details',{},[el('summary',{text:'未安装时：填写组织分发信息'}),el('p',{text:'CDBI 由组织分发。没有当前系统的官方包时，不会猜测下载地址或运行不匹配文件。填写地址与校验值即可安装，无需改代码。'}),formField('当前系统下载地址',url),formField('SHA-256',hash)]),
 el('details',{},[el('summary',{text:'指定已安装的 CLI'}),formField('可执行文件',path),btn('连接此文件',e=>quiet(withButton(e.currentTarget,async()=>{await run('cdbi_connect',{path:path.value});status.textContent='已连接 CDBI';})))])]);
}
function cdbiSites(project){
 const query=el('input',{placeholder:'搜索场地数据集'}),datasets=select([['','先搜索数据集']]),code=select([]),name=select([]),filter=select([['','不额外筛选']]),value=el('input',{placeholder:'筛选值，例如区域代码'}),preview=el('div'),status=el('p'),chosen=new Set();let candidate=null;
 const read=btn('读取字段',e=>quiet(withButton(e.currentTarget,async()=>{const r=(await run('cdbi_fields',{dataset:datasets.value})).value;for(const target of[code,name,filter]){target.replaceChildren(...(target===filter?[el('option',{value:'',text:'不额外筛选'})]:[]),...(r.columnList||[]).map(c=>el('option',{value:c.column,text:(c.rename||c.column)+' · '+c.column})));}status.textContent='请选择场地编码、名称字段，并按需限定范围。';})));
 const inspect=btn('预览场地',e=>quiet(withButton(e.currentTarget,async()=>{chosen.clear();candidate=(await run('cdbi_preview',{dataset:datasets.value,project_id:project.id,code_field:code.value,name_field:name.value,filter_field:filter.value,filter_value:value.value})).value;preview.replaceChildren(...candidate.rows.map(row=>el('label',{class:'check'},[el('input',{type:'checkbox',onchange:e=>e.target.checked?chosen.add(row.code):chosen.delete(row.code)}),row.code+' · '+row.title])));status.textContent='找到 '+candidate.rows.length+' 项候选'+(candidate.limited?'（只展示首 100 条，请缩小筛选范围）':'')+'。选择后导入，不覆盖已有场地。';})));
 const importButton=btn('导入选中场地',e=>quiet(withButton(e.currentTarget,async()=>{if(!candidate||!chosen.size)throw new Error('请先预览并选择场地');const r=(await run('cdbi_import',{dataset:datasets.value,preview:candidate.id,codes:[...chosen],request_id:crypto.randomUUID()})).value;status.textContent='处理 '+r.items.length+' 项，已存在的场地保留。';data=null;})),'primary');
 dialog('从丰景台获取场地 · '+projectLabel(project),el('div',{},[el('div',{class:'toolbar'},[query,btn('搜索数据集',e=>quiet(withButton(e.currentTarget,async()=>{const r=(await run('cdbi_datasets',{query:query.value})).value;datasets.replaceChildren(...r.datasets.map(d=>el('option',{value:String(d.id),text:d.name})));})))]),datasets,read,formField('场地编码字段',code),formField('场地名称字段',name),formField('筛选字段',filter),value,inspect,status,preview,importButton]));
}

function memoryMap(result,onSelect){
 const pages=result.pages||[],height=Math.max(400,Math.ceil(pages.length/2)*64+60),svg=svgNode('svg',{viewBox:`0 0 900 ${height}`,'aria-label':'项目记忆关系图',role:'group'}),positions=new Map();
 const center={x:450,y:height/2};
 pages.forEach((p,i)=>{const pos={x:i%2?630:20,y:45+Math.floor(i/2)*64};positions.set(p.slug,pos);svg.append(svgNode('path',{d:`M450 ${center.y} Q${i%2?600:300} ${pos.y+20} ${pos.x+125} ${pos.y+20}`,class:'graph-branch memory-match'}));});
 for(const e of result.edges||[]){const a=positions.get(e.source),b=positions.get(e.target);if(a&&b)svg.append(svgNode('path',{d:`M${a.x+125} ${a.y+24} Q450 ${Math.min(a.y,b.y)-30} ${b.x+125} ${b.y+24}`,class:'graph-link'}));}
 const circle=svgNode('circle',{cx:center.x,cy:center.y,r:55,class:'memory-root'});svg.append(circle);const label=svgNode('text',{x:center.x,y:center.y,'text-anchor':'middle',class:'graph-label'});label.textContent='项目记忆';svg.append(label);
 for(const p of pages){const pos=positions.get(p.slug),node=svgNode('g',{class:'graph-node',role:'button',tabindex:0,'aria-label':p.title});node.append(svgNode('rect',{x:pos.x,y:pos.y,width:250,height:44,rx:12}));const t=svgNode('text',{x:pos.x+12,y:pos.y+26});t.textContent=p.title.slice(0,16)+(p.title.length>16?'…':'');node.append(t);node.onclick=()=>onSelect(p);node.onkeydown=e=>{if(e.key==='Enter'){onSelect(p);}};svg.append(node);}
 return el('div',{},[el('div',{class:'graph-scroll'},[svg]),el('p',{class:'form-help',text:'中心虚线：按项目关键词匹配；页面间实线：记忆中的明确引用。点击卡片或节点读取正文。'})]);
}
