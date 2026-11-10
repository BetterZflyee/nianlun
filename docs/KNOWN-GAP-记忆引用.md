# 已知缺口：记忆之间没有引用关系

**状态**：✅ 已修复并**在真实生长中验证**（2026-11-07 10:25）

`growth.py` 的 `_related_links()` 按本轮 evidence 里的项目拼
`[[projects/nianlun-<hash>|标题]]`。

**生产验证**（2026-11-07 09:25 那轮真实生长）：

```
gbrain call get_links '{"slug":"meetings/nianlun-20261107-092518-da49fe98"}'
→ 出边数: 18
  → projects/nianlun-a43db55a38aec99b04a20a1b
  → projects/nianlun-921709c497dc5e6163976ea5
  → projects/nianlun-ed9ddf27d3cc9698af253ead
  ...
```

**工作台界面同步变化**：

| | 修复前 | 修复后 |
|---|---|---|
| 统计 | 505 篇 · **0 条引用** | 120 篇 · **18 条引用** |
| 3D 星图 | 只有散点 | **有放射状连线**（projects·43 → meetings·69 / concepts·6） |

下面保留完整排查过程，供以后遇到同类问题时对照。

**发现时间**：2026-11-07 09:10
**影响**：3D 星图只有散点、没有连线；「0 条引用」

## 现象

工作台「项目记忆」页显示：

```
505 篇 · 0 条引用
```

3D 星图里 505 篇记忆按项目分组成 12 个簇（`projects·45`、`meetings·326`、
`people·68`…），但**簇与簇、点与点之间一条线都没有**。

## 排查过程与结论

### 1. 读取是正常的

```python
ex = MemoryExplorer('~/.config/nianlun/config.json')
r = ex.relations([key1, key2])
# → verified: True | links: 0 | error: ''
```

`verified: True` 说明**读成功了**，不是「读取失败被当成空索引」。

原始调用也确认：

```bash
gbrain call get_links '{"slug":"meetings/nianlun-20261107-081430-..."}'
# → []     （退出码 0）
```

### 2. GBrain 本身有链接能力

```bash
gbrain link <from> <to> --link-type T --link-source S   # 建边，实测 {"status":"ok"}
gbrain unlink <from> <to> ...                            # 删边，实测 {"removed":1}
gbrain link-sources                                      # markdown 173 条 / frontmatter 4 条
gbrain backlinks <slug>                                  # 入边
gbrain graph <slug> --depth N                            # 遍历
```

**建边能力已验证可用**（测试用的那条边已 `unlink` 撤销，数据未污染）。

### 3. 根因在写入侧

`growth.py:793` 写入记忆的正文是：

```python
content = ('---\ntitle: 年轮生长记录 ' + run_id + '\ntags: [nianlun, project-memory]\n---\n\n'
           + text + '\n\n## 相关记录\n\n项目来源与 AI 表格链接见上。\n')
```

那个「## 相关记录」章节**写着「见上」，但正文里没有任何 `[[wiki链接]]`**。

而 GBrain 的 markdown 边**正是靠正文里的 `[[...]]` 建立的**——对比：

```markdown
# 有链接的记忆（projects/aviation-security.md）
[[2026-H1-安检数智化项目全览]]
[[2026-09-15-机场f区ai安检项目现场踏勘]]

# 年轮写的记忆
（零个 [[...]]）
```

**年轮从未写过 wiki 链接，也从未调用过 `gbrain link`。**

### 4. 这是回归

`docs/VALIDATION_2.5.md:14` 记录过：

> 真实目录 **483 篇**完整展开，483 篇引用索引核验完成，**呈现 176 条页面间引用**

当时有 176 条。现在 505 篇是 **0 条**。

那 177 条现存边（markdown 173 + frontmatter 4）属于**其他来源**——
`backlinks` 对年轮记忆、concept 页面全部返回 `[]`。

## 为什么没有修

修它需要在写入侧加链接，而**链接目标必须是真实存在的页面**。当前
`evidence.json` / `decision.json` 里**没有带上项目 slug**，所以要修得先
把「本次涉及哪些项目」传进来。

**不能为了有连线而硬造关系**——那会让星图看起来热闹但信息是假的，
比没有连线更糟。这与「不为出 3D 而编造依赖」是同一条原则。

## 修的话怎么做

1. 采集阶段把本次涉及的 `project_id` 列表带进 `evidence.json`
2. 写入 `content` 时，对每个项目拼 `[[projects/nianlun-<hash>]]`
3. 或者写入后用 `gbrain link meetings/nianlun-<run> projects/nianlun-<hash>`
   补边（`--link-source nianlun`，便于将来审计/回滚）
4. 加测试：写入的记忆正文必须含至少一个 `[[...]]`（当次有项目时）

## 验收标准

- 新一轮生长后，`gbrain call get_links` 对该记忆返回非空
- 工作台「0 条引用」变成非零
- 3D 星图出现连线
