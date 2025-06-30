import { describe, expect } from 'vitest'
import { runMarkdownTests } from './utils'

describe('span', async () => {
  const wikiLink = await import('remark-wiki-link').then(r => r.default)

  runMarkdownTests({
    'simple': {
      markdown: '[span]',
    },
    'complex _': {
      markdown: '[span _span_ **span** `span`]',
      expected: '[span _span_ **span** `span`]',
    },
    'complex': {
      markdown: '[span _span_ **span** `span`]{a="a" b="b"}',
      expected: '[span _span_ **span** `span`]{a="a" b="b"}',
    },
    'inside-link-valid': {
      markdown: '[ [span]](#href)',
      extra(_markdown, ast, _expected) {
        expect(ast.children[0].children[0]).toMatchObject({
          type: 'link',
          children: [
            { type: 'text', value: ' ' },
            { type: 'textComponent', name: 'span' },
          ],
        })
      },
    },
    'inside-link-invalid': {
      markdown: '[[span]](#href)',
      expected: '[\\[span\\]](#href)',
      extra(_markdown, ast, _expected) {
        expect(ast.children[0].children[0]).toMatchObject({
          type: 'link',
          children: [
            {
              type: 'text',
              value: '[span]',
            },
          ],
        })
      },
    },
    'with-wikilinks': {
      markdown: '[[span]]',
      plugins: [wikiLink],
      extra(_markdown, ast, _expected) {
        expect(ast.children[0].children[0]).toMatchObject({
          type: 'wikiLink',
        })
      },
    },
    'with-attributes': {
      markdown: '[span]{#theid.aclass foo="bar" class="anotherclass" class="andother"}',
      expected: '[span]{#theid .aclass.anotherclass.andother foo="bar"}',
      extra(_markdown, ast, _expected) {
        expect(ast.children[0].children[0].attributes).toEqual({
          id: 'theid',
          class: 'aclass anotherclass andother',
          foo: 'bar',
        })
      },
    },
    '[x]': {
      markdown: '[x]',
      extra(_markdown, ast, _expected) {
        expect(ast.children[0].children[0].type).toEqual('textComponent')
        expect(ast.children[0].children[0].children[0].value).toEqual('x')
      },
    },
    '[ ]': {
      markdown: '[ ]',
      expected: '[]',
      extra(_markdown, ast, _expected) {
        expect(ast.children[0].children[0].type).toEqual('textComponent')
        expect(ast.children[0].children[0].children.length).toEqual(0)
      },
    },
    'respect-gfm-check-list': {
      markdown: '- [ ] task 1\n- [X] task 2',
      expected: '- [ ] task 1\n- [x] task 2',
    },
    'respect-reference-style-link': {
      markdown: '[link][ref]\n\n[ref]: http://example.com',
    },
    'ignore-double-bracket': {
      markdown: '[[wikilink]]',
      expected: '\\[\\[wikilink]]',
      extra(_markdown, ast, _expected) {
        expect(ast.children[0].children[0].type).toEqual('text')
        expect(ast.children[0].children[0].value).toEqual('[[wikilink]]')
      },
    },
    'ignored-bracket': {
      markdown: '\\[label]',
      expected: '\\[label]',
      extra(_markdown, ast, _expected) {
        expect(ast.children[0].children[0].type).toEqual('text')
        expect(ast.children[0].children[0].value).toEqual('[label]')
      },
    },
  })
})
