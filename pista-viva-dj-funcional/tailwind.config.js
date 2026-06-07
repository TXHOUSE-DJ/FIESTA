export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#02030a',
        ink2: '#070816',
        neonCyan: '#00e5ff',
        neonBlue: '#168bff',
        neonViolet: '#7c3cff',
        neonPink: '#ff2bd6',
        neonMagenta: '#ff1493',
        neonGreen: '#00ff88',
        softText: '#b8b8d8',
      },
      boxShadow: {
        neonPink: '0 0 18px rgba(255,43,214,.55), 0 0 44px rgba(255,43,214,.25)',
        neonCyan: '0 0 18px rgba(0,229,255,.55), 0 0 44px rgba(0,229,255,.25)',
        neonViolet: '0 0 18px rgba(124,60,255,.55), 0 0 44px rgba(124,60,255,.25)',
      },
      keyframes: {
        pulseGlow: {
          '0%,100%': { filter: 'drop-shadow(0 0 8px rgba(255,43,214,.55))' },
          '50%': { filter: 'drop-shadow(0 0 22px rgba(0,229,255,.8))' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        bars: {
          '0%,100%': { transform: 'scaleY(.35)', opacity: '.55' },
          '50%': { transform: 'scaleY(1)', opacity: '1' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 2.3s ease-in-out infinite',
        floaty: 'floaty 3.2s ease-in-out infinite',
        shimmer: 'shimmer 5s linear infinite',
        bars: 'bars 1.1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
