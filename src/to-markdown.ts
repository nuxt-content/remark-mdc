/**
 * Based on: https://github.com/syntax-tree/mdast-util-directive
 * Version: 2.1.0
 * License: MIT (https://github.com/syntax-tree/mdast-util-directive/blob/main/license)
 */
import { stringifyEntitiesLight } from 'stringify-entities'
import type { Parents, PhrasingContent, RootContent } from 'mdast'
import { type State, type Info, type Unsafe, defaultHandlers } from 'mdast-util-to-markdown'
import { containerFlow, containerPhrasing, checkQuote, inlineContainerFlow } from './mdast-util-to-markdown'
import { stringifyFrontMatter, stringifyCodeBlockProps } from './frontmatter'
import type { RemarkMDCOptions } from './types'
import { CONTAINER_NODE_TYPES, convertHtmlEntitiesToChars, NON_UNWRAPPABLE_TYPES } from './utils'
import type { Container } from './micromark-extension/types'

type NodeContainerComponent = Parents & { name: string, fmAttributes?: Record<string, any> }

const shortcut = /^[^\t\n\r "'.<=>`}]+$/
const baseFence = 2

// import { defaultHandlers } from 'mdast-util-to-markdown/lib/util/compile-pattern'
function compilePattern(pattern: Unsafe) {
  if (!pattern._compiled) {
    const before = (pattern.atBreak ? '[\\r\\n][\\t ]*' : '') + (pattern.before ? '(?:' + pattern.before + ')' : '')

    pattern._compiled = new RegExp(
      (before ? '(' + before + ')' : '')
      + (/[|\\{}()[\]^$+*?.-]/.test(pattern.character) ? '\\' : '')
      + pattern.character
      + (pattern.after ? '(?:' + pattern.after + ')' : ''),
      'g',
    )
  }

  return pattern._compiled
}

type NodeComponentContainerSection = Parents & { name: string }

export default (opts: RemarkMDCOptions = {}) => {
  const applyAutomaticUnwrap = (node: Container, _options: Exclude<RemarkMDCOptions['autoUnwrap'], boolean | undefined>) => {
    if (!CONTAINER_NODE_TYPES.has(node.type)) {
      // unwrap only applicable for container components
      return
    }

    const isSafe = (type: string) => ['paragraph'].includes(type) || NON_UNWRAPPABLE_TYPES.has(type)
    const safeChildrens = node.children.filter(child => !isSafe(child.type))
    if (safeChildrens.length === 0) {
      return
    }

    node.children = [
      {
        type: 'paragraph',
        children: safeChildrens as PhrasingContent[],
      },
      ...node.children.filter(child => isSafe(child.type)),
    ]
  }

  const frontmatter = (node: NodeContainerComponent) => {
    const entries = Object.entries(node.fmAttributes || {})

    if (entries.length === 0) {
      return ''
    }

    const attrs = entries
      .sort(([key1], [key2]) => key1.localeCompare(key2))
      .reduce((acc, [key, value2]) => {
        // Parse only JSON objects. `{":key:": "value"}` can be used for binding data to frontmatter.
        if (key?.startsWith(':') && isValidJSON(value2)) {
          try {
            value2 = JSON.parse(value2)
          }
          catch {
            // ignore
          }
          key = key.slice(1)
        }
        acc[key] = value2
        return acc
      }, {} as Record<string, any>)

    return '\n' + (
      opts?.attributes?.yamlCodeBlock
        ? stringifyCodeBlockProps(attrs).trim()
        : stringifyFrontMatter(attrs).trim()
    )
  }

  const processNode = (node: Container) => {
    if (opts.autoUnwrap) {
      applyAutomaticUnwrap(node, typeof opts.autoUnwrap === 'boolean' ? {} : opts.autoUnwrap)
    }
  }

  function componentContainerSection(node: NodeComponentContainerSection, _: any, context: any) {
    context.indexStack = context.stack

    processNode(node as any)

    return `#${(node as any).name}${attributes(node, context)}\n${content(node, context)}`.trim()
  }

  type NodeTextComponent = Parents & { name: string, rawData: string, attributes: any }
  function textComponent(node: NodeTextComponent, _: any, context: any) {
    let value
    context.indexStack = context.stack

    const exit = context.enter(node.type)

    if (node.name === 'span') {
      // Handle span suger syntax
      value = `[${content(node, context)}]${attributes(node, context)}`
    }
    else if (node.name === 'binding') {
      // Handle binding syntax
      const attrs = node.attributes || {}
      value = attrs.defaultValue
        ? `{{ ${attrs.value} || '${attrs.defaultValue}' }}`
        : `{{ ${attrs.value} }}`
    }
    else {
      value = ':' + (node.name || '') + label(node, context) + attributes(node, context)
    }

    exit()
    return value
  }

  let nest = 0
  function containerComponent(node: NodeContainerComponent, _: any, context: any) {
    context.indexStack = context.stack
    const prefix = ':'.repeat(baseFence + nest)
    nest += 1
    const exit = context.enter(node.type)
    // Reset bullet marker for lists nested containers
    context.bulletLastUsed = undefined
    let value = prefix + (node.name || '') + label(node, context)

    // Move default slot's children to the beginning of the content
    const defaultSlotChildren = node.children.filter((child: any) => child.type !== 'componentContainerSection')
    const slots = node.children.filter((child: any) => child.type === 'componentContainerSection')

    node.children = [
      ...defaultSlotChildren,
      ...slots,
    ]

    // ensure fmAttributes exists
    node.fmAttributes = node.fmAttributes || {}
    const attributesText = attributes(node, context)
    const attributesEntries = Object.entries((node as any).attributes || {})
    if (
      (value + attributesText).length > (opts?.attributes?.maxLength || 80)
      || Object.keys(node.fmAttributes).length > 0 // remove: allow using both yaml and inline attributes simentensoly
      || attributesEntries.length > 3
      // It is recommended to use yaml for complex attributes
      || attributesEntries.some(([_, value]) => typeof value === 'object')
      || attributesText.match(/(=['"][{[]|\n)/) // ='[]' ='{}' ="{}" ="[]"
      || node.children?.some((child: RootContent) => child.type === 'componentContainerSection') // remove: allow using both yaml and inline attributes simentensoly
    ) {
      // add attributes to frontmatter
      Object.assign(node.fmAttributes, (node as any).attributes)
      // clear attributes
      ;(node as any).attributes = []
    }

    processNode(node as any)

    value += attributes(node, context)
    value += frontmatter(node)

    let subvalue
    if ((node.type as string) === 'containerComponent') {
      subvalue = content(node, context)
      if (subvalue) {
        value += '\n' + subvalue
      }
      value += '\n' + prefix

      if (nest > 1) {
        value = value
          .split('\n')
          .map(line => line.length > 0 ? '  ' + line : line)
          .join('\n')
      }
    }
    nest -= 1
    exit()
    return value
  }

  containerComponent.peek = function peekComponent() {
    return ':'
  }

  function label(node: Parents, context: State) {
    let label: any = node

    if ((node.type as string) === 'containerComponent') {
      if (!inlineComponentLabel(node)) {
        return ''
      }
      label = node.children[0]
    }

    const exit = context.enter('label')
    const subexit = context.enter((node.type as string + 'Label') as any)
    const value = containerPhrasing(label, context, { before: '[', after: ']' })
    subexit()
    exit()
    return value ? '[' + value + ']' : ''
  }

  const isValidJSON = (str: string) => {
    try {
      JSON.parse(str)
      return true
    }
    catch {
      return false
    }
  }

  function attributes(node: any, context: State) {
    const quote = checkQuote(context)
    const subset = (node.type as string) === 'textComponent' ? [quote] : [quote, '\n', '\r']
    const attributes = (node as any).attributes || {}

    const attrs = (opts.attributes?.preserveOrder && attributes.__order__)
      ? attributes.__order__?.value
      : Object.entries(attributes)
          .sort(([key1], [key2]) => key1.localeCompare(key2))

    const values = []
    let id
    let classesFull: string | string[] = ''
    let classes: string | string[] = ''
    let index

    for (const attr of attrs) {
      const key = attr[0]
      let value = attr[1]
      if (attr[1] != null) {
        value = String(attr[1])

        if (key === 'id') {
          id = shortcut.test(value) ? '#' + value : quoted('id', value)
        }
        else if (key === 'class' || key === 'className') {
          value = Array.isArray(attrs[key]) ? (attrs[key] as string[]).join(' ') : value
          value = value.split(/[\t\n\r ]+/g).filter(Boolean)
          classesFull = []
          classes = []
          index = -1

          while (++index < value.length) {
            (shortcut.test(value[index]) ? classes : classesFull).push(value[index])
          }

          classesFull = classesFull.length ? quoted('class', classesFull.join(' ')) : ''
          classes = classes.length ? '.' + classes.join('.') : ''
        }
        else if (key.startsWith(':') && value === 'true') {
          values.push(key.slice(1))
        }
        else if (key.startsWith(':') && isValidJSON(value)) {
          values.push(`${key}='${value.replace(/([^/])'/g, '$1\\\'')}'`)
        }
        else if (typeof attr[1] === 'object') {
          values.push(quoted(key, JSON.stringify(value)))
        }
        else {
          values.push(quoted(key, value))
        }
      }
    }

    if (classesFull) {
      values.unshift(classesFull)
    }

    if (classes) {
      values.unshift(classes)
    }

    if (id) {
      values.unshift(id)
    }

    return values.length ? '{' + values.join(' ') + '}' : ''

    function quoted(key: string, value: string) {
      return key + '=' + quote + stringifyEntitiesLight(value, { subset }) + quote
    }
  }

  function content(node: any, context: State) {
    const content = inlineComponentLabel(node) ? Object.assign({}, node, { children: node.children.slice(1) }) : node
    let result = node.type === 'textComponent' ? inlineContainerFlow(content, context) : containerFlow(content, context)

    if (result.includes('&#x')) {
      result = convertHtmlEntitiesToChars(result)
    }

    return result
  }

  function inlineComponentLabel(node: any) {
    return node.children && node.children[0] && node.children[0].data && node.children[0].data.componentLabel
  }

  return {
    compilePattern,
    unsafe: [
      {
        character: '\r',
        inConstruct: ['leafComponentLabel', 'containerComponentLabel'],
      },
      {
        character: '\n',
        inConstruct: ['leafComponentLabel', 'containerComponentLabel'],
      },
      {
        before: '[^:]',
        character: ':',
        after: '[A-Za-z]',
        inConstruct: ['phrasing'],
      },
      { atBreak: true, character: ':', after: ':' },
    ],
    handlers: {
      containerComponent,
      textComponent,
      componentContainerSection,
      image: (node: Parents, _: any, state: State, info: Info) => {
        return defaultHandlers.image(node as any, _, state, info) + attributes(node, state)
      },
      link: (node: Parents, _: any, state: State, info: Info) => {
        return defaultHandlers.link(node as any, _, state, info) + attributes(node, state)
      },
      linkReference: (node: Parents, _: any, state: State, info: Info) => {
        return defaultHandlers.linkReference(node as any, _, state, info) + attributes(node, state)
      },
      strong: (node: Parents, _: any, state: State, info: Info) => {
        return defaultHandlers.strong(node as any, _, state, info) + attributes(node, state)
      },
      inlineCode: (node: Parents, _: any, state: State) => {
        // Temporary fix for handling old version of mdast-util-to-markdown
        state.compilePattern = state.compilePattern || compilePattern
        return defaultHandlers.inlineCode(node as any, _, state) + attributes(node, state)
      },
      emphasis: (node: Parents, _: any, state: State, info: Info) => {
        return defaultHandlers.emphasis(node as any, _, state, info) + attributes(node, state)
      },
    },
  }
}
