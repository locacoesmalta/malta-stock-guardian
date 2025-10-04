export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Otimizações para produção
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          minifySelectors: true,
        }],
      },
    }),
  },
};
