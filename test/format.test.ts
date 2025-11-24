import { describe, expect } from 'vitest'
import { runMarkdownTests } from './utils'

describe('ul', () => {
  runMarkdownTests({
    nested1: {
      markdown: [
        '::container',
        '---',
        'background-color: "#eee"',
        'padding: 20px',
        '---',
        '# This is a header',
        '',
        ':icon{color="#000" name="mdi:github" size="36px"}',
        '',
        '  :::content2',
        '  Well',
        '  :::',
        '::',
      ].join('\n'),
    },
    nested2: {
      markdown: [
        '::container',
        '---',
        'bi:',
        '  url: https://example.com',
        '  bg: contain',
        'styles: |',
        '  p {',
        '    color: red;',
        '  }',
        '---',
        '::',
      ].join('\n'),
    },
    list1: {
      markdown: [
        '- This is a list item.',
        '',
        '::container',
        '- This is a list item.',
        '::',
      ].join('\n'),
      extra(_markdown, ast, _expected) {
        expect(ast.children.length).toBe(2)
        expect(ast.children[0].type).toBe('list')
        expect(ast.children[1].type).toBe('containerComponent')
        expect(ast.children[1].children[0].type).toBe('list')
      },
    },
    list2: {
      markdown: [
        '- This is a list item.',
        '',
        '  ::container',
        '  - This is a list item.',
        '  ::',
      ].join('\n'),
      extra(_markdown, ast, _expected) {
        expect(ast.children.length).toBe(1)
      },
    },
    list4: {
      markdown: [
        '::parent',
        '- This is a list item.',
        '',
        '  :::container',
        '  - This is a list item.',
        '  :::',
        '::',
      ].join('\n'),
      extra(_markdown, ast, _expected) {
        expect(ast.children[0].children.length).toBe(2)
      },
    },
    list5: {
      markdown: [
        '- This is a list item.',
        '  ::container',
        '  - This is a list item.',
        '  ::',
      ].join('\n'),
      extra(_markdown, ast, _expected) {
        expect(ast.children.length).toBe(1)
      },
    },
    list6: {
      markdown: [
        '::parent',
        '- This is a list item.',
        '    :::container',
        '    - This is a list item.',
        '    :::',
        '::',
      ].join('\n'),
      extra(_markdown, ast, _expected) {
        expect(ast.children[0].children.length).toBe(1)
      },
    },
    list7: {
      markdown: [
        '- This is a list item.',
        '    :::container',
        '    - This is a list item.',
        '    :::',
      ].join('\n'),
      expected: [
        '- This is a list item.',
        '  ::container',
        '  - This is a list item.',
        '  ::',
      ].join('\n'),
    },
  })
})
