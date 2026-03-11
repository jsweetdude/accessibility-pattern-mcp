// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Accessibility Pattern API',
  tagline: 'Production-ready accessibility patterns for modern frameworks',
  favicon: 'img/favicon.svg',

  url: 'https://accessibility-pattern-api.vercel.app',
  baseUrl: '/',

  organizationName: 'jsweetdude',
  projectName: 'accessibility-pattern-api',

  // Fail the build on broken internal links so Vercel catches regressions before deploy.
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Process .md files as standard CommonMark (not MDX) so that HTML tags
  // like <button> or <a href> in prose text do not cause JSX parse errors.
  markdown: {
    format: 'detect',
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        // Disable the preset's built-in docs plugin; we use plugin instances below.
        docs: false,
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.8,
        },
      }),
    ],
  ],

  plugins: [
    // ── Main (Installation + Operations) ──────────────────────────────────────
    // routeBasePath: '/' serves docs at /installation/... and /operations/...
    // Docs root: /docs at repo root (sibling of /patterns and /website).
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'main',
        path: 'docs',
        routeBasePath: '/',
        sidebarPath: './sidebars-main.js',
        breadcrumbs: true,
      },
    ],

    // ── React (Web) ───────────────────────────────────────────────────────────
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'web-react',
        path: '../patterns/web/react',
        routeBasePath: 'web/react',
        sidebarPath: './sidebars-web-react.js',
        exclude: ['**/patterns.json'],
        // Show last-updated date from git
        showLastUpdateTime: true,
        // Breadcrumbs for better navigation
        breadcrumbs: true,
      },
    ],

    // ── Android (Compose) ─────────────────────────────────────────────────────
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'android',
        path: '../patterns/android',
        routeBasePath: 'android',
        sidebarPath: './sidebars-android.js',
        breadcrumbs: true,
      },
    ],

    // ── iOS (SwiftUI) ─────────────────────────────────────────────────────────
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'ios',
        path: '../patterns/ios',
        routeBasePath: 'ios',
        sidebarPath: './sidebars-ios.js',
        breadcrumbs: true,
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },

      navbar: {
        title: 'A11y Patterns',
        logo: {
          alt: 'Accessibility Pattern API Logo',
          src: 'img/logo.svg',
          srcDark: 'img/logo-dark.svg',
        },
        items: [
          {
            label: 'Getting Started',
            to: '/getting-started',
            position: 'left',
          },
          {
            label: 'Guides',
            to: '/guides',
            position: 'left',
          },
          {
            type: 'dropdown',
            label: 'Frameworks',
            position: 'left',
            items: [
              {
                label: 'React (Web)',
                to: '/web/react',
              },
              {
                label: 'Android (Compose)',
                to: '/android',
              },
              {
                label: 'iOS (SwiftUI)',
                to: '/ios',
              },
            ],
          },
          {
            href: 'https://github.com/jsweetdude/accessibility-pattern-api',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },

      footer: {
        style: 'dark',
        links: [
          {
            title: 'Frameworks',
            items: [
              { label: 'React (Web)', to: '/web/react' },
              { label: 'Android (Compose)', to: '/android' },
              { label: 'iOS (SwiftUI)', to: '/ios' },
            ],
          },
          {
            title: 'Resources',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/jsweetdude/accessibility-pattern-api',
              },
              {
                label: 'WCAG 2.2',
                href: 'https://www.w3.org/TR/WCAG22/',
              },
              {
                label: 'ARIA Authoring Practices Guide',
                href: 'https://www.w3.org/WAI/ARIA/apg/',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Accessibility Pattern API. Built with Docusaurus.`,
      },

      prism: {
        theme: require('prism-react-renderer').themes.github,
        darkTheme: require('prism-react-renderer').themes.dracula,
        additionalLanguages: ['bash', 'json', 'yaml'],
      },

      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: false,
        },
      },
    }),
};

module.exports = config;
