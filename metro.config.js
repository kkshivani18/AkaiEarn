const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add .js extension to source extensions for proper resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'js', 'jsx', 'json', 'ts', 'tsx', 'cjs'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes("zustand")) {
    const result = require.resolve(moduleName);
    return context.resolveRequest(context, result, platform);
  }

  if (moduleName.includes("rpc-websockets")) {
    const result = require.resolve(moduleName);
    return context.resolveRequest(context, result, platform);
  }

  // Handle .js imports from TypeScript files (viem/ox issue)
  if (moduleName.endsWith('.js')) {
    const tsModuleName = moduleName.replace(/\.js$/, '.ts');
    try {
      return context.resolveRequest(context, tsModuleName, platform);
    } catch {
      // Fall through to default resolution
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;