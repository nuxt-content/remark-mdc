import { factorySpace } from 'micromark-factory-space'
import { factoryWhitespace } from 'micromark-factory-whitespace'

import {
  markdownLineEnding,
  markdownLineEndingOrSpace,
  asciiAlpha,
  asciiAlphanumeric,
  markdownSpace,
} from 'micromark-util-character'
import type { Effects, State, TokenTypeMap } from './types'
import { Codes } from './constants'

export default function createAttributes(
  effects: Effects,
  ok: State,
  nok: State,
  attributesType: keyof TokenTypeMap,
  attributesMarkerType: keyof TokenTypeMap,
  attributeType: keyof TokenTypeMap,
  attributeIdType: keyof TokenTypeMap,
  attributeClassType: keyof TokenTypeMap,
  attributeNameType: keyof TokenTypeMap,
  attributeInitializerType: keyof TokenTypeMap,
  attributeValueLiteralType: keyof TokenTypeMap,
  attributeValueType: keyof TokenTypeMap,
  attributeValueMarker: keyof TokenTypeMap,
  attributeValueData: keyof TokenTypeMap,
  disallowEol?: boolean,
) {
  let type: keyof TokenTypeMap
  let marker: number | undefined
  let isBindAttribute: boolean = false

  return start

  function start(code: number) {
    // Always a `{`
    effects.enter(attributesType)
    effects.enter(attributesMarkerType)
    effects.consume(code)
    effects.exit(attributesMarkerType)
    return between
  }

  function between(code: number): State | undefined {
    if (code === Codes.hash) {
      type = attributeIdType
      return shortcutStart(code) as State
    }

    if (code === Codes.dot) {
      type = attributeClassType
      return shortcutStart(code) as State
    }

    if (code === Codes.colon || code === Codes.underscore || asciiAlpha(code)) {
      effects.enter(attributeType)
      effects.enter(attributeNameType)
      effects.consume(code)
      isBindAttribute = code === Codes.colon
      return (code === Codes.colon ? bindAttributeName : name) as State
    }

    if (disallowEol && markdownSpace(code)) {
      return factorySpace(effects, between as State, 'whitespace')(code)
    }

    if (!disallowEol && markdownLineEndingOrSpace(code)) {
      return factoryWhitespace(effects, between as State)(code)
    }

    return end(code)
  }

  function shortcutStart(code: number) {
    effects.enter(attributeType)
    effects.enter(type)
    effects.enter(type + 'Marker' as keyof TokenTypeMap)
    effects.consume(code)
    effects.exit(type + 'Marker' as keyof TokenTypeMap)
    return shortcutStartAfter
  }

  function shortcutStartAfter(code: number) {
    if (
      code === Codes.EOF
      || code === Codes.quotationMark
      || code === Codes.hash
      || code === Codes.apostrophe
      || code === Codes.dot
      || code === Codes.LessThan
      || code === Codes.equals
      || code === Codes.greaterThan
      || code === Codes.backTick
      || code === Codes.closingCurlyBracket
      || markdownLineEndingOrSpace(code)
    ) {
      return nok(code)
    }

    effects.enter(type + 'Value' as keyof TokenTypeMap)
    effects.consume(code)
    return shortcut
  }

  function shortcut(code: number) {
    if (
      code === Codes.EOF
      || code === Codes.quotationMark
      || code === Codes.apostrophe
      || code === Codes.LessThan
      || code === Codes.equals
      || code === Codes.greaterThan
      || code === Codes.backTick
    ) {
      return nok(code)
    }

    if (code === Codes.dot || code === Codes.closingCurlyBracket || markdownLineEndingOrSpace(code)) {
      effects.exit(type + 'Value' as keyof TokenTypeMap)
      effects.exit(type)
      effects.exit(attributeType)
      return between(code)
    }

    effects.consume(code)
    return shortcut
  }

  /*
    Vue bind shorthand `:`
  */

  function bindAttributeName(code: number) {
    if (code === Codes.dash || asciiAlphanumeric(code)) {
      effects.consume(code)
      return bindAttributeName
    }

    effects.exit(attributeNameType)

    if (disallowEol && markdownSpace(code)) {
      return factorySpace(effects, bindAttributeNameAfter as State, 'whitespace')(code)
    }

    if (!disallowEol && markdownLineEndingOrSpace(code)) {
      return factoryWhitespace(effects, bindAttributeNameAfter as State)(code)
    }

    return bindAttributeNameAfter(code)
  }

  function bindAttributeNameAfter(code: number) {
    if (code === Codes.equals) {
      effects.enter(attributeInitializerType)
      effects.consume(code)
      effects.exit(attributeInitializerType)
      return valueBefore
    }

    // Attribute w/o value.
    effects.exit(attributeType)
    return nok(code)
  }

  function name(code: number) {
    if (
      code === Codes.dash
      || code === Codes.dot
      || code === Codes.colon
      || code === Codes.underscore
      || asciiAlphanumeric(code)
    ) {
      effects.consume(code)
      return name
    }

    effects.exit(attributeNameType)

    if (disallowEol && markdownSpace(code)) {
      return factorySpace(effects, nameAfter as State, 'whitespace')(code)
    }

    if (!disallowEol && markdownLineEndingOrSpace(code)) {
      return factoryWhitespace(effects, nameAfter as State)(code)
    }

    return nameAfter(code)
  }

  function nameAfter(code: number) {
    if (code === Codes.equals) {
      effects.enter(attributeInitializerType)
      effects.consume(code)
      effects.exit(attributeInitializerType)
      return valueBefore
    }

    // Attribute w/o value.
    effects.exit(attributeType)
    return between(code)
  }

  function valueBefore(code: number): State | undefined {
    if (
      code === Codes.EOF
      || code === Codes.LessThan
      || code === Codes.equals
      || code === Codes.greaterThan
      || code === Codes.backTick
      || code === Codes.closingCurlyBracket
      || (disallowEol && markdownLineEnding(code))
    ) {
      return nok(code)
    }

    if (code === Codes.quotationMark || code === Codes.apostrophe) {
      effects.enter(attributeValueLiteralType)
      effects.enter(attributeValueMarker)
      effects.consume(code)
      effects.exit(attributeValueMarker)
      marker = code
      return valueQuotedStart as State
    }

    if (disallowEol && markdownSpace(code)) {
      return factorySpace(effects, valueBefore as State, 'whitespace')(code)
    }

    if (!disallowEol && markdownLineEndingOrSpace(code)) {
      return factoryWhitespace(effects, valueBefore as State)(code)
    }

    effects.enter(attributeValueType)
    effects.enter(attributeValueData)
    effects.consume(code)
    marker = undefined
    return valueUnquoted as State
  }

  function valueUnquoted(code: number) {
    if (
      code === Codes.EOF
      || code === Codes.quotationMark
      || code === Codes.apostrophe
      || code === Codes.LessThan
      || code === Codes.equals
      || code === Codes.greaterThan
      || code === Codes.backTick
    ) {
      return nok(code)
    }

    if (code === Codes.closingCurlyBracket || markdownLineEndingOrSpace(code)) {
      effects.exit(attributeValueData)
      effects.exit(attributeValueType)
      effects.exit(attributeType)
      return between(code)
    }

    effects.consume(code)
    return valueUnquoted
  }

  function valueQuotedStart(code: number) {
    if (code === marker) {
      effects.enter(attributeValueMarker)
      effects.consume(code)
      effects.exit(attributeValueMarker)
      effects.exit(attributeValueLiteralType)
      effects.exit(attributeType)
      return valueQuotedAfter
    }

    effects.enter(attributeValueType)
    return valueQuotedBetween(code)
  }

  function valueQuotedBetween(code: number): State | undefined {
    if (code === marker) {
      effects.exit(attributeValueType)
      return valueQuotedStart(code) as State
    }

    if (code === Codes.EOF) {
      return nok(code)
    }

    // Note: blank lines can’t exist in content.
    if (markdownLineEnding(code)) {
      return disallowEol ? nok(code) : factoryWhitespace(effects, valueQuotedBetween as State)(code)
    }

    effects.enter(attributeValueData)
    effects.consume(code)
    return valueQuoted as State
  }

  function valueQuoted(code: number) {
    if (isBindAttribute && code === Codes.backSlash) {
      effects.exit(attributeValueData)
      effects.exit(attributeValueType)
      effects.enter('escapeCharacter')
      effects.consume(code)
      effects.exit('escapeCharacter')
      effects.enter(attributeValueType)
      effects.enter(attributeValueData)
      return valueQuotedEscape
    }

    if (code === marker || code === Codes.EOF || markdownLineEnding(code)) {
      effects.exit(attributeValueData)
      return valueQuotedBetween(code)
    }

    effects.consume(code)
    return valueQuoted
  }

  function valueQuotedEscape(code: number) {
    effects.consume(code)

    return valueQuoted
  }

  function valueQuotedAfter(code: number) {
    return code === Codes.closingCurlyBracket || markdownLineEndingOrSpace(code) ? between(code) : end(code)
  }

  function end(code: number) {
    if (code === Codes.closingCurlyBracket) {
      effects.enter(attributesMarkerType)
      effects.consume(code)
      effects.exit(attributesMarkerType)
      effects.exit(attributesType)
      return ok
    }

    return nok(code)
  }
}
