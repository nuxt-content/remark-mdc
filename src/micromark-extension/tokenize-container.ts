import { factorySpace } from 'micromark-factory-space'
import { markdownLineEnding, asciiAlpha, markdownSpace } from 'micromark-util-character'
import type { Effects, State, Code, TokenizeContext } from './types'
import { linePrefixSize, tokenizeCodeFence, useTokenState } from './utils'
import { Codes, ContainerSequenceSize, slotSeparatorCode, slotSeparatorLength } from './constants'
import createName from './factory-name'
import createLabel from './factory-label'
import createAttributes from './factory-attributes'
import { tokenizeFrontMatter } from './tokenize-frontmatter'

const label: any = { tokenize: tokenizeLabel, partial: true }
const attributes: any = { tokenize: tokenizeAttributes, partial: true }

function tokenize(this: TokenizeContext, effects: Effects, ok: State, nok: State) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const self = this
  const initialPrefix = linePrefixSize(this.events)
  let sizeOpen = 0
  let previous: any
  const childContainersSequenceSize: number[] = []
  let containerFirstLine = true

  /**
   * After each empty line inside a container, we need to check for an indented component.
   */
  let possibleIndentedComponent = false
  /**
   * The size of the indent of the container. Related to the `possibleIndentedComponent`
   */
  let containerIndentSize = 0

  /**
   * Show whether the current line is in the code fence or not.
   * Lines inside the code fence will not check for the slot separator and component end.
   */
  let visitingCodeFenced = false

  const section = useTokenState('componentContainerSection')

  /**
   * data tokenizer
   */
  return start

  function start(code: Code): State | undefined {
    /* istanbul ignore if - handled by mm */
    if (code !== Codes.colon) {
      throw new Error('expected `:`')
    }
    effects.enter('componentContainer')
    effects.enter('componentContainerFence')
    effects.enter('componentContainerSequence')
    return sequenceOpen(code)
  }

  function tokenizeSectionClosing(effects: Effects, ok: State, nok: State) {
    let size = 0
    let sectionIndentSize = 0
    let revertSectionState: () => void
    return closingPrefixAfter

    function closingPrefixAfter(code: Code): State | undefined {
      sectionIndentSize = linePrefixSize(self.events)

      // Close section
      revertSectionState = section.exit(effects)

      effects.enter('componentContainerSectionSequence')
      return closingSectionSequence(code)
    }

    function closingSectionSequence(code: Code): State | undefined {
      if (code === slotSeparatorCode) {
        effects.consume(code)
        size++
        return closingSectionSequence
      }

      if (size !== slotSeparatorLength) {
        // Revert section state to initial value before failing
        revertSectionState()
        return nok(code)
      }
      if (sectionIndentSize !== initialPrefix) {
        // Revert sect to initial value before failing
        revertSectionState()
        return nok(code)
      }

      // non ascii chars are invalid
      if (!asciiAlpha(code)) {
        // Revert sect to initial value before failing
        revertSectionState()
        return nok(code)
      }

      effects.exit('componentContainerSectionSequence')
      return factorySpace(effects, ok, 'whitespace')(code)
    }
  }

  function sectionOpen(code: Code): undefined | State {
    // Open new Section
    section.enter(effects)

    if (markdownLineEnding(code)) {
      return factorySpace(effects, lineStart, 'whitespace')(code)
    }

    effects.enter('componentContainerSectionTitle')
    return sectionTitle(code)
  }

  function sectionTitle(code: Code): State | undefined {
    // parse attributes
    if (code === Codes.openingCurlyBracket) {
      return effects.check(
        attributes,
        (code) => {
          effects.exit('componentContainerSectionTitle')
          return effects.attempt(attributes, factorySpace(effects, lineStart, 'linePrefix', 4), nok)(code)
        },
        (code) => {
          effects.consume(code)
          return sectionTitle
        },
      )(code)
    }

    if (markdownLineEnding(code)) {
      effects.exit('componentContainerSectionTitle')
      return factorySpace(effects, lineStart, 'linePrefix', 4)(code)
    }

    effects.consume(code)
    return sectionTitle
  }

  function sequenceOpen(code: Code): State | undefined {
    if (code === Codes.colon) {
      effects.consume(code)
      sizeOpen++
      return sequenceOpen
    }

    if (sizeOpen < ContainerSequenceSize) {
      return nok(code)
    }

    effects.exit('componentContainerSequence')
    return createName.call(self, effects, afterName, nok, 'componentContainerName')(code)
  }

  function afterName(code: Code): State | undefined {
    return code === Codes.openingSquareBracket
      ? effects.attempt(label, afterLabel, afterLabel)(code)
      : afterLabel(code)
  }

  function afterLabel(code: Code): State | undefined {
    return code === Codes.openingCurlyBracket
      ? effects.attempt(attributes, afterAttributes, afterAttributes)(code)
      : afterAttributes(code)
  }

  function afterAttributes(code: Code): State | undefined {
    return factorySpace(effects, openAfter, 'whitespace')(code)
  }

  function openAfter(code: Code): State | undefined {
    effects.exit('componentContainerFence')

    if (code === null) {
      effects.exit('componentContainer')
      return ok(code)
    }

    if (markdownLineEnding(code)) {
      effects.enter('lineEnding')
      effects.consume(code)
      effects.exit('lineEnding')

      return self.interrupt ? ok : contentStart
    }

    return nok(code)
  }

  function contentStart(code: Code): State | undefined {
    if (code === null) {
      effects.exit('componentContainer')
      return ok(code)
    }
    if (containerFirstLine && (code === Codes.dash || markdownSpace(code))) {
      containerFirstLine = false
      return tokenizeFrontMatter(effects, ok, nok, contentStart, initialPrefix)(code)
    }

    effects.enter('componentContainerContent')
    return lineStart(code)
  }

  function lineStartAfterPrefix(code: Code): State | undefined {
    if (code === null) {
      return after(code)
    }

    // Check for code fence
    if (code === Codes.backTick) {
      return effects.check(
        tokenizeCodeFence,
        (code) => {
          visitingCodeFenced = !visitingCodeFenced
          return chunkStart(code)
        },
        chunkStart,
      )(code)
    }

    if (visitingCodeFenced) {
      return chunkStart(code)
    }

    // detect slots
    if (!childContainersSequenceSize.length && (code === slotSeparatorCode || code === Codes.space)) {
      return effects.attempt(
        { tokenize: tokenizeSectionClosing, partial: true },
        sectionOpen,
        chunkStart,
      )(code)
    }

    /**
     * disable splitting inner sections
     */
    if (code === Codes.colon) {
      return effects.attempt(
        { tokenize: tokenizeClosingFence, partial: true },
        after,
        chunkStart,
      )(code)
    }

    return chunkStart(code)
  }

  function dentendIndentedCommponent(code: Code): State | undefined {
    if (containerIndentSize) {
      return factorySpace(effects, lineStartAfterPrefix, 'linePrefix', containerIndentSize + 1)(code)
    }
    return lineStartAfterPrefix(code)
  }

  function attemptIntentedCommponent(code: Code): State | undefined {
    if (containerIndentSize) {
      return factorySpace(effects, lineStartAfterPrefix, 'linePrefix', containerIndentSize + 1)(code)
    }

    return effects.check({ tokenize: tokenizeContainerIndent, partial: true }, 
      dentendIndentedCommponent,
      lineStartAfterPrefix,
    )(code)
  }

  function lineStart(code: Code): State | undefined {
    if (code === null) {
      return after(code)
    }

    let nextState = dentendIndentedCommponent

    // Check for an indented component if previous line was an empty line.
    if (possibleIndentedComponent) {
      nextState = attemptIntentedCommponent
    }

    // After each empty line inside a container, we need to check for an indented component.
    possibleIndentedComponent = markdownLineEnding(code)


    return initialPrefix > 0
      ? factorySpace(effects, nextState, 'linePrefix', initialPrefix + 1)(code)
      : nextState(code)
  }

  function chunkStart(code: Code): State | undefined {
    if (code === null) {
      return after(code)
    }

    // Open new Section
    section.enterOnce(effects)

    const token = effects.enter('chunkDocument', {
      contentType: 'document',
      previous,
    })
    if (previous) {
      previous.next = token
    }
    previous = token
    return contentContinue(code)
  }

  function contentContinue(code: Code): State | undefined {
    if (code === null) {
      effects.exit('chunkDocument')
      return after(code)
    }

    if (markdownLineEnding(code)) {
      effects.consume(code)
      effects.exit('chunkDocument')
      return lineStart
    }

    effects.consume(code)
    return contentContinue
  }

  function after(code: Code): State | undefined {
    // Close section
    section.exit(effects)
    effects.exit('componentContainerContent')
    effects.exit('componentContainer')
    return ok(code)
  }

  function tokenizeClosingFence(effects: Effects, ok: State, nok: State) {
    let size = 0

    return factorySpace(effects, closingPrefixAfter, 'linePrefix', 4)

    function closingPrefixAfter(code: Code): State | undefined {
      effects.enter('componentContainerFence')
      effects.enter('componentContainerSequence')
      return closingSequence(code)
    }

    function closingSequence(code: Code): State | undefined {
      if (code === Codes.colon) {
        effects.consume(code)
        size++
        return closingSequence
      }
      if (childContainersSequenceSize.length) {
        if (size === childContainersSequenceSize[childContainersSequenceSize.length - 1]) {
          childContainersSequenceSize.pop()
        }
        return nok(code)
      }

      // it is important to match sequence
      if (size !== sizeOpen) {
        return nok(code)
      }
      effects.exit('componentContainerSequence')
      return factorySpace(effects, closingSequenceEnd, 'whitespace')(code)
    }

    function closingSequenceEnd(code: Code): State | undefined {
      if (code === null || markdownLineEnding(code)) {
        effects.exit('componentContainerFence')
        return ok(code)
      }
      childContainersSequenceSize.push(size)
      return nok(code)
    }
  }

  /**
   * @example
   * 
   * ```markdown
   * ::container
   * - This is a list item.
   *
   *   ::indented-container
   *   - This is a list item.
   *   :::
   * ::
   * ```

   */
  function tokenizeContainerIndent(effects: Effects, ok: State, nok: State) {
    let size = 0
    function start (code: Code): State | undefined {
      if (code !== Codes.space) {
        return nok(code)
      }
      return factory(code)
    }

    function factory(code: Code): State | undefined {
      effects.enter('linePrefix')
      if (code === Codes.space) {
        effects.consume(code)
        size += 1
        return factory
      }
      return containerCheck(code)
    }
    return start

    function containerCheck(code: Code): State | undefined {
      if (code === Codes.colon && size > 0) {
        containerIndentSize = size
        return ok(code)
      }
      if (markdownLineEnding(code)) {
        possibleIndentedComponent = false
        containerIndentSize = 0
        return ok(code)
      }
      return nok(code)
    }
  }
}

function tokenizeLabel(effects: Effects, ok: State, nok: State) {
  // Always a `[`
  return createLabel(
    effects,
    ok,
    nok,
    'componentContainerLabel',
    'componentContainerLabelMarker',
    'componentContainerLabelString',
    true,
  )
}

function tokenizeAttributes(effects: Effects, ok: State, nok: State) {
  // Always a `{`
  return createAttributes(
    effects,
    ok,
    nok,
    'componentContainerAttributes',
    'componentContainerAttributesMarker',
    'componentContainerAttribute',
    'componentContainerAttributeId',
    'componentContainerAttributeClass',
    'componentContainerAttributeName',
    'componentContainerAttributeInitializerMarker',
    'componentContainerAttributeValueLiteral',
    'componentContainerAttributeValue',
    'componentContainerAttributeValueMarker',
    'componentContainerAttributeValueData',
    true,
  )
}

export default {
  tokenize,
  concrete: true,
}
