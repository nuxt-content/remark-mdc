import { describe, expect, it } from 'vitest'
import { parse, stringify } from 'yaml'
import { runMarkdownTests } from './utils'

describe('block-component', () => {
  it('should parse frontmatter binding values', () => {
    const fmAttributes = {
      'array': ['item', { ':itemKey': 'value' }],
      ':key': 'value',
      'key2': { ':subkey': 'value', 'subkey2': 'value' },
    }
    expect(parse(stringify(fmAttributes).trim())).toEqual(fmAttributes)
  })

  runMarkdownTests({
    'empty': {
      markdown: '::component\n::',
      expected: '::component\n::',
    },
    'text': {
      markdown: '::component\ntext\n::',
      expected: '::component\ntext\n::',
    },
    'paragraphWithComponents': {
      markdown: [
        '::test',
        'Hello world :this is a **test**, with _different_ **styles** and a [link](https://nuxtjs.org){target="_blank"}',
        '::',
      ].join('\n'),
    },
    'empty-slot': {
      markdown: '::component\n#text\n::',
      expected: '::component\n#text\n::',
    },
    'component-attributes': {
      markdown: '::component{key="value"}\n::',
    },
    'component-attributes-remove-duplicate': {
      markdown: '::component{key="value" key="value"}\n::',
      expected: '::component{key="value"}\n::',
    },
    'component-attributes-length-80': {
      // `::component{a=""}` = 17 characters + 1 because array start at 0
      markdown: `::component{a="${Array.from({ length: 80 - 17 + 1 }).join('a')}"}\n::`,
    },
    'component-attributes-length-81': {
      markdown: `::component{a="${Array.from({ length: 81 - 17 + 1 }).join('a')}"}\n::`,
      expected: [
        '::component',
        '---',
        `a: ${Array.from({ length: 81 - 17 + 1 }).join('a')}`,
        '---',
        '::',
      ].join('\n'),
    },
    'component-max-attributes-length-option': {
      mdcOptions: {
        maxAttributesLength: 100,
      },
      markdown: `::component{a="${Array.from({ length: 100 - 17 + 1 }).join('a')}"}\n::`,
    },
    'frontmatter': {
      markdown: '::with-frontmatter\n---\nkey: value\narray:\n  - item\n  - itemKey: value\n---\n::',
      expected: '::with-frontmatter\n---\narray:\n  - item\n  - itemKey: value\nkey: value\n---\n::',
    },
    'jsonScapeAttr': {
      markdown: '::foo{:test=\'{"foo":"I\\\'d love to"}\'}\n::',
      expected: [
        '::foo',
        '---',
        'test:',
        '  foo: I\'d love to',
        '---',
        '::',
      ].join('\n'),
      extra: (_md, ast) => {
        expect(ast.children[0].type).toBe('containerComponent')
      },
    },
    'frontmatter1': {
      markdown: [
        '::with-frontmatter',
        '---',
        'key: value',
        'key2:',
        '  subkey: value',
        '  subkey2: value',
        'array:',
        '  - item',
        '  - itemKey: value',
        '---',
        '::',
      ].join('\n'),
      expected: [
        '::with-frontmatter',
        '---',
        'array:',
        '  - item',
        '  - itemKey: value',
        'key: value',
        'key2:',
        '  subkey: value',
        '  subkey2: value',
        '---',
        '::',
      ].join('\n'),
    },
    'frontmatter-with-binding-variables': {
      markdown: [
        '::with-frontmatter',
        '---',
        ':key: value',
        'array:',
        '  - item',
        '  - :itemKey: value',
        'object:',
        '  :subkey: value',
        '  subkey2: value',
        '---',
        '::',
      ].join('\n'),
    },
    'nested-component': {
      markdown: [
        '::with-frontmatter-and-nested-component',
        '---',
        'key: value',
        'array:',
        '  - item',
        '  - itemKey: value',
        '---',
        'Default slot',
        '',
        '#secondary-slot',
        'Secondary slot value',
        '',
        '  :::hello',
        '  ---',
        '  key: value',
        '  ---',
        '  :::',
        '::',
      ].join('\n'),
      expected: [
        '::with-frontmatter-and-nested-component',
        '---',
        'array:',
        '  - item',
        '  - itemKey: value',
        'key: value',
        '---',
        'Default slot',
        '',
        '#secondary-slot',
        'Secondary slot value',
        '',
        '  :::hello',
        '  ---',
        '  key: value',
        '  ---',
        '  :::',
        '::',
      ].join('\n'),
    },
    'section-order': {
      markdown: [
        '::comp',
        '#title',
        'Hello',
        '#another-title',
        'World',
        '#default',
        'P1',
        '',
        'P2',
        '',
        'P',
        '::',
      ].join('\n'),
      expected: [
        '::comp',
        'P1',
        '',
        'P2',
        '',
        'P',
        '',
        '#title',
        'Hello',
        '',
        '#another-title',
        'World',
        '::',
      ].join('\n'),
    },
    'section-order-2': {
      markdown: [
        '::comp',
        '#a',
        'A',
        '#c',
        'C',
        '#b',
        'B',
        '#default',
        'P1',
        '::',
      ].join('\n'),
      expected: [
        '::comp',
        'P1',
        '',
        '#a',
        'A',
        '',
        '#c',
        'C',
        '',
        '#b',
        'B',
        '::',
      ].join('\n'),
    },
    'ignore-code-fence': {
      markdown: [
        '::component',
        'First line',
        '',
        '```cpp',
        '#include <iostream>',
        '```',
        '',
        'Second line',
        '::',
        '',
        'Third line',
      ].join('\n'),
    },
    'ignore-code-fence-with-prior-indented-subcomponent': {
      // Code fence at column 0 must NOT have its content indentation stripped,
      // even when a prior indented sub-component set containerIndentSize > 0.
      // The leading blank line after ::component is normalized away on stringify.
      markdown: [
        '::component',
        '',
        '  :::nested',
        '  :::',
        '',
        '```json',
        '{',
        '  "key": "value"',
        '}',
        '```',
        '::',
      ].join('\n'),
      expected: [
        '::component',
        '  :::nested',
        '  :::',
        '',
        '```json',
        '{',
        '  "key": "value"',
        '}',
        '```',
        '::',
      ].join('\n'),
      extra: (_md, ast) => {
        const container = ast.children[0]
        const codeNode = container.children[1]
        expect(codeNode.type).toBe('code')
        expect(codeNode.value).toBe('{\n  "key": "value"\n}')
      },
    },
    'ignore-code-fence-with-prior-indented-subcomponent-blank-line': {
      // Same as above but with a blank line immediately before the code fence,
      // which triggers the `possibleIndentedComponent` / attemptIntentedCommponent path.
      // The leading blank line after ::component is normalized away on stringify.
      markdown: [
        '::component',
        '',
        '  :::nested',
        '  :::',
        '',
        'Some text',
        '',
        '```json',
        '{',
        '  "key": "value"',
        '}',
        '```',
        '::',
      ].join('\n'),
      expected: [
        '::component',
        '  :::nested',
        '  :::',
        '',
        'Some text',
        '',
        '```json',
        '{',
        '  "key": "value"',
        '}',
        '```',
        '::',
      ].join('\n'),
      extra: (_md, ast) => {
        const container = ast.children[0]
        // children[0] = nested container, children[1] = paragraph, children[2] = code
        const codeNode = container.children[2]
        expect(codeNode.type).toBe('code')
        expect(codeNode.value).toBe('{\n  "key": "value"\n}')
      },
    },
    'indented-code-fence-with-prior-indented-subcomponent': {
      // Code fence at containerIndentSize indent should still work correctly —
      // spaces ARE stripped from the opening line, so content stripping applies too.
      // The stringify round-trip normalizes the fence back to column 0.
      markdown: [
        '::component',
        '',
        '  :::nested',
        '  :::',
        '',
        '  ```json',
        '  {',
        '    "key": "value"',
        '  }',
        '  ```',
        '::',
      ].join('\n'),
      expected: [
        '::component',
        '  :::nested',
        '  :::',
        '',
        '```json',
        '{',
        '  "key": "value"',
        '}',
        '```',
        '::',
      ].join('\n'),
      extra: (_md, ast) => {
        const container = ast.children[0]
        const codeNode = container.children[1]
        expect(codeNode.type).toBe('code')
        expect(codeNode.value).toBe('{\n  "key": "value"\n}')
      },
    },
    'tilde-code-fence-with-prior-indented-subcomponent': {
      // Tilde-delimited fences must behave identically to backtick fences:
      // content indentation must be preserved when the fence is at column 0.
      markdown: [
        '::component',
        '',
        '  :::nested',
        '  :::',
        '',
        '~~~json',
        '{',
        '  "key": "value"',
        '}',
        '~~~',
        '::',
      ].join('\n'),
      expected: [
        '::component',
        '  :::nested',
        '  :::',
        '',
        '```json',
        '{',
        '  "key": "value"',
        '}',
        '```',
        '::',
      ].join('\n'),
      extra: (_md, ast) => {
        const container = ast.children[0]
        const codeNode = container.children[1]
        expect(codeNode.type).toBe('code')
        expect(codeNode.value).toBe('{\n  "key": "value"\n}')
      },
    },
    'tilde-code-fence-blank-line-before': {
      // Same as tilde-code-fence-with-prior-indented-subcomponent but with a blank
      // line before the fence, exercising the attemptIntentedCommponent path.
      markdown: [
        '::component',
        '',
        '  :::nested',
        '  :::',
        '',
        'Some text',
        '',
        '~~~json',
        '{',
        '  "key": "value"',
        '}',
        '~~~',
        '::',
      ].join('\n'),
      expected: [
        '::component',
        '  :::nested',
        '  :::',
        '',
        'Some text',
        '',
        '```json',
        '{',
        '  "key": "value"',
        '}',
        '```',
        '::',
      ].join('\n'),
      extra: (_md, ast) => {
        const container = ast.children[0]
        // children[0] = nested container, children[1] = paragraph, children[2] = code
        const codeNode = container.children[2]
        expect(codeNode.type).toBe('code')
        expect(codeNode.value).toBe('{\n  "key": "value"\n}')
      },
    },
    'two-code-fences-indented-then-column-zero': {
      // Second fence (column 0) must not inherit codeFenceStripped from the first
      // fence (indented), which would incorrectly strip its content indentation.
      markdown: [
        '::component',
        '',
        '  :::nested',
        '  :::',
        '',
        '  ```json',
        '  { "first": true }',
        '  ```',
        '',
        '```json',
        '{',
        '  "second": true',
        '}',
        '```',
        '::',
      ].join('\n'),
      expected: [
        '::component',
        '  :::nested',
        '  :::',
        '',
        '```json',
        '{ "first": true }',
        '```',
        '',
        '```json',
        '{',
        '  "second": true',
        '}',
        '```',
        '::',
      ].join('\n'),
      extra: (_md, ast) => {
        const container = ast.children[0]
        // children[0]=nested, children[1]=first code, children[2]=second code
        expect(container.children[1].type).toBe('code')
        expect(container.children[1].value).toBe('{ "first": true }')
        expect(container.children[2].type).toBe('code')
        expect(container.children[2].value).toBe('{\n  "second": true\n}')
      },
    },
    'two-code-fences-column-zero-then-indented': {
      // Reverse order: column-0 fence first, then indented fence. The indented fence
      // must still have its content stripped correctly.
      markdown: [
        '::component',
        '',
        '  :::nested',
        '  :::',
        '',
        '```json',
        '{',
        '  "first": true',
        '}',
        '```',
        '',
        '  ```json',
        '  { "second": true }',
        '  ```',
        '::',
      ].join('\n'),
      expected: [
        '::component',
        '  :::nested',
        '  :::',
        '',
        '```json',
        '{',
        '  "first": true',
        '}',
        '```',
        '',
        '```json',
        '{ "second": true }',
        '```',
        '::',
      ].join('\n'),
      extra: (_md, ast) => {
        const container = ast.children[0]
        expect(container.children[1].type).toBe('code')
        expect(container.children[1].value).toBe('{\n  "first": true\n}')
        expect(container.children[2].type).toBe('code')
        expect(container.children[2].value).toBe('{ "second": true }')
      },
    },
    'dangling-list': {
      markdown: [
        '::component',
        '- list item',
        '- list item',
        '',
        '#slot',
        'slot content',
        '::',
      ].join('\n'),
    },
    'multiple-slots-with-lists': {
      markdown: [
        '::component',
        '',
        '#slot-a',
        '- item one',
        '- item two',
        '- item three',
        '',
        '#slot-b',
        '- item one',
        '- item two',
        '- item three',
        '',
        '::',
      ].join('\n'),
      expected: [
        '::component',
        '#slot-a',
        '- item one',
        '- item two',
        '- item three',
        '',
        '#slot-b',
        '- item one',
        '- item two',
        '- item three',
        '::',
      ].join('\n'),
      extra(_md, ast) {
        const container = ast.children[0]
        const slotA = container.children.find((c: any) => c.name === 'slot-a')
        const slotB = container.children.find((c: any) => c.name === 'slot-b')
        expect(slotA.children[0].type).toBe('list')
        expect(slotB.children[0].type).toBe('list')
        expect(slotA.children[0].children).toHaveLength(3)
        expect(slotB.children[0].children).toHaveLength(3)
      },
    },
    'trim-slot-name': {
      markdown: [
        '::component',
        '#slot ',
        'slot content',
        '::',
      ].join('\n'),
      expected: [
        '::component',
        '#slot',
        'slot content',
        '::',
      ].join('\n'),
    },
    'sugar-syntax': {
      markdown: [
        ':component',
      ].join('\n'),
      extra: (_md, ast) => {
        expect(ast.children[0].type).toBe('textComponent')
        expect(ast.children[0].name).toBe('component')
      },
    },
    'component-attributes-bind-frontmatter': {
      markdown: '::text-component{:key="value"}\n::',
      extra(_, ast) {
        expect(ast.children[0].attributes).toEqual({ ':key': 'value' })
        expect(ast.children[0].data.hProperties).toEqual({ ':key': 'value' })
      },
    },
    'component-attributes-array-of-string': {
      markdown: '::container-component{:items=\'["Nuxt", "Vue"]\'}\n::',
      expected: [
        '::container-component',
        '---',
        'items:',
        '  - Nuxt',
        '  - Vue',
        '---',
        '::',
      ].join('\n'),
      extra(_, ast) {
        expect(ast.children[0].attributes).toEqual({ ':items': '["Nuxt", "Vue"]' })
        expect(ast.children[0].data.hProperties).toEqual({ ':items': '["Nuxt", "Vue"]' })
      },
    },
    'component-attributes-bad-array': {
      markdown: '::container-component{:items="[Nuxt,Vue]"}\n::',
      expected: [
        '::container-component',
        '---',
        ':items: "[Nuxt,Vue]"',
        '---',
        '::',
      ].join('\n'),
      extra(_, ast) {
        expect(ast.children[0].attributes).toEqual({ ':items': '[Nuxt,Vue]' })
        expect(ast.children[0].data.hProperties).toEqual({ ':items': '[Nuxt,Vue]' })
      },
    },
    'component-attributes-array-of-number': {
      markdown: '::container-component{:items=\'[1,2,3.5]\'}\n::',
      expected: [
        '::container-component',
        '---',
        'items:',
        '  - 1',
        '  - 2',
        '  - 3.5',
        '---',
        '::',
      ].join('\n'),
      extra(_, ast) {
        expect(ast.children[0].attributes).toEqual({ ':items': '[1,2,3.5]' })
        expect(ast.children[0].data.hProperties).toEqual({ ':items': '[1,2,3.5]' })
      },
    },
    'component-attributes-array-convert-double-quote': {
      markdown: '::container-component{:items="[1,2,3.5]"}\n::',
      expected: [
        '::container-component',
        '---',
        'items:',
        '  - 1',
        '  - 2',
        '  - 3.5',
        '---',
        '::',
      ].join('\n'),
      extra(_, ast) {
        expect(ast.children[0].attributes).toEqual({ ':items': '[1,2,3.5]' })
        expect(ast.children[0].data.hProperties).toEqual({ ':items': '[1,2,3.5]' })
      },
    },
    'component-attributes-object': {
      markdown: '::container-component{:items=\'{"key": "value"}\'}\n::',
      expected: [
        '::container-component',
        '---',
        'items:',
        '  key: value',
        '---',
        '::',
      ].join('\n'),
      extra(_, ast) {
        expect(ast.children[0].attributes).toEqual({ ':items': '{"key": "value"}' })
        expect(ast.children[0].data.hProperties).toEqual({ ':items': '{"key": "value"}' })
      },
    },
    'component-hProperties-be-the-same': {
      markdown: [
        '::container-component{:items=\'{"key":"value"}\'}\n::',
        '',
        '::container-component',
        '---',
        'items:',
        '  key: value',
        '---',
        '::',
      ].join('\n'),
      expected: [
        '::container-component',
        '---',
        'items:',
        '  key: value',
        '---',
        '::',
        '',
        '::container-component',
        '---',
        'items:',
        '  key: value',
        '---',
        '::',
      ].join('\n'),
      extra(_, ast) {
        expect(ast.children[0].attributes).toEqual({ ':items': '{"key":"value"}' })
        expect(ast.children[1].attributes).toEqual({})
        expect(ast.children[0].data.hProperties).toEqual(ast.children[1].data.hProperties)
      },
    },
    'slot-attributes': {
      markdown: [
        '::container-component',
        '#slot{key="value"}',
        'slot content',
        '::',
      ].join('\n'),
      extra(_, ast) {
        const slot = ast.children[0].children[0]
        expect(slot.type).toBe('componentContainerSection')
        expect(slot.attributes).toEqual({ key: 'value' })
      },
    },
    'default-slot-attributes': {
      markdown: [
        '::container-component',
        '#default{key="value"}',
        'slot content',
        '::',
      ].join('\n'),
      extra(_, ast) {
        const slot = ast.children[0].children[0]
        expect(slot.type).toBe('componentContainerSection')
        expect(slot.attributes).toEqual({ key: 'value' })
      },
    },
    'nested-empty-line': {
      markdown: [
        '::container{padding="0px"}',
        '  :::container',
        '  ---',
        '  styles: |',
        '    pre {',
        '      border: 1px solid red !important;',
        '',
        '      span {',
        '        line-height: 1;',
        '      }',
        '    }',
        '  ---',
        '  This container has a code block.',
        '',
        '  ```js',
        '  function test() {',
        '    console.log("test");',
        '  }',
        '  ```',
        '  :::',
        '::',
      ].join('\n'),
    },
  })
})
