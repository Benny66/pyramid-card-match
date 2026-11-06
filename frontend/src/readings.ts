// ============================================================================
// 趣味解答：完全本地、完全枚举、零网络、零大模型。
//
// 合规做法：所有语义素材在下面写死，且全部是中性陪伴式陈述句；
// 不含预测、吉凶、运势、宜忌、建议、决策、因果推断，也不回应用户提问的实质。
// 生成逻辑只是「按 话题 × 结果 × 本局统计 × 牌面特征」确定性地挑句并拼接，
// 同一局面永远得到同一段文字 —— 没有生成式内容，也就没有失控风险。
//
// A 档扩充：每个话题 5 条专属短句、开局/收尾各 10 条，并新增「牌面速写」
// 两个维度（剩余 K 的张数、点数分布与用时）。六句用各自独立的 seed 选，
// 不再由一个 seed 联动，避免「换个类型换一句、其余永远一样」。
// ============================================================================

export const DISCLAIMER =
  '本游戏及趣味解答仅休闲娱乐，不作为真实依据，不具备预测、占卜、判断吉凶的作用，也不构成任何建议或决策依据。'

export const DICT_DISCLAIMER =
  '以上为国内民间口口相传的趣味说法，版本很多，纯属休闲娱乐，不作为真实依据，不具备预测、占卜、判断吉凶的作用，也不构成任何现实建议'

export interface Topic {
  key: string
  label: string
  hint: string
  group: string
}

// 分组只是为了好选，标签一律中性、生活化：
// 不用财运 / 姻缘 / 吉凶 / 运势这类强化预测感的分类，也不赋予任何含义。
export const TOPIC_GROUPS: string[] = ['心情与自己', '人与关系', '事情与日常']

export const TOPICS: Topic[] = [
  { key: 'mood', label: '今日心情', hint: '随手记下此刻的状态', group: '心情与自己' },
  { key: 'rest', label: '作息状态', hint: '最近睡得怎么样', group: '心情与自己' },
  { key: 'choice', label: '一点犹豫', hint: '心里还没定下来的小事', group: '心情与自己' },
  { key: 'goal', label: '小目标', hint: '一个小小的念头', group: '心情与自己' },
  { key: 'novelty', label: '新鲜事', hint: '刚遇到、刚想到的事', group: '心情与自己' },

  { key: 'people', label: '人际关系', hint: '想到的人或事', group: '人与关系' },
  { key: 'love', label: '感情陪伴', hint: '关于亲近的人', group: '人与关系' },
  { key: 'family', label: '家里的事', hint: '家人与日常相处', group: '人与关系' },
  { key: 'friends', label: '朋友往来', hint: '许久没联系的人', group: '人与关系' },

  { key: 'work', label: '工作学习', hint: '忙碌之外的几分钟', group: '事情与日常' },
  { key: 'tasks', label: '手头的事', hint: '桌面上那一堆小事', group: '事情与日常' },
  { key: 'money', label: '日常开销', hint: '柴米油盐那点账', group: '事情与日常' },
  { key: 'travel', label: '出门走走', hint: '路上、窗外的风景', group: '事情与日常' },
  { key: 'casual', label: '随手一问', hint: '没有目的，图个新鲜', group: '事情与日常' },
]

export function topicByKey(key: string): Topic {
  return TOPICS.find((t) => t.key === key) ?? TOPICS[TOPICS.length - 1]
}

// 静态趣味小词典：沿用最早的民间口口相传版本，仅作可查的休闲阅读。
// 它【不参与】趣味解答的生成，也不参与任何玩法、计分或胜负判定。
export const FUN_RANKS: { rank: string; text: string }[] = [
  { rank: 'A', text: '一心一意、新开端' },
  { rank: '2', text: '两难、选择、阻碍' },
  { rank: '3', text: '贵人、靠山、助力' },
  { rank: '4', text: '奔波、四面八方、变动' },
  { rank: '5', text: '小财、收获' },
  { rank: '6', text: '顺利、平顺' },
  { rank: '7', text: '口舌、纠结、小事牵绊' },
  { rank: '8', text: '财运、机会' },
  { rank: '9', text: '酒、应酬、欢愉' },
  { rank: '10', text: '大财、大收获' },
  { rank: 'J', text: '小人、晚辈、消息' },
  { rank: 'Q', text: '女生 / 伴侣、温柔的人' },
  { rank: 'K', text: '贵人、长辈、有力的人' },
]

