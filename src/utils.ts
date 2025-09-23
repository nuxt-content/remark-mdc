export const CONTAINER_NODE_TYPES = new Set([
  'componentContainerSection',
  'containerComponent',
  'leafComponent',
])

export const NON_UNWRAPPABLE_TYPES = new Set([
  'componentContainerSection',
  'componentContainerDataSection',
  'containerComponent',
  'leafComponent',
  'table',
  'pre',
  'code',
  'textComponent',
  'heading',
])

export function convertHtmlEntitiesToChars(text: string): string {
  return text.replace(/&#x([0-9A-Fa-f]+);/g, (_, hexCode) => {
    return String.fromCodePoint(Number.parseInt(hexCode, 16))
  })
  // .replace(/&#(\d+);/g, (_, decimalCode) => {
  //   return String.fromCodePoint(Number.parseInt(decimalCode, 10))
  // })
}
