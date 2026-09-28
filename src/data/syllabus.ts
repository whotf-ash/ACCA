export interface SubChapter {
  id: string;
  title: string;
}

export interface Chapter {
  id: string;
  code: string;
  title: string;
  subChapters: SubChapter[];
}

export interface Subject {
  code: string;
  name: string;
  chapters: Chapter[];
}

export const syllabusData: Subject[] = [
  {
    code: "BT",
    name: "Business and Technology",
    chapters: [
      {
        id: "bt-a",
        code: "A",
        title: "The business organisation and its external environment",
        subChapters: [
          { id: "bt-a1", title: "Purpose and types of business organisation" },
          { id: "bt-a2", title: "Stakeholders and Mendelow matrix" },
          { id: "bt-a3", title: "Political and legal factors" },
          { id: "bt-a4", title: "Macroeconomic factors" },
          { id: "bt-a5", title: "Microeconomic factors" },
          { id: "bt-a6", title: "Social and demographic factors" },
          { id: "bt-a7", title: "Technological factors" },
          { id: "bt-a8", title: "Environmental and sustainability factors" },
          { id: "bt-a9", title: "Competitive factors & Porter's models" },
        ],
      },
      {
        id: "bt-b",
        code: "B",
        title: "Organisational structure, culture, governance and sustainability",
        subChapters: [
          { id: "bt-b1", title: "Formal and informal organisation" },
          { id: "bt-b2", title: "Organisational structure & Anthony's hierarchy" },
          { id: "bt-b3", title: "Organisational culture (Schein, Handy, Hofstede)" },
          { id: "bt-b4", title: "Corporate Governance & agency theory" },
          { id: "bt-b5", title: "Sustainable business practices & CSR" },
        ],
      },
      {
        id: "bt-c",
        code: "C",
        title: "Business functions, regulation and technology",
        subChapters: [
          { id: "bt-c1", title: "Accounting and other core functions" },
          { id: "bt-c2", title: "Accounting and finance function roles" },
          { id: "bt-c3", title: "Regulation, fraud and financial crime" },
          { id: "bt-c4", title: "Financial information & reports" },
          { id: "bt-c5", title: "Financial systems and technology" },
          { id: "bt-c6", title: "Internal controls & management duties" },
          { id: "bt-c7", title: "Emerging technology (Cloud, AI, Blockchain, Cyber)" },
        ],
      },
      {
        id: "bt-d",
        code: "D",
        title: "Leadership and management",
        subChapters: [
          { id: "bt-d1", title: "Leadership, management and supervision theories" },
          { id: "bt-d2", title: "Individual and group behaviour" },
          { id: "bt-d3", title: "Team formation and management (Belbin, Tuckman)" },
          { id: "bt-d4", title: "Motivating individuals and teams (Maslow, Herzberg)" },
          { id: "bt-d5", title: "Learning and training (Kolb, Honey & Mumford)" },
          { id: "bt-d6", title: "Review and appraisal" },
        ],
      },
      {
        id: "bt-e",
        code: "E",
        title: "Personal effectiveness and communication in business",
        subChapters: [
          { id: "bt-e1", title: "Personal effectiveness & time management" },
          { id: "bt-e2", title: "Consequences of ineffectiveness" },
          { id: "bt-e3", title: "Competence frameworks & PDPs" },
          { id: "bt-e4", title: "Conflict causes and resolution" },
          { id: "bt-e5", title: "Communicating in business" },
        ],
      },
      {
        id: "bt-f",
        code: "F",
        title: "Professional ethics",
        subChapters: [
          { id: "bt-f1", title: "Fundamental ethical principles (IESBA/ACCA)" },
          { id: "bt-f2", title: "Role of regulatory and professional bodies" },
          { id: "bt-f3", title: "Corporate codes of ethics" },
          { id: "bt-f4", title: "Ethical conflicts, threats and safeguards" },
        ],
      },
    ],
  },
  {
    code: "MA",
    name: "Management Accounting",
    chapters: [
      {
        id: "ma-a",
        code: "A",
        title: "Nature, source and purpose of management information",
        subChapters: [
          { id: "ma-a1", title: "Accounting for management vs Financial accounting" },
          { id: "ma-a2", title: "Sources of data & data capture costs" },
          { id: "ma-a3", title: "Cost classification & behaviour" },
          { id: "ma-a4", title: "Presenting information & data visualisation" },
        ],
      },
      {
        id: "ma-b",
        code: "B",
        title: "Data analysis and statistical techniques",
        subChapters: [
          { id: "ma-b1", title: "Sampling methods" },
          { id: "ma-b2", title: "Analytical techniques, linear regression & forecasting" },
          { id: "ma-b3", title: "Time series analysis & index numbers" },
          { id: "ma-b4", title: "Summarising data, Big Data & normal distribution" },
          { id: "ma-b5", title: "Spreadsheets in management accounting" },
        ],
      },
      {
        id: "ma-c",
        code: "C",
        title: "Cost accounting techniques",
        subChapters: [
          { id: "ma-c1", title: "Accounting for materials & EOQ" },
          { id: "ma-c2", title: "Accounting for labour & ratios" },
          { id: "ma-c3", title: "Overheads allocation, apportionment & absorption" },
          { id: "ma-c4", title: "Absorption vs Marginal costing" },
          { id: "ma-c5", title: "Job, batch, process & service costing" },
          { id: "ma-c6", title: "Alternative principles (ABC, Target, Life-cycle)" },
        ],
      },
      {
        id: "ma-d",
        code: "D",
        title: "Budgeting",
        subChapters: [
          { id: "ma-d1", title: "Nature and purpose of budgeting" },
          { id: "ma-d2", title: "Budget preparation & master budget" },
          { id: "ma-d3", title: "Flexible budgets & volume flexing" },
          { id: "ma-d4", title: "Investment appraisal (NPV, IRR, Payback)" },
          { id: "ma-d5", title: "Budgetary control & variance reporting" },
          { id: "ma-d6", title: "Behavioural aspects of budgeting" },
        ],
      },
      {
        id: "ma-e",
        code: "E",
        title: "Standard costing",
        subChapters: [
          { id: "ma-e1", title: "Standard costing systems & unit standards" },
          { id: "ma-e2", title: "Variance calculations (Materials, Labour, Overheads, Sales)" },
          { id: "ma-e3", title: "Reconciliation of budgeted and actual profit" },
        ],
      },
      {
        id: "ma-f",
        code: "F",
        title: "Performance measurement",
        subChapters: [
          { id: "ma-f1", title: "Overview & strategic performance measures" },
          { id: "ma-f2", title: "Financial ratios & non-financial measures (Balanced Scorecard)" },
          { id: "ma-f3", title: "Cost reduction and value enhancement" },
          { id: "ma-f4", title: "Monitoring performance & benchmarking" },
        ],
      },
    ],
  },
  {
    code: "FA",
    name: "Financial Accounting",
    chapters: [
      {
        id: "fa-a",
        code: "A",
        title: "Context and purpose of financial reporting",
        subChapters: [
          { id: "fa-a1", title: "Scope and purpose of external financial statements" },
          { id: "fa-a2", title: "Stakeholders' needs" },
          { id: "fa-a3", title: "Main elements of financial statements" },
          { id: "fa-a4", title: "Regulatory framework (IFRS, IASB, ISSB)" },
          { id: "fa-a5", title: "Governance duties of directors" },
        ],
      },
      {
        id: "fa-b",
        code: "B",
        title: "Accounting principles, concepts and qualitative characteristics",
        subChapters: [
          { id: "fa-b1", title: "Key principles (Going concern, Accruals, Prudence, etc.)" },
          { id: "fa-b2", title: "Qualitative characteristics of financial information" },
        ],
      },
      {
        id: "fa-c",
        code: "C",
        title: "Double-entry bookkeeping and accounting systems",
        subChapters: [
          { id: "fa-c1", title: "Double-entry principles & accounting equation" },
          { id: "fa-c2", title: "Ledger accounts, journals & balancing" },
        ],
      },
      {
        id: "fa-d",
        code: "D",
        title: "Recording transactions and events",
        subChapters: [
          { id: "fa-d1", title: "Sales, purchases, sales tax & discounts" },
          { id: "fa-d2", title: "Cash and bank reconciliations" },
          { id: "fa-d3", title: "Inventories valuation (FIFO, AVCO, IAS 2)" },
          { id: "fa-d4", title: "Tangible non-current assets & revaluations" },
          { id: "fa-d5", title: "Depreciation methods & ledger entries" },
          { id: "fa-d6", title: "Intangible assets & R&D amortisation" },
          { id: "fa-d7", title: "Accruals and prepayments" },
          { id: "fa-d8", title: "Receivables, payables & irrecoverable debts" },
          { id: "fa-d9", title: "Provisions and contingencies" },
          { id: "fa-d10", title: "Capital structure, shares & finance costs" },
        ],
      },
      {
        id: "fa-e",
        code: "E",
        title: "Reconciliations",
        subChapters: [
          { id: "fa-e1", title: "Bank reconciliations" },
          { id: "fa-e2", title: "Payables ledger account reconciliations" },
        ],
      },
      {
        id: "fa-f",
        code: "F",
        title: "Preparing a trial balance",
        subChapters: [
          { id: "fa-f1", title: "Trial balance extraction & limitations" },
          { id: "fa-f2", title: "Correction of errors & journals" },
          { id: "fa-f3", title: "Suspense accounts & clearing entries" },
        ],
      },
      {
        id: "fa-g",
        code: "G",
        title: "Preparing financial statements",
        subChapters: [
          { id: "fa-g1", title: "Statement of Financial Position (SFP)" },
          { id: "fa-g2", title: "Statement of Profit or Loss (SPL) and OCI" },
          { id: "fa-g3", title: "Disclosure notes & post-balance sheet events" },
          { id: "fa-g4", title: "Statement of cash flows" },
          { id: "fa-g5", title: "Incomplete records & mark-ups/margins" },
        ],
      },
      {
        id: "fa-h",
        code: "H",
        title: "Basic consolidated financial statements",
        subChapters: [
          { id: "fa-h1", title: "Subsidiaries & Consolidated SFP (Goodwill, NCI)" },
          { id: "fa-h2", title: "Consolidated Statement of Profit or Loss" },
          { id: "fa-h3", title: "Associates & Equity method" },
        ],
      },
      {
        id: "fa-i",
        code: "I",
        title: "Interpretation of financial statements",
        subChapters: [
          { id: "fa-i1", title: "Financial ratios analysis (Profitability, Liquidity, Position)" },
          { id: "fa-i2", title: "Comprehensive analysis and reporting" },
        ],
      },
    ],
  },
];