export const FUN_SUITS: { suit: string; text: string }[] = [
  { suit: '♥ 红桃', text: '感情、人缘、心情' },
  { suit: '♦ 方块', text: '钱财、消息、事业' },
  { suit: '♣ 梅花', text: '机遇、合作、工作' },
  { suit: '♠ 黑桃', text: '阻碍、烦恼、是非' },
]

// ---------------------------------------------------------------------------
// 素材池：全部为陈述式、陪伴式表达，不含祈使句、建议句式与任何推断。
// ---------------------------------------------------------------------------

const OPENING: Record<string, string[]> = {
  cleared: [
    '这一副牌刚好走到了最后一张，七层塔被收拾得干干净净。',
    '牌一张张都被收了起来，桌面空下来的样子看着挺舒服。',
    '最后一张牌也翻过去了，这一局算是完整收尾。',
    '从最底下那排开始，一直收到了塔尖。',
    '52 张牌一张不剩，桌面上只剩浅色的底纹。',
    '这一局走完了全程，翻牌和配对都刚好接上。',
    '七层塔被一层层拆开，最后连塔尖也收走了。',
    '桌面清空的时候，计时也刚好停在这一刻。',
    'A 到 K 都在这局里露过面，又都回到了牌堆。',
    '没有留下没配完的牌，这一副算是收得整齐。',
  ],
  stuck: [
    '牌没有全部收完，本来就是消磨时间的小游戏。',
    '这一副没走通，桌面上还留着几张牌。',
    '剩下的几张就先放在那里，一局牌到这里告一段落。',
    '手牌翻到了尽头，塔上还有没配完的位置。',
    '这一局停在半路，牌面就停在眼前这个样子。',
    '有几张牌一直等到最后，也没等到能配对的那张。',
    '塔的下半部分已经空了，上面还留着一些。',
    '翻完最后一手牌，桌面安静了下来。',
    '这一副的牌序就摆成这样，收尾停在了这里。',
    '没清空的牌还在原位，这一局到这里为止。',
  ],
}

