"""Install Nianlun's public visual adapter into a user-selected recap Skill.

Existing Skill instructions, editor, examples and private content are not copied
into the product. Back up the Skill before running this explicit opt-in command.
"""
import argparse
import shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent


def sync(target):
    target=Path(target).expanduser().resolve()
    if 'name: transcript-visual-recap' not in (target/'SKILL.md').read_text(encoding='utf-8'):
        raise ValueError('Target is not transcript-visual-recap')
    for name in ('report_blocks.py','report_layout.py','report_visual.py'):
        shutil.copyfile(ROOT/'nianlun/scripts'/name,target/'scripts'/name)
    dest=target/'assets/report';dest.mkdir(parents=True,exist_ok=True)
    for name in ('visual-blocks.css','visual-blocks.js','charts.bundle.js','compact.css','path3d.bundle.js','path3d.css'):
        shutil.copyfile(ROOT/'nianlun/assets/report'/name,dest/name)
    vendor=target/'assets/portal/vendor';vendor.mkdir(parents=True,exist_ok=True)
    for name in ('three-LICENSE.txt','echarts-LICENSE.txt','echarts-NOTICE.txt','zrender-LICENSE.txt','tslib-LICENSE.txt'):
        shutil.copyfile(ROOT/'nianlun/assets/portal/vendor'/name,vendor/name)
    for name in ('LICENSE','NOTICE'):
        shutil.copyfile(ROOT/name,dest/('NIANLUN-'+name+'.txt'))
    shutil.copyfile(ROOT/'nianlun/assets/report/visual-contract.md',target/'references/visual-contract.md')
    shutil.copyfile(ROOT/'tools/recap_visual_render.py',target/'scripts/render_visual.py')


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('skill');sync(p.parse_args().skill)
