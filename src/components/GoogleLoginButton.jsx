import { useEffect, useRef } from 'react'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
let googleScriptPromise

function loadGoogleIdentityServices() {
    if (window.google?.accounts?.id) return Promise.resolve()

    if (!googleScriptPromise) {
        googleScriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://accounts.google.com/gsi/client'
            script.async = true
            script.defer = true
            script.onload = resolve
            script.onerror = () => {
                googleScriptPromise = undefined
                reject(new Error('Não foi possível carregar o login do Google.'))
            }
            document.head.appendChild(script)
        })
    }

    return googleScriptPromise
}

export default function GoogleLoginButton({ onCredential, onError, disabled = false }) {
    const containerRef = useRef(null)
    const callbacksRef = useRef({ onCredential, onError })

    useEffect(() => {
        callbacksRef.current = { onCredential, onError }
    }, [onCredential, onError])

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || !containerRef.current) return undefined

        let mounted = true
        loadGoogleIdentityServices()
            .then(() => {
                if (!mounted || !containerRef.current) return

                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: ({ credential }) => {
                        if (credential) callbacksRef.current.onCredential?.(credential)
                    },
                })

                window.google.accounts.id.renderButton(containerRef.current, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'rectangular',
                    logo_alignment: 'left',
                    locale: 'pt-BR',
                    width: Math.max(220, Math.floor(containerRef.current.getBoundingClientRect().width)),
                })
            })
            .catch((error) => callbacksRef.current.onError?.(error.message))

        return () => {
            mounted = false
            containerRef.current?.replaceChildren()
        }
    }, [])

    if (!GOOGLE_CLIENT_ID) return null

    return (
        <div
            className={`login_google_button${disabled ? ' login_google_button--disabled' : ''}`}
            ref={containerRef}
            aria-label="Continuar com Google"
            aria-disabled={disabled}
        />
    )
}
