// @ts-check

/**
 * Sidebar for the main docs instance.
 * Docs root: website/docs/
 * routeBasePath: '/' — pages served at /getting-started/..., /guides/..., etc.
 */

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  mainSidebar: [
    // ── Getting Started ───────────────────────────────────────────────────────
    {
      type: 'category',
      label: 'Getting Started',
      collapsible: true,
      collapsed: false,
      link: { type: 'doc', id: 'getting-started/index' },
      items: [
        {
          type: 'doc',
          id: 'getting-started/choose-your-setup-path',
          label: 'Choose Setup Path',
        },
        {
          type: 'category',
          label: 'Repo Install',
          collapsible: true,
          collapsed: false,
          link: { type: 'doc', id: 'getting-started/repo-install/index' },
          items: [
            {
              type: 'doc',
              id: 'getting-started/repo-install/choose-retrieval-mode',
              label: 'Choose Retrieval Mode',
            },
            {
              type: 'doc',
              id: 'getting-started/repo-install/install-the-kit',
              label: 'Install the Kit',
            },
            {
              type: 'doc',
              id: 'getting-started/repo-install/configure-docs-fallback',
              label: 'Configure RAG',
            },
            {
              type: 'doc',
              id: 'getting-started/repo-install/enable-in-your-client',
              label: 'Enable in Your Client',
            },
            {
              type: 'doc',
              id: 'getting-started/repo-install/verify-installation',
              label: 'Verify Installation',
            },
          ],
        },
      ],
    },

    // ── Guides ────────────────────────────────────────────────────────────────
    {
      type: 'category',
      label: 'Guides',
      collapsible: true,
      collapsed: false,
      link: { type: 'doc', id: 'guides/index' },
      items: [
        {
          type: 'doc',
          id: 'guides/indexing-guidance',
          label: 'Indexing guidance',
        },
        {
          type: 'doc',
          id: 'guides/update-policy-url-stability',
          label: 'Update policy & URL stability',
        },
        {
          type: 'doc',
          id: 'guides/admin-managed-enforcement',
          label: 'Admin-managed enforcement',
        },
      ],
    },

    // ── Troubleshooting ───────────────────────────────────────────────────────
    {
      type: 'doc',
      id: 'troubleshooting/index',
      label: 'Troubleshooting',
    },

    // ── Evaluating Accessible Output ──────────────────────────────────────────
    {
      type: 'doc',
      id: 'evaluating-accessible-output/index',
      label: 'Evaluating Accessible Output',
    },
  ],
};

module.exports = sidebars;
