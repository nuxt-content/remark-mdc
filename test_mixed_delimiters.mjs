import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdc from './dist/index.mjs'

const processor = unified()
  .use(remarkParse)
  .use(remarkMdc)

// Test case: tilde fence with backticks inside
const mdWithTildeAndBackticks = `::component
~~~json
Here is an example fence:
\`\`\`
code
\`\`\`
~~~
::`

const mdWithBacktickAndTildes = `::component
\`\`\`json
Here is an example fence:
~~~
code
~~~
\`\`\`
::`

console.log('=== Test 1: Tilde fence with backticks inside ===')
console.log('Input:')
console.log(mdWithTildeAndBackticks)
console.log('\nParsing...')
try {
  const ast1 = processor.parse(mdWithTildeAndBackticks)
  const container = ast1.children[0]
  console.log('Container children:', container.children.length)
  container.children.forEach((child, i) => {
    console.log(`  ${i}: ${child.type}`, child.value ? `(${child.value.substring(0, 50)})` : '')
  })
} catch (e) {
  console.error('Error:', e.message)
}

console.log('\n=== Test 2: Backtick fence with tildes inside ===')
console.log('Input:')
console.log(mdWithBacktickAndTildes)
console.log('\nParsing...')
try {
  const ast2 = processor.parse(mdWithBacktickAndTildes)
  const container = ast2.children[0]
  console.log('Container children:', container.children.length)
  container.children.forEach((child, i) => {
    console.log(`  ${i}: ${child.type}`, child.value ? `(${child.value.substring(0, 50)})` : '')
  })
} catch (e) {
  console.error('Error:', e.message)
}
