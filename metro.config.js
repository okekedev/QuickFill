const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Simple, clean configuration
config.resolver.alias = {
  ...config.resolver.alias,
  buffer: 'buffer',
};

config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.unstable_enablePackageExports = false;

module.exports = config;