import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import clsx from 'clsx';

const FRAMEWORKS = [
  {
    label: 'React (Web)',
    href: '/web/react',
    description:
      'Accessible component patterns for React applications, covering buttons, dialogs, carousels, grids, and more.',
    badge: { label: 'Beta', type: 'primary' },
    cta: 'Browse Patterns',
  },
  {
    label: 'Android (Compose)',
    href: '/android',
    description: 'Jetpack Compose accessibility patterns — coming soon.',
    badge: { label: 'Coming Soon', type: 'secondary' },
    cta: null,
  },
  {
    label: 'iOS (SwiftUI)',
    href: '/ios',
    description: 'SwiftUI accessibility patterns — coming soon.',
    badge: { label: 'Coming Soon', type: 'secondary' },
    cta: null,
  },
];

function FrameworkCard({ label, href, description, badge, cta }) {
  return (
    <div className="col col--4">
      <div className="card shadow--md" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="card__header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>{label}</h3>
            <span className={clsx('badge', `badge--${badge.type}`)}>{badge.label}</span>
          </div>
        </div>
        <div className="card__body">
          <p>{description}</p>
        </div>
        {cta && (
          <div className="card__footer">
            <Link className="button button--primary button--block" to={href}>
              {cta}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <header className="hero hero--primary">
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <p style={{ maxWidth: '640px' }}>
            A structured corpus of production-ready accessibility patterns for modern UI frameworks.
            Each pattern provides prescriptive guidance, a golden implementation, and acceptance
            checks — ready for developer AI contexts, design system docs, or direct team reference.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link className="button button--secondary button--lg" to="/web/react">
              Browse React Patterns
            </Link>
            <Link className="button button--outline button--secondary button--lg" to="/getting-started">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section style={{ padding: '3rem 0' }}>
          <div className="container">
            <h2>Choose a Framework</h2>
            <div className="row" style={{ marginTop: '1.5rem' }}>
              {FRAMEWORKS.map((fw) => (
                <FrameworkCard key={fw.href} {...fw} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
