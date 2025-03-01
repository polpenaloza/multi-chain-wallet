module.exports = {
  $schema: 'http://json.schemastore.org/prettierrc',
  bracketSameLine: false,
  bracketSpacing: true,
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  htmlWhitespaceSensitivity: 'css',
  jsxSingleQuote: true,
  overrides: [
    {
      files: ['*.json', '*.yaml'],
      options: {
        useTabs: false,
      },
    },
  ],
  // plugins: ['prettier-plugin-tailwindcss'],
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  useTabs: false,
}
