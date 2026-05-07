const { unified } = require('unified')
const remarkParse = require('remark-parse')
const remarkMdc = require('./dist/index.js').default

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
console.log('\nOutput:')
const ast1 = processor.parse(mdWithTildeAndBackticks)
console.log(JSON.stringify(ast1, null, 2))

console.log('\n=== Test 2: Backtick fence with tildes inside ===')
console.log('Input:')
console.log(mdWithBacktickAndTildes)
console.log('\nOutput:')
const ast2 = processor.parse(mdWithBacktickAndTildes)
console.log(JSON.stringify(ast2, null, 2))
