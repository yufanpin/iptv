#!/usr/bin/env node
/**
 * 频道名称 / TVG 规整回归测试（issue #39）
 *
 * 用 issue #39 提需求者列出的真实别名清单做断言：各种写法的 CCTV 频道名，
 * 都应归一到咪咕 EPG 的规范名，从而能匹配上节目单。
 *
 * 运行： node scripts/test-channel-normalize.mjs   （或 npm test）
 *
 * 注：卫视/港台等规范名在生产环境由 playback.xml 提供（运行时读取）；
 * 测试环境无 EPG 文件，故这里只校验「静态可用」的 CCTV 系列（来自 datas.js 的 cntvNames）。
 */
import assert from 'node:assert/strict'
import { normalizeKey, normalizeTvgName } from '../utils/channelNormalize.js'

let passed = 0
function check(name, fn) { fn(); passed++; console.log(`  ✅ ${name}`) }

console.log('频道名称 / TVG 规整回归测试 (issue #39)')

// 1) normalizeKey：归一 key 是否符合预期（含 CCTV5 vs CCTV5+、CCTV4 三路区分）
check('normalizeKey 关键用例', () => {
  assert.equal(normalizeKey('CCTV1综合'), 'CCTV1')
  assert.equal(normalizeKey('CCTV-1高清'), 'CCTV1')
  assert.equal(normalizeKey('CCTV-1综合HD'), 'CCTV1')
  assert.equal(normalizeKey('CCTV5体育'), 'CCTV5')
  assert.equal(normalizeKey('CCTV5+体育赛事'), 'CCTV5+')
  assert.equal(normalizeKey('CCTV5加'), 'CCTV5+')          // 「加」当作 +
  assert.equal(normalizeKey('CCTV4中文国际'), 'CCTV4')
  assert.equal(normalizeKey('CCTV4欧洲'), 'CCTV4欧')        // 欧洲单独成 key，避免覆盖中文国际
  assert.equal(normalizeKey('CCTV4美洲'), 'CCTV4美')
  assert.equal(normalizeKey('湖南卫视HD'), normalizeKey('湖南卫视')) // 清晰度后缀不影响匹配
})

// 2) issue #39 列出的别名清单 → 规范名（咪咕 EPG 频道名）
const cases = {
  'CCTV1综合': ['CCTV1', 'CCTV1综合', 'CCTV-1综合', 'CCTV-1', 'CCTV1HD', 'CCTV1高清',
    'CCTV1综合HD', 'CCTV1综合高清', 'CCTV-1综合HD', 'CCTV-1综合高清', 'CCTV-1HD', 'CCTV-1高清'],
  'CCTV2财经': ['CCTV2', 'CCTV2财经', 'CCTV-2财经', 'CCTV-2', 'CCTV2HD', 'CCTV2高清',
    'CCTV-2财经高清', 'CCTV-2HD', 'CCTV-2高清'],
  'CCTV3综艺': ['CCTV3', 'CCTV3综艺', 'CCTV-3综艺', 'CCTV-3', 'CCTV3HD', 'CCTV3高清', 'CCTV-3综艺HD'],
  'CCTV4中文国际': ['CCTV4', 'CCTV4国际', 'CCTV4中文国际', 'CCTV-4', 'CCTV4HD', 'CCTV4高清', 'CCTV-4中文国际高清'],
  'CCTV5体育': ['CCTV5', 'CCTV-5', 'CCTV5高清', 'CCTV5体育', 'CCTV-5体育HD'],
  'CCTV5+体育赛事': ['CCTV5+', 'CCTV5+体育赛事', 'CCTV-5+', 'CCTV5加', 'CCTV5+高清'],
  'CCTV4欧洲': ['CCTV4欧洲', 'CCTV-4欧洲', 'CCTV4欧洲高清'],
  'CCTV4美洲': ['CCTV4美洲', 'CCTV-4美洲HD'],
}
for (const [canonical, aliases] of Object.entries(cases)) {
  check(`别名归一 → ${canonical}（${aliases.length} 种写法）`, () => {
    for (const alias of aliases) {
      assert.equal(normalizeTvgName(alias), canonical, `「${alias}」应归一为「${canonical}」，实际「${normalizeTvgName(alias)}」`)
    }
  })
}

// 3) 无对应规范名时返回 null，绝不误改
check('无法匹配的名字返回 null（不误改）', () => {
  assert.equal(normalizeTvgName('某体育赛事直播回看'), null)
  assert.equal(normalizeTvgName(''), null)
  assert.equal(normalizeTvgName('翡翠台'), null) // 港台台（测试环境无 EPG，预期未命中）
})

console.log(`\n全部通过：${passed} 组 ✅`)
