import { Pair, stringify, type Node as YAMLNode } from 'yaml'
import * as flat from 'flat'
import { parseDocument, Document, YAMLMap, YAMLSeq, Scalar, isMap, isSeq, isScalar } from 'yaml'
import type { YamlOptions } from './types'

const FRONTMATTER_DELIMITER_DEFAULT = '---'
const FRONTMATTER_DELIMITER_CODEBLOCK_STYLE = '```yaml [props]'
const LF = '\n'
const CR = '\r'

export function stringifyYAML(data: any, options?: YamlOptions & { prefix?: string, suffix?: string }) {
  if (!data || !Object.keys(data).length) return ''

  if (options?.preserveOrder && data.__order__) {
    const newDoc = new Document()
    newDoc.contents = buildFromOrdered(data.__order__)
    return String(newDoc).trim()
  }

  Reflect.deleteProperty(data, '__order__')

  data = flat.unflatten(data || {}, {})

  return [
    options?.prefix || '',
    stringify(data).trim(),
    options?.suffix || '',
  ].join('\n').trim()
}

export function stringifyFrontMatter(data: any, content = '', options?: YamlOptions) {
  const str = stringifyYAML(data, {
    ...options,
    prefix: FRONTMATTER_DELIMITER_DEFAULT,
    suffix: FRONTMATTER_DELIMITER_DEFAULT,
  })

  return [str, '', content.trim()].join('\n').trim() + '\n'
}

export function stringifyCodeBlockProps(data: any, content = '', options?: YamlOptions) {
  const str = stringifyYAML(data, {
    ...options,
    prefix: FRONTMATTER_DELIMITER_CODEBLOCK_STYLE,
    suffix: '```',
  })

  return [str, content.trim()].join('\n').trim() + '\n'
}

export function parseFrontMatter(content: string, options?: YamlOptions) {
  let data: any = {}
  if (content.startsWith(FRONTMATTER_DELIMITER_DEFAULT)) {
    const idx = content.indexOf(LF + FRONTMATTER_DELIMITER_DEFAULT)
    if (idx !== -1) {
      const hasCarriageReturn = content[idx - 1] === CR
      const frontmatter = content.slice(4, idx - (hasCarriageReturn ? 1 : 0))
      if (frontmatter) {
        const document = parseDocument(frontmatter, options)
        data = document.toJSON()
        if (options?.preserveOrder) {
          data.__order__ = extractOrdered(document.contents as YAMLNode)
        }
        content = content.slice(idx + 4 + (hasCarriageReturn ? 1 : 0))
      }
    }
  }

  return {
    content,
    // unflatten frontmatter data. convert `parent.child` keys into `parent: { child: ... }`
    data: flat.unflatten(data || {}, {}) as Record<string, any>,
  }
}

/**
 * YAML
 */

// Recursive function to extract ordered structure
export function extractOrdered(valueNode: YAMLNode): { type: string, value: any } {
  if (isMap(valueNode)) {
    const map = []
    for (const item of valueNode.items) {
      map.push([(item.key as any).value, extractOrdered(item.value as YAMLNode)])
    }
    return { type: 'map', value: map }
  }

  if (isSeq(valueNode)) {
    return { type: 'seq', value: valueNode.items.map(item => extractOrdered(item as YAMLNode)) }
  }

  if (isScalar(valueNode)) {
    return { type: 'scalar', value: valueNode.value }
  }

  return { type: 'scalar', value: null } // fallback
}

// Recursive function to rebuild Document content
function buildFromOrdered(orderedNode: { type: string, value: any }): YAMLNode {
  if (orderedNode.type === 'map') {
    const map = new YAMLMap()
    for (const [key, value] of orderedNode.value) {
      map.items.push(new Pair(new Scalar(key), buildFromOrdered(value)))
    }
    return map
  }

  if (orderedNode.type === 'seq') {
    const seq = new YAMLSeq()
    for (const item of orderedNode.value) {
      seq.items.push(buildFromOrdered(item))
    }
    return seq
  }

  return new Scalar(orderedNode.value)
}
