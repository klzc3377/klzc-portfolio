const TOKEN_PATTERN = /[\u3000-\u303f\u3400-\u9fff\uff00-\uffef]|[^\s\u3000-\u303f\u3400-\u9fff\uff00-\uffef]+|\s+/g

/** CJK glyphs animate one by one; Latin text animates word by word. */
export function tokenize(text: string) {
  return text.match(TOKEN_PATTERN) ?? [text]
}

export const isSpace = (token: string) => /^\s+$/.test(token)
