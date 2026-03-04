import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { formatCurrency } from '../../utils/currency'

// ─── Step indicators ──────────────────────────────────────────────────────────

const StepDots: React.FC<{ total: number; current: number }> = ({ total, current }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: total }, (_, i) => (
      <div
        key={i}
        className={[
          'rounded-full transition-all duration-300',
          i === current ? 'w-6 h-2 bg-indigo-600' : 'w-2 h-2 bg-slate-200',
        ].join(' ')}
      />
    ))}
  </div>
)

// ─── Step 0: Benvenuto ────────────────────────────────────────────────────────

const StepWelcome: React.FC = () => (
  <div className="flex flex-col items-center text-center gap-6 py-4">
    <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-4xl shadow-sm">
      💰
    </div>
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Benvenuto in Budget Planner</h1>
      <p className="text-slate-500 max-w-sm">
        Tieni traccia di entrate e uscite ogni mese, monitora i tuoi salvadanai e guarda le statistiche.
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mt-2">
      {[
        { icon: '📅', title: 'Mesi', desc: 'Un budget per ogni mese, sempre sotto controllo' },
        { icon: '🏦', title: 'Salvadanai', desc: 'Metti da parte denaro per i tuoi obiettivi' },
        { icon: '📊', title: 'Statistiche', desc: 'Grafici e trend per capire le tue spese' },
      ].map(({ icon, title, desc }) => (
        <div key={title} className="bg-slate-50 rounded-xl p-4 text-left">
          <span className="text-2xl">{icon}</span>
          <p className="font-semibold text-slate-800 text-sm mt-2">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
        </div>
      ))}
    </div>
  </div>
)

// ─── Step 1: Voci Ricorrenti ──────────────────────────────────────────────────

const StepTemplate: React.FC = () => {
  const template = useAppStore((s) => s.template)

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
          📋
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Voci Ricorrenti</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          È il modello base che viene copiato ogni volta che crei un nuovo mese.
          Abbiamo preconfigurato delle categorie per te — potrai personalizzarle in qualsiasi momento.
        </p>
      </div>

      {/* Category chips */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Categorie</p>
        <div className="flex flex-wrap gap-2">
          {template.categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: cat.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/50 shrink-0" />
              {cat.name}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
        Dopo la configurazione potrai aggiungere, rinominare o rimuovere categorie dal menu <strong>Ricorrenti</strong>.
      </p>
    </div>
  )
}

// ─── Step 2: Voci ricorrenti ──────────────────────────────────────────────────

const StepItems: React.FC = () => {
  const template = useAppStore((s) => s.template)
  const settings = useAppStore((s) => s.settings)

  const getCat = (catId: string) => template.categories.find((c) => c.id === catId)

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
          🔄
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Voci ricorrenti</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Queste voci vengono aggiunte automaticamente a ogni nuovo mese. Modificale per adattarle alla tua situazione.
        </p>
      </div>

      {/* Items list */}
      <div className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
        {template.items.map((item) => {
          const cat = getCat(item.categoryId)
          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat?.color ?? '#94a3b8' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{item.name}</p>
                <p className="text-xs text-slate-400">{cat?.name}</p>
              </div>
              <span className={`text-sm font-semibold shrink-0 ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {item.type === 'INCOME' ? '+' : '−'}{formatCurrency(item.amount, settings.currency)}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-4 py-3">
        Potrai aggiungere, modificare o eliminare le voci ricorrenti dal menu <strong>Ricorrenti</strong>.
      </p>
    </div>
  )
}

// ─── Step 3: Pronto ───────────────────────────────────────────────────────────

const StepDone: React.FC = () => (
  <div className="flex flex-col items-center text-center gap-6 py-4">
    <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-4xl shadow-sm">
      🎉
    </div>
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Tutto pronto!</h2>
      <p className="text-slate-500 max-w-sm">
        Le tue Voci Ricorrenti sono configurate. Puoi creare il primo mese e iniziare subito a tracciare le tue finanze.
      </p>
    </div>

    <div className="flex flex-col gap-2 w-full max-w-xs">
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
        <span className="text-lg">1️⃣</span>
        <p className="text-sm text-slate-600 text-left">Crea il primo mese dal pulsante in alto nella barra laterale</p>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
        <span className="text-lg">2️⃣</span>
        <p className="text-sm text-slate-600 text-left">Aggiungi voci extra o segna quelle già pagate</p>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
        <span className="text-lg">3️⃣</span>
        <p className="text-sm text-slate-600 text-left">Esplora statistiche e salvadanai dal menu laterale</p>
      </div>
    </div>
  </div>
)

// ─── Wizard wrapper ───────────────────────────────────────────────────────────

const STEPS = [
  { id: 'welcome', component: StepWelcome, next: 'Inizia' },
  { id: 'template', component: StepTemplate, next: 'Avanti' },
  { id: 'items', component: StepItems, next: 'Avanti' },
  { id: 'done', component: StepDone, next: 'Inizia a usare l\'app' },
]

export const OnboardingWizard: React.FC = () => {
  const [step, setStep] = useState(0)
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)
  const navigate = useNavigate()

  const isLast = step === STEPS.length - 1
  const StepContent = STEPS[step].component

  const handleNext = () => {
    if (isLast) {
      completeOnboarding()
      navigate('/template')
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleSkip = () => {
    completeOnboarding()
    navigate('/')
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
            ₿
          </div>
          <span className="font-bold text-slate-800 text-sm">Budget Planner</span>
        </div>

        {!isLast && (
          <button
            onClick={handleSkip}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Salta
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full">
        <StepContent />
      </div>

      {/* Bottom bar */}
      <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-between max-w-2xl mx-auto w-full">
        <StepDots total={STEPS.length} current={step} />

        <div className="flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Indietro
            </button>
          )}
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            {STEPS[step].next}
          </button>
        </div>
      </div>
    </div>
  )
}
