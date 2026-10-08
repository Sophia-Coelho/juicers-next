import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { ClinicalProvider } from '../context/ClinicalContext'
import { useAuth } from '../context/AuthContext'
import '../style/medicoLayout.css'

export default function MedicoLayout() {
    const { usuario } = useAuth()

    return (
        <ClinicalProvider>
            <div className="medico-layout">
                <Sidebar variant="medico" />
                <div className="medico-layout-main">
                    {usuario?.doctorVerificationMode === 'legacy-demo' && (
                        <div
                            role="status"
                            style={{
                                margin: '12px 20px 0',
                                padding: '10px 14px',
                                border: '1px solid #d9a441',
                                borderRadius: 8,
                                background: '#fff6df',
                                color: '#654b16',
                                fontSize: 13,
                            }}
                        >
                            Modo de apresentação: esta conta antiga não foi verificada pelo CFM.
                        </div>
                    )}
                    <Outlet />
                </div>
            </div>
        </ClinicalProvider>
    )
}
