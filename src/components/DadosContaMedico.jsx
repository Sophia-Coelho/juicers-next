import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
    getMyDoctorProfile,
    updateMyDoctorProfile,
} from '../services/api'
import '../style/dadosContaMedico.css'

const INITIAL = {
    nome: '',
    sobrenome: '',
    email: '',
    crm: '',
    specialty: '',
    ultimaAtualizacao: '',
}

function separarNome(nomeCompleto = '') {
    const partes = nomeCompleto.trim().split(' ').filter(Boolean)

    return {
        nome: partes[0] || '',
        sobrenome: partes.slice(1).join(' '),
    }
}

function Toast({ msg, show, warn }) {
    return (
        <div className={`dcm-toast${show ? ' dcm-toast--show' : ''}`}>
            <div className={`dcm-toast-dot${warn ? ' dcm-toast-dot--warn' : ''}`} />
            {msg}
        </div>
    )
}

export default function DadosContaMedico() {
    const { usuario } = useAuth()

    const [form, setForm] = useState(INITIAL)
    const [saved, setSaved] = useState(INITIAL)
    const [toast, setToast] = useState({ show: false, msg: '', warn: false })
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)

    const [senhaAtual, setSenhaAtual] = useState('')
    const [novaSenha, setNovaSenha] = useState('')
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [salvandoSenha, setSalvandoSenha] = useState(false)

    const dirty = JSON.stringify(form) !== JSON.stringify(saved)

    const update = (key, val) => {
        setForm(prev => ({
            ...prev,
            [key]: val,
        }))
    }

    const showToast = (msg, warn = false) => {
        setToast({ show: true, msg, warn })
        setTimeout(() => setToast(t => ({ ...t, show: false })), 3200)
    }

    useEffect(() => {
        async function carregarPerfilMedico() {
            try {
                setLoading(true)

                const data = await getMyDoctorProfile()
                const doctor = data.doctor
                const user = doctor.userId

                const nomeSeparado = separarNome(user?.name || usuario?.name || '')

                const dados = {
                    nome: nomeSeparado.nome,
                    sobrenome: nomeSeparado.sobrenome,
                    email: user?.email || usuario?.email || '',
                    crm: doctor.crm || '',
                    specialty: doctor.specialty || '',
                    ultimaAtualizacao: doctor.updatedAt
                        ? new Date(doctor.updatedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                        })
                        : '',
                }

                setForm(dados)
                setSaved(dados)
            } catch (error) {
                showToast(error.message || 'Erro ao carregar dados do médico.', true)

                const nomeSeparado = separarNome(usuario?.name || '')

                const fallback = {
                    ...INITIAL,
                    nome: nomeSeparado.nome,
                    sobrenome: nomeSeparado.sobrenome,
                    email: usuario?.email || '',
                }

                setForm(fallback)
                setSaved(fallback)
            } finally {
                setLoading(false)
            }
        }

        carregarPerfilMedico()
    }, [usuario])

    const handleSave = async () => {
        if (!form.nome.trim()) {
            showToast('Preencha o nome.', true)
            return
        }

        try {
            setSaving(true)

            const response = await updateMyDoctorProfile({
                crm: form.crm,
                specialty: form.specialty,
            })

            const doctor = response.doctor
            const user = doctor.userId

            const nomeSeparado = separarNome(user?.name || `${form.nome} ${form.sobrenome}`)

            const atualizado = {
                nome: nomeSeparado.nome || form.nome,
                sobrenome: nomeSeparado.sobrenome || form.sobrenome,
                email: user?.email || form.email,
                crm: doctor.crm || '',
                specialty: doctor.specialty || '',
                ultimaAtualizacao: new Date().toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                }),
            }

            setForm(atualizado)
            setSaved(atualizado)
            showToast('Dados atualizados com sucesso')
        } catch (error) {
            showToast(error.message || 'Erro ao salvar dados.', true)
        } finally {
            setSaving(false)
        }
    }

    const handleDiscard = () => {
        setForm({ ...saved })
        showToast('Alterações descartadas', true)
    }

    const handleSenha = async () => {
        if (!senhaAtual) {
            showToast('Informe a senha atual.', true)
            return
        }

        if (!novaSenha) {
            showToast('Informe a nova senha.', true)
            return
        }

        if (novaSenha !== confirmarSenha) {
            showToast('As senhas não coincidem.', true)
            return
        }

        if (novaSenha.length < 6) {
            showToast('A senha deve ter pelo menos 6 caracteres.', true)
            return
        }

        setSalvandoSenha(true)
        await new Promise(r => setTimeout(r, 900))
        setSalvandoSenha(false)
        setSenhaAtual('')
        setNovaSenha('')
        setConfirmarSenha('')
        showToast('Senha redefinida com sucesso')
    }

    const nomeCompleto = `${form.nome || 'Médico'} ${form.sobrenome || ''}`.trim()

    const saveBtnClass = [
        'dcm-btn-save',
        dirty ? 'dcm-btn-save--active' : '',
        saving ? 'dcm-btn-save--saving' : '',
    ].filter(Boolean).join(' ')

    if (loading) {
        return (
            <div className="dcm-wrap">
                <div className="dcm-page">
                    <div style={{ color: '#555', padding: 24 }}>
                        Carregando dados da conta...
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="dcm-wrap">
            <div className="dcm-page">
                <div className="dcm-page-header">
                    <div>
                        <h1 className="dcm-page-title">Dados da Conta</h1>
                        <p className="dcm-page-sub">
                            {nomeCompleto} · {form.email || 'E-mail não informado'}
                        </p>
                    </div>
                </div>

                <div className="dcm-grid">
                    <div className="dcm-section dcm-section--perfil">
                        <div className="dcm-section-title">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#2FD6BE" strokeWidth="1.4">
                                <circle cx="8" cy="5.5" r="3" />
                                <path d="M2 14.5c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                            </svg>
                            Perfil
                        </div>

                        <div className="dcm-row2">
                            <div className="dcm-field">
                                <label>Nome</label>
                                <input
                                    type="text"
                                    value={form.nome}
                                    placeholder="Seu nome"
                                    disabled
                                    onChange={e => update('nome', e.target.value)}
                                />
                            </div>

                            <div className="dcm-field">
                                <label>Sobrenome</label>
                                <input
                                    type="text"
                                    value={form.sobrenome}
                                    placeholder="Sobrenome"
                                    disabled
                                    onChange={e => update('sobrenome', e.target.value)}
                                />
                            </div>

                            <div className="dcm-field dcm-field--full">
                                <label>E-mail</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    placeholder="seu@email.com"
                                    disabled
                                    onChange={e => update('email', e.target.value)}
                                />
                            </div>

                            <div className="dcm-field">
                                <label>CRM</label>
                                <input
                                    type="text"
                                    value={form.crm}
                                    placeholder="CRM-SP 123456"
                                    onChange={e => update('crm', e.target.value)}
                                />
                            </div>

                            <div className="dcm-field">
                                <label>Especialidade</label>
                                <input
                                    type="text"
                                    value={form.specialty}
                                    placeholder="Endocrinologia"
                                    onChange={e => update('specialty', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="dcm-section dcm-section--senha">
                        <div className="dcm-section-title">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#2FD6BE" strokeWidth="1.4">
                                <rect x="3" y="7" width="10" height="7" rx="1.5" />
                                <path d="M5 7V5a3 3 0 016 0v2" strokeLinecap="round" />
                            </svg>
                            Redefinir senha
                        </div>

                        <div className="dcm-row2">
                            <div className="dcm-field dcm-field--full">
                                <label>Senha atual</label>
                                <input
                                    type="password"
                                    value={senhaAtual}
                                    placeholder="••••••••"
                                    onChange={e => setSenhaAtual(e.target.value)}
                                />
                            </div>

                            <div className="dcm-field">
                                <label>Nova senha</label>
                                <input
                                    type="password"
                                    value={novaSenha}
                                    placeholder="••••••••"
                                    onChange={e => setNovaSenha(e.target.value)}
                                />
                            </div>

                            <div className="dcm-field">
                                <label>Confirmar nova senha</label>
                                <input
                                    type="password"
                                    value={confirmarSenha}
                                    placeholder="••••••••"
                                    onChange={e => setConfirmarSenha(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            className="dcm-btn-senha"
                            onClick={handleSenha}
                            disabled={salvandoSenha}
                        >
                            {salvandoSenha ? 'Salvando…' : 'Redefinir senha'}
                        </button>
                    </div>

                    <div className="dcm-save-bar dcm-full">
                        <div className="dcm-save-info">
                            Última atualização:{' '}
                            <span>{form.ultimaAtualizacao || 'Ainda não atualizado'}</span>
                        </div>

                        <div className="dcm-save-actions">
                            {dirty && (
                                <button className="dcm-btn-discard" onClick={handleDiscard}>
                                    Descartar
                                </button>
                            )}

                            <button
                                className={saveBtnClass}
                                onClick={handleSave}
                                disabled={!dirty || saving}
                            >
                                {saving ? 'Salvando…' : 'Salvar alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Toast msg={toast.msg} show={toast.show} warn={toast.warn} />
        </div>
    )
}