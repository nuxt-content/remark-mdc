<template>
  <div>
    <label for="autoUnwrap">
      <input
        id="autoUnwrap"
        v-model="mdcOptions.experimental.autoUnwrap"
        type="checkbox"
      > auto unwrap
    </label>
    <label for="componentCodeBlockYamlProps">
      <input
        id="componentCodeBlockYamlProps"
        v-model="mdcOptions.experimental.componentCodeBlockYamlProps"
        type="checkbox"
      >
      Component props code block style
    </label>
    <div class="flex">
      <textarea
        v-model="markdown"
        class="flex-1"
      />
      <JsonViewer
        :value="ast || {}"
        class="flex-1 whitespace-pre-wrap"
        theme="dark"
        expanded
        :expand-depth="3"
      />
      <pre class="flex-1">{{ md }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { JsonViewer } from 'vue3-json-viewer'
import 'vue3-json-viewer/dist/vue3-json-viewer.css'

const mdcOptions = ref({ experimental: { autoUnwrap: true, componentCodeBlockYamlProps: false } })
const markdown = ref(`::page-section
- This is a list item.

  :::container
  ~~~json
  function a() {
    return 'a'
  }
  function b() {
    return 'b'
  }
  function c() {
    return 'c'
  }
  function d() {
    return 'd'
  }
  ~~~
  :::
::`)
const ast = useMarkdownParser(markdown, mdcOptions)
const md = useMarkdownGenerator(ast, mdcOptions)
</script>

<style>
.flex {
  display: flex;
  width: 100%;
}

.flex-1 {
  flex: 1;
  height: calc(100vh - 40px);
  overflow: scroll;
}
</style>
