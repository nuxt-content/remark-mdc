import { describe, it, expect } from 'vitest'
import { markdownToAST } from './utils/markdown'

describe('html', () => {
  it('should parse html', async () => {
    const md1 = `<Hero>

<template #description>dedsdsc</template>

</Hero>`

    const ast1 = {
      "type": "minimark",
      "value": [
        ["html", {}, "<Hero>"],
        [
          "paragraph",
          {},
          ["html", {}, "<template #description>"],
          "dedsdsc",
          ["html", {}, "</template>"]
        ],
        ["html", {}, "</Hero>"]
      ]
    }
    const { ast } = await markdownToAST(md1)
    const minimark = fromHast(ast)
    expect(minimark).toMatchObject(ast1)
  })

  it('should parse less space', async () => {
    const md1 = `<Hero>
<template #description>dedsdsc</template>
</Hero>`

    const ast1 = {
      "type": "minimark",
      "value": [
        ["html", {}, "<Hero>"],
        [
          "paragraph",
          {},
          ["html", {}, "<template #description>"],
          "dedsdsc",
          ["html", {}, "</template>"],
        ],
        ["html", {}, "</Hero>"]
      ]
    }
    const { ast } = await markdownToAST(md1)
    const minimark = fromHast(ast)
    // console.log(JSON.stringify(minimark, null, 2))
    expect(minimark).toMatchObject(ast1)
  })
})


function fromHast(tree) {
	return {
		type: "minimark",
		value: tree.children.map(hastToMinimarkNode).filter((v) => v !== void 0)
	};
}
function hastToMinimarkNode(input) {
	if (input.type === "comment") return void 0;
	if (input.type === "text") return input.value;
	if (input.type === "html") return ["html", {}, input.value];
	if (input.tag === "code" && input.props?.className && input.props.className.length === 0) delete input.props.className;
	return [
		input.tag || input.type,
		input.props || {},
		...(input.children || []).map(hastToMinimarkNode).filter((v) => v !== void 0)
	];
}