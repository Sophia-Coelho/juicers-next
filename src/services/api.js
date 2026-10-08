const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function getToken() {
    return localStorage.getItem('tokenJuicers')
}

async function handleResponse(response, defaultMessage) {
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
        const error = new Error(data.message || defaultMessage)
        error.code = data.code
        throw error
    }

    return data
}

function authHeaders() {
    const token = getToken()

    return {
        Authorization: `Bearer ${token}`,
    }
}

function jsonAuthHeaders() {
    const token = getToken()

    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }
}

export async function registerUser({ name, email, password, role = 'patient', doctorVerification }) {
    const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role, doctorVerification }),
    })

    return handleResponse(response, 'Erro ao cadastrar usuário.')
}

export async function loginUser({ email, password }) {
    const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })

    return handleResponse(response, 'Erro ao fazer login.')
}

export async function savePatientProfile(patientData) {
    const response = await fetch(`${API_URL}/patients`, {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify(patientData),
    })

    return handleResponse(response, 'Erro ao salvar perfil do paciente.')
}

export async function getMyPatientProfile() {
    const response = await fetch(`${API_URL}/patients/me`, {
        method: 'GET',
        headers: authHeaders(),
    })

    return handleResponse(response, 'Erro ao buscar perfil do paciente.')
}

export async function updateUserProfile(userData) {
    const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: jsonAuthHeaders(),
        body: JSON.stringify(userData),
    })

    return handleResponse(response, 'Erro ao atualizar usuário.')
}

export async function changePassword({ currentPassword, newPassword }) {
    const response = await fetch(`${API_URL}/users/password`, {
        method: 'PUT',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
    })

    return handleResponse(response, 'Erro ao alterar senha.')
}

export async function getMyExams() {
    const response = await fetch(`${API_URL}/exams`, {
        method: 'GET',
        headers: authHeaders(),
    })

    return handleResponse(response, 'Erro ao buscar exames.')
}

export async function createExam(examData) {
    const response = await fetch(`${API_URL}/exams`, {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify(examData),
    })

    return handleResponse(response, 'Erro ao criar exame.')
}

export async function deleteExam(id) {
    const response = await fetch(`${API_URL}/exams/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    })

    return handleResponse(response, 'Erro ao deletar exame.')
}

export async function createDoctorInvite({ patientName, patientEmail }) {
    const response = await fetch(`${API_URL}/doctors/invites`, {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ patientName, patientEmail }),
    })

    return handleResponse(response, 'Erro ao criar convite.')
}

export async function getDoctorPatients() {
    const response = await fetch(`${API_URL}/doctors/patients`, {
        method: 'GET',
        headers: authHeaders(),
    })

    return handleResponse(response, 'Erro ao buscar pacientes do médico.')
}

export async function getDoctorPatientById(id) {
    const response = await fetch(`${API_URL}/doctors/patients/${id}`, {
        method: 'GET',
        headers: authHeaders(),
    })

    return handleResponse(response, 'Erro ao buscar paciente.')
}

export async function getDoctorPatientExams(id) {
    const response = await fetch(`${API_URL}/doctors/patients/${id}/exams`, {
        method: 'GET',
        headers: authHeaders(),
    })

    return handleResponse(response, 'Erro ao buscar exames do paciente.')
}

export async function uploadDoctorPatientExamPdf(id, file) {
    const formData = new FormData()
    formData.append('examPdf', file)

    const response = await fetch(`${API_URL}/doctors/patients/${id}/exams/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
    })

    return handleResponse(response, 'Erro ao importar PDF do exame.')
}

export async function getInviteByToken(inviteToken) {
    const response = await fetch(`${API_URL}/doctors/invites/${inviteToken}`)

    return handleResponse(response, 'Erro ao buscar convite.')
}

export async function acceptDoctorInvite(inviteToken) {
    const response = await fetch(`${API_URL}/doctors/invites/${inviteToken}/accept`, {
        method: 'POST',
        headers: authHeaders(),
    })

    return handleResponse(response, 'Erro ao aceitar convite.')
}

export async function getMyFollowup() {
    const response = await fetch(`${API_URL}/patients/me/followup`, {
        method: 'GET',
        headers: authHeaders(),
    })

    return handleResponse(response, 'Erro ao buscar acompanhamento médico.')
}

export async function getDoctorPatientFollowup(patientId) {
    const response = await fetch(`${API_URL}/doctors/patients/${patientId}/followup`, {
        method: 'GET',
        headers: authHeaders(),
    })

    return handleResponse(response, 'Erro ao buscar acompanhamento do paciente.')
}

export async function createDoctorPatientNote(patientId, text) {
    const response = await fetch(`${API_URL}/doctors/patients/${patientId}/notes`, {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ text }),
    })

    return handleResponse(response, 'Erro ao criar anotação clínica.')
}

export async function toggleDoctorPatientRequestedExam(patientId, label) {
    const response = await fetch(`${API_URL}/doctors/patients/${patientId}/requested-exams`, {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ label }),
    })

    return handleResponse(response, 'Erro ao solicitar exame.')
}

export async function deleteDoctorPatientExam(patientId, examId) {
    const response = await fetch(`${API_URL}/doctors/patients/${patientId}/exams/${examId}`, {
        method: 'DELETE',
        headers: authHeaders(),
    })

    return handleResponse(response, 'Erro ao deletar exame do paciente.')
}

export async function getMyDoctorProfile() {
    const response = await fetch(`${API_URL}/doctors/me`, {
        method: 'GET',
        headers: authHeaders(),
    })

    return handleResponse(response, 'Erro ao buscar perfil médico.')
}

export async function updateDoctorPatientNote(noteId, text) {
    const response = await fetch(`${API_URL}/doctors/notes/${noteId}`, {
        method: 'PUT',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ text }),
    })

    return handleResponse(response, 'Erro ao editar anotação.')
}

export async function deleteDoctorPatientNote(noteId) {
    const response = await fetch(`${API_URL}/doctors/notes/${noteId}`, {
        method: 'DELETE',
        headers: authHeaders(),
    })

    return handleResponse(response, 'Erro ao excluir anotação.')
}

export async function reverifyDoctorAccount({ email, password, doctorVerification }) {
    const response = await fetch(`${API_URL}/users/verify-doctor`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, doctorVerification }),
    })

    return handleResponse(response, 'Erro ao verificar o CRM do médico.')
}
