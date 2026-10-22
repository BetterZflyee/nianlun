// Loaded only by this report's --patch. Never changes the user's host profile.
module.exports = {
  name: 'nianlun-report-policy',
  inject: ['tools'],
  apply(ctx) {
    ctx.tools.guard(() => '年轮阶段汇报只分析已提供材料，不能执行工具。');
    ctx.on('agent/created', ({ agent }) => {
      agent.ctx.tools.restrict({ allow: [] });
      if (ctx.tools.schemas(agent).length) throw new Error('NIANLUN_REPORT_TOOLS_NOT_EMPTY');
      process.stdout.write(JSON.stringify({ type: 'nianlun_policy', tools: 0 }) + '\n');
    });
  },
};
