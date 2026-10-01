// Generates a narrowly scoped Management API PATCH body. No credentials, network,
// provider toggles or unrelated Auth configuration. Use only with authorized access.
import { readFile } from 'node:fs/promises'
const root = new URL('../supabase/templates/', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'))
const patch = {}
for (const template of manifest) {
  patch[template.subjectKey] = template.subject
  patch[template.contentKey] = await readFile(new URL(template.file, root), 'utf8')
}
process.stdout.write(JSON.stringify(patch, null, 2) + '\n')
