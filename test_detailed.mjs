import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdc from './dist/index.mjs'

const processor = unified()
  .use(remarkParse)
  .use(remarkMdc)

// More explicit test: the exact scenario mentioned
const mdBuggyCase = `::component
~~~
three backticks inside tilde fence:
\`\`\`
~~~
::`

console.log('=== Potential Bug Case ===')
console.log('Input:')
console.log(mdBuggyCase)
console.log('\nParsing...')
const ast = processor.parse(mdBuggyCase)
const container = ast.children[0]
console.log('Container type:', container.type)
console.log('Container children count:', container.children.length)
container.children.forEach((child, i) => {
  console.log(`  Child ${i}:`)
  console.log(`    Type: ${child.type}`)
  console.log(`    Value: ${JSON.stringify(child.value)}`)
})
console.log('\nFull AST:')
console.log(JSON.stringify(ast, null, 2))
