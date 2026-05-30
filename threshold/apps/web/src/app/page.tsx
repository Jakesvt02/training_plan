import Link from 'next/link'

const DISCIPLINES = [
  { icon: '🏁', name: 'HYROX', desc: 'Functional fitness racing' },
  { icon: '🏋️', name: 'Powerlifting', desc: 'Squat, bench, deadlift' },
  { icon: '💪', name: 'Bodybuilding', desc: 'Hypertrophy & aesthetics' },
  { icon: '⚡', name: 'CrossFit', desc: 'High-intensity WODs' },
  { icon: '🏃', name: 'Running', desc: '5K to marathon' },
  { icon: '🚴', name: 'Cycling', desc: 'Road & indoor power' },
]

const FEATURES = [
  {
    icon: '🔗',
    title: 'Connect your devices',
    desc: 'Sync Strava, Polar and Garmin. Your real training data drives every decision.',
  },
  {
    icon: '🧠',
    title: 'AI-adaptive plans',
    desc: 'Your plan adjusts week by week based on training load, HRV and how your body feels.',
  },
  {
    icon: '☀️',
    title: 'Daily check-in',
    desc: 'A 2-minute morning check-in scores your readiness and prescribes the right session.',
  },
  {
    icon: '🥗',
    title: 'Nutrition that matches training',
    desc: 'TDEE-based macros and meal plans that shift on training vs rest days.',
  },
  {
    icon: '📊',
    title: 'Training analytics',
    desc: 'Track acute:chronic load ratio, HR zones, body composition and discipline-specific PRs.',
  },
  {
    icon: '📏',
    title: 'Body composition tracking',
    desc: 'Log weight, measurements and BMI over time. See the trend, not just the number.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D', color: '#F5F5F5' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#3A3A3A] sticky top-0 z-50" style={{ background: '#0D0D0Dcc', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm" style={{ background: 'linear-gradient(135deg,#FF3B30,#FF8C00)' }}>
            T
          </div>
          <span className="font-black text-lg tracking-tight">THRESHOLD</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition px-4 py-2">
            Sign in
          </Link>
          <Link href="/register" className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition hover:opacity-90" style={{ background: 'linear-gradient(135deg,#FF3B30,#FF8C00)' }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 border border-[#FF3B30]/30 bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] inline-block"></span>
          Adaptive training for every discipline
        </div>

        <h1 className="text-6xl font-black tracking-tight leading-none mb-6">
          Train smarter.<br />
          <span style={{ background: 'linear-gradient(135deg,#FF3B30,#FF8C00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Push your threshold.
          </span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          An AI-powered training platform that connects to your devices, reads your body and builds a plan that adapts in real time — for HYROX, powerlifting, bodybuilding, CrossFit, running and more.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register" className="px-8 py-4 rounded-2xl font-bold text-white text-base hover:opacity-90 transition" style={{ background: 'linear-gradient(135deg,#FF3B30,#FF8C00)' }}>
            Build my training plan →
          </Link>
          <Link href="/login" className="px-8 py-4 rounded-2xl font-bold text-gray-300 text-base border border-[#3A3A3A] hover:border-[#FF3B30] hover:text-white transition">
            Sign in
          </Link>
        </div>

        {/* Hero device mockup strip */}
        <div className="mt-16 grid grid-cols-3 gap-3 max-w-2xl mx-auto">
          <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl p-4 text-left">
            <p className="text-xs text-gray-500 mb-1">Readiness Score</p>
            <p className="text-3xl font-black">78<span className="text-base text-gray-500 font-normal">/100</span></p>
            <p className="text-xs text-green-400 mt-1">Ready to train hard</p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl p-4 text-left">
            <p className="text-xs text-gray-500 mb-1">This week</p>
            <p className="text-3xl font-black">42<span className="text-base text-gray-500 font-normal">km</span></p>
            <p className="text-xs text-[#FF3B30] mt-1">Build phase · Week 8</p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl p-4 text-left">
            <p className="text-xs text-gray-500 mb-1">Today&apos;s session</p>
            <p className="text-lg font-black leading-tight">HYROX<br />Drills</p>
            <p className="text-xs text-gray-400 mt-1">Sled · Ski · Burpees</p>
          </div>
        </div>
      </section>

      {/* Disciplines */}
      <section className="border-t border-[#3A3A3A] py-16">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs text-gray-500 uppercase tracking-widest mb-8">Built for every discipline</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {DISCIPLINES.map(d => (
              <div key={d.name} className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl p-4 text-center hover:border-[#FF3B30]/50 transition cursor-default">
                <div className="text-2xl mb-2">{d.icon}</div>
                <p className="font-bold text-sm">{d.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black mb-3">Everything your training needs</h2>
          <p className="text-gray-400 text-lg">One platform. Every metric that matters.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl p-6 hover:border-[#FF3B30]/40 transition">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-base mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[#3A3A3A] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Up and running in minutes</h2>
            <p className="text-gray-400 text-lg">No spreadsheets. No guesswork.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { n: '01', title: 'Create your profile', desc: 'Name, stats, discipline, goal. Takes 3 minutes.' },
              { n: '02', title: 'Connect your devices', desc: 'Link Strava, Polar or Garmin with one click.' },
              { n: '03', title: 'Get your plan', desc: 'AI builds a periodised program anchored to your goal.' },
              { n: '04', title: 'Train. Adapt. Improve.', desc: 'Check in daily. Your plan evolves with you.' },
            ].map(s => (
              <div key={s.n} className="relative">
                <div className="text-5xl font-black mb-3" style={{ background: 'linear-gradient(135deg,#FF3B30,#FF8C00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {s.n}
                </div>
                <h3 className="font-bold mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center rounded-3xl p-12 border border-[#FF3B30]/20" style={{ background: 'linear-gradient(135deg,#FF3B30/10 0%, #1A1A1A 100%)', backgroundColor: '#1A1A1A' }}>
          <h2 className="text-4xl font-black mb-3">Ready to push your threshold?</h2>
          <p className="text-gray-400 mb-8">Free to start. No credit card required.</p>
          <Link href="/register" className="inline-block px-10 py-4 rounded-2xl font-bold text-white text-base hover:opacity-90 transition" style={{ background: 'linear-gradient(135deg,#FF3B30,#FF8C00)' }}>
            Build my training plan →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#3A3A3A] px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-white text-xs" style={{ background: 'linear-gradient(135deg,#FF3B30,#FF8C00)' }}>T</div>
            <span className="font-black text-sm">THRESHOLD</span>
          </div>
          <p className="text-xs text-gray-500">Train smarter. Push your threshold.</p>
        </div>
      </footer>

    </div>
  )
}
