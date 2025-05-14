// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Expo LLM MediaPipe',
  tagline: 'Run LLMs locally on Android and iOS using MediaPipe',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://tirthajyoti-ghosh.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/expo-llm-mediapipe/',

  // GitHub pages deployment config.
  organizationName: 'tirthajyoti-ghosh', // Your GitHub org/user name.
  projectName: 'expo-llm-mediapipe', // Your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe/edit/main/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'Expo LLM MediaPipe',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docs', // Updated to match the correct sidebar ID
            position: 'left',
            label: 'Docs',
          },
          {
            href: 'https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting started',
                to: '/docs/getting-started',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/expo-llm-mediapipe',
              },
              {
                label: 'Discord',
                href: 'https://discordapp.com/invite/expo',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/expo',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Expo LLM MediaPipe. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;