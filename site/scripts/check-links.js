import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(__dirname, '..', 'dist');

async function getHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getHtmlFiles(full)));
    } else if (entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

async function checkLinks() {
  const htmlFiles = await getHtmlFiles(distDir);
  console.log(`Checking links across ${htmlFiles.length} HTML files...`);
  let errors = 0;

  for (const file of htmlFiles) {
    const content = await readFile(file, 'utf8');
    const hrefRegex = /href=["']([^"']+)["']/g;
    let match;
    while ((match = hrefRegex.exec(content)) !== null) {
      const href = match[1];
      // Skip external, protocol-relative, tel, mailto, javascript
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('//') ||
        href.startsWith('tel:') ||
        href.startsWith('mailto:') ||
        href.startsWith('javascript:')
      ) {
        continue;
      }

      // Parse path, query, and hash
      const withoutHash = href.split('#')[0];
      const pathPart = withoutHash.split('?')[0];

      // Check file path
      let targetFile;
      if (pathPart === '' || pathPart === '/') {
        targetFile = join(distDir, 'index.html');
      } else if (pathPart.endsWith('/')) {
        targetFile = join(distDir, pathPart, 'index.html');
      } else if (pathPart.includes('.')) {
        targetFile = join(distDir, pathPart);
      } else {
        // e.g. /about -> /about/index.html or /about.html
        targetFile = join(distDir, pathPart, 'index.html');
      }

      // Check if file exists if path was specified
      if (pathPart) {
        try {
          await readFile(targetFile);
        } catch {
          console.error(`Broken link in ${file}: "${href}" -> ${targetFile} not found`);
          errors++;
        }
      }
    }
  }

  if (errors === 0) {
    console.log('✓ All internal links valid!');
  } else {
    console.error(`✗ Found ${errors} broken link(s)`);
    process.exit(1);
  }
}

checkLinks();
