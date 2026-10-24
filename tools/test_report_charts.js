const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('nianlun/assets/report/visual-blocks.js','utf8');
function fixture(config,fail=false) {
  const saved={},host={hidden:true,before(button){saved.button=button;}},fallback={hidden:false};
  const fig={querySelector(sel){return {'.rv-spec':{textContent:JSON.stringify(config)},'.rv-interactive':host,'.rv-static-graph':fallback}[sel];}};
  const chart={setOption(o){saved.option=o;},resize(){saved.resized=true;},dispose(){saved.disposed=true;}};
  const engine={init(el,theme,opts){saved.init=opts;if(fail)throw Error('renderer unavailable');return chart;}};
  const ctx={window:{RecapCharts:engine},RecapCharts:engine,
    document:{documentElement:{},querySelectorAll:()=>[fig],createElement:()=>({setAttribute(k,v){this[k]=v;}})},
    getComputedStyle:()=>({getPropertyValue:()=>''}),matchMedia:()=>({matches:true}),
    ResizeObserver:class{observe(){}disconnect(){}},MutationObserver:class{observe(){}disconnect(){}},
    addEventListener:(n,fn)=>{saved[n]=fn;}};
  vm.runInNewContext(source,ctx);return {saved,host,fallback};
}
const graph={type:'graph',nodes:[{id:'a',label:'材料',detail:'仍待补充',layer:0,state:'blocked'},
  {id:'b',label:'核验',detail:'计划动作',layer:1,state:'planned'}],links:[{from:'a',to:'b',label:'待补后核验'}]};
test('report starts with accessible static graph; opt-in ECharts preserves exact directed relations',()=>{
  const {saved,host,fallback}=fixture(graph);assert.equal(saved.init,undefined);
  saved.button.onclick();assert.equal(saved.init.renderer,'svg');assert.equal(host.hidden,false);assert.equal(fallback.hidden,true);
  const s=saved.option.series[0];assert.equal(s.type,'graph');assert.equal(s.links.length,1);
  assert.equal(s.links[0].source,'a');assert.equal(s.links[0].target,'b');assert.equal(s.edgeSymbol[1],'arrow');
  assert.equal(s.data[0].value,undefined);assert.equal(s.data[0].detail,'仍待补充');
  assert.ok(saved.option.aria.label.description.includes('材料：仍待补充'));
  assert.equal(saved.option.animation,false);assert.equal(saved.option.tooltip.renderMode,'richText');
  saved.button.onclick();assert.equal(host.hidden,true);assert.equal(fallback.hidden,false);
  saved.pagehide({persisted:false});assert.equal(saved.disposed,true);
});
test('unavailable chart engine retains the original figure',()=>{
  const {saved,host,fallback}=fixture(graph,true);saved.button.onclick();
  assert.equal(fallback.hidden,false);assert.equal(host.hidden,true);assert.equal(saved.button.disabled,true);
});
test('quantitative chart keeps actual values, units and categories including negative numbers',()=>{
  const {saved}=fixture({type:'bar',unit:'万元',categories:['前期','本期'],series:[{name:'变化',data:[-2,0]}]});
  saved.button.onclick();assert.deepEqual(Array.from(saved.option.series[0].data),[-2,0]);
  assert.equal(saved.option.yAxis.name,'万元');assert.equal(saved.option.series[0].type,'bar');
  assert.equal(saved.option.toolbox.feature.saveAsImage.type,'svg');
});
