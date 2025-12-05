# Phạm Thành Nam - Personal Website & Blog

Welcome to the source code of my personal website and blog.
This project is built with **[Astro 5.0](https://astro.build/)** and **[Tailwind CSS](https://tailwindcss.com/)**, serving as a portfolio, technical blog, and a playground for my web experiments.

## 🚀 About The Project

This repository powers **[bug.edu.vn](https://bug.edu.vn)**.
The site is designed to be highly performant, accessible, and SEO-friendly, leveraging the modern "Island Architecture" of Astro.

### ✨ Key Features

- **High Performance**: Static site generation (SSG) with minimal client-side JavaScript for lightning-fast loads.
- **Modern Design**: Clean, responsive UI built with Tailwind CSS, featuring automatic Dark/Light mode support.
- **Content Engine**: robust blog system using Markdown/MDX with support for:
  - Syntax highlighting
  - Categories & Tags
  - Estimated reading time
  - Draft mode & scheduling
- **SEO Optimized**: Built-in support for sitemaps, Open Graph tags, JSON-LD structured data, and canonical URLs.
- **Fully Type-Safe**: Developed with TypeScript for reliability and maintainability.

## 🛠️ Tech Stack

- **Core Framework**: [Astro](https://astro.build/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: Astro, React (for interactive islands)
- **Icons**: [Tabler Icons](https://tabler-icons.io/) (via `astro-icon`)
- **Deployment**: Compatible with Vercel, Netlify, Cloudflare Pages, etc.

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites

- **Node.js**: Version `18.17.1` or higher is required.
- **Package Manager**: `npm`, `pnpm`, or `yarn`.

### Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/ptn1411/astro-blog.git
    cd astro-blog
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

### ⚡ Development

Start the local development server:

```bash
npm run dev
```

The site will be available at `http://localhost:4321`. Changes to files will automatically reload the page.

### 📦 Build for Production

To build the project for deployment:

```bash
npm run build
```

The optimized static assets will be generated in the `dist/` directory.

You can preview the production build locally:

```bash
npm run preview
```

## 📂 Project Structure

Here's an overview of the project's file structure:

```text
/
├── public/             # Static assets (fonts, images, global files like robots.txt)
├── src/
│   ├── assets/         # Bundled assets (images, styles)
│   ├── components/     # UI components (Header, Footer, Widgets, etc.)
│   ├── content/        # Content collections (Blog posts in .md/.mdx)
│   ├── layouts/        # Page layouts (Base, Page, Blog layouts)
│   ├── pages/          # File-based routing (index.astro, [...blog].astro)
│   ├── utils/          # Utility functions and helpers
│   └── config.yaml     # Centralized site configuration
├── astro.config.ts     # Astro configuration file
├── tailwind.config.cjs # Tailwind configuration
└── package.json        # Project dependencies and scripts
```

## ⚙️ Configuration

The project's main settings can be found in `src/config.yaml`.
You can easily customize:

- Site Metadata (Name, Description, URL)
- Blog Settings (Posts per page, Permalinks)
- UI Preferences
- Analytics IDs
- Structured Data / Schema.org info

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/ptn1411/astro-blog/issues).

## 🙏 Credits

This project is built upon the solid foundation of [AstroWind](https://github.com/arthelokyo/astrowind), a fantastic template for Astro.
A huge thanks to the open-source community for the tools that make this possible.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/ptn1411">Phạm Thành Nam</a>
</p>
