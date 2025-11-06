import { describe, expect } from 'vitest'
import { runMarkdownTests } from './utils'

describe('Attributes', () => {
  runMarkdownTests({
    'id-suger': {
      markdown: ':test{#id} text',
    },
    'class-suger': {
      markdown: ':test{.class .another-class key="value"} text',
      expected: ':test{.class.another-class key="value"} text',
    },
    'boolean': {
      markdown: ':test{prop} text',
      expected: ':test{prop="true"} text',
    },
    'html-characters': {
      markdown: ':test{icon="&copy;"} text',
      expected: ':test{icon="©"} text',
    },
    'html-characters-unquoted': {
      markdown: ':test{icon=&copy;} text',
      expected: ':test{icon="©"} text',
    },
    'value-with-space': {
      markdown: ':test{attr= value} text',
      expected: ':test{attr="value"} text',
    },
    'invalid-binding': {
      markdown: ':test{:} text',
      expected: ':test{:} text',
    },
    'fragment-attribute': {
      markdown: '[![Nuxt](https://nuxtjs.org/design-kit/colored-logo.svg){.nest}](https:test){.cls}',
      expected: '[![Nuxt](https://nuxtjs.org/design-kit/colored-logo.svg){.nest}](https\\:test){.cls}',
    },
    'image': {
      markdown: '![Nuxt](https://nuxtjs.org/design-kit/colored-logo.svg){#id .class}',
    },
    'nested': {
      markdown: '[Hello [World]{.x}](/world){style="color: green"}',
    },
    'nested2': {
      markdown: '[Hello [World](/world){.x}]{style="color: green"}',
    },
    'nested3': {
      markdown: '_**[Nuxt](https://nuxtjs.org){#id .class} strong**{#id2 .class2} emphasis_{#id3 .class3}',
    },
    'code': {
      markdown: '`code`{#id .class}',
    },
    '# in class': {
      markdown: '`code`{#id .bg-[#E74249]}',
    },
    'strong': {
      markdown: '**strong**{#id .class}',
    },
    'link': {
      markdown: '[Nuxt](https://nuxtjs.org){#id .class}',
    },
    'linkReference': {
      markdown: '[Nuxt][nuxt]{#id .class}\n\n[nuxt]: https://nuxt.com',
    },
    'emphasis': {
      markdown: '_emphasis_{#id .class}',
    },
    'nested-in-table': {
      markdown: [
        '| Col1 |      Col2      |',
        '|  --  |      -----     |',
        '|  aa  | [a](/a){a="a"} |',
      ].join('\n'),
      expected: [
        '| Col1 | Col2           |',
        '| ---- | -------------- |',
        '| aa   | [a](/a){a="a"} |',
      ].join('\n'),
    },
    'ignoreEscapeCharacterInNormalAttribute': {
      markdown: ':copy{code="D:\\Software\\"}',
      expected: ':copy{code="D:\\Software\\"}',
      extra: (_md, ast) => {
        expect(ast.children[0].type).toBe('textComponent')
        expect(ast.children[0].attributes.code).toBe('D:\\Software\\')
      },
    },
    'ignoreEscapeCharacterInNormalAttributeYaml': {
      markdown: '::copy\n---\ncode: D:\\Software\\\n---\n::',
      expected: '::copy\n---\ncode: D:\\Software\\\n---\n::',
      extra: (_md, ast) => {
        expect(ast.children[0].type).toBe('containerComponent')
        expect(ast.children[0].fmAttributes.code).toBe('D:\\Software\\')
      },
    },
    'sort-attributes': {
      markdown: ':test{a="a" c="c" b="b"} text',
      expected: ':test{a="a" b="b" c="c"} text',
    },
    'preserveOrder': {
      markdown: ':test{a="a" c="c" b="b"} text',
      expected: ':test{a="a" c="c" b="b"} text',
      mdcOptions: {
        attributes: {
          preserveOrder: true,
        },
      },
    },
  })
})
