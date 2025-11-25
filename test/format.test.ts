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
    list8: {
      markdown: [
        '::page-section',
        '---',
        'background-image:',
        '  url: https://images.example.com/dog.png',
        'color: red',
        '---',
        '- This is a list item.2',
        '',
        '  :::container',
        '  :::',
        '::',
      ].join('\n'),
      extra(_markdown, ast, _expected) {
        expect(ast.children[0].children.length).toBe(2)
      },
    },
    list10: {
      markdown: `---
title: ""
description: ""
---

## This section contains a bunch of lists

- This is a list item.
- This is a list item.
  - This is a CHILD list item.
    - This is a GRANDCHILD list item.
- This is a list item.

::page-section
---
background-image:
  url: https://images.example.com/dog.png
color: red
---
- This is a list item.
- This is a list item.
  - This is a CHILD list item.
    - This is a GRANDCHILD list item.
- This is a list item.

  :::container
  - This is a list item.
  - This is a list item.
  - This is a CHILD list item.
    - This is a GRANDCHILD list item.
  - This is a list item.
  :::

  :::container
  - This is a list item.
  - This is a list item.
    - This is a CHILD list item.
      - This is a GRANDCHILD list item.
  - This is a list item.

  :button[This is nested another level]

    ::::container
    ---
    background-image:
      url: https://images.example.com/dog.png
    color: red
    ---
    - This is a list item.
    - This is a list item.
      - This is a CHILD list item.
        - This is a GRANDCHILD list item.
    - This is a list item.

    This content is below the list.
    ::::

  :icon{name="mdi:github"}

  More outer content.
  :::
::`,
    },
    list11: {
      markdown: `::page-container
---
simple-array:
  - item1
  - item2
  - item3
---
::

::page-container
---
items:
  - name: Item 1
    description: First item
  - name: Item 2
    description: Second item
---
::

::page-container
---
attributes:
  - domains:
      - internal
  - env:
      - dev
      - staging
      - prod
  - dogs:
      - husky
      - beagle
---
::`,
      removeFmAttributes: true,
    },
  })
})
