import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgPath = path.join(__dirname, '../package.json');
const publicPath = path.join(__dirname, '../public/build-version.json');

async function exportBuildVersion() {
	const pkgRaw = await readFile(pkgPath, 'utf8');
	const pkg = JSON.parse(pkgRaw);
	const buildVersion = pkg.buildVersion || 0;
	const buildDate = new Date().toISOString();
	await writeFile(publicPath, JSON.stringify({ buildVersion, buildDate }, null, 2));
	console.log(`Exported build version: ${buildVersion} (${buildDate})`);
}

exportBuildVersion().catch(err => {
	console.error('Failed to export build version:', err);
	process.exit(1);
});
