"""版本号的唯一来源。

## 为什么要有这个文件

2026-11-07 之前版本号硬编码在 4 个地方：

```
packaging/build.py:15      VERSION = '2.9.7'
packaging/install.py:108   'version':'2.9.2'
nianlun/scripts/server.py:70  'version':'2.9.2'
nianlun/scripts/setup.py:21   VERSION = '2.9.2'
```

升版本要改 4 处，漏一处就会出现「打包出来的 2.9.3、界面显示 2.9.2」这种
前后不一致——而且**不报错**，只有用户看出不对才会发现。

## 用法

```python
from version import VERSION
```

`nianlun/scripts/` 在打包时被复制到分发包里，`packaging/` 只在开发时用，
所以这个文件放在 `nianlun/scripts/` 下、两边都能引到。

## 改版本时

只改这里一行，然后跑：

```bash
python3 tools/check_version_sync.py
```

它会扫全仓库，确认没有别处还硬编码着旧版本号。
"""

VERSION = '2.12.0'
