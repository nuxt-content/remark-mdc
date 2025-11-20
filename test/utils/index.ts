import { expect, test } from 'vitest'
import { markdownToAST, astToMarkdown } from './markdown'

interface MarkdownTest {
  markdown: string
  expected?: string
  extra?: (markdown: string, ast: any, expected: string) => void
  plugins?: any[]
  mdcOptions?: Record<string, any>
}

export function runMarkdownTests(tests: Record<string, MarkdownTest>) {
  for (const key in tests) {
    const { markdown, expected, extra, plugins = [], mdcOptions = {} } = tests[key]
    test(key, async () => {
      const parsedData = await markdownToAST(markdown, plugins, mdcOptions)

      expect(parsedData.ast).toMatchSnapshot()

      const regeneratedMarkdown = await astToMarkdown(parsedData, plugins, mdcOptions)
      expect(regeneratedMarkdown.trim()).toEqual(expected || markdown)
      if (extra) {
        extra(markdown, parsedData.ast, expected || markdown)
      }

      // We should be able regenerate same markdown starting from the `regeneratedMarkdown`
      const parsedData2 = await markdownToAST(regeneratedMarkdown, plugins, mdcOptions)
      const regeneratedMarkdown2 = await astToMarkdown(parsedData2, plugins, mdcOptions)
      expect(regeneratedMarkdown2).toEqual(regeneratedMarkdown)
    })
  }
}

// Internal function to remove position from ast
function _removePosition(ast: any) {
  if (Array.isArray(ast)) {
    ast.forEach(child => _removePosition(child))
  }
  else if (ast && typeof ast === 'object') {
    delete ast.position
    if (ast.children) {
      _removePosition(ast.children)
    }
    // In case nested properties contain AST children
    for (const key in ast) {
      if (ast[key] && typeof ast[key] === 'object' && ast[key] !== null) {
        _removePosition(ast[key])
      }
    }
  }
}
