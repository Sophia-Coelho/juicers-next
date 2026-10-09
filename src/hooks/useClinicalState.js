import { useCallback, useEffect, useMemo, useState } from 'react'
import { getMyExams, getMyPatientProfile } from '../services/api'
import { buildDashboardData, formatExamDate } from '../data/markers.js'

const TODAY = new Date()
    .toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
    .replace('.', '')

const EMPTY_DATA = {
    examDates: [],
    markers: [],
    categories: [],
    summary: [],
    alerts: [],
    patients: [],
    examHistory: [],
    suggestedExams: [
        'Hemograma completo (controle de hematócrito)',
        'Perfil lipídico completo',
        'Painel hepático (TGO, TGP, GGT)',
        'Estradiol sérico',
        'PSA total e livre',
        'Ecocardiograma + aferição de PA',
    ],
}

const EMPTY_ACCOUNT = {
    nome: '',
    sobrenome: '',
    idade: '',
    sexo: '',
    peso: '',
    altura: '',
    cicloStatus: '',
    dose: '',
    cicloTempo: '',
    compounds: [],
    condicoes: [],
    examFreq: '',
    lastExam: '',
}

const EMPTY_MEDICO = {
    nome: '',
    crm: '',
    specialty: '',
}

// O catálogo de marcadores e a montagem da série vivem em src/data/markers.js.
const formatarData = formatExamDate

function montarDadosClinicosPorExames(exames = []) {
    if (!exames.length) {
        return EMPTY_DATA
    }

    const base = buildDashboardData(exames)

    const examHistory = [...base.exams]
        .reverse()
        .map((exam) => ({
            id: exam._id,
            date: formatarData(exam.examDate),
            lab: exam.source === 'manual' ? 'Importação manual' : 'Laboratório',
            markers: Object.keys(exam.markers || {}).length,
            status:
                exam.riskLevel === 'high'
                    ? 'risco'
                    : exam.riskLevel === 'attention'
                        ? 'atencao'
                        : 'ok',
            file: exam.originalFileName || exam.alerts?.[0] || 'Exame laboratorial',
            raw: exam,
        }))

    return {
        ...EMPTY_DATA,
        examDates: base.examDates,
        markers: base.categories.flatMap((c) => c.markers),
        categories: base.categories,
        summary: base.summary,
        alerts: base.alerts,
        examHistory,
    }
}

export function useClinicalState() {
    const [data, setData] = useState(EMPTY_DATA)
    const [account, setAccount] = useState(EMPTY_ACCOUNT)
    const [medico, setMedico] = useState(EMPTY_MEDICO)
    const [clinical, setClinical] = useState({})

    useEffect(() => {
        async function carregarDadosClinicos() {
            try {
                const [perfilResponse, examesResponse] = await Promise.all([
                    getMyPatientProfile(),
                    getMyExams(),
                ])

                const paciente = perfilResponse.patient
                const exames = examesResponse.exams || []

                const dadosConvertidos = montarDadosClinicosPorExames(exames)
                setData(dadosConvertidos)

                const nomeCompleto = paciente?.userId?.name || ''
                const partesNome = nomeCompleto.split(' ').filter(Boolean)

                setAccount({
                    nome: partesNome[0] || '',
                    sobrenome: partesNome.slice(1).join(' '),
                    idade: paciente?.age || '',
                    sexo:
                        paciente?.biologicalSex === 'male'
                            ? 'Masculino'
                            : paciente?.biologicalSex === 'female'
                                ? 'Feminino'
                                : '',
                    peso: paciente?.weight || '',
                    altura: paciente?.height ? paciente.height * 100 : '',
                    cicloStatus: paciente?.cycleStatus || '',
                    dose: paciente?.weeklyDosage || '',
                    cicloTempo: paciente?.cycleTime || '',
                    compounds: paciente?.substances || [],
                    condicoes: paciente?.healthConditions || [],
                    examFreq: paciente?.examStatus || '',
                    lastExam: paciente?.lastExamDate
                        ? formatarData(paciente.lastExamDate)
                        : '',
                })

                setClinical({
                    p1: {
                        notes: [],
                        requested: {},
                        uploads: dadosConvertidos.examHistory,
                    },
                })
            } catch (error) {
                console.error('Erro ao carregar dados clínicos:', error)

                setData(EMPTY_DATA)
                setAccount(EMPTY_ACCOUNT)
                setClinical({})
            }
        }

        carregarDadosClinicos()
    }, [])

    const updAccount = useCallback((k, v) => {
        setAccount((a) => ({
            ...a,
            [k]: v,
        }))
    }, [])

    const updMed = useCallback((k, v) => {
        setMedico((m) => ({
            ...m,
            [k]: v,
        }))
    }, [])

    const toggleCompound = useCallback((compound) => {
        setAccount((a) => {
            const compounds = a.compounds || []
            const has = compounds.includes(compound)

            return {
                ...a,
                compounds: has
                    ? compounds.filter((item) => item !== compound)
                    : compounds.concat(compound),
            }
        })
    }, [])

    const toggleCondition = useCallback((condition) => {
        setAccount((a) => {
            let condicoes = a.condicoes || []

            if (condition === 'Nenhuma das anteriores') {
                condicoes = condicoes.includes(condition) ? [] : ['Nenhuma das anteriores']
            } else {
                condicoes = condicoes.filter((item) => item !== 'Nenhuma das anteriores')
                condicoes = condicoes.includes(condition)
                    ? condicoes.filter((item) => item !== condition)
                    : condicoes.concat(condition)
            }

            return {
                ...a,
                condicoes,
            }
        })
    }, [])

    const addNote = useCallback(() => false, [])

    const togglePatientExam = useCallback(() => {}, [])

    const addUpload = useCallback(() => {}, [])

    const value = useMemo(
        () => ({
            data,
            today: TODAY,
            account,
            medico,
            clinical,
            updAccount,
            updMed,
            toggleCompound,
            toggleCondition,
            addNote,
            togglePatientExam,
            addUpload,
        }),
        [
            data,
            account,
            medico,
            clinical,
            updAccount,
            updMed,
            toggleCompound,
            toggleCondition,
            addNote,
            togglePatientExam,
            addUpload,
        ]
    )

    return value
}