import { describe, expect } from 'vitest'
import { runMarkdownTests } from './utils'

describe('block attributes', () => {
  runMarkdownTests({
    'paragraph': {
      markdown: 'A paragraph {attr="value"}',
      extra(_md, ast) {
        expect(ast.children[0].type).toBe('paragraph')
        expect(ast.children[0].attributes).toEqual({ attr: 'value' })
      },
    },
    'heading h1': {
      markdown: '# h1 {attr="value"}',
      extra(_md, ast) {
        expect(ast.children[0].type).toBe('heading')
        expect(ast.children[0].depth).toBe(1)
        expect(ast.children[0].attributes).toEqual({ attr: 'value' })
      },
    },
    'heading h6': {
      markdown: '###### h6 {attr="value"}',
      extra(_md, ast) {
        expect(ast.children[0].depth).toBe(6)
        expect(ast.children[0].attributes).toEqual({ attr: 'value' })
      },
    },
    'bullet list items': {
      markdown: '- a list item {attr="value"}\n- another list item {attr2="value2"}',
      extra(_md, ast) {
        const [first, second] = ast.children[0].children
        // attributes attach to the list item, not the inner paragraph
        expect(first.type).toBe('listItem')
        expect(first.attributes).toEqual({ attr: 'value' })
        expect(first.children[0].attributes).toBeUndefined()
        expect(second.attributes).toEqual({ attr2: 'value2' })
      },
    },
    'ordered list item': {
      markdown: '1. List item {attr="value"}',
      extra(_md, ast) {
        expect(ast.children[0].ordered).toBe(true)
        expect(ast.children[0].children[0].attributes).toEqual({ attr: 'value' })
      },
    },
    'task list items': {
      markdown: '- [ ] Task list item {attr="value"}\n- [x] Task list item {attr2="value2"}',
      extra(_md, ast) {
        const [first, second] = ast.children[0].children
        expect(first.checked).toBe(false)
        expect(first.attributes).toEqual({ attr: 'value' })
        expect(second.checked).toBe(true)
        expect(second.attributes).toEqual({ attr2: 'value2' })
      },
    },
    'blockquote': {
      markdown: '> Blockquote {attr="value"}',
      extra(_md, ast) {
        expect(ast.children[0].type).toBe('blockquote')
        // single-content blockquote attaches to its paragraph
        expect(ast.children[0].children[0].attributes).toEqual({ attr: 'value' })
      },
    },
    'blockquote multiple paragraphs': {
      markdown: '> Para 1 {attr="value"}\n>\n> Para 2 {attr2="value2"}',
      extra(_md, ast) {
        const [p1, p2] = ast.children[0].children
        expect(p1.attributes).toEqual({ attr: 'value' })
        expect(p2.attributes).toEqual({ attr2: 'value2' })
      },
    },
    'keeps attaching to inline element': {
      // `{attr}` directly after an inline element stays on that element
      markdown: '**bold**{attr="value"} and more',
      extra(_md, ast) {
        const strong = ast.children[0].children[0]
        expect(strong.type).toBe('strong')
        expect(strong.attributes).toEqual({ attr: 'value' })
        expect(ast.children[0].attributes).toBeUndefined()
      },
    },
    'non-trailing attributes stay literal': {
      markdown: 'A {x} paragraph',
      extra(_md, ast) {
        expect(ast.children[0].children).toHaveLength(1)
        expect(ast.children[0].children[0]).toMatchObject({ type: 'text', value: 'A {x} paragraph' })
        expect(ast.children[0].attributes).toBeUndefined()
      },
    },
    'lifts attributes onto unwrapped container': {
      markdown: '::test\nHello {attr="value"}\n::',
      mdcOptions: { autoUnwrap: true },
      removeFmAttributes: true,
      expected: '::test{attr="value"}\nHello\n::',
      extra(_md, ast) {
        expect(ast.children[0].type).toBe('containerComponent')
        expect(ast.children[0].attributes).toEqual({ attr: 'value' })
      },
    },
  })
})

describe('block component fold', () => {
  runMarkdownTests({
    'ul': {
      markdown: '::ul{attr="value"}\n- item 1\n- item 2\n::',
      extra(_md, ast) {
        const list = ast.children[0]
        expect(list.type).toBe('list')
        expect(list.ordered).toBe(false)
        expect(list.attributes).toEqual({ attr: 'value' })
        expect(list.children).toHaveLength(2)
        expect(list.children[0].type).toBe('listItem')
      },
    },
    'ol': {
      markdown: '::ol{attr="value"}\n1. item 1\n2. item 2\n::',
      extra(_md, ast) {
        const list = ast.children[0]
        expect(list.type).toBe('list')
        expect(list.ordered).toBe(true)
        expect(list.attributes).toEqual({ attr: 'value' })
      },
    },
    'table': {
      markdown: '::table{attr="value"}\n| a | b |\n| - | - |\n| 1 | 2 |\n::',
      expected: [
        '::table{attr="value"}',
        '| a | b |',
        '| - | - |',
        '| 1 | 2 |',
        '::',
      ].join('\n'),
      extra(_md, ast) {
        const table = ast.children[0]
        expect(table.type).toBe('table')
        expect(table.attributes).toEqual({ attr: 'value' })
      },
    },
    'blockquote multi-block uses wrapper': {
      markdown: '::blockquote{attr="value"}\n> a\n>\n> b\n::',
      extra(_md, ast) {
        const blockquote = ast.children[0]
        expect(blockquote.type).toBe('blockquote')
        expect(blockquote.attributes).toEqual({ attr: 'value' })
        expect(blockquote.children).toHaveLength(2)
      },
    },
    'blockquote single-content uses natural form': {
      markdown: '::blockquote{attr="value"}\n> a\n::',
      // a single-content blockquote round-trips to the natural `> text {attr}`
      expected: '> a {attr="value"}',
      extra(_md, ast) {
        const blockquote = ast.children[0]
        expect(blockquote.type).toBe('blockquote')
        expect(blockquote.attributes).toEqual({ attr: 'value' })
        expect(blockquote.children).toHaveLength(1)
      },
    },
    'outer attributes win over inner': {
      markdown: '::ul{attr="outer"}\n- item\n::',
      extra(_md, ast) {
        expect(ast.children[0].attributes).toEqual({ attr: 'outer' })
      },
    },
    'no fold when tags differ': {
      // `::ul` wrapping an ordered list is not folded
      markdown: '::ul{attr="value"}\n1. item\n::',
      extra(_md, ast) {
        expect(ast.children[0].type).toBe('containerComponent')
        expect(ast.children[0].name).toBe('ul')
        expect(ast.children[0].children[0].type).toBe('list')
        expect(ast.children[0].children[0].ordered).toBe(true)
      },
    },
  })
})