// 每个话题 5 条专属短句，全部为陈述式、陪伴式表达，
// 不含祈使句、建议、预测，也不回应用户写下的内容。
const TOPIC_LINES: Record<string, string[]> = {
  mood: [
    '今天的话题就写在这里，不急着下什么结论。',
    '心情这种东西，写下来的时候已经变了一点点。',
    '这一刻的状态被留了一行字，如此而已。',
    '开心或平淡，都只是这一局开始前的背景。',
    '牌摆开的时候，刚才那点情绪还停在旁边。',
  ],
  rest: [
    '起早贪黑之外，一天里也有发呆的几分钟。',
    '早睡和晚睡的差别，今天没有写进牌里。',
    '窗外的光线，和这局牌一起停在这里。',
    '忙完一轮之后，坐着不动的这几分钟也算数。',
    '身体是慢的，牌面是静的，都不着急。',
  ],
  choice: [
    '心里放着一件还没定下来的小事，写下来就是写下来了。',
    '拿不定的那部分，暂时还是拿不定的。',
    '两个选项并排摆着，谁也没有被划掉。',
    '犹豫本身也是一段完整的时间。',
    '这一局没有替谁做选，只是把牌翻了一遍。',
  ],
  goal: [
    '一个小小的念头，被认真写了一次。',
    '目标写得很短，短到刚好放进这一行。',
    '还没开始的那些事，此刻都还是名词。',
    '纸上的一行字，和桌上的牌一样安静。',
    '想做点什么的那点劲头，被记了一笔。',
  ],
  novelty: [
    '刚碰上的新鲜事，在这里留了一行字。',
    '新遇到的人和景，转眼就成了旧事。',
    '今天多出来的一件小事，被顺手写进来了。',
    '第一次听说的词，现在躺在这局牌的开头。',
    '新鲜感来得快，牌面还是老样子。',
  ],

  people: [
    '写下来的那几个字，只是此刻想到的人或事。',
    '名字被想起一次，没有别的后续。',
    '人和人之间的距离，牌面上量不出来。',
    '这一局里出现的称呼，只有你自己认识。',
    '想到谁就写了谁，写完就翻牌。',
  ],
  love: [
    '想到某个人的时候，牌刚好翻到了这里。',
    '亲近的人不必出现在牌面上，也一直在背景里。',
    '有些话没说出口，只变成了一行小字。',
    '两个人之间那些琐碎，被这几分钟隔开了一点。',
    '这份惦记没有形状，牌堆也照旧洗开。',
  ],
  family: [
    '家里那些琐碎的声音，此刻离得有点远。',
    '饭点、灯、门响，都是没写进来的背景。',
    '一家人的日常，通常由很多不值一提的小事组成。',
    '这会儿桌面上只有牌，家里的动静暂时在另一边。',
    '关于家的那几个字，写得比想象中短。',
  ],
  friends: [
    '有些名字很久没念出来，这会儿被想起了一次。',
    '上一条消息还停在几天前，牌已经翻了好几轮。',
    '朋友这种关系，不联系的时候也还在那里。',
    '聊天记录没有翻，翻的是这一副牌。',
    '想起一个人，往往只需要一个很普通的瞬间。',
  ],

  work: [
    '忙碌之外，还有这几分钟是留给自己的。',
    '待办还挂在别处，这会儿没有跟过来。',
    '表格和课本都合上了，桌上摊开的是牌。',
    '忙到一半抽身出来，时间就这么短了一截。',
    '工作日的下午，也会有这样一小段空白。',
  ],
  tasks: [
    '桌上摊着的几件事，暂时都停在原处。',
    '清单没有变短，也没有变长。',
    '那些待办还在原来的位置，牌先翻到了这里。',
    '一件件摆着的事，此刻谁也没有被拿起。',
    '手头的事和这副牌，各占了一段不同的时间。',
  ],
  money: [
    '柴米油盐的账目，今天没有摆到桌面上。',
    '数字在生活里很常见，在牌面上只是点数。',
    '账本合着，牌摊着，两件事互不相干。',
    '今天花掉的和留下的，都不在这局里。',
    '开销是另一本账，这里是 52 张纸牌。',
  ],
  travel: [
    '路上见到的风景，被顺手记了一笔。',
    '窗外换过的几段景，和牌面一起停在今天。',
    '走过的地方变成了很短的一句话。',
    '出门和回家之间，有这几分钟的空白。',
    '车票和照片都收起来了，桌面留给牌。',
  ],
  casual: [
    '随口一问，本来也不必有什么答案。',
    '没有问题的一局，也一样能把牌翻完。',
    '这一栏留白的时候，牌面反而更清楚。',
    '没什么特别想问的，就随便摆一副。',
    '随手写下又划掉的那种念头，也算来过。',
  ],
}

// 牌面速写之一：按剩余 K 的张数分档，只描述看得见的事实。
const K_LINES: Record<string, string[]> = {
  none: [
    '桌面上的 K 都已经收走了。',
    '四张 K 在这一局里先后都翻了出来。',
    'K 的位置空着，剩下的都是别的点数。',
  ],
  one: [
    '桌上还留着一张 K，单独摆在那里。',
    '剩下的牌里，还有一张 K 没有配对。',
    '一张 K 留在牌面上，旁边是别的点数。',
  ],
  many: [
    '剩下的牌里有几张 K，各自占着一个位置。',
    'K 还留了几张在桌面上，没有被一起收走。',
    '牌面上散着几张 K，位置都不挨着。',
  ],
}

