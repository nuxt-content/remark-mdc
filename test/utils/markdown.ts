import { unified, type Preset } from 'unified'
import parse from 'remark-parse'
import gfm from 'remark-gfm'
import stringify from 'remark-stringify'
import mdc, { parseFrontMatter, stringifyFrontMatter } from '../../src'

export async function markdownToAST(markdown: string, plugins = [] as any[], mdcOptions = {}) {
  const { content, data: frontmatter } = parseFrontMatter(markdown)
  function compiler(this: any) {
    this.Compiler = function (root: any) {
      return root
    }
  }

  let stream = unified()
    .use(parse)
    .use(gfm)
    .use(mdc, mdcOptions)

  for (const plugin of plugins) {
    stream = stream.use(plugin)
  }
  const file = await stream.use(compiler as Preset).process(content)

  return {
    content,
    frontmatter,
    ast: file.result,
  }
}

export async function astToMarkdown(parsed, plugins = [] as any[], mdcOptions = {}) {
  const { ast, frontmatter } = parsed
  function jsonParser(this: any) {
    this.Parser = function (root: any) {
      return JSON.parse(root)
    }
  }
  const stream = await unified()
    .use(jsonParser)
    .use(gfm)
    .use(mdc, mdcOptions)

  for (const plugin of plugins) {
    stream.use(plugin)
  }
  stream.use(stringify, {
    bullet: '-',
    emphasis: '_',
    listItemIndent: 'one',
    fence: '`',
    fences: true,
    rule: '-',
  })
  const result = await stream.process(JSON.stringify(ast))
  return stringifyFrontMatter(frontmatter, result.value as string)
}
