<div align="center">

[Italiano](#italiano) · [English](#english)

</div>

<a id="italiano"></a>

# In chiaro — dalla RAL allo stipendio netto

Prototipo realizzato per la prova pratica **Jet HR Product Builder**. L'obiettivo è volutamente semplice: inserire una Retribuzione Annua Lorda (RAL) e ottenere una stima comprensibile dello stipendio netto per un caso standard nel 2026.

Il prodotto non prova a sostituire un cedolino o un software paghe. Privilegia invece tre aspetti utili per valutare il prototipo: un flusso essenziale, una logica leggibile e un risultato spiegabile. Ogni voce del calcolo è mostrata separatamente, così da rendere visibili sia le regole applicate sia le semplificazioni necessarie.

**Demo:** <https://alessiocaneschi.github.io/jet-hr-product-builder/>

## Scelte di prodotto

- Un solo dato in ingresso, la RAL, per mantenere l'esperienza immediata.
- Un profilo standard esplicito: dipendente del settore privato, residente a Milano, anno lavorato per intero e 13 mensilità.
- Un dettaglio del risultato che separa contributi, imponibile, IRPEF, detrazioni, beneficio legato al cuneo fiscale e addizionali locali.
- Regole e fonti vicine al codice che le implementa, in modo che il modello sia controllabile e aggiornabile.
- Nessuna falsa precisione: il risultato è una stima annualizzata e le ipotesi non verificabili dalla sola RAL sono dichiarate come tali.

## Avvio in locale

Il progetto richiede Node.js e usa il file di blocco di pnpm.

```bash
pnpm install
pnpm dev
```

Per eseguire i controlli disponibili:

```bash
pnpm test
pnpm build
```

## Architettura

L'interfaccia è una piccola applicazione a pagina singola realizzata con React, TypeScript e Vite.

La logica di calcolo è separata dalla UI e si trova in [`src/lib/salary.ts`](src/lib/salary.ts). È composta da funzioni pure, contiene costanti nominate per le regole 2026, riceve una RAL annua e restituisce tutte le voci della stima. I componenti dell'interfaccia si occupano soltanto di acquisire l'input, formattare i valori e presentare il risultato.

I test in [`src/lib/salary.test.ts`](src/lib/salary.test.ts) coprono scaglioni progressivi, soglie, detrazioni, beneficio legato al cuneo fiscale e un caso completo rappresentativo. La validazione dell'input è testata separatamente in [`src/lib/salaryInput.test.ts`](src/lib/salaryInput.test.ts). Non vengono usate librerie fiscali o calcolatori esterni.

## Come funziona il modello 2026

Il calcolo è annuale. Mantiene la precisione durante i passaggi intermedi e arrotonda ai centesimi soltanto i valori restituiti.

1. Calcola i contributi previdenziali a carico del dipendente applicando il 9,19% alla RAL e un contributo aggiuntivo dell'1% alla quota che supera €56.224.
2. Ricava l'imponibile fiscale sottraendo i contributi dalla RAL.
3. Calcola l'IRPEF lorda per scaglioni: 23% fino a €28.000, 33% da €28.000 a €50.000 e 43% oltre €50.000.
4. Sottrae la detrazione per lavoro dipendente, compresa la maggiorazione di €65 tra €25.000 e €35.000, e applica dove previsto la misura strutturale sul cuneo fiscale: somma esente fino a €20.000 oppure detrazione aggiuntiva fino a €40.000.
5. Calcola l'addizionale regionale lombarda per scaglioni e l'addizionale comunale di Milano secondo l'ipotesi descritta sotto.
6. Divide il netto annuo per 13 per ottenere il netto mensile mostrato nell'interfaccia.

## Assunzioni e limiti

- Il profilo considerato è un dipendente del settore privato residente a Milano ai fini delle addizionali, con un intero anno di lavoro e 13 mensilità.
- Non sono inclusi coniuge, figli o altri familiari a carico, altri redditi, oneri deducibili, ulteriori detrazioni, regime impatriati, agevolazioni legate alla disabilità o conguagli di anni precedenti.
- Non sono inclusi premi variabili, straordinari, fringe benefit, welfare, buoni pasto, TFR, previdenza complementare, compensi azionari o eccezioni previste dal contratto collettivo.
- Il 9,19% è un'aliquota tipica scelta per il caso standard. L'aliquota effettiva può cambiare in base a settore, dimensione dell'azienda, CCNL e tipo di rapporto.
- La stima è annualizzata. Un cedolino reale può differire perché ritenute e detrazioni vengono gestite mese per mese, le addizionali seguono normalmente un calendario diverso e gli arrotondamenti delle paghe non coincidono necessariamente con quelli del prototipo.
- Nella banca dati ufficiale del Dipartimento delle Finanze non risulta, alla data del controllo, una voce 2026 per Milano. Il modello riporta quindi l'ultima regola confermata per il 2025: aliquota dello 0,8%, nessuna addizionale fino a €23.000 di imponibile e applicazione sull'intera base oltre la soglia. È un'ipotesi del prototipo, non un valore 2026 dato per definitivo.
- La Legge di Bilancio 2026 prevede un'imposta sostitutiva del 5% per determinati aumenti retributivi collegati a rinnovi contrattuali. La misura è esclusa perché la sola RAL non consente di stabilire l'idoneità né di isolare la parte di retribuzione interessata.
- Il risultato ha finalità dimostrativa e non costituisce consulenza fiscale, previdenziale o del lavoro.

## Regole e provenienza

Il catalogo [`RULE_PROVENANCE`](src/lib/salary.ts) affianca le fonti alle costanti usate nel calcolo. La distinzione serve a non trattare allo stesso modo una regola direttamente rappresentabile e una scelta necessaria per costruire un prototipo basato sulla sola RAL.

| Regola implementata | Trattamento nel modello | Stato | Fonte ufficiale |
| --- | --- | --- | --- |
| Contributo dipendente del 9,19% | Aliquota tipica per un dipendente privato standard | Ipotesi del prototipo: può variare per CCNL, settore e datore di lavoro | [INPS, parametri contributivi 2026](https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.lavoratori-dipendenti-limite-minimo-di-retribuzione-giornaliera-2026.html) |
| Contributo aggiuntivo dell'1% oltre €56.224 | Soglia e aliquota 2026 | Regola codificata | [Circolare INPS n. 27/2026](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.03.circolare-numero-27-del-11-03-2026_15198.html) |
| IRPEF 23% / 33% / 43% | In vigore dal 1° gennaio 2026 | Regola codificata | [Legge 199/2025](https://www.normattiva.it/eli/stato/LEGGE/2025/12/30/199/CONSOLIDATED) |
| Detrazione per lavoro dipendente e maggiorazione di €65 | Regola strutturale inclusa nel modello 2026 | Regola codificata | [Ministero del Lavoro, Legge di Bilancio 2025](https://www.lavoro.gov.it/notizie/pagine/legge-di-bilancio-2025-le-misure-lavoratori-imprese-e-famiglie) |
| Somma esente o detrazione legata al cuneo fiscale | Regola strutturale inclusa nel modello 2026 | Regola codificata | [Ministero del Lavoro, Legge di Bilancio 2025](https://www.lavoro.gov.it/notizie/pagine/legge-di-bilancio-2025-le-misure-lavoratori-imprese-e-famiglie) |
| Addizionale Lombardia 1,23% / 1,58% / 1,72% / 1,73% | Scaglioni regionali pubblicati per il 2026 | Regola codificata | [Regione Lombardia](https://www.regione.lombardia.it/bollo-auto-e-tributi-regionali/red-addizionale-regionale-irpef) |
| Addizionale Milano 0,8%, esenzione fino a €23.000 | Riporto dell'ultima regola 2025 confermata | Ipotesi del prototipo: manca la conferma 2026 nella banca dati | [Dipartimento delle Finanze](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&cc=F205&pr=MI&r=1), [Regolamento del Comune di Milano](https://www.comune.milano.it/documents/20126/200621592/Regolamento%2Bper%2Bl%27applicazione%2Bdell%27Addizionale%2BComunale%2Ball%27Imposta%2Bsul%2BReddito%2Bdelle%2BPersone%2BFisiche.pdf/f5423372-46d4-c742-7cbe-4d0959865ec0?t=1613126257286) |
| 13 mensilità | Netto annuo diviso per 13 | Scelta del prototipo: il contratto può prevederne 12, 13 o 14 | Non esiste una regola universale applicabile a tutti i contratti |

## Fonti ufficiali consultate

- [Legge 30 dicembre 2025, n. 199 — Normattiva](https://www.normattiva.it/eli/stato/LEGGE/2025/12/30/199/CONSOLIDATED): porta al 33% l'aliquota IRPEF intermedia dal 1° gennaio 2026 e disciplina la misura al 5% per alcuni rinnovi contrattuali.
- [Sintesi della Legge di Bilancio 2026 — Ministero del Lavoro](https://www.lavoro.gov.it/notizie/pagine/legge-di-bilancio-2026-le-principali-misure-lavoratori-imprese-e-famiglie): riepiloga gli scaglioni 23% / 33% / 43% e le principali misure sul lavoro.
- [Redditi di lavoro dipendente e pensione — Agenzia delle Entrate](https://infoprecompilata.agenziaentrate.gov.it/portale/semplificata-mod-lavoro-dipendente-e-pensioni): descrive la somma esente e la detrazione aggiuntiva collegate al cuneo fiscale.
- [Sintesi della Legge di Bilancio 2025 — Ministero del Lavoro](https://www.lavoro.gov.it/notizie/pagine/legge-di-bilancio-2025-le-misure-lavoratori-imprese-e-famiglie): documenta le regole strutturali su detrazione da lavoro dipendente e cuneo fiscale riprese nel modello.
- [Parametri contributivi 2026](https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.lavoratori-dipendenti-limite-minimo-di-retribuzione-giornaliera-2026.html) e [circolare n. 27/2026](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.03.circolare-numero-27-del-11-03-2026_15198.html) — INPS: indicano la soglia di €56.224 per il contributo aggiuntivo dell'1%.
- [Addizionale regionale IRPEF — Regione Lombardia](https://www.regione.lombardia.it/bollo-auto-e-tributi-regionali/red-addizionale-regionale-irpef): riporta gli scaglioni regionali usati nel calcolo.
- [Addizionale comunale IRPEF di Milano — Dipartimento delle Finanze](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&cc=F205&pr=MI&r=1): conferma per il 2025 l'aliquota dello 0,8% e la soglia di esenzione di €23.000; non mostra una voce 2026 alla data del controllo.
- [Regolamento dell'addizionale comunale — Comune di Milano](https://www.comune.milano.it/documents/20126/200621592/Regolamento%2Bper%2Bl%27applicazione%2Bdell%27Addizionale%2BComunale%2Ball%27Imposta%2Bsul%2BReddito%2Bdelle%2BPersone%2BFisiche.pdf/f5423372-46d4-c742-7cbe-4d0959865ec0?t=1613126257286): definisce aliquota ed esenzione, salvo successive modifiche valide.

Fonti ricontrollate il 21 agosto 2026.

## Pubblicazione

Il flusso automatico [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) compila il progetto e pubblica il risultato su GitHub Pages a ogni push su `main`. Se Pages non è già configurato, nelle impostazioni della repository va selezionato **GitHub Actions** come origine.

La build dedicata usa il percorso base della repository:

```bash
pnpm build:pages
```

Una volta completato il flusso automatico, l'app è disponibile su <https://alessiocaneschi.github.io/jet-hr-product-builder/>.


---

<a id="english"></a>

# In chiaro — from gross annual salary to net pay

Prototype created for the **Jet HR Product Builder take-home assignment**. Its deliberately simple goal is to let someone enter an annual gross salary (RAL) and receive an understandable 2026 net-salary estimate for a standard case.

The product does not try to replace a payslip or payroll software. It focuses on three things that matter for this prototype: a short flow, readable logic, and an explainable result. Each part of the calculation is shown separately so both the applied rules and the necessary simplifications remain visible.

**Live demo:** <https://alessiocaneschi.github.io/jet-hr-product-builder/>

## Product choices

- One input—the annual gross salary—to keep the experience immediate.
- An explicit standard profile: private-sector employee, resident in Milan, employed for the full year, with 13 salary payments.
- An itemised result separating contributions, taxable income, IRPEF, deductions, tax-wedge relief, and local surcharges.
- Rules and sources kept close to the code that implements them, so the model can be reviewed and updated.
- No false precision: the result is an annualised estimate, and assumptions that cannot be confirmed from RAL alone are labelled as such.

## Run locally

The project requires Node.js and uses the pnpm lockfile.

```bash
pnpm install
pnpm dev
```

Run the available checks with:

```bash
pnpm test
pnpm build
```

## Architecture

The interface is a small single-page application built with React, TypeScript, and Vite.

Calculation logic is separate from the UI and lives in [`src/lib/salary.ts`](src/lib/salary.ts). It consists of pure functions, contains named constants for the 2026 rules, receives an annual gross salary, and returns every item in the estimate. UI components only collect the input, format values, and present the result.

Tests in [`src/lib/salary.test.ts`](src/lib/salary.test.ts) cover progressive bands, thresholds, deductions, tax-wedge relief, and a representative end-to-end case. Input validation is tested separately in [`src/lib/salaryInput.test.ts`](src/lib/salaryInput.test.ts). No tax libraries or external calculators are used.

## How the 2026 model works

The calculation is annual. It retains precision during intermediate steps and rounds returned values to cents.

1. Calculate employee social-security contributions at 9.19% of RAL, plus a 1% additional contribution on the portion above €56,224.
2. Calculate taxable income by subtracting employee contributions from RAL.
3. Calculate gross IRPEF progressively: 23% up to €28,000, 33% from €28,000 to €50,000, and 43% above €50,000.
4. Subtract the standard employment deduction, including the €65 supplement between €25,000 and €35,000, and apply the structural tax-wedge measure where eligible: an exempt payment up to €20,000 or an additional deduction up to €40,000.
5. Calculate Lombardy's progressive regional surcharge and Milan's municipal surcharge under the assumption explained below.
6. Divide annual net pay by 13 to obtain the monthly figure shown in the interface.

## Assumptions and limitations

- The model assumes a private-sector employee resident in Milan for local-tax purposes, employed for the full year, with 13 salary payments.
- It excludes spouses, children or other dependants, other income, deductible expenses, further tax credits, impatriate relief, disability-related relief, and settlements from previous years.
- It excludes variable pay, overtime, fringe benefits, welfare, meal vouchers, TFR, supplementary pension contributions, stock compensation, and collective-agreement exceptions.
- The 9.19% rate is a typical assumption for the standard case. The actual employee rate can vary by sector, company size, CCNL, and employment type.
- This is an annualised estimate. A real payslip can differ because withholding and deductions are handled monthly, local surcharges normally follow a different schedule, and payroll rounding may differ.
- At the date checked, the official Department of Finance database had no 2026 Milan record. The model therefore carries forward the latest confirmed 2025 rule: a 0.8% rate, no surcharge at or below €23,000 of taxable income, and application to the full taxable base above that threshold. This is a prototype assumption, not a confirmed 2026 value.
- The 2026 Budget Law introduced a 5% substitute-tax regime for certain pay increases linked to contract renewals. It is excluded because RAL alone cannot establish eligibility or isolate the qualifying portion.
- The result is for demonstration purposes and does not constitute tax, social-security, or employment advice.

## Rules and provenance

The [`RULE_PROVENANCE`](src/lib/salary.ts) catalogue keeps sources next to the constants used in the calculation. The distinction prevents a directly representable rule from being presented in the same way as a choice required by a RAL-only prototype.

| Encoded rule | Treatment in the model | Status | Official source |
| --- | --- | --- | --- |
| 9.19% employee contribution | Typical rate for a standard private-sector employee | Prototype assumption: CCNL, sector, and employer details can change it | [INPS, 2026 contribution parameters](https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.lavoratori-dipendenti-limite-minimo-di-retribuzione-giornaliera-2026.html) |
| 1% additional contribution above €56,224 | 2026 threshold and rate | Encoded rule | [INPS circular no. 27/2026](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.03.circolare-numero-27-del-11-03-2026_15198.html) |
| IRPEF 23% / 33% / 43% | In force from 1 January 2026 | Encoded rule | [Law 199/2025](https://www.normattiva.it/eli/stato/LEGGE/2025/12/30/199/CONSOLIDATED) |
| Employment deduction and €65 supplement | Structural rule included in the 2026 model | Encoded rule | [Ministry of Labour, 2025 Budget Law](https://www.lavoro.gov.it/notizie/pagine/legge-di-bilancio-2025-le-misure-lavoratori-imprese-e-famiglie) |
| Tax-wedge exempt payment or deduction | Structural rule included in the 2026 model | Encoded rule | [Ministry of Labour, 2025 Budget Law](https://www.lavoro.gov.it/notizie/pagine/legge-di-bilancio-2025-le-misure-lavoratori-imprese-e-famiglie) |
| Lombardy surcharge 1.23% / 1.58% / 1.72% / 1.73% | Regional bands published for 2026 | Encoded rule | [Regione Lombardia](https://www.regione.lombardia.it/bollo-auto-e-tributi-regionali/red-addizionale-regionale-irpef) |
| Milan surcharge 0.8%, exemption through €23,000 | Latest confirmed 2025 rule carried forward | Prototype assumption: no 2026 confirmation in the database | [Department of Finance](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&cc=F205&pr=MI&r=1), [Comune di Milano regulation](https://www.comune.milano.it/documents/20126/200621592/Regolamento%2Bper%2Bl%27applicazione%2Bdell%27Addizionale%2BComunale%2Ball%27Imposta%2Bsul%2BReddito%2Bdelle%2BPersone%2BFisiche.pdf/f5423372-46d4-c742-7cbe-4d0959865ec0?t=1613126257286) |
| 13 salary payments | Annual net divided by 13 | Prototype choice: a contract may provide 12, 13, or 14 payments | No universal rule applies to every contract |

## Official sources consulted

- [Law 30 December 2025, no. 199 — Normattiva](https://www.normattiva.it/eli/stato/LEGGE/2025/12/30/199/CONSOLIDATED): changes the middle IRPEF rate to 33% from 1 January 2026 and regulates the 5% measure for certain contract renewals.
- [2026 Budget Law summary — Ministry of Labour](https://www.lavoro.gov.it/notizie/pagine/legge-di-bilancio-2026-le-principali-misure-lavoratori-imprese-e-famiglie): summarises the 23% / 33% / 43% bands and the main employment measures.
- [Employment income and pensions — Agenzia delle Entrate](https://infoprecompilata.agenziaentrate.gov.it/portale/semplificata-mod-lavoro-dipendente-e-pensioni): describes the tax-wedge exempt payment and additional deduction.
- [2025 Budget Law summary — Ministry of Labour](https://www.lavoro.gov.it/notizie/pagine/legge-di-bilancio-2025-le-misure-lavoratori-imprese-e-famiglie): documents the structural employment-deduction and tax-wedge rules used in the model.
- [2026 contribution parameters](https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.lavoratori-dipendenti-limite-minimo-di-retribuzione-giornaliera-2026.html) and [circular no. 27/2026](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.03.circolare-numero-27-del-11-03-2026_15198.html) — INPS: give the €56,224 threshold for the additional 1% contribution.
- [Regional IRPEF surcharge — Regione Lombardia](https://www.regione.lombardia.it/bollo-auto-e-tributi-regionali/red-addizionale-regionale-irpef): publishes the regional bands used in the calculation.
- [Milan municipal IRPEF surcharge — Department of Finance](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&cc=F205&pr=MI&r=1): confirms the 0.8% rate and €23,000 exemption for 2025 and showed no 2026 record when checked.
- [Municipal surcharge regulation — Comune di Milano](https://www.comune.milano.it/documents/20126/200621592/Regolamento%2Bper%2Bl%27applicazione%2Bdell%27Addizionale%2BComunale%2Ball%27Imposta%2Bsul%2BReddito%2Bdelle%2BPersone%2BFisiche.pdf/f5423372-46d4-c742-7cbe-4d0959865ec0?t=1613126257286): sets the rate and exemption, subject to subsequent valid changes.

Sources rechecked on 21 August 2026.

## Deployment

The [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) workflow builds the project and publishes it to GitHub Pages on every push to `main`. If Pages is not configured yet, select **GitHub Actions** as the source in the repository settings.

The dedicated build uses the repository base path:

```bash
pnpm build:pages
```

After the workflow completes, the app is available at <https://alessiocaneschi.github.io/jet-hr-product-builder/>.
