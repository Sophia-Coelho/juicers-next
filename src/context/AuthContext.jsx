import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const MOCK_USERS = [
    { id: 1, email: 'atleta@juicers.com', password: '123456', role: 'atleta', name: 'Lucas Ferreira' },
    { id: 2, email: 'medico@juicers.com', password: '123456', role: 'medico', name: 'Dr. Rafael Lima' },
]

function mapRole(backendRole) {
    if (backendRole === 'doctor') return 'medico'
    if (backendRole === 'patient') return 'atleta'
    return backendRole
}

function carregarSessao() {
    try {
        const token = localStorage.getItem('tokenJuicers')
        const user = localStorage.getItem('usuarioLogadoJuicers')
        const role = localStorage.getItem('roleJuicers')
        if (!token || !user) return null
        const parsed = JSON.parse(user)
        // role do localStorage tem prioridade — vem POR ÚLTIMO para não ser sobrescrito
        const resolvedRole = role || mapRole(parsed.role) || 'atleta'
        return { token, ...parsed, role: resolvedRole }
    } catch {
        return null
    }
}

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(carregarSessao)

    const loginComToken = (token, user, roleEscolhido) => {
        const role = user?.role ? mapRole(user.role) : roleEscolhido
        localStorage.setItem('tokenJuicers', token)
        localStorage.setItem('usuarioLogadoJuicers', JSON.stringify(user))
        localStorage.setItem('roleJuicers', role)
        // role vem por último para não ser sobrescrito pelo spread
        setUsuario({ token, ...user, role })
    }

    const loginMock = (email, senha, roleEscolhido) => {
        const encontrado = MOCK_USERS.find(
            u => u.email === email && u.password === senha && u.role === roleEscolhido
        )
        if (!encontrado) return { ok: false, erro: 'E-mail, senha ou perfil incorretos.' }

        const fakeToken = `mock-token-${encontrado.id}`
        const user = { id: encontrado.id, name: encontrado.name, email: encontrado.email }
        localStorage.setItem('tokenJuicers', fakeToken)
        localStorage.setItem('usuarioLogadoJuicers', JSON.stringify(user))
        localStorage.setItem('roleJuicers', encontrado.role)
        setUsuario({ token: fakeToken, ...user, role: encontrado.role })
        return { ok: true }
    }

    const atualizarUsuario = (dadosAtualizados) => {
        const usuarioAtualizado = { ...usuario, ...dadosAtualizados }
        const { token, ...usuarioPersistido } = usuarioAtualizado

        localStorage.setItem('usuarioLogadoJuicers', JSON.stringify(usuarioPersistido))
        setUsuario(usuarioAtualizado)
    }

    const logout = () => {
        localStorage.removeItem('tokenJuicers')
        localStorage.removeItem('usuarioLogadoJuicers')
        localStorage.removeItem('roleJuicers')
        setUsuario(null)
    }

    return (
        <AuthContext.Provider value={{ usuario, loginComToken, loginMock, atualizarUsuario, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
