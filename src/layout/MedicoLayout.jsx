import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { ClinicalProvider } from '../context/ClinicalContext'
import '../style/medicoLayout.css'

export default function MedicoLayout() {
    return (
        <ClinicalProvider>
            <div className="medico-layout">
                <Sidebar variant="medico" />
                <div className="medico-layout-main">
                    <Outlet />
                </div>
            </div>
        </ClinicalProvider>
    )
}
