const fs = require('fs');
const path = require('path');
const os = require('os');

// ***********************
// HELPER FUNCTIONS/VALUES
// ***********************
const generatedDirPath = path.join(__dirname, 'generated');
const getPath = (generatedFileName) => path.join(generatedDirPath, generatedFileName);
const writeFile = ({path, content}) => {
  fs.writeFileSync(path, content);
  console.log(`wrote file ${path}:`);
  console.log(content);
  console.log('----------');
}

// ***********
// WRITE FILES
// ***********
const prefix = 'const bakedEnv: Record<string, string | undefined> = {';

let body = os.EOL;
Object.entries(process.env).forEach(([key, value]) => {
  if (key.startsWith('NODE_APP_')) {
    body += `  ${key}: '${value || ''}',${os.EOL}`;
  }
});

const envVariablesNotFound = body === os.EOL;
if (envVariablesNotFound) {
  // Erase the end of line character so that the file will be formatted nicely
  body = '';
}

const suffix = `};${os.EOL}`;

// Export a separate function in order to mock more easily in tests
const getBakedEnv =
  `export const getBakedEnv = (key: string): string | undefined => bakedEnv[key];${os.EOL}`;

writeFile({
  path: getPath('baked-env.ts'),
  content: prefix + body + suffix + getBakedEnv,
});
