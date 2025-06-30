import { describe, test, expect } from 'vitest'
import { parseDocument, type Node as YAMLNode } from 'yaml'
import {
  stringifyYAML,
  stringifyFrontMatter,
  stringifyCodeBlockProps,
  parseFrontMatter,
  extractOrdered,
} from '../src/frontmatter'

describe('frontmatter', () => {
  describe('stringifyYAML', () => {
    test('should stringify simple object', () => {
      const data = { title: 'Hello World', author: 'John Doe' }
      const result = stringifyYAML(data)
      expect(result).toBe('title: Hello World\nauthor: John Doe')
    })

    test('should stringify nested object', () => {
      const data = {
        title: 'Hello World',
        meta: {
          author: 'John Doe',
          date: '2023-01-01',
        },
      }
      const result = stringifyYAML(data)
      expect(result).toBe('title: Hello World\nmeta:\n  author: John Doe\n  date: 2023-01-01')
    })

    test('should stringify array', () => {
      const data = {
        tags: ['javascript', 'typescript', 'node'],
        counts: [1, 2, 3],
      }
      const result = stringifyYAML(data)
      expect(result).toBe('tags:\n  - javascript\n  - typescript\n  - node\ncounts:\n  - 1\n  - 2\n  - 3')
    })

    test('should handle empty object', () => {
      const data = {}
      const result = stringifyYAML(data)
      expect(result).toBe('')
    })

    test('should handle null/undefined', () => {
      expect(stringifyYAML(null)).toBe('')
      expect(stringifyYAML(undefined)).toBe('')
    })

    test('should use document toString when document option is true', () => {
      const document = parseDocument('title: Hello World')
      const data = { __order__: extractOrdered(document.contents as YAMLNode) }
      const result = stringifyYAML(data, { preserveOrder: true })
      expect(result).toBe('title: Hello World')
    })

    test('should unflatten flattened keys', () => {
      const data = {
        'parent.child': 'value',
        'parent.another': 'another value',
        'simple': 'simple value',
      }
      const result = stringifyYAML(data)
      expect(result).toBe('parent:\n  child: value\n  another: another value\nsimple: simple value')
    })
  })

  describe('stringifyFrontMatter', () => {
    test('should create frontmatter with content', () => {
      const data = { title: 'Hello World', author: 'John Doe' }
      const content = '# Hello\n\nThis is content.'
      const result = stringifyFrontMatter(data, content)
      expect(result).toBe('---\ntitle: Hello World\nauthor: John Doe\n---\n\n# Hello\n\nThis is content.\n')
    })

    test('should create frontmatter without content', () => {
      const data = { title: 'Hello World', author: 'John Doe' }
      const result = stringifyFrontMatter(data)
      expect(result).toBe('---\ntitle: Hello World\nauthor: John Doe\n---\n')
    })

    test('should return trimmed content when no frontmatter data', () => {
      const data = {}
      const content = '  # Hello\n\nThis is content.  \n\n'
      const result = stringifyFrontMatter(data, content)
      expect(result).toBe('# Hello\n\nThis is content.\n')
    })

    test('should handle empty data and empty content', () => {
      const result = stringifyFrontMatter({}, '')
      expect(result).toBe('\n')
    })

    test('should handle complex nested data', () => {
      const data = {
        title: 'Complex Example',
        meta: {
          author: 'John Doe',
          tags: ['javascript', 'yaml'],
        },
        published: true,
      }
      const content = '# Content'
      const result = stringifyFrontMatter(data, content)
      expect(result).toBe('---\ntitle: Complex Example\nmeta:\n  author: John Doe\n  tags:\n    - javascript\n    - yaml\npublished: true\n---\n\n# Content\n')
    })
  })

  describe('stringifyCodeBlockProps', () => {
    test('should create code block props', () => {
      const data = { title: 'Hello World', author: 'John Doe' }
      const content = 'Some content'
      const result = stringifyCodeBlockProps(data, content)
      expect(result).toBe('```yaml [props]\ntitle: Hello World\nauthor: John Doe\n```\nSome content\n')
    })

    test('should return content string when no data', () => {
      const data = {}
      const content = 'Some content'
      const result = stringifyCodeBlockProps(data, content)
      expect(result).toBe('Some content\n')
    })

    test('should handle empty content', () => {
      const data = { title: 'Hello World' }
      const result = stringifyCodeBlockProps(data, '')
      expect(result).toBe('```yaml [props]\ntitle: Hello World\n```\n')
    })

    test('should handle complex data', () => {
      const data = {
        array: ['item1', 'item2'],
        nested: {
          key: 'value',
        },
      }
      const content = 'Component content'
      const result = stringifyCodeBlockProps(data, content)
      expect(result).toBe('```yaml [props]\narray:\n  - item1\n  - item2\nnested:\n  key: value\n```\nComponent content\n')
    })
  })

  describe('parseFrontMatter', () => {
    test('should parse frontmatter with content', () => {
      const content = '---\ntitle: Hello World\nauthor: John Doe\n---\n\n# Hello\n\nThis is content.'
      const result = parseFrontMatter(content)
      expect(result.data).toEqual({ title: 'Hello World', author: 'John Doe' })
      expect(result.content).toBe('\n\n# Hello\n\nThis is content.')
    })

    test('should parse frontmatter without content', () => {
      const content = '---\ntitle: Hello World\nauthor: John Doe\n---\n'
      const result = parseFrontMatter(content)
      expect(result.data).toEqual({ title: 'Hello World', author: 'John Doe' })
      expect(result.content).toBe('\n')
    })

    test('should handle content without frontmatter', () => {
      const content = '# Hello\n\nThis is just content.'
      const result = parseFrontMatter(content)
      expect(result.data).toEqual({})
      expect(result.content).toBe('# Hello\n\nThis is just content.')
    })

    test('should handle empty content', () => {
      const content = ''
      const result = parseFrontMatter(content)
      expect(result.data).toEqual({})
      expect(result.content).toBe('')
    })

    test('should handle malformed frontmatter', () => {
      const content = '---\ntitle: Hello World\n# This is not proper frontmatter'
      const result = parseFrontMatter(content)
      expect(result.data).toEqual({})
      expect(result.content).toBe('---\ntitle: Hello World\n# This is not proper frontmatter')
    })

    test('should parse complex nested frontmatter', () => {
      const content = `---
title: Complex Example
meta:
  author: John Doe
  tags:
    - javascript
    - yaml
published: true
---

# Content here`
      const result = parseFrontMatter(content)
      expect(result.data).toEqual({
        title: 'Complex Example',
        meta: {
          author: 'John Doe',
          tags: ['javascript', 'yaml'],
        },
        published: true,
      })
      expect(result.content).toBe('\n\n# Content here')
    })

    test('should handle frontmatter with arrays', () => {
      const content = `---
tags:
  - javascript
  - typescript
  - node
numbers:
  - 1
  - 2
  - 3
---

Content`
      const result = parseFrontMatter(content)
      expect(result.data).toEqual({
        tags: ['javascript', 'typescript', 'node'],
        numbers: [1, 2, 3],
      })
      expect(result.content).toBe('\n\nContent')
    })

    test('should handle carriage return line endings', () => {
      const content = '---\r\ntitle: Hello World\r\nauthor: John Doe\r\n---\r\n\r\n# Hello\r\n\r\nThis is content.'
      const result = parseFrontMatter(content)
      expect(result.data).toEqual({ title: 'Hello World', author: 'John Doe' })
      expect(result.content).toBe('\n\r\n# Hello\r\n\r\nThis is content.')
    })

    test('should unflatten flattened keys in parsed data', () => {
      const content = `---
parent.child: value
parent.another: another value
simple: simple value
---

Content`
      const result = parseFrontMatter(content)
      expect(result.data).toEqual({
        parent: {
          child: 'value',
          another: 'another value',
        },
        simple: 'simple value',
      })
    })

    test('should return document when document option is true', () => {
      const content = '---\ntitle: Hello World\n---\nContent'
      const result = parseFrontMatter(content, { preserveOrder: true })
      expect(result.data.__order__).toBeDefined()
      expect(typeof result.data.__order__).toBe('object')
      // Remove document for comparison
      const { __order__, ...dataWithoutDocument } = result.data
      expect(dataWithoutDocument).toEqual({ title: 'Hello World' })
    })

    test('should handle empty frontmatter section', () => {
      const content = '---\n---\n\nContent here'
      const result = parseFrontMatter(content)
      expect(result.data).toEqual({})
      expect(result.content).toBe('---\n---\n\nContent here')
    })

    test('should handle frontmatter with only whitespace', () => {
      const content = '---\n   \n   \n---\n\nContent here'
      const result = parseFrontMatter(content)
      expect(result.data).toEqual({})
      expect(result.content).toBe('\n\nContent here')
    })
  })

  describe('round-trip functionality', () => {
    test('should parse and stringify back to same result', () => {
      const originalData = {
        title: 'Test Document',
        meta: {
          author: 'Test Author',
          tags: ['test', 'roundtrip'],
        },
        published: true,
      }
      const originalContent = '# Test Content\n\nThis is a test.'

      // Stringify to frontmatter format
      const stringified = stringifyFrontMatter(originalData, originalContent)

      // Parse it back
      const parsed = parseFrontMatter(stringified)

      expect(parsed.data).toEqual(originalData)
      expect(parsed.content).toBe('\n\n' + originalContent + '\n')
    })

    test('should parse and stringify with exact match when content already has proper spacing', () => {
      const originalData = {
        title: 'Test Document',
        meta: {
          author: 'Test Author',
          tags: ['test', 'roundtrip'],
        },
        published: true,
      }
      const originalContent = '\n\n# Test Content\n\nThis is a test.\n'

      // Stringify to frontmatter format
      const stringified = stringifyFrontMatter(originalData, originalContent.trim())

      // Parse it back
      const parsed = parseFrontMatter(stringified)

      expect(parsed.data).toEqual(originalData)
      expect(parsed.content).toBe(originalContent)
    })

    test('should handle code block props round-trip', () => {
      const originalData = {
        array: ['item1', { key: 'value' }],
        simple: 'value',
      }
      const originalContent = 'Component content'

      // Create code block props
      const codeBlockProps = stringifyCodeBlockProps(originalData, originalContent)
      expect(codeBlockProps).toContain('```yaml [props]')
      expect(codeBlockProps).toContain('array:')
      expect(codeBlockProps).toContain('Component content')
    })
  })
})
