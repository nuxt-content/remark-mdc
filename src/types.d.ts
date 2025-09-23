import type { ParseOptions } from 'yaml'

interface ComponentHandler {
  name: string
  instance: any
  options?: any
}

export interface YamlOptions extends ParseOptions {
  prefix?: string
  suffix?: string
  preserveOrder?: boolean
}

export interface RemarkMDCOptions {
  components?: ComponentHandler[]
  frontmatter?: YamlOptions
  attributes?: {
    maxLength?: number
    preserveOrder?: boolean
    yamlCodeBlock?: boolean
  }
  autoUnwrap?: boolean | {}
  /**
   * @deprecated Use `attributes.yamlCodeBlock`
   */
  yamlCodeBlockProps?: boolean
  /**
   * @deprecated Use `attributes.maxLength`
   */
  maxAttributesLength?: number
  experimental?: {
    /**
     * @deprecated This feature is out of experimental, use `autoUnwrap`
     */
    autoUnwrap?: boolean
    /**
     * @deprecated This feature is out of experimental, use `yamlCodeBlockProps`
     */
    componentCodeBlockYamlProps?: boolean
  }
}
