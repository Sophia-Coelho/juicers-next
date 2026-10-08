import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { changePassword, getMyDoctorProfile, updateUserProfile } from '../services/api'
import '../style/dadosContaMedico.css'

const INITIAL = {
    nome: '',
    sobrenome: '',
    email: '',
    crm: '',
    specialty: '',
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
        <div className={`dcm-toast${show ? ' dcm-toast--show' : ''}${warn ? ' dcm-toast--warn' : ''}`} role={warn ? 'alert' : 'status'} aria-live={warn ? 'assertive' : 'polite'}>
            <div className={`dcm-toast-dot${warn ? ' dcm-toast-dot--warn' : ''}`} />
            {msg}
        </div>
    )
}

export default function DadosContaMedico() {
    const { usuario, atualizarUsuario } = useAuth()

    const [form, setForm] = useState(INITIAL)
    const [saved, setSaved] = useState(INITIAL)
    const [toast, setToast] = useState({ show: false, msg: '', warn: false })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [senhaAtual, setSenhaAtual] = useState('')
    const [novaSenha, setNovaSenha] = useState('')
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [salvandoSenha, setSalvandoSenha] = useState(false)

    const dirty = JSON.stringify(form) !== JSON.stringify(saved)

    const update = (key, val) => {
        setForm(prev => ({ ...prev, [key]: val }))
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
        const nomeCompleto = `${form.nome} ${form.sobrenome}`.trim()

        if (!form.nome.trim() || !form.sobrenome.trim()) {
            showToast('Preencha nome e sobrenome.', true)
            return
        }

        try {
            setSaving(true)
            const response = await updateUserProfile({ name: nomeCompleto })
            const usuarioAtualizado = response.user
            const dadosAtualizados = {
                ...form,
                ...separarNome(usuarioAtualizado.name),
                email: usuarioAtualizado.email || form.email,
            }

            setForm(dadosAtualizados)
            setSaved(dadosAtualizados)
            atualizarUsuario({
                name: usuarioAtualizado.name,
                email: usuarioAtualizado.email,
            })
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

        try {
            setSalvandoSenha(true)
            await changePassword({
                currentPassword: senhaAtual,
                newPassword: novaSenha,
            })
            setSenhaAtual('')
            setNovaSenha('')
            setConfirmarSenha('')
            showToast('Senha alterada com sucesso')
        } catch (error) {
            showToast(error.message || 'Não foi possível alterar a senha.', true)
        } finally {
            setSalvandoSenha(false)
        }
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
                            <div className="dcm-field dcm-field--editable">
                                <div className="dcm-field-label-row">
                                    <label htmlFor="doctor-first-name">Nome</label>
                                    <span className="dcm-editable-badge">Editável</span>
                                </div>
                                <input
                                    id="doctor-first-name"
                                    type="text"
                                    value={form.nome}
                                    placeholder="Seu nome"
                                    autoComplete="given-name"
                                    onChange={e => update('nome', e.target.value)}
                                />
                            </div>

                            <div className="dcm-field dcm-field--editable">
                                <div className="dcm-field-label-row">
                                    <label htmlFor="doctor-last-name">Sobrenome</label>
                                    <span className="dcm-editable-badge">Editável</span>
                                </div>
                                <input
                                    id="doctor-last-name"
                                    type="text"
                                    value={form.sobrenome}
                                    placeholder="Sobrenome"
                                    autoComplete="family-name"
                                    onChange={e => update('sobrenome', e.target.value)}
                                />
                            </div>

                            <div className="dcm-field dcm-field--full">
                                <div className="dcm-field-label-row">
                                    <label htmlFor="doctor-email">E-mail</label>
                                    <span className="dcm-readonly-badge">Somente leitura</span>
                                </div>
                                <input
                                    id="doctor-email"
                                    type="email"
                                    value={form.email}
                                    placeholder="seu@email.com"
                                    autoComplete="email"
                                    readOnly
                                    aria-readonly="true"
                                />
                            </div>

                            <div className="dcm-field">
                                <label>CRM</label>
                                <input
                                    type="text"
                                    value={form.crm}
                                    placeholder="CRM-SP 123456"
                                    readOnly
                                    aria-readonly="true"
                                />
                            </div>

                            <div className="dcm-field">
                                <label>Especialidade</label>
                                <input
                                    type="text"
                                    value={form.specialty}
                                    placeholder="Endocrinologia"
                                    readOnly
                                    aria-readonly="true"
                                />
                            </div>
                        </div>

                        <p className="dcm-profile-note">
                            CRM e especialidade são informados no cadastro e não podem ser alterados nesta tela.
                        </p>
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

                </div>

                <div className="dcm-save-bar">
                    <div className="dcm-save-info">Salve para aplicar alterações no nome e sobrenome.</div>
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

            <Toast msg={toast.msg} show={toast.show} warn={toast.warn} />
        </div>
    )
}
