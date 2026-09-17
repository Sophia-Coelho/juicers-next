import { useEffect, useRef, useState } from 'react'
import '../style/historicoExames.css'
import { createExam, deleteExam, getMyExams } from '../services/api'

const RISK_LABELS = {
    high: 'Risco alto',
    warn: 'Atenção',
    normal: 'Normal',
    processing: 'Processando…',
}

function RiskBadge({ risk }) {
    return (
        <span className={`he-badge he-badge--${risk || 'processing'}`}>
            {RISK_LABELS[risk] || 'Processando…'}
        </span>
    )
}

function PdfIcon() {
    return (
        <div className="he-pdf-icon">
            <svg viewBox="0 0 16 16" fill="none" stroke="#c0392b" strokeWidth="1.4">
                <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" />
                <path d="M5 6h6M5 8.5h6M5 11h4" />
            </svg>
        </div>
    )
}

function StatCard({ label, value, sub, modifier }) {
    return (
        <div className="he-stat-card">
            <div className="he-stat-label">{label}</div>
            <div className={`he-stat-val${modifier ? ` he-stat-val--${modifier}` : ''}`}>
                {value}
            </div>
            {sub && <div className="he-stat-sub">{sub}</div>}
        </div>
    )
}

function Toast({ msg, show, warn }) {
    return (
        <div className={`he-toast${show ? ' he-toast--show' : ''}`}>
            <div className={`he-toast-dot${warn ? ' he-toast-dot--warn' : ''}`} />
            {msg}
        </div>
    )
}

function formatarData(data) {
    if (!data) return '—'

    const dataCorrigida = new Date(`${data}T00:00:00`)

    return dataCorrigida
        .toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
        .replace('.', '')
}

function mapRiskLevel(riskLevel) {
    if (riskLevel === 'high') return 'high'
    if (riskLevel === 'attention') return 'warn'
    if (riskLevel === 'normal') return 'normal'
    return 'processing'
}

export default function HistoricoExames() {
    const [exams, setExams] = useState([])
    const [loading, setLoading] = useState(true)
    const [dragging, setDragging] = useState(false)
    const [toast, setToast] = useState({ show: false, msg: '', warn: false })

    const fileRef = useRef()

    const showToast = (msg, warn = false) => {
        setToast({ show: true, msg, warn })
        setTimeout(() => setToast(t => ({ ...t, show: false })), 3200)
    }

    useEffect(() => {
        async function carregarExames() {
            try {
                const data = await getMyExams()
                setExams(data.exams || [])
            } catch (error) {
                showToast(error.message || 'Erro ao carregar exames', true)
            } finally {
                setLoading(false)
            }
        }

        carregarExames()
    }, [])

    const addExam = async (file) => {
        if (!file || file.type !== 'application/pdf') {
            showToast('Apenas arquivos PDF são aceitos', true)
            return
        }

        try {
            const hoje = new Date().toISOString().split('T')[0]

            const data = await createExam({
                examDate: hoje,
                source: 'manual',
                markers: {},
                riskLevel: 'attention',
                alerts: [`PDF importado: ${file.name}`],
            })

            setExams(prev => [data.exam, ...prev])
            showToast(`"${file.name}" importado com sucesso`)
        } catch (error) {
            showToast(error.message || 'Erro ao importar exame', true)
        }
    }

    const removeExam = async (id, e) => {
        e.stopPropagation()

        try {
            await deleteExam(id)
            setExams(prev => prev.filter(ex => ex._id !== id))
            showToast('Exame removido', true)
        } catch (error) {
            showToast(error.message || 'Erro ao remover exame', true)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragging(false)
        addExam(e.dataTransfer.files[0])
    }

    const highCount = exams.filter(e => e.riskLevel === 'high').length
    const lastDate = exams[0]?.examDate ? formatarData(exams[0].examDate) : '—'

    return (
        <div className="he-wrap">
            <div className="he-page">
                <div className="he-page-header">
                    <h1>Histórico de Exames</h1>
                    <p>Upload e gestão dos seus laudos laboratoriais</p>
                </div>

                <div className="he-stats">
                    <StatCard
                        label="Total de exames"
                        value={exams.length}
                        sub="laudos importados"
                    />

                    <StatCard
                        label="Último exame"
                        value={lastDate}
                        sub="exame mais recente"
                        modifier="muted"
                    />

                    <StatCard
                        label="Alertas ativos"
                        value={highCount}
                        sub="marcadores fora do limite"
                        modifier={highCount > 0 ? 'red' : 'green'}
                    />
                </div>

                <div
                    className={`he-upload-zone${dragging ? ' he-upload-zone--dragging' : ''}`}
                    onClick={() => fileRef.current.click()}
                    onDragOver={e => {
                        e.preventDefault()
                        setDragging(true)
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                >
                    <div className="he-upload-icon">
                        <svg viewBox="0 0 20 20" fill="none" stroke="#262121" strokeWidth="1.5">
                            <path d="M10 13V7M7 10l3-3 3 3" />
                            <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
                        </svg>
                    </div>

                    <div className="he-upload-title">Arrastar PDF de exame aqui</div>

                    <div className="he-upload-sub">
                        ou clique para selecionar arquivo · PDF, até 20MB
                    </div>

                    <div className="he-upload-btn">Selecionar arquivo</div>

                    <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf"
                        style={{ display: 'none' }}
                        onChange={e => {
                            addExam(e.target.files[0])
                            e.target.value = ''
                        }}
                    />
                </div>

                <div className="he-section-title">Exames importados</div>

                <div className="he-exam-list">
                    {loading && (
                        <div className="he-exam-empty">
                            Carregando exames...
                        </div>
                    )}

                    {!loading && exams.length === 0 && (
                        <div className="he-exam-empty">
                            Nenhum exame importado ainda.
                        </div>
                    )}

                    {!loading && exams.map(exam => (
                        <div key={exam._id} className="he-exam-card">
                            <PdfIcon />

                            <div>
                                <div className="he-exam-name">
                                    {exam.alerts?.[0] || 'Exame laboratorial'}
                                </div>

                                <div className="he-exam-meta">
                                    {formatarData(exam.examDate)} ·{' '}
                                    {exam.source === 'manual' ? 'Importado manualmente' : 'PDF'} · MongoDB
                                </div>
                            </div>

                            <div className="he-exam-badges">
                                <RiskBadge risk={mapRiskLevel(exam.riskLevel)} />

                                <span className="he-badge he-badge--pdf">
                                    PDF
                                </span>

                                <button
                                    className="he-btn-remove"
                                    title="Remover"
                                    onClick={e => removeExam(exam._id, e)}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Toast msg={toast.msg} show={toast.show} warn={toast.warn} />
        </div>
    )
}