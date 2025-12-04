/**
 * Based on: https://github.com/micromark/micromark-extension-directive
 * Version: 2.1.0
 * License: MIT (https://github.com/micromark/micromark-extension-directive/blob/main/license)
 */

import tokenizeSpan from './tokenize-span'
import tokenizeAttribute from './tokenize-attribute'
import tokenizeBinding from './tokenize-binding'
import tokenizeInline from './tokenize-inline'
import tokenizeContainer from './tokenize-container'
import tokenizeContainerIndented from './tokenize-container-indented'
import { Codes } from './constants'
import tokenizeContainerSuger from './tokenize-container-suger'
import { list } from 'micromark-core-commonmark'
import { htmlFlow } from './html-flow'
import { htmlText } from './html-text'

const continuationList = list.continuation?.tokenize
if (list.continuation && continuationList) {
  list.continuation.tokenize = function (this, effects, ok, nok) {
    if (this.containerState) {
      this.containerState.initialBlankLine = true
    }
    return continuationList.call(this, effects, ok, nok)
  }
}

export default function micromarkComponentsExtension() {
  return {
    text: {
      [Codes.colon]: tokenizeInline,
      [Codes.openingSquareBracket]: [tokenizeSpan],
      [Codes.openingCurlyBracket]: [tokenizeBinding, tokenizeAttribute],
      [Codes.LessThan]: htmlText
    },
    flow: {
      [Codes.colon]: [tokenizeContainer, tokenizeContainerSuger],
      [Codes.LessThan]: htmlFlow
    },
    flowInitial: {
      '-2': tokenizeContainerIndented,
      '-1': tokenizeContainerIndented,
      [Codes.space]: tokenizeContainerIndented,
    },
  }
}
