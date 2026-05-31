import Link from 'next/link'

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
    desc: 'TDEE-based macros that shift on training vs rest days, with calorie tracking built in.',
  },
  {
    icon: '📊',
    title: 'Training load analytics',
    desc: 'Track fitness, fatigue and form over time with ATL/CTL/TSB charts.',
  },
  {
    icon: '📏',
    title: 'Body composition tracking',
    desc: 'Log weight, measurements and body fat over time. See the trend, not just the number.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D0D0D', color: '#F5F5F5' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] sticky top-0 z-50" style={{ background: '#0D0D0Dcc', backdropFilter: 'blur(12px)' }}>
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

      <main className="flex-1">

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight leading-none mb-6">
            Train smarter.<br />
            <span style={{ background: 'linear-gradient(135deg,#FF3B30,#FF8C00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Push your threshold.
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            An adaptive training platform that connects to your devices, reads your body and builds a plan that evolves with you — every single week.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register" className="px-8 py-4 rounded-2xl font-bold text-white text-base hover:opacity-90 transition" style={{ background: 'linear-gradient(135deg,#FF3B30,#FF8C00)' }}>
              Build my training plan →
            </Link>
            <Link href="/login" className="px-8 py-4 rounded-2xl font-bold text-gray-300 text-base border border-[#2A2A2A] hover:border-[#FF3B30] hover:text-white transition">
              Sign in
            </Link>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-3 gap-3 max-w-2xl mx-auto">
            <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4 text-left">
              <p className="text-xs text-gray-500 mb-1">Readiness Score</p>
              <p className="text-3xl font-black">78<span className="text-base text-gray-500 font-normal">/100</span></p>
              <p className="text-xs text-green-400 mt-1">Ready to train hard</p>
            </div>
            <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4 text-left">
              <p className="text-xs text-gray-500 mb-1">Training load</p>
              <p className="text-3xl font-black">+12<span className="text-base text-gray-500 font-normal"> TSB</span></p>
              <p className="text-xs text-[#FF3B30] mt-1">Build phase · Week 8</p>
            </div>
            <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4 text-left">
              <p className="text-xs text-gray-500 mb-1">Today&apos;s session</p>
              <p className="text-lg font-black leading-tight">HYROX<br />Drills</p>
              <p className="text-xs text-gray-400 mt-1">60 min · TSS 58</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[#1E1E1E] py-20 max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Everything your training needs</h2>
            <p className="text-gray-400 text-lg">One platform. Every metric that matters.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-6 hover:border-[#FF3B30]/40 transition">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-[#1E1E1E] py-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-black mb-3">Up and running in minutes</h2>
              <p className="text-gray-400 text-lg">No spreadsheets. No guesswork.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { n: '01', title: 'Create your profile', desc: 'Name, stats, discipline, goal. Takes 3 minutes.' },
                { n: '02', title: 'Connect your devices', desc: 'Link Strava or Polar with one click.' },
                { n: '03', title: 'Get your plan', desc: 'A periodised program anchored to your goal date.' },
                { n: '04', title: 'Train. Adapt. Improve.', desc: 'Check in daily. Your plan evolves with you.' },
              ].map(s => (
                <div key={s.n}>
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
          <div className="max-w-2xl mx-auto text-center rounded-3xl p-12" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
            <h2 className="text-4xl font-black mb-3">Ready to push your threshold?</h2>
            <p className="text-gray-400 mb-8">Free to start. No credit card required.</p>
            <Link href="/register" className="inline-block px-10 py-4 rounded-2xl font-bold text-white text-base hover:opacity-90 transition" style={{ background: 'linear-gradient(135deg,#FF3B30,#FF8C00)' }}>
              Build my training plan →
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E1E1E]" style={{ background: '#0A0A0A' }}>
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">

            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs" style={{ background: 'linear-gradient(135deg,#FF3B30,#FF8C00)' }}>T</div>
                <span className="font-black tracking-tight">THRESHOLD</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Adaptive training, nutrition and performance tracking for serious athletes.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-12">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Get started</h4>
                <ul className="space-y-3">
                  <li><Link href="/register" className="text-sm text-gray-500 hover:text-white transition">Create account</Link></li>
                  <li><Link href="/login" className="text-sm text-gray-500 hover:text-white transition">Sign in</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Integrations</h4>
                <ul className="space-y-3">
                  <li><span className="text-sm text-gray-500">Strava</span></li>
                  <li><span className="text-sm text-gray-500">Polar</span></li>
                  <li><span className="text-sm text-gray-500">Garmin <span className="text-xs text-gray-600">(soon)</span></span></li>
                </ul>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-[#1E1E1E] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">© {new Date().getFullYear()} Threshold. All rights reserved.</p>
            <p className="text-xs text-gray-600">Train smarter. Push your threshold.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
