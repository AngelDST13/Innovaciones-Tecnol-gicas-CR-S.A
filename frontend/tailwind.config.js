/**
 * Tokens semánticos: cada color apunta a una variable CSS en formato RGB,
 * así las clases de opacidad (bg-surface/60, text-ink/70...) funcionan en ambos temas.
 * Los valores de cada tema están en src/index.css.
 */
const token = (nombre) => `rgb(var(--${nombre}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        line: token('line'),
        ink: token('ink'),
        'ink-muted': token('ink-muted'),
        'ink-subtle': token('ink-subtle'),
        'brand-cyan': token('accent-cyan'),
        'brand-indigo': token('accent-indigo'),
        'brand-emerald': token('accent-emerald'),
        'brand-rose': token('accent-rose'),
        'brand-amber': token('accent-amber'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        'glow-cyan': '0 0 28px -6px rgba(45, 212, 191, 0.4)',
        'glow-indigo': '0 0 28px -6px rgba(167, 139, 250, 0.4)',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        wave: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.35' },
          '30%': { transform: 'translateY(-5px)', opacity: '1' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(3%, -2%, 0) scale(1.06)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out both',
        'slide-up': 'slideUp 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'scale-in': 'scaleIn 0.28s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        float: 'float 7s ease-in-out infinite',
        wave: 'wave 1.2s ease-in-out infinite',
        drift: 'drift 18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
