const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('nianlun/assets/portal/app.js', 'utf8');
const block = source.slice(source.indexOf('  const mailbox = select('), source.indexOf('  const lookback = select('));

function form(run, preferences = {}) {
  const context = {
    preferences, run,
    el: (_tag, props = {}) => ({ ...props }),
    select: (_options, value) => ({ value, setAttribute() {}, replaceChildren(...options) { this.options = options; } }),
    btn: (text, onclick) => ({ textContent: text, onclick }),
    quiet: (p) => p,
    withButton: async (b, fn) => fn((text) => { b.textContent = text; }),
  };
  vm.createContext(context);
  vm.runInContext(block + '\nglobalThis.form = { mailbox, mailStatus, loadMail, testMail };', context);
  return context.form;
}

test('single discovered mailbox is visibly selected, without enabling or saving collection', async () => {
  const calls = [];
  const f = form(async (op) => { calls.push(op); return { value: { emails: ['me@example.test'] } }; });
  await f.loadMail.onclick({ currentTarget: f.loadMail });
  assert.equal(f.mailbox.value, 'me@example.test');
  assert.match(f.mailStatus.textContent, /已读取 1 个邮箱/);
  assert.equal(f.testMail.disabled, false);
  assert.deepEqual(calls, ['mailboxes']);
});

test('multiple accounts require selection; existing choice survives refresh', async () => {
  const run = async () => ({ value: { emails: ['a@example.test', 'b@example.test'] } });
  const f = form(run);
  await f.loadMail.onclick({ currentTarget: f.loadMail });
  assert.equal(f.mailbox.value, '');
  assert.equal(f.testMail.disabled, true);
  const saved = form(run, { mailbox: 'b@example.test' });
  await saved.loadMail.onclick({ currentTarget: saved.loadMail });
  assert.equal(saved.mailbox.value, 'b@example.test');
});

test('failure stays visible beside the selector and preserves the saved selection', async () => {
  const f = form(async () => { throw Error('连接超时'); }, { mailbox: 'me@example.test' });
  await assert.rejects(f.loadMail.onclick({ currentTarget: f.loadMail }), /连接超时/);
  assert.match(f.mailStatus.textContent, /读取失败：连接超时/);
  assert.equal(f.mailbox.disabled, false);
  assert.equal(f.mailbox.value, 'me@example.test');
});

test('probe shows real phases and distinguishes no mail from verified body', async () => {
  for (const body of [true, null]) {
    const f = form(async (op, data, phase) => {
      assert.equal(op, 'mail_probe');
      assert.equal(data.email, 'me@example.test');
      phase('正在验证正文');
      assert.equal(f.mailStatus.textContent, '正在验证正文');
      return { value: { body_readable: body } };
    }, { mailbox: 'me@example.test' });
    await f.testMail.onclick({ currentTarget: f.testMail });
    assert.match(f.mailStatus.textContent, body ? /列表和正文均可读取/ : /本次未验证正文/);
    assert.equal(f.mailbox.disabled, false);
  }
});