// 牌面速写之二：按点数分布与用时分档，同样只描述事实。
const SPREAD_LINES: Record<string, string[]> = {
  few: [
    '剩下的点数集中在很少的几种里。',
    '牌面上翻来覆去就是那几个数字。',
    '余下的牌点数种类不多，摆得也紧凑。',
  ],
  many: [
    '剩下的牌里，从 A 到 K 差不多都能找到。',
    '点数散得很开，桌面上什么数字都有。',
    '余下的牌点数各不一样，看着热闹。',
  ],
  paired: [
    '有几张同点数的牌并排留在桌上。',
    '同样的数字出现了不止一次，各自占着位置。',
    '牌面上能看到成对出现的相同点数。',
  ],
  slow: [
    '这一局翻得慢，时间在这一副牌上停得久一些。',
    '从摆牌到现在，时间安安静静地过去了一截。',
    '时间走得比牌快，这一局跨过了不少分钟。',
  ],
  quick: [
    '这一局翻得挺快，几分钟就到了收尾。',
    '牌面刚摆开没多久，就已经走到这里。',
    '时间没走多远，一副牌已经翻了大半。',
  ],
}

// 只描述本局统计事实，不据此推断任何事情。
function statPool(kind: string, remaining: number, steps: number): string[] {
  if (kind === 'cleared') {
    return steps <= 26
      ? [
          '整局用了不多的几次配对就收了尾。',
          '消除次数不多，塔就已经空了。',
          `${steps} 次消除走完了一整副牌。`,
        ]
      : [
          '来来回回配对了许多次，最后还是清空了。',
          '消除次数比平常多，牌还是一张张收完了。',
          `一共 ${steps} 次消除，末尾一张也没剩。`,
        ]
  }
  if (remaining <= 5) {
    return ['桌上剩的牌不多，这一局停在了这里。', '只差几张就收完，牌面停成了这个样子。', `${remaining} 张牌留在桌面，${steps} 次消除已经过去。`]
  }
  if (remaining <= 12) {
    return ['还剩一小半牌留在桌面上。', '留在桌面上的牌，比收起来的少一些。', `桌上余 ${remaining} 张，本局消除了 ${steps} 次。`]
  }
  return [
    `本局一共消除了 ${steps} 次，桌面上还留着 ${remaining} 张牌。`,
    `${remaining} 张牌留在原位，${steps} 次消除已经过去。`,
    `牌面还剩 ${remaining} 张，翻牌的次数停在 ${steps}。`,
  ]
}

// 本局节奏：同样只描述过程，不评价、不推断，对通关与没走通都成立。
const PACE_LINES = [
  '翻牌的间隔有长有短，这一局就这么过去了。',
  '有几张牌是立刻配掉的，有几张留到了后面。',
  '牌堆从厚变薄，节奏也跟着慢下来。',
  '中间有几次停顿，之后又接着翻了下去。',
  '这一局的节奏和上一局不太一样。',
  '有些配对挨得很近，有些隔了好几次翻牌。',
  '从摆牌到收尾，中间没有别的插曲。',
  '点数一个接一个被念出来，桌面慢慢变了样子。',
]

const CLOSING = [
  '牌面只是牌面，看完合上就好。',
  '这一小段文字陪你把这几分钟过完。',
  '游戏到这里，换一副牌又能重新翻开。',
  '这段文字没有别的意思，就是一局的记录。',
  '收起牌，桌面又会回到原来的样子。',
  '这一页看过之后，桌面还是那副牌。',
  '这一局的字写完了，下一局还是 52 张。',
  '窗外没变，桌上多了一段短短的记录。',
  '翻篇之后，剩下的只是刚才那几分钟。',
  '就到这里，牌和文字都停在这一页。',
]

// 「这局不算，重摆一局」弹窗里附带的那一句，同样为中性陈述。
export const REPLAY_LINES = [
  '牌没收完也没关系，本来就是消磨时间的小游戏。',
  '这一副没走通，桌面上还留着几张牌。',
  '剩下的几张先放在那里，一局牌到这里告一段落。',
  '牌面只是牌面，收起来又是新的一副。',
]

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]
}

