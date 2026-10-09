/**
 * diagnostico.mjs — mostra o que REALMENTE está no banco e se o parser funciona.
 *
 * Rode de dentro da pasta backend:
 *
 *     cd backend
 *     node diagnostico.mjs
 *
 * Usa o seu próprio .env. Não grava nem altera nada — só lê e imprime.
 * Pode colar a saída inteira: ela não contém senha nem a string de conexão.
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const linha = (t = '') => console.log(t)
const titulo = (t) => { linha(); linha('─'.repeat(64)); linha(t); linha('─'.repeat(64)) }

async function main() {
  titulo('1. CONEXÃO')

  if (!process.env.MONGO_URI) {
    linha('MONGO_URI não encontrada. O .env está em backend/.env?')
    process.exit(1)
  }

  // Mostra só o host, nunca usuário/senha
  try {
    const u = new URL(process.env.MONGO_URI.replace('mongodb+srv://', 'https://').replace('mongodb://', 'https://'))
    linha(`host do banco : ${u.hostname}`)
    linha(`base          : ${u.pathname.replace('/', '') || '(padrão)'}`)
  } catch {
    linha('MONGO_URI presente (formato não reconhecido para exibição)')
  }

  await mongoose.connect(process.env.MONGO_URI)
  linha('conectado     : sim')

  const db = mongoose.connection.db
  linha(`banco em uso  : ${db.databaseName}`)

  const cols = (await db.listCollections().toArray()).map(c => c.name).sort()
  linha(`coleções      : ${cols.join(', ')}`)

  titulo('2. CONTAGENS')
  for (const nome of ['users', 'patients', 'exams', 'doctors']) {
    if (cols.includes(nome)) {
      linha(`${nome.padEnd(10)} ${await db.collection(nome).countDocuments()}`)
    } else {
      linha(`${nome.padEnd(10)} (coleção não existe)`)
    }
  }

  titulo('3. EXAMES — o que está gravado em markers')

  const exams = await db.collection('exams').find({}).sort({ examDate: 1 }).toArray()

  if (!exams.length) {
    linha('NENHUM exame na coleção. É por isso que o dashboard está vazio.')
  }

  // nome do paciente para cada exame
  const patients = await db.collection('patients').find({}).toArray()
  const users = await db.collection('users').find({}).toArray()
  const nomePaciente = (patientId) => {
    const p = patients.find(x => String(x._id) === String(patientId))
    if (!p) return '(paciente não encontrado)'
    const u = users.find(x => String(x._id) === String(p.userId))
    return u ? `${u.name} <${u.email}>` : `(patient ${p._id})`
  }

  for (const e of exams) {
    const m = e.markers
    const tipo = m === null ? 'null' : m === undefined ? 'undefined' : Array.isArray(m) ? 'array' : typeof m
    const chaves = m && typeof m === 'object' && !Array.isArray(m) ? Object.keys(m) : []

    linha()
    linha(`exame _id     : ${e._id}`)
    linha(`  paciente    : ${nomePaciente(e.patientId)}`)
    linha(`  examDate    : ${JSON.stringify(e.examDate)}  (tipo ${typeof e.examDate})`)
    linha(`  source      : ${e.source}   arquivo: ${e.originalFileName || '(vazio)'}`)
    linha(`  riskLevel   : ${e.riskLevel}`)
    linha(`  markers     : tipo=${tipo}  nº de chaves=${chaves.length}`)

    if (chaves.length) {
      chaves.forEach(k => {
        const v = m[k]
        linha(`      ${k.padEnd(16)} = ${JSON.stringify(v)}   (tipo ${typeof v})`)
      })
    } else {
      linha('      >>> VAZIO — nenhum marcador gravado neste exame <<<')
    }

    linha(`  alerts      : ${JSON.stringify(e.alerts || [])}`)
  }

  titulo('4. PACIENTES E VÍNCULO COM MÉDICO')
  for (const p of patients) {
    const u = users.find(x => String(x._id) === String(p.userId))
    const n = exams.filter(e => String(e.patientId) === String(p._id)).length
    const comMarcadores = exams.filter(e =>
      String(e.patientId) === String(p._id) &&
      e.markers && typeof e.markers === 'object' && Object.keys(e.markers).length > 0
    ).length
    linha(`${(u ? u.name : '(sem user)').padEnd(22)} ${n} exame(s), ${comMarcadores} com marcadores   doctorId=${p.doctorId || '(nenhum)'}`)
  }

  titulo('5. PARSER DE PDF — funciona neste ambiente?')

  const candidatos = [
    path.join(__dirname, '..', 'laudo-demo-rafael-abr2026.pdf'),
    path.join(__dirname, 'laudo-demo-rafael-abr2026.pdf'),
  ]
  const pdfPath = candidatos.find(p => fs.existsSync(p))

  if (!pdfPath) {
    linha('PDF de demonstração não encontrado. Procurei em:')
    candidatos.forEach(c => linha(`  ${c}`))
  } else {
    linha(`arquivo: ${pdfPath}`)
    try {
      const mod = require('pdf-parse')
      const pdfParse = typeof mod === 'function' ? mod : mod.default

      if (typeof pdfParse !== 'function') {
        linha(`ERRO: pdf-parse não exporta função. typeof=${typeof mod}, chaves=${Object.keys(mod).slice(0, 8).join(',')}`)
        linha(`versão instalada: ${require('pdf-parse/package.json').version}`)
      } else {
        const data = await pdfParse(fs.readFileSync(pdfPath))
        linha(`texto extraído: ${data.text.length} caracteres`)

        const { parseExamPdfText } = await import('./src/utils/examPdfParser.js')
        const r = parseExamPdfText(data.text)
        const n = Object.keys(r.markers || {}).length

        linha(`examDate      : ${r.examDate}`)
        linha(`riskLevel     : ${r.riskLevel}`)
        linha(`marcadores    : ${n} de 17`)
        if (n) {
          Object.entries(r.markers).forEach(([k, v]) => linha(`      ${k.padEnd(16)} = ${v}`))
        } else {
          linha('      >>> o parser não extraiu nada deste PDF <<<')
          linha('      primeiros 400 caracteres do texto extraído:')
          linha('      ' + JSON.stringify(data.text.slice(0, 400)))
        }
      }
    } catch (err) {
      linha(`ERRO ao testar o parser: ${err.message}`)
    }
  }

  titulo('FIM')
  await mongoose.disconnect()
}

main().catch(async (e) => {
  console.error('\nFALHOU:', e.message)
  try { await mongoose.disconnect() } catch {}
  process.exit(1)
})
