/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: 'var(--surface-base)',
          elevated: 'var(--surface-elevated)',
          overlay: 'var(--surface-overlay)',
        },
        ink: {
          primary: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          tertiary: 'var(--ink-tertiary)',
          muted: 'var(--ink-muted)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          standard: 'var(--border-standard)',
          emphasis: 'var(--border-emphasis)',
          strong: 'var(--border-strong)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
        },
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
      },
      ringColor: {
        DEFAULT: 'var(--accent)',
      },
    },
  },
  plugins: [],
}