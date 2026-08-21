import { useMemo, useState } from 'react'
import { calculateNetSalary, getSalaryInsight, RULES_2026 } from './lib/salary'
import { parseSalaryInput } from './lib/salaryInput'

const euro = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const formatPercentage = (value: number) =>
  new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 }).format(value) + '%'

function App() {
  const [input, setInput] = useState('40.000')
  const parsedInput = parseSalaryInput(input)
  const estimate = useMemo(
    () => (parsedInput.value === null ? null : calculateNetSalary(parsedInput.value)),
    [parsedInput.value],
  )

  const setSalary = (amount: number) => setInput(amount.toLocaleString('it-IT'))
  const validationMessage = parsedInput.error === 'empty'
    ? 'Inserisci una RAL per vedere la stima.'
    : parsedInput.error === 'negative'
      ? 'La RAL non può essere negativa.'
      : parsedInput.error === 'invalid'
        ? 'Inserisci un importo positivo, ad esempio 40.000 o 40.000,50.'
        : 'Formati supportati: 40.000,50 oppure 40000.50.'

  return (
    <main>
      <nav className="nav wrap" aria-label="Navigazione principale">
        <a className="brand" href="#calcolatore" aria-label="In chiaro, torna al calcolatore">
          <span className="brand-mark">↘</span> in chiaro
        </a>
        <a className="nav-link" href="#metodo">Come calcoliamo</a>
      </nav>

      <section className="hero wrap" id="calcolatore">
        <div className="hero-copy">
          <p className="eyebrow">STIMA 2026 · MILANO</p>
          <h1>Il tuo stipendio,<br /><em>in chiaro.</em></h1>
          <p className="intro">Inserisci la RAL e scopri, euro per euro, cosa resta davvero a te.</p>
        </div>

        <div className="calculator-card">
          <label htmlFor="salary">Retribuzione annua lorda</label>
          <div className={`salary-input ${parsedInput.error ? 'invalid' : ''}`}>
            <span>€</span>
            <input
              id="salary"
              inputMode="decimal"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              aria-describedby="salary-help"
              aria-invalid={Boolean(parsedInput.error)}
            />
            <span className="per-year">/ anno</span>
          </div>
          <p className="input-help" id="salary-help">
            {validationMessage}
          </p>
          <div className="quick-values" aria-label="Esempi di RAL">
            {[30_000, 40_000, 55_000].map((amount) => (
              <button key={amount} onClick={() => setSalary(amount)}>{euro.format(amount)}</button>
            ))}
          </div>
        </div>
      </section>

      {estimate && (
        <>
          <section className="result wrap" aria-live="polite">
            <div className="net-card">
              <div>
                <p className="eyebrow">LA TUA STIMA</p>
                <p className="net-label">Netto mensile</p>
                <p className="net-amount">{euro.format(estimate.netMonthly)}</p>
                <p className="net-caption">su {RULES_2026.monthlyPayments} mensilità</p>
              </div>
              <div className="annual-net">
                <span>Netto annuale</span>
                <strong>{euro.format(estimate.netAnnual)}</strong>
              </div>
            </div>

            <div className="takeaway">
              <span className="takeaway-icon">↳</span>
              <p>Su <strong>{euro.format(estimate.grossAnnual)}</strong> di RAL, ti restano <strong>{Math.round((estimate.netAnnual / estimate.grossAnnual) * 100)} centesimi</strong> per ogni euro guadagnato.</p>
            </div>
          </section>

          <section className="insight wrap" aria-labelledby="insight-title">
            <div className="insight-mark">↗</div>
            <div>
              <p className="eyebrow">COSA CAMBIA ALLA TUA RAL?</p>
              <h2 id="insight-title">Ogni aumento ha un percorso.</h2>
            </div>
            <div className="insight-details">
              {(() => {
                const insight = getSalaryInsight(estimate)
                return <>
                  <p><strong>Aliquota IRPEF marginale: {Math.round(insight.marginalIrpefRate * 100)}%</strong><br />È l’aliquota applicata alla prossima parte del tuo imponibile, non a tutta la RAL.</p>
                  <p><strong>Beneficio cuneo fiscale</strong><br />{insight.taxWedgeLabel}</p>
                  <p className="insight-explanation">{insight.growthExplanation} È una stima, non la previsione di un cedolino.</p>
                </>
              })()}
            </div>
          </section>

          <section className="breakdown wrap" aria-labelledby="breakdown-title">
            <div className="section-heading">
              <p className="eyebrow">DOVE VA LA TUA RAL</p>
              <h2 id="breakdown-title">Un conto semplice.<br />Tutto visibile.</h2>
            </div>
            <div className="breakdown-card">
              <div className="money-row gross-row">
                <span>RAL lorda</span><strong>{euro.format(estimate.grossAnnual)}</strong>
              </div>
              {(() => {
                const localTaxes = estimate.lombardyRegionalTax + estimate.milanMunicipalTax
                const distribution = [
                  { label: 'Contributi INPS', value: estimate.employeeContributions, tone: 'contributions' },
                  { label: 'IRPEF netta', value: estimate.netIrpef, tone: 'irpef' },
                  { label: 'Addizionali locali', value: localTaxes, tone: 'local' },
                  { label: 'Netto annuale', value: estimate.netAnnual, tone: 'net' },
                ]
                const distributionWithPercentages = distribution.map((item, index) => {
                  const percentage = index === distribution.length - 1
                    ? 100 - distribution.slice(0, index).reduce((total, previous) => total + Math.round((previous.value / estimate.grossAnnual) * 1_000) / 10, 0)
                    : Math.round((item.value / estimate.grossAnnual) * 1_000) / 10
                  return { ...item, percentage }
                })
                return <div className="distribution" role="group" aria-label="Ripartizione accessibile della RAL">
                  <div className="stacked-bar" role="img" aria-label={distributionWithPercentages.map((item) => `${item.label}: ${euro.format(item.value)}, ${formatPercentage(item.percentage)}`).join('. ')}>
                    {distribution.map((item) => <span key={item.label} className={item.tone} style={{ width: `${(item.value / estimate.grossAnnual) * 100}%` }} />)}
                  </div>
                  <ul className="distribution-list">
                    {distributionWithPercentages.map((item) => <li key={item.label}><span><i className={`dot ${item.tone}`} />{item.label}</span><strong>{euro.format(item.value)} · {formatPercentage(item.percentage)}</strong></li>)}
                  </ul>
                </div>
              })()}

              <div className="money-row">
                <span><i className="dot contributions" />Contributi INPS</span><strong>− {euro.format(estimate.employeeContributions)}</strong>
              </div>
              <p className="row-note">9,19% + 1% oltre {euro.format(RULES_2026.additionalContributionThreshold)}</p>
              <div className="money-row">
                <span><i className="dot irpef" />IRPEF netta</span><strong>− {euro.format(estimate.netIrpef)}</strong>
              </div>
              <p className="row-note">IRPEF lorda {euro.format(estimate.grossIrpef)} − detrazioni {euro.format(estimate.employmentTaxDeduction + estimate.taxWedgeDeduction)}</p>
              <div className="money-row">
                <span><i className="dot regional" />Addizionale Lombardia</span><strong>− {euro.format(estimate.lombardyRegionalTax)}</strong>
              </div>
              <div className="money-row">
                <span><i className="dot municipal" />Addizionale Milano</span><strong>− {euro.format(estimate.milanMunicipalTax)}</strong>
              </div>
              {estimate.taxWedgePayment > 0 && (
                <div className="money-row relief-row">
                  <span><i className="dot relief" />Somma cuneo fiscale</span><strong>+ {euro.format(estimate.taxWedgePayment)}</strong>
                </div>
              )}
              <div className="net-total">
                <span>Quello che resta a te</span><strong>{euro.format(estimate.netAnnual)}</strong>
              </div>
            </div>
          </section>

          <section className="details wrap" id="metodo">
            <div className="details-copy">
              <p className="eyebrow">IL METODO</p>
              <h2>Una stima onesta,<br />non una scatola nera.</h2>
              <p>Partiamo dalla RAL, sottraiamo i contributi del dipendente, calcoliamo l’IRPEF progressiva e poi le addizionali locali. Le detrazioni riducono l’IRPEF, non l’imponibile.</p>
            </div>
            <dl className="formula-list">
              <div><dt>Imponibile IRPEF</dt><dd>{euro.format(estimate.grossAnnual)} − {euro.format(estimate.employeeContributions)} = <strong>{euro.format(estimate.taxableIncome)}</strong></dd></div>
              <div><dt>IRPEF 2026</dt><dd>23% fino a €28k · 33% fino a €50k · 43% oltre</dd></div>
              <div><dt>Detrazioni incluse</dt><dd>Lavoro dipendente e beneficio cuneo fiscale, quando spettante.</dd></div>
            </dl>
          </section>
        </>
      )}

      <section className="notes wrap" aria-labelledby="notes-title">
        <div>
          <p className="eyebrow">PRIMA DI USARLO</p>
          <h2 id="notes-title">Assunzioni</h2>
        </div>
        <div className="notes-grid">
          <p><strong>Profilo standard.</strong> Dipendente privato, residente fiscalmente a Milano, assunto per tutto il 2026, senza familiari a carico né altri redditi o oneri.</p>
          <p><strong>13 mensilità.</strong> Il netto mensile è il netto annuo diviso 13. Le addizionali possono avere tempi di trattenuta diversi in busta paga.</p>
          <p><strong>Contributi stimati.</strong> Usiamo 9,19% del dipendente e l’1% aggiuntivo oltre la prima fascia 2026; CCNL e settore possono cambiare l’aliquota.</p>
          <p><strong>Milano: dato da confermare.</strong> Per il 2026 usiamo 0,8% e soglia €23.000 come assunzione basata sulla regola comunale confermata nel 2025: il database MEF non espone ancora un record 2026.</p>
          <p><strong>Fuori dal perimetro.</strong> TFR, welfare, premi, straordinari, bonus, impatriati, mutui/spese detraibili e regimi agevolati non sono calcolati.</p>
        </div>
      </section>

      <footer className="footer wrap">
        <div><a className="brand" href="#calcolatore"><span className="brand-mark">↘</span> in chiaro</a><p>Una guida, non un cedolino.</p></div>
        <div className="sources"><p>Fonti ufficiali</p><a href="https://www.normattiva.it/eli/stato/LEGGE/2025/12/30/199/CONSOLIDATED" target="_blank" rel="noreferrer">Legge di Bilancio 2026 ↗</a><a href="https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.lavoratori-dipendenti-limite-minimo-di-retribuzione-giornaliera-2026.html" target="_blank" rel="noreferrer">INPS: soglie 2026 ↗</a><a href="https://www.regione.lombardia.it/bollo-auto-e-tributi-regionali/red-addizionale-regionale-irpef" target="_blank" rel="noreferrer">Regione Lombardia ↗</a><a href="https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&cc=F205&pr=MI&r=1" target="_blank" rel="noreferrer">MEF: Comune di Milano ↗</a></div>
      </footer>
    </main>
  )
}

export default App
