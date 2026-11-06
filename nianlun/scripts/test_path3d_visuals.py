"""3D 效果的视觉参数不能退回扁平。

飞哥明确要求「Three.js 一定要用，因为效果会很好」。功能能跑（canvas 创建、
dialog 打开）只是底线；真正决定「效果好不好」的是厚度、材质、阴影这些参数。
这里锁住它们，避免以后被无意改回去。
"""
import re
import sys
import unittest
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / 'assets' / 'report'


class Path3DVisualTests(unittest.TestCase):
    def bundle(self):
        return (ASSETS / 'path3d.bundle.js').read_text(encoding='utf-8')

    def test_bundle_is_syntactically_parseable(self):
        """压缩代码改动后必须还能解析，否则整个 3D 静默失效。"""
        src = self.bundle()
        self.assertFalse(src.count('</script>'), 'bundle 里不能出现 script 结束标签')
        self.assertGreater(len(src), 500000, 'bundle 明显偏小，可能被截断')

    def test_nodes_have_real_depth(self):
        """厚度必须够，10 的厚度看起来就是一张纸。"""
        src = self.bundle()
        match = re.search(r'new Ci\(J\.width,J\.height,(\d+)\)', src)
        self.assertIsNotNone(match, '找不到节点几何构造')
        self.assertGreaterEqual(int(match.group(1)), 20, '节点厚度被改薄了，立体感会消失')

    def test_material_uses_supported_params_only(self):
        """材质参数必须是该材质真支持的。

        这个 bundle 只打包了 MeshBasic 和 MeshLambert 两种材质。Lambert 不支持
        roughness/metalness——之前加了这两个，浏览器只打警告然后默默忽略，
        视觉没变化，测试却因为「字符串里有 roughness」而假通过。
        改用 Lambert 支持的 emissive + emissiveIntensity。
        """
        src = self.bundle()
        # Three.js 库内部有 shader uniform 也叫 roughness/metalness，要排除掉，
        # 只看业务代码构造的节点材质。
        import re as _re
        node_materials = _re.findall(r'new ws\(\{[^}]*\}\)', src)
        self.assertTrue(node_materials, '找不到节点材质构造')
        for material in node_materials:
            self.assertNotIn('roughness', material,
                             'MeshLambertMaterial 不支持 roughness，加了也无效还会打警告')
            self.assertNotIn('metalness', material, 'MeshLambertMaterial 不支持 metalness')
        self.assertIn('emissiveIntensity', src, '质感应改用 Lambert 支持的参数')

    def test_shadow_map_enabled(self):
        src = self.bundle()
        self.assertIn('shadowMap.enabled=!0', src, '阴影被关掉了')

    def test_nodes_cast_and_receive_shadow(self):
        src = self.bundle()
        self.assertIn('castShadow=!0', src)
        self.assertIn('receiveShadow=!0', src)

    def test_directional_light_has_shadow_camera(self):
        src = self.bundle()
        self.assertIn('A.castShadow=!0', src, '方向光没有开启投影')
        self.assertIn('mapSize.set(1024,1024)', src, '阴影贴图分辨率被降掉了')

    def test_wrapper_enables_pointer_drag(self):
        """能拖拽转视角是 3D 感的重要来源。"""
        src = self.bundle()
        self.assertIn('pointermove', src)
        self.assertIn('rotation.x=', src)


if __name__ == '__main__':
    unittest.main()