// FNV 风格的整数散列：让每一句用各自独立的 seed，互不联动。
function hash(parts: number[]): number {
  let h = 2166136261
  for (const p of parts) {
    h ^= p | 0
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export function replayLine(remaining: number, steps: number): string {
  return pick(REPLAY_LINES, remaining * 3 + steps * 7)
}

// 素材规模统计（供验证与自查使用，不参与生成）。
export const MATERIAL_TOTAL =
  OPENING.cleared.length + OPENING.stuck.length +
  Object.values(TOPIC_LINES).reduce((n, a) => n + a.length, 0) +
  Object.values(K_LINES).reduce((n, a) => n + a.length, 0) +
  Object.values(SPREAD_LINES).reduce((n, a) => n + a.length, 0) +
  PACE_LINES.length + CLOSING.length

export interface ReadingInput {
  topicKey: string
  kind: 'cleared' | 'stuck'
  remaining: number
  steps: number
  /** 本局结束时仍未消除的牌的点数，用于「牌面速写」。 */
  remainingValues: number[]
  /** 本局用时（秒），只作为选句的确定性输入。 */
  elapsed: number
}

export interface Reading {
  lines: string[]
  text: string
}

// 确定性组合：相同输入永远得到同一段文字；牌面信息与用时参与 seed，
// 所以两局即使话题与结果相同，只要剩牌/用时不同，文案也会不同。
export function buildReading(input: ReadingInput): Reading {
  const topicIndex = Math.max(0, TOPICS.findIndex((t) => t.key === input.topicKey))
  const values = input.remainingValues.length ? input.remainingValues : [input.remaining]
  const kLeft = values.filter((v) => v === 13).length
  const distinct = new Set(values).size
  const hasPair = distinct < values.length

  const kPool = kLeft === 0 ? K_LINES.none : kLeft === 1 ? K_LINES.one : K_LINES.many
  let spreadKey = 'paired'
  if (distinct <= 4) spreadKey = 'few'
  else if (distinct >= 9) spreadKey = 'many'
  else if (input.elapsed >= 90) spreadKey = 'slow'
  else if (input.elapsed < 30) spreadKey = 'quick'
  const spreadPool = SPREAD_LINES[spreadKey]

  const base = input.steps * 131 + input.remaining * 17 + topicIndex * 29 +
    input.elapsed * 7 + distinct * 11 + kLeft * 23 + (hasPair ? 97 : 0)
  const s = (n: number) => hash([base, n])

  const lines = [
    pick(OPENING[input.kind] ?? OPENING.stuck, s(1)),
    pick(TOPIC_LINES[input.topicKey] ?? TOPIC_LINES.casual, s(2)),
    pick(kPool, s(3)),
    pick(spreadPool, s(4)),
    pick(statPool(input.kind, input.remaining, input.steps), s(5)),
    pick(PACE_LINES, s(7)),
    pick(CLOSING, s(6)),
  ]
  return { lines, text: lines.join('') + DISCLAIMER }
}

const UNSAFE_WORDS = [
  '赌博', '博彩', '彩票号码', '自杀', '自残', '毒品', '诈骗', '色情',
  '裸照', '枪支', '炸药', '代孕', '刷单', '洗钱',
]

export interface QuestionCheck {
  ok: boolean
  text: string
  message: string
}

// 前端输入校验：长度限制 + 明显有害内容过滤（纯前端，无后端、无存储）。
export function checkQuestion(raw: string): QuestionCheck {
  const text = raw.trim()
  if (Array.from(text).length > 200) {
    return { ok: false, text: '', message: '写得太长了，简短一点就好（200 字以内）。' }
  }
  const lower = text.toLowerCase()
  if (UNSAFE_WORDS.some((w) => lower.includes(w))) {
    return {
      ok: false, text: '',
      message: '这个话题不适合在这里展开，我们换个轻松的吧。' + DISCLAIMER,
    }
  }
  return { ok: true, text, message: '' }
}
