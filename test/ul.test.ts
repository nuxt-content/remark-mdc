import { describe } from 'vitest'
import { runMarkdownTests } from './utils'

describe('ul', () => {
  runMarkdownTests({
    simple: {
      markdown: '- item 1\n- item 2\n- item 3',
    },
    nested: {
      markdown: '- item 1\n  - item 2\n  - item 3',
    },
    mixed: {
      markdown: '- item 1\n- item 2\n  - item 3\n- item 4',
    },
    mixed2: {
      markdown: '- item 1\n- item 2\n  - item 3\n- item 4',
    },
    mixed3: {
      markdown: '- item 1\n- item 2\n  - item 3\n- item 4',
    },
    mixed4: {
      markdown: '- item 1\n- item 2\n  - item 3\n- item 4',
    },
    mixed5: {
      markdown: [
        '- This is a list item.',
        '  - This is a CHILD list item.',
        '    - This is a GRANDCHILD list item.',
      ].join('\n'),
    },
  })
})
