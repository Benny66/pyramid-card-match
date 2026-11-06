// QA 一键验证：node scripts/verify-deals.mjs [n]
// Node 22 原生 type-stripping 直接加载 .ts，无需 esbuild / tsx / 新依赖。
import { verifyDeals } from '../src/diagnostics.ts'

const n = Number.parseInt(process.argv[2] ?? '1000', 10) || 1000
const report = verifyDeals(n, { seed: 0x5eed })
console.log(JSON.stringify(report, null, 2))

const ok =
  report.structureOk === n &&
  report.pyramidSolvable === n &&
  report.fullSolvable === n &&
  report.planReplayOk === n &&
  report.failures.length === 0

if (!ok) {
  console.error('[verify] FAILED')
  process.exit(1)
}
console.log(
  '[verify] OK  structureOk=' + report.structureOk +
  ' pyramidSolvable=' + report.pyramidSolvable +
  ' fullSolvable=' + report.fullSolvable +
  ' planReplayOk=' + report.planReplayOk +
  ' fallbackCount=' + report.fallbackCount +
  ' hintPyramidCleared=' + report.hintPyramidCleared + '/' + report.hintSamples +
  ' failures=' + report.failures.length,
)
