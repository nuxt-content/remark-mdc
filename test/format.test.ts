import { describe } from 'vitest'
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
      extra(markdown, ast, expected) {
        console.log(JSON.stringify(ast, null, 2))
      }
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
  })
})
