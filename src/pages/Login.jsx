import { useEffect, useState } from 'react'
import '../style/login.css'
import { Link, useNavigate, useParams } from 'react-router-dom'
import logoIcon from '../assets/juicers.png'
import OnboardingForm from '../components/OnboardingForm'
import LoginPreview, { LoginFeatures, LoginPrivacyFooter } from '../components/LoginPreview'
import { acceptDoctorInvite, getInviteByToken, loginUser, loginWithGoogle, registerUser, reverifyDoctorAccount } from '../services/api'
import { useAuth } from '../context/AuthContext'
import GoogleLoginButton from '../components/GoogleLoginButton'

const API_URL = import.meta.env.DEV ? '/api' : `${window.location.origin}/api`
const GOOGLE_LOGIN_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

export default function Login() {
    const navigate = useNavigate()
    const { token: conviteToken } = useParams()
    const { loginComToken, loginMock } = useAuth()

    const [role, setRole] = useState('atleta')
    const [modoCadastro, setModoCadastro] = useState(false)
    const [modoReverificacao, setModoReverificacao] = useState(false)
    const [mostrarOnboarding, setMostrarOnboarding] = useState(false)
    const [carregando, setCarregando] = useState(false)
    const [erroLogin, setErroLogin] = useState(false)
    const [erroGoogle, setErroGoogle] = useState('')
    const [conviteCarregando, setConviteCarregando] = useState(false)
    const [conviteErro, setConviteErro] = useState('')

    const [nomeCadastro, setNomeCadastro] = useState('')
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [mostrarSenha, setMostrarSenha] = useState(false)
    const [crm, setCrm] = useState('')
    const [ufCrm, setUfCrm] = useState('')
    const [cpf, setCpf] = useState('')
    const [dataNascimento, setDataNascimento] = useState('')

    const destinoMock = role === 'medico' ? '/medico' : '/perfil'

    useEffect(() => {
        if (!conviteToken) return undefined

        let mounted = true
        setRole('atleta')
        setModoCadastro(true)
        setMostrarOnboarding(false)
        setConviteCarregando(true)
        setConviteErro('')

        getInviteByToken(conviteToken)
            .then(({ invite }) => {
                if (!mounted) return
                setNomeCadastro(invite.patientName || '')
                setEmail(invite.patientEmail || '')
            })
            .catch(error => {
                if (mounted) setConviteErro(error.message || 'Este convite não está disponível.')
            })
            .finally(() => {
                if (mounted) setConviteCarregando(false)
            })

        return () => { mounted = false }
    }, [conviteToken])

    function limparCampos() {
        setNomeCadastro('')
        setEmail('')
        setSenha('')
        setConfirmarSenha('')
        setCrm('')
        setUfCrm('')
        setCpf('')
        setDataNascimento('')
        setErroLogin(false)
        setErroGoogle('')
    }

    function abrirCadastro() {
        limparCampos()
        setModoReverificacao(false)
        setModoCadastro(true)
        setMostrarOnboarding(false)
    }

    function abrirLogin() {
        limparCampos()
        setModoReverificacao(false)
        setModoCadastro(false)
        setMostrarOnboarding(false)
    }

    async function backendOnline() {
        try {
            const controller = new AbortController()

            const timeoutId = setTimeout(() => {
                controller.abort()
            }, 4000)

            const res = await fetch(`${API_URL}/health`, {
                method: 'GET',
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            return res.ok
        } catch {
            return false
        }
    }

    function salvarSessao(token, user) {
        localStorage.setItem('tokenJuicers', token)
        localStorage.setItem('userJuicers', JSON.stringify(user))
    }

    function getRoleApi() {
        if (conviteToken) return 'patient'
        return role === 'medico' ? 'doctor' : 'patient'
    }

    function getRoleFront(userRole) {
        return userRole === 'doctor' ? 'medico' : 'atleta'
    }

    function redirecionarPorTipo(user) {
        if (user.role === 'doctor') {
            navigate('/medico')
            return
        }

        navigate('/perfil')
    }

    async function fazerCadastro() {
        if (conviteToken && (conviteCarregando || conviteErro || !email)) {
            alert(conviteErro || 'Aguarde a validação do convite.')
            return
        }

        if (!nomeCadastro || !email || !senha || !confirmarSenha) {
            alert('Preencha todos os campos.')
            return
        }

        if (senha !== confirmarSenha) {
            alert('As senhas não são iguais.')
            return
        }

        setCarregando(true)
        setErroLogin(false)

        const online = await backendOnline()

        if (!online) {
            if (conviteToken) {
                alert('Não foi possível validar o convite. Verifique sua conexão e tente novamente.')
                setCarregando(false)
                return
            }

            if (role === 'medico') {
                alert('Não é possível validar seu CRM enquanto o serviço de autenticação está indisponível. Tente novamente mais tarde.')
                setCarregando(false)
                return
            }

            const fakeUser = {
                id: Date.now(),
                name: nomeCadastro,
                email,
                role: getRoleApi(),
            }

            const fakeToken = `mock-token-${Date.now()}`

            salvarSessao(fakeToken, fakeUser)
            loginComToken(fakeToken, fakeUser, role)
            setCarregando(false)

            if (fakeUser.role === 'doctor') {
                navigate('/medico')
                return
            }

            setMostrarOnboarding(true)
            setModoCadastro(false)
            return
        }

        try {
            await registerUser({
                name: nomeCadastro,
                email,
                password: senha,
                role: getRoleApi(),
                doctorVerification: role === 'medico'
                    ? { crm, uf: ufCrm, cpf, birthDate: dataNascimento }
                    : undefined,
            })

            const loginResponse = await loginUser({
                email,
                password: senha,
            })

            salvarSessao(loginResponse.token, loginResponse.user)

            loginComToken(
                loginResponse.token,
                loginResponse.user,
                getRoleFront(loginResponse.user.role)
            )

            if (loginResponse.user.role === 'doctor') {
                navigate('/medico')
                return
            }

            setMostrarOnboarding(true)
            setModoCadastro(false)
        } catch (error) {
            alert(error.message)
        } finally {
            setCarregando(false)
        }
    }

    async function fazerReverificacaoMedico() {
        if (!email || !senha || !crm || !ufCrm || !cpf || !dataNascimento) {
            alert('Preencha suas credenciais e todos os dados para validar o CRM.')
            return
        }

        setCarregando(true)
        try {
            const data = await reverifyDoctorAccount({
                email,
                password: senha,
                doctorVerification: {
                    crm,
                    uf: ufCrm,
                    cpf,
                    birthDate: dataNascimento,
                },
            })

            salvarSessao(data.token, data.user)
            loginComToken(data.token, data.user, 'medico')
            navigate('/medico')
        } catch (error) {
            alert(error.message)
        } finally {
            setCarregando(false)
        }
    }

    async function fazerLoginComGoogle(credential) {
        setCarregando(true)
        setErroGoogle('')

        try {
            const data = await loginWithGoogle({
                credential,
                inviteToken: conviteToken,
            })

            salvarSessao(data.token, data.user)
            loginComToken(data.token, data.user, 'atleta')
            setNomeCadastro(data.user.name || '')
            setEmail(data.user.email || '')

            if (data.needsOnboarding) {
                setModoCadastro(false)
                setMostrarOnboarding(true)
                return
            }

            if (conviteToken) await acceptDoctorInvite(conviteToken)
            navigate('/perfil')
        } catch (error) {
            setErroGoogle(error.message || 'Não foi possível entrar com o Google.')
        } finally {
            setCarregando(false)
        }
    }

    async function fazerLogin() {
        if (!email || !senha) {
            alert('Preencha o e-mail e a senha.')
            return
        }

        setCarregando(true)
        setErroLogin(false)

        const online = await backendOnline()

        if (!online) {
            const resultado = loginMock(email, senha, role)
            setCarregando(false)

            if (resultado.ok) {
                navigate(destinoMock)
            } else {
                setErroLogin(true)
            }

            return
        }

        try {
            const data = await loginUser({
                email,
                password: senha,
            })

            salvarSessao(data.token, data.user)

            loginComToken(
                data.token,
                data.user,
                getRoleFront(data.user.role)
            )

            if (conviteToken && data.user.role === 'patient') {
                try {
                    await acceptDoctorInvite(conviteToken)
                    navigate('/perfil')
                    return
                } catch (error) {
                    if (error.status === 404 && error.message.includes('Perfil de paciente não encontrado')) {
                        setMostrarOnboarding(true)
                        setModoCadastro(false)
                    } else {
                        alert(error.message || 'Não foi possível aceitar o convite.')
                    }
                    return
                }
            }

            redirecionarPorTipo(data.user)
        } catch (error) {
            if (error.code === 'DOCTOR_VERIFICATION_REQUIRED') {
                setRole('medico')
                setModoReverificacao(true)
                setModoCadastro(true)
            } else {
                alert(error.message)
            }
        } finally {
            setCarregando(false)
        }
    }

    if (mostrarOnboarding) {
        return (
            <OnboardingForm
                nomeCompleto={nomeCadastro}
                emailUsuario={email}
                conviteToken={conviteToken}
                onBack={() => {
                    setMostrarOnboarding(false)
                    setModoCadastro(true)
                }}
                onFinish={() => navigate('/perfil')}
            />
        )
    }

    return (
        <div className="login_wrap">
            <div className="login_left">
                <img
                    src="/images/juicers-digital-athlete.webp"
                    alt=""
                    aria-hidden="true"
                    className="login_athlete"
                />

                <a className="logo" href="/">
                    <img src={logoIcon} alt="Logo" className="logo-icon" />
                </a>

                <div className="login_left_middle">
                    <h1 className="login_left_headline">
                        Monitore o impacto<br /><em>no seu corpo.</em>
                    </h1>

                    <p className="login_left_sub">
                        Acompanhe exames, identifique riscos reais e entenda como os anabolizantes afetam sua saúde.
                    </p>

                    <LoginPreview />

                    <LoginFeatures />
                </div>

                <div className="login_left_stats">
                    <LoginPrivacyFooter />
                </div>
            </div>

            <div className="login_right">
                <div className="login_card">
                    {!modoReverificacao && <div className="login_role_toggle">
                        <button
                            type="button"
                            className={`login_role_btn${role === 'atleta' ? ' login_role_btn--active login_role_btn--atleta' : ''}`}
                            onClick={() => {
                                if (conviteToken) return
                                setRole('atleta')
                                setErroLogin(false)
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                                <path d="M8 2C6 2 5 3.5 5 5C5 7 6.5 8.5 8 8.5C9.5 8.5 11 7 11 5C11 3.5 10 2 8 2Z" />
                                <path d="M3 15C3 11.5 5.5 9.5 8 9.5C10.5 9.5 13 11.5 13 15" />
                            </svg>
                            Atleta
                        </button>

                        {!conviteToken && (
                            <button
                                type="button"
                                className={`login_role_btn${role === 'medico' ? ' login_role_btn--active login_role_btn--medico' : ''}`}
                                onClick={() => {
                                    setRole('medico')
                                    setErroLogin(false)
                                }}
                            >
                                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                                    <rect x="2" y="2" width="12" height="12" rx="2" />
                                    <path d="M8 5.5V10.5M5.5 8H10.5" />
                                </svg>
                                Médico
                            </button>
                        )}
                    </div>}

                    {conviteCarregando && <p role='status' className='login_card_sub'>Validando o convite...</p>}
                    {conviteErro && <div role='alert' className='login_offline_banner'>{conviteErro}</div>}

                    {erroLogin && (
                        <div className="login_offline_banner">
                            Credenciais não encontradas. Use as contas de teste:
                            <span className="login_offline_hint">
                                atleta@juicers.com · medico@juicers.com · senha: 123456
                            </span>
                        </div>
                    )}

                    {!modoCadastro ? (
                        <>
                            <p className="login_card_title">Entrar</p>
                            <p className="login_card_sub">
                                Acesse sua conta para visualizar seus dados.
                            </p>

                            <div className="field">
                                <label>E-mail</label>
                                <input
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={e => {
                                        setEmail(e.target.value)
                                        setErroLogin(false)
                                    }}
                                />
                            </div>

                            <div className="field">
                                <label>Senha</label>
                                <div className="field_senha_wrap">
                                    <input
                                        type={mostrarSenha ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={senha}
                                        onChange={e => {
                                            setSenha(e.target.value)
                                            setErroLogin(false)
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="field_senha_toggle"
                                        onClick={() => setMostrarSenha(v => !v)}
                                        aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                                        tabIndex={-1}
                                    >
                                        {mostrarSenha ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 3l18 18" />
                                                <path d="M10.58 10.58a2 2 0 002.83 2.83" />
                                                <path d="M9.88 5.09A10.94 10.94 0 0112 5c6 0 10 7 10 7a17.6 17.6 0 01-3.22 3.95M6.1 6.1A17.9 17.9 0 002 12s4 7 10 7a10.5 10.5 0 004.24-.88" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <a href="#" className="forgot">Esqueci minha senha</a>

                            <button
                                className={`btn_entrar btn_entrar--${role}`}
                                onClick={fazerLogin}
                                disabled={carregando}
                            >
                                {carregando ? 'Entrando...' : 'Entrar'}
                            </button>

                            {GOOGLE_LOGIN_ENABLED && role === 'atleta' && !modoReverificacao ? (
                                <>
                                    <div className="divider"><span>ou</span></div>
                                    <GoogleLoginButton
                                        onCredential={fazerLoginComGoogle}
                                        onError={setErroGoogle}
                                        disabled={carregando}
                                    />
                                    {erroGoogle && <div role="alert" className="login_offline_banner">{erroGoogle}</div>}
                                </>
                            ) : <div className="divider"><span>ou</span></div>}

                            <Link to="/" className="btn_voltar">
                                ← Voltar para o site
                            </Link>

                            <p className="login_card_footer">
                                Não tem conta?{' '}
                                <button
                                    type="button"
                                    className="link_button"
                                    onClick={abrirCadastro}
                                >
                                    Cadastre-se
                                </button>
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="login_card_title">
                                {modoReverificacao ? 'Validar conta médica' : 'Criar conta'}
                            </p>
                            <p className="login_card_sub">
                                {modoReverificacao
                                    ? 'Sua conta já existe. Confirme seus dados no CFM para liberar novamente o acesso médico.'
                                    : conviteToken
                                    ? 'Crie sua conta para aceitar o convite do médico.'
                                    : role === 'medico'
                                        ? 'Crie sua conta para gerenciar seus atletas.'
                                        : 'Preencha seus dados para começar.'}
                            </p>

                            {!modoReverificacao && <div className="login_selected_role">
                                Tipo de conta:{' '}
                                <strong>
                                    {role === 'medico' ? 'Médico' : 'Atleta'}
                                </strong>
                            </div>}

                            {!modoReverificacao && <div className="field">
                                <label>Nome</label>
                                <input
                                    type="text"
                                    placeholder="Seu nome"
                                    value={nomeCadastro}
                                    onChange={e => setNomeCadastro(e.target.value)}
                                />
                            </div>}

                            <div className="field">
                                <label>E-mail</label>
                                <input
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    disabled={Boolean(conviteToken)}
                                    autoComplete='email'
                                />
                            </div>

                            <div className="field">
                                <label>Senha</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={senha}
                                    onChange={e => setSenha(e.target.value)}
                                />
                            </div>

                            {!modoReverificacao && <div className="field">
                                <label>Confirmar senha</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmarSenha}
                                    onChange={e => setConfirmarSenha(e.target.value)}
                                />
                            </div>}

                            {(role === 'medico' || modoReverificacao) && (
                                <>
                                    <p className="login_card_sub">
                                        O CFM confirmará que o CRM está regular e que os dados de identidade correspondem. CPF e data de nascimento são encaminhados ao CFM para validação e não são salvos no banco do Juicers.
                                    </p>
                                    <div className="field">
                                        <label>CRM</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="Somente números, sem a UF"
                                            value={crm}
                                            onChange={e => setCrm(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="field">
                                        <label>Estado do CRM</label>
                                        <select value={ufCrm} onChange={e => setUfCrm(e.target.value)} required>
                                            <option value="">Selecione a UF</option>
                                            {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                                <option key={uf} value={uf}>{uf}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>CPF</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="off"
                                            placeholder="Somente números"
                                            value={cpf}
                                            onChange={e => setCpf(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="field">
                                        <label>Data de nascimento</label>
                                        <input
                                            type="date"
                                            autoComplete="bday"
                                            value={dataNascimento}
                                            onChange={e => setDataNascimento(e.target.value)}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                className={`btn_entrar btn_entrar--${role}`}
                                onClick={modoReverificacao ? fazerReverificacaoMedico : fazerCadastro}
                                disabled={carregando || conviteCarregando || Boolean(conviteErro)}
                            >
                                {conviteCarregando
                                    ? 'Validando convite...'
                                    : carregando
                                    ? 'Aguarde...'
                                    : modoReverificacao
                                        ? 'Validar CRM e acessar'
                                        : role === 'medico'
                                        ? 'Criar conta e acessar'
                                        : 'Criar conta'}
                            </button>

                            {GOOGLE_LOGIN_ENABLED && role === 'atleta' && !modoReverificacao ? (
                                <>
                                    <div className="divider"><span>ou</span></div>
                                    <GoogleLoginButton
                                        onCredential={fazerLoginComGoogle}
                                        onError={setErroGoogle}
                                        disabled={carregando}
                                    />
                                    {erroGoogle && <div role="alert" className="login_offline_banner">{erroGoogle}</div>}
                                </>
                            ) : <div className="divider"><span>ou</span></div>}

                            <button
                                type="button"
                                className="btn_voltar"
                                onClick={abrirLogin}
                            >
                                {modoReverificacao ? '← Voltar para entrar' : '← Já tenho conta'}
                            </button>

                            {!modoReverificacao && <p className="login_card_footer">
                                Ao cadastrar, você concorda com os <a href="#">Termos de Uso</a>.
                            </p>}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
