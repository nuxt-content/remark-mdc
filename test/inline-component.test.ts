import { describe, expect } from 'vitest'
import { runMarkdownTests } from './utils'

describe('inline-component', () => {
  runMarkdownTests({
    'empty': {
      markdown: ':component text',
    },
    'text': {
      markdown: ':component[text] text',
    },
    'with-attribute': {
      markdown: ':component[text]{.class} text',
    },
    'strong': {
      markdown: '**:component[text]{.class}**',
      extra(_markdown, ast, _expected) {
        expect(ast.children[0].children[0].type).toEqual('strong')
        expect(ast.children[0].children[0].children[0].type).toEqual('textComponent')
      },
    },
    'underlined': {
      markdown: '**:component[text]{.class}**',
    },
    'parentheses': {
      markdown: '(:component[text]{.class})',
    },
    'binding': {
      markdown: '{{ $doc.variable }}',
    },
    'bindingWithDefault': {
      markdown: '{{ $doc.variable || \'mdc\' }}',
    },
    'kbd': {
      markdown: '::tip\nYou can also use the shortcut :kbd{value="meta"} + :kbd{value="."} to redirect to the Studio route.\n::',
    },
  })
})
