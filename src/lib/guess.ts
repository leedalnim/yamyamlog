// 제품 이름에 적힌 낱말로 종류와 원료를 짐작한다.
//
// '조공 오키로스틱 퍼플 닭가슴살' → 종류 츄르? 원료 닭가슴살.
// 짐작이 틀릴 수 있으므로 앱은 빈칸일 때만 채우고, 사용자가 고칠 수 있다.

import { toNewKind } from './kind'

// 앞에 있는 규칙이 이긴다 — '동결건조 트릿'은 동결건조
const KIND_RULES: [string, RegExp][] = [
  ['동결건조', /동결\s*건조|프리즈\s*드라이|freeze\s*dr/i],
  ['양갱', /양갱/],
  ['츄르', /츄르|짜\s*먹는|퓨레|리퀴드/],
  ['파우치(습식)', /파우치|습식/],
  ['캔', /캔(?!디)|\bcan\b/i],
  ['트릿', /트릿|트리트|treat/i],
  ['주식', /주식/],
  ['건식', /건식|건사료|사료/],
]

/** 이름에 적힌 낱말로 종류(형태)를 짐작한다. 모르면 undefined.
 *  낱말로 예전 종류를 먼저 찾고, 새 분류(건식·습식·간식·트릿·츄르)로 옮긴다 */
export function guessKind(text: string): string | undefined {
  for (const [k, re] of KIND_RULES) if (re.test(text)) return toNewKind(k, text)
  return undefined
}

// 원료 — 앱의 원료 칩 이름으로 맞춘다. 칩에 없는 것(오리 등)도 그 이름으로 넣는다.
const BASE_RULES: [string, RegExp][] = [
  ['참치', /참치|튜나|tuna/i],
  ['닭가슴살', /닭|치킨|chicken/i],
  ['칠면조', /칠면조|터키|turkey/i],
  ['연어', /연어|salmon/i],
  ['게살', /게살|크랩|crab/i],
  ['새우', /새우|shrimp/i],
  ['가리비', /가리비|scallop/i],
  ['소고기', /소고기|쇠고기|비프|beef|한우/i],
  ['북어', /북어|황태/],
  ['명태', /명태/],
  ['정어리', /정어리|사딘|sardine/i],
  ['갈치', /갈치/],
  ['호키', /호키|hoki/i],
  ['산양유', /산양\s*유|산양\s*우유|goat\s*milk/i],
  ['오리', /오리(?!지)|duck/i],
  ['가다랑어', /가다랑어|가쓰오|가츠오|bonito/i],
  ['고등어', /고등어|mackerel/i],
  ['대구', /대구(?!시)|cod\b/i],
  ['양고기', /양고기|lamb/i],
]

/** 이름에 적힌 원료 (적힌 것만) */
export function guessBase(name: string): string[] {
  return BASE_RULES.filter(([, re]) => re.test(name)).map(([b]) => b)
}
