export default defineAppConfig({
  docus: {
    title: 'Remark MDC',
    description: 'Remark plugin to parse Markdown Components syntax.',
    image: 'https://remark-mdc.nuxt.space/cover.png',

    socials: {
      twitter: 'nuxt_js',
      github: 'nuxt-content/remark-mdc',
      nuxt: {
        label: 'Nuxt',
        icon: 'simple-icons:nuxtdotjs',
        href: 'https://nuxt.com',
      },
    },

    github: {
      dir: 'docs/content',
      branch: 'main',
      repo: 'remark-mdc',
      owner: 'nuxt-content',
      edit: true,
    },

    aside: {
      level: 0,
      collapsed: false,
      exclude: [],
    },

    main: {
      padded: true,
      fluid: false,
    },

    header: {
      logo: false,
      showLinkIcon: true,
      exclude: [],
      fluid: false,
      title: 'Remark MDC',
    },
  },
})
