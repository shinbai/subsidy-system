// Claude API用のシステムプロンプトと生成プロンプト

export const SYSTEM_PROMPT = `あなたは中小企業の補助金・助成金申請書の専門家です。
社交ダンス教室「DANCE GRAND Harajuku（ダンスグランド原宿）」の
申請書作成を支援しています。

【事業者の強み（必ず盛り込むこと）】
- 日本最大の会員数（150名以上）を持つ社交ダンス教室
- 90%以上の驚異的な継続率・リテンション率
- テレビ朝日「羽鳥慎一モーニングショー」出演実績（2025年11月）
- 初心者専門・マンツーマンレッスンという差別化されたビジネスモデル
- フレイル（虚弱）予防の専門家としての地位確立
- LTV約86万円、CPA約1万円以下という卓越した顧客獲得効率

【文章生成のルール】
- 審査員が読みやすいよう、具体的な数字と事実を必ず含める
- 補助金の目的・趣旨に沿った表現を使う
- 採択されやすい「課題→解決策→期待効果」の構成を意識する
- 誇張や虚偽は避け、事実に基づいた表現にする
- 各セクションは指定文字数の90〜100%を目標に記述する
- 行政文書として適切な丁寧語・敬体を使用する`

/**
 * セクションごとの生成プロンプトを構築
 */
export function buildSectionPrompt(params: {
  sectionTitle: string
  sectionHint: string
  maxChars: number
  subsidyName: string
  orgName: string
  orgIndustry: string
  orgRepresentative: string
  orgEmployees: number
  orgCapital: number
  locationName: string
  locationAddress: string
  userInputs: Record<string, string>
}): string {
  const {
    sectionTitle, sectionHint, maxChars,
    subsidyName, orgName, orgIndustry, orgRepresentative, orgEmployees, orgCapital,
    locationName, locationAddress, userInputs,
  } = params

  // ユーザー入力を整形
  const inputSummary = Object.entries(userInputs)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => {
      const labels: Record<string, string> = {
        q1_usage: '補助金の使途',
        q2_effect: '期待する効果',
        q3_background: '課題・背景',
        q4_value: '顧客への価値',
        q5_differentiation: '差別化ポイント',
        q6_numbers: '数字で表せる実績',
        q7_other: 'その他強調事項',
      }
      return `- ${labels[k] || k}: ${v}`
    })
    .join('\n')

  return `以下の情報をもとに、申請書の「${sectionTitle}」セクションを作成してください。

【補助金名】${subsidyName}

【事業者情報】
- 法人名: ${orgName}
- 代表者: ${orgRepresentative}
- 業種: ${orgIndustry}
- 従業員数: ${orgEmployees}名
- 資本金: ${(orgCapital / 10000).toLocaleString()}万円
- 拠点: ${locationName}（${locationAddress}）

【ユーザーから提供された情報】
${inputSummary || '（特になし）'}

【セクションの要件】
- セクション: ${sectionTitle}
- ガイド: ${sectionHint}
- 目標文字数: ${maxChars}文字（${Math.round(maxChars * 0.9)}〜${maxChars}文字を目標）

セクション内容のみを出力してください。見出しやラベルは不要です。`
}
