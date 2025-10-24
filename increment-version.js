import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgPath = path.join(__dirname, 'package.json');
async function incrementVersion() {
	const pkgRaw = await readFile(pkgPath, 'utf8');
	const pkg = JSON.parse(pkgRaw);
	const versionKey = 'buildVersion';
	let buildVersion = pkg[versionKey] || 0;
	buildVersion++;
	pkg[versionKey] = buildVersion;
	await writeFile(pkgPath, JSON.stringify(pkg, null, 2));
	console.log(`Build version incremented to: ${buildVersion}`);
}

incrementVersion().catch(err => {
	console.error('Failed to increment build version:', err);
	process.exit(1);
});
