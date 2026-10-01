import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

test('email patch contains only subjects and templates; native verification links and OTP are preserved', async () => {
  const manifest = JSON.parse(await readFile('supabase/templates/manifest.json', 'utf8'))
  const patch = JSON.parse(execFileSync(process.execPath, ['tooling/auth-email-config.mjs'], { encoding: 'utf8' }))
  assert.equal(manifest.length, 13)
  assert.equal(Object.keys(patch).length, 26)
  for (const key of Object.keys(patch)) assert.match(key, /^mailer_(subjects_[a-z_]+|templates_[a-z_]+_content)$/)
  assert.ok(!Object.keys(patch).some(key => /enabled|smtp|redirect|secret/.test(key)), 'No provider, cost, sender or security toggles')
  for (const item of manifest) {
    const html = await readFile('supabase/templates/' + item.file, 'utf8')
    assert.equal(patch[item.contentKey], html)
    assert.equal(patch[item.subjectKey], item.subject)
    assert.match(item.subject, /Marcador Futbolín V3/)
    if (['confirmation', 'recovery', 'email_change', 'magic_link', 'invite'].includes(item.name)) assert.equal((html.match(/href="{{ \.ConfirmationURL }}"/g) ?? []).length, 2)
    if (item.name === 'reauthentication') assert.match(html, /{{ \.Token }}/)
    assert.ok(!/<script|<form|<input|<img|https?:\/\//i.test(html), 'No tracking or external assets')
  }
})
