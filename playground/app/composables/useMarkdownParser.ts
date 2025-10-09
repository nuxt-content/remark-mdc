import type { Root, Node } from 'mdast'
import type { Preset, Processor } from 'unified'
import type { Ref } from 'vue'

// workaround for kleur
process.env = process.env || {}

function compiler(this: any) {
  this.Compiler = function (root: any) {
    return root
  }
}

export function useMarkdownParser(input: Ref<string>, mdcOptions = ref({})) {
  let _stream: Processor<Root, Node, Node, undefined, undefined> | null = null
  const ast = ref()
  const parse = async (str: string) => {
    if (!_stream) {
      const unified = await import('unified').then(r => r.unified)
      const parse = await import('remark-parse').then(r => r.default)
      const gfm = await import('remark-gfm').then(r => r.default)
      const mdc = await import('../../../src').then(r => r.default)

      _stream = unified()
        .use(parse)
        .use(gfm)
        .use(mdc, mdcOptions.value)
        .use(compiler as Preset)
    }
    const res = await _stream.process(str).then(file => file.result)
    ast.value = res
  }

  watch(() => input.value, v => parse(v))
  watch(() => mdcOptions.value, () => {
    _stream = null
    parse(input.value)
  }, { deep: true })

  parse(input.value)

  return ast
}
