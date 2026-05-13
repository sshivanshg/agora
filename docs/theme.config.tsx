import type { DocsThemeConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  logo: <span style={{ fontFamily: "monospace", letterSpacing: "0.08em" }}>agora</span>,
  project: {
    link: "https://github.com/your-org/agora",
  },
  docsRepositoryBase: "https://github.com/your-org/agora/tree/main/docs",
  footer: {
    content: "© Agora contributors — Apache 2.0",
  },
  darkMode: true,
};

export default config;
