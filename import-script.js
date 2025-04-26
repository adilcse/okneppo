// import-script.js
require('ts-node').register({
    transpileOnly: true,
    compilerOptions: {
      module: 'commonjs'
    }
  });
  
  require('./src/scripts/import-products.ts');