import { markdownLineEnding } from 'micromark-util-character'
import type { Effects, State, Code, TokenizeContext } from './types'
import { Codes } from './constants'
import createAttributes from './factory-attributes'

const attributes: any = { tokenize: tokenizeAttributes, partial: true }
const blockAttributes: any = { tokenize: tokenizeBlockAttributes, partial: true }

const validEvents = [
  /**
   * Span
   */
  'textSpan',
  /**
   * Bold & Italic
   */
  'attentionSequence',
  /**
   * Inline Code
   */
  'codeText',
  /**
   * Link
   */
  'link',
  /**
   * Image
   */
  'image',
]

function tokenize(this: TokenizeContext, effects: Effects, ok: State, nok: State) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const self = this

  return start

  function start(code: Code): undefined | State {
    if (code !== Codes.openingCurlyBracket) {
      throw new Error('expected `{`')
    }

    /**
     * Make sure syntax is used after valid tags
     */
    const event = self.events[self.events.length - 1]
    if (markdownLineEnding(self.previous) || !event) {
      return nok(code)
    }

    if (validEvents.includes(event[1].type)) {
      return effects.attempt(attributes, ok, nok)(code)
    }

    /**
     * Trailing block attributes: `{attr}` following plain text at the end of a
     * block (paragraph, heading, list item, blockquote paragraph). Only accept
     * when the attributes are the last thing on the line so that `{...}` in the
     * middle of some text stays literal.
     */
    if (event[1].type === 'data') {
      return effects.attempt(blockAttributes, ok, nok)(code)
    }

    return nok(code)
  }
}

function tokenizeBlockAttributes(this: TokenizeContext, effects: Effects, ok: State, nok: State) {
  // Always a `{`. Reuse the regular attributes factory, but only succeed when
  // the closing `}` is immediately followed by the end of the line (or input).
  return tokenizeAttributes(effects, afterAttributes, nok)

  function afterAttributes(code: Code): State | undefined {
    if (code === Codes.EOF || markdownLineEnding(code)) {
      return ok(code)
    }
    return nok(code)
  }
}

function tokenizeAttributes(effects: Effects, ok: State, nok: State) {
  // Always a `{`
  return createAttributes(
    effects,
    ok,
    nok,
    'componentTextAttributes',
    'componentTextAttributesMarker',
    'componentTextAttribute',
    'componentTextAttributeId',
    'componentTextAttributeClass',
    'componentTextAttributeName',
    'componentTextAttributeInitializerMarker',
    'componentTextAttributeValueLiteral',
    'componentTextAttributeValue',
    'componentTextAttributeValueMarker',
    'componentTextAttributeValueData',
  )
}

export default {
  tokenize,
}
