/** Configuración de Jest para módulos ES nativos (sin transpilar). */
export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  transform: {},
  clearMocks: true,
};
