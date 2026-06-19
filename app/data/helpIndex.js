// Help Index - Searchable help topics for the fleet management system

export const helpIndex = [
  // ============================================
  // REPORTS CATEGORY
  // ============================================
  {
    id: "driver-reports-overview",
    title: "View Driver Reports & Statements",
    category: "Reports",
    subcategory: "Driver Reports",
    keywords: ["driver", "reports", "statement", "earnings", "settlement", "revenue", "expenses", "financial"],
    navigationPath: "Reports > Driver Reports",
    description: "Generate individual financial statements showing driver earnings, expenses, and net settlement for a specific period",
    steps: [
      "Navigate to Reports category on dashboard",
      "Click 'Driver Reports' card",
      "Select a driver from the dropdown menu",
      "Choose date range (From and To dates)",
      "Click 'Generate Report' button",
      "Review revenues, expenses, and summary tabs"
    ],
    relatedTopics: ["finalize-statement", "email-statement"],
    difficulty: "beginner",
    icon: "TrendingUp",
    color: "#4facfe"
  },
  {
    id: "summary-reports",
    title: "Generate Summary Reports",
    category: "Reports",
    subcategory: "Summary Reports",
    keywords: ["summary", "reports", "fleet", "overview", "all drivers", "total"],
    navigationPath: "Reports > Summary Reports",
    description: "View consolidated reports across all drivers showing total fleet performance",
    steps: [
      "Go to Reports category",
      "Click 'Summary Reports' card",
      "Select report type (Revenue, Expenses, etc.)",
      "Choose date range",
      "Click 'Generate' to view consolidated data"
    ],
    relatedTopics: ["driver-reports-overview"],
    difficulty: "beginner",
    icon: "Assessment",
    color: "#4facfe"
  },

  // ============================================
  // DATA UPLOADS CATEGORY
  // ============================================
  {
    id: "upload-trip-data",
    title: "Upload Trip Data from CSV/Excel",
    category: "Data Uploads",
    subcategory: "Import Data",
    keywords: ["upload", "import", "trips", "csv", "excel", "data", "file", "transaction"],
    navigationPath: "Data & Integrations > Data Import",
    description: "Import trip records from CSV or Excel files into the system",
    steps: [
      "Go to Data & Integrations category on dashboard",
      "Click 'Data Import' card",
      "Select 'Trip Data' from the data type dropdown",
      "Click 'Choose File' and select your CSV/Excel file",
      "Review the column mapping preview",
      "Click 'Upload' to import the data"
    ],
    relatedTopics: ["upload-credit-card", "icabbi-integration"],
    difficulty: "intermediate",
    icon: "CloudUpload",
    color: "#F9D13E"
  },
  {
    id: "upload-credit-card",
    title: "Upload Credit Card Transactions",
    category: "Data Uploads",
    subcategory: "Payment Data",
    keywords: ["credit card", "payment", "upload", "chase", "moneris", "transaction"],
    navigationPath: "Data & Integrations > Data Import",
    description: "Import credit card payment transactions from payment processor files",
    steps: [
      "Navigate to Data & Integrations category",
      "Click 'Data Import'",
      "Select 'Credit Card Transactions' from dropdown",
      "Upload CSV file from your payment processor",
      "Verify transaction count and amounts",
      "Click 'Upload' to process"
    ],
    relatedTopics: ["upload-trip-data", "driver-reports-overview"],
    difficulty: "intermediate",
    icon: "Payment",
    color: "#F9D13E"
  },
  {
    id: "upload-icabbi-shifts",
    title: "Upload iCabbi Logon/Logoff Data",
    category: "Data Uploads",
    subcategory: "Shift Data",
    keywords: ["icabbi", "logon", "logoff", "shift", "upload", "driver hours"],
    navigationPath: "Data & Integrations > Data Import",
    description: "Import driver shift data from iCabbi system including logon/logoff times",
    steps: [
      "Go to Data & Integrations",
      "Click 'Data Import'",
      "Select 'iCabbi Logon/Logoff' from dropdown",
      "Choose your iCabbi export file",
      "Review shift duration calculations",
      "Upload to create shift records"
    ],
    relatedTopics: ["icabbi-integration", "shift-management"],
    difficulty: "intermediate",
    icon: "Schedule",
    color: "#F9D13E"
  },

  // ============================================
  // FLEET MANAGEMENT - DRIVERS
  // ============================================
  {
    id: "create-new-driver",
    title: "Create a New Driver Profile",
    category: "Fleet Management",
    subcategory: "Drivers",
    keywords: ["add", "create", "new", "driver", "register", "setup", "onboard"],
    navigationPath: "Fleet Management > Drivers",
    description: "Add a new driver to your fleet with contact information and settings",
    steps: [
      "Go to Fleet Management category",
      "Click 'Drivers' card",
      "Click the '+ Add Driver' button (top right)",
      "Fill in required fields: Name, Driver Number, Contact Info",
      "Set driver type (Owner/Non-Owner) and status",
      "Configure payment settings if needed",
      "Click 'Save' to create the driver profile"
    ],
    relatedTopics: ["assign-driver-shift", "driver-reports-overview"],
    difficulty: "beginner",
    icon: "PersonAdd",
    color: "#667eea"
  },
  {
    id: "manage-drivers",
    title: "View and Edit Driver Information",
    category: "Fleet Management",
    subcategory: "Drivers",
    keywords: ["edit", "update", "driver", "contact", "status", "manage"],
    navigationPath: "Fleet Management > Drivers",
    description: "Update existing driver contact information, status, and settings",
    steps: [
      "Navigate to Fleet Management > Drivers",
      "Use search or filters to find the driver",
      "Click on the driver row to open details",
      "Edit fields as needed",
      "Click 'Save Changes' to update"
    ],
    relatedTopics: ["create-new-driver"],
    difficulty: "beginner",
    icon: "Person",
    color: "#667eea"
  },

  // ============================================
  // FLEET MANAGEMENT - CABS
  // ============================================
  {
    id: "create-new-cab",
    title: "Add a New Cab/Vehicle",
    category: "Fleet Management",
    subcategory: "Cabs",
    keywords: ["add", "create", "cab", "vehicle", "taxi", "car", "fleet"],
    navigationPath: "Fleet Management > Cabs",
    description: "Register a new vehicle in your fleet",
    steps: [
      "Go to Fleet Management category",
      "Click 'Cabs' card",
      "Click '+ Add Cab' button",
      "Enter cab number and vehicle details",
      "Add license plate, make, model",
      "Set cab status (Active/Inactive)",
      "Save the new cab"
    ],
    relatedTopics: ["assign-driver-shift", "cab-attributes"],
    difficulty: "beginner",
    icon: "DirectionsCar",
    color: "#667eea"
  },

  // ============================================
  // FLEET MANAGEMENT - SHIFTS
  // ============================================
  {
    id: "create-shift-profile",
    title: "Set Up Shift Profiles",
    category: "Fleet Management",
    subcategory: "Shift Configuration",
    keywords: ["shift", "profile", "schedule", "day", "night", "setup", "configure"],
    navigationPath: "Fleet Management > Shift Profiles",
    description: "Define shift types (Day, Night, etc.) with schedules and settings",
    steps: [
      "Navigate to Fleet Management > Shift Profiles",
      "Click '+ Create Profile' button",
      "Enter shift name (e.g., 'Day Shift', 'Night Shift')",
      "Set start and end times",
      "Configure shift-specific settings",
      "Save the profile"
    ],
    relatedTopics: ["assign-driver-shift", "shift-attributes"],
    difficulty: "intermediate",
    icon: "Schedule",
    color: "#667eea"
  },
  {
    id: "assign-driver-shift",
    title: "Assign Driver to Cab Shift",
    category: "Fleet Management",
    subcategory: "Shift Assignment",
    keywords: ["assign", "shift", "driver", "cab", "schedule", "roster"],
    navigationPath: "Fleet Management > Shift Assignment",
    description: "Create shift assignments linking drivers to cabs for specific time periods",
    steps: [
      "Go to Fleet Management > Shift Assignment",
      "Click '+ Create Shift' button",
      "Select the cab from dropdown",
      "Select shift profile (Day/Night)",
      "Choose the driver",
      "Set start and end dates",
      "Save the shift assignment"
    ],
    relatedTopics: ["create-shift-profile", "create-new-driver"],
    difficulty: "beginner",
    icon: "Assignment",
    color: "#667eea"
  },

  // ============================================
  // FINANCIAL SETUP
  // ============================================
  {
    id: "create-expense-category",
    title: "Set Up Expense Categories",
    category: "Billings & Charges",
    subcategory: "Financial Setup",
    keywords: ["expense", "category", "setup", "create", "financial", "cost"],
    navigationPath: "Billings & Charges > Financial Setup",
    description: "Define expense categories for charging costs to drivers or fleet",
    steps: [
      "Navigate to Billings & Charges category",
      "Click 'Financial Setup' card",
      "Go to 'Expense Categories' tab",
      "Click '+ Add Category' button",
      "Enter category name and description",
      "Set whether it's charged to drivers or owners",
      "Save the category"
    ],
    relatedTopics: ["create-recurring-expense", "driver-reports-overview"],
    difficulty: "intermediate",
    icon: "Receipt",
    color: "#764ba2"
  },
  {
    id: "create-recurring-expense",
    title: "Add Recurring Expenses",
    category: "Billings & Charges",
    subcategory: "Expense Management",
    keywords: ["recurring", "expense", "monthly", "dispatch", "insurance", "fee"],
    navigationPath: "Billings & Charges > Expense Management",
    description: "Set up monthly recurring charges like dispatch fees or insurance",
    steps: [
      "Go to Billings & Charges > Expense Management",
      "Click 'Recurring Expenses' tab",
      "Click '+ Add Recurring Expense'",
      "Select expense category",
      "Choose driver or apply to all",
      "Set amount and effective dates",
      "Save the recurring expense"
    ],
    relatedTopics: ["create-expense-category"],
    difficulty: "intermediate",
    icon: "Repeat",
    color: "#764ba2"
  },

  // ============================================
  // ACCOUNT MANAGEMENT
  // ============================================
  {
    id: "manage-accounts",
    title: "Manage Account Customers",
    category: "Account Customers",
    subcategory: "Account Management",
    keywords: ["account", "customer", "corporate", "manage", "billing"],
    navigationPath: "Account Customers & Trips > Account Management",
    description: "Create and manage corporate account customers and their billing",
    steps: [
      "Navigate to Account Customers & Trips",
      "Click 'Account Management' card",
      "Click '+ Add Account' to create new",
      "Enter company name and contact details",
      "Set billing preferences",
      "Save the account"
    ],
    relatedTopics: ["account-charges"],
    difficulty: "intermediate",
    icon: "Business",
    color: "#764ba2"
  },

  // ============================================
  // INTEGRATIONS
  // ============================================
  {
    id: "icabbi-integration",
    title: "Connect to iCabbi System",
    category: "Third-Party Integrations",
    subcategory: "iCabbi",
    keywords: ["icabbi", "integration", "connect", "sync", "api", "dispatch"],
    navigationPath: "Third-Party Integrations > iCabbi Integration",
    description: "Set up integration with iCabbi dispatch system for automated data sync",
    steps: [
      "Go to Third-Party Integrations category",
      "Click 'iCabbi Integration' card",
      "Enter your iCabbi API credentials",
      "Test the connection",
      "Configure sync settings",
      "Enable automatic data import"
    ],
    relatedTopics: ["upload-icabbi-shifts"],
    difficulty: "advanced",
    icon: "SyncAlt",
    color: "#F9D13E"
  },

  // ============================================
  // DRIVER PAYMENTS
  // ============================================
  {
    id: "process-driver-payment",
    title: "Process Driver Payments",
    category: "Payments",
    subcategory: "Driver Payments",
    keywords: ["payment", "driver", "settle", "pay", "process"],
    navigationPath: "Payments > Driver Payments",
    description: "Record and track payments made to drivers for their settlements",
    steps: [
      "Navigate to Payments > Driver Payments",
      "Select driver from list",
      "Review outstanding balance",
      "Enter payment amount",
      "Select payment method",
      "Add payment date and notes",
      "Save payment record"
    ],
    relatedTopics: ["driver-reports-overview"],
    difficulty: "beginner",
    icon: "Payment",
    color: "#4facfe"
  }
];

// Keyword aliases for common search terms
export const keywordAliases = {
  "driver earnings": ["driver reports", "driver statement", "driver settlement", "driver financials"],
  "upload data": ["import data", "import file", "data upload", "file upload", "import csv"],
  "add driver": ["create driver", "new driver", "driver setup", "register driver", "onboard driver"],
  "add cab": ["create cab", "new cab", "register vehicle", "add vehicle", "new vehicle"],
  "create expense": ["add expense", "new expense", "expense category", "setup expense"],
  "shift schedule": ["shift roster", "driver schedule", "shift assignment", "assign shift"],
  "icabbi": ["icabi", "icabi", "dispatch system", "dispatch integration"],
  "credit card": ["payment", "card transaction", "chase", "moneris"],
  "trip data": ["trip records", "trip upload", "fare data"],
  "driver pay": ["driver payment", "settle driver", "pay driver", "driver settlement"]
};

// System overview content
export const systemOverview = {
  title: "How Yellow Cab Fleet Management Works",
  sections: [
    {
      title: "Core Entities",
      content: [
        {
          entity: "Drivers",
          description: "Individuals who operate cabs and earn revenue from trips. Each driver has a profile with contact info, status, and financial settings.",
          icon: "Person"
        },
        {
          entity: "Cabs",
          description: "Vehicles in your fleet with registration details, cab numbers, and tracking information. Cabs can be assigned to drivers through shifts.",
          icon: "DirectionsCar"
        },
        {
          entity: "Shifts",
          description: "Time periods when specific drivers operate specific cabs. Shifts track who drove which cab and when, enabling accurate revenue and expense allocation.",
          icon: "AccessTime"
        },
        {
          entity: "Revenue",
          description: "Money earned from various sources: credit card payments, account charges (corporate customers), and lease fees collected from drivers.",
          icon: "AttachMoney"
        },
        {
          entity: "Expenses",
          description: "Costs charged to drivers or fleet operations, including dispatch fees, insurance, mileage-based charges, and airport trip fees.",
          icon: "Receipt"
        }
      ]
    },
    {
      title: "Typical Workflow",
      steps: [
        "Set up your fleet: Add users, create driver profiles, register cabs",
        "Create shift profiles defining Day/Night schedules and settings",
        "Assign drivers to cabs through the shift assignment system",
        "Import trip data from dispatching systems (iCabbi, Taxi Caller, etc.)",
        "Upload payment transactions (credit cards, account charges)",
        "Generate financial statements for drivers showing revenue and expenses",
        "Review and finalize statements to lock in the period",
        "Process payments to drivers based on their net settlement amount"
      ]
    },
    {
      title: "Reports & Analytics",
      content: "Track business performance with detailed driver reports, summary reports across the fleet, and analytics dashboards. Monitor revenue trends, expense breakdowns, and profitability metrics. All reports can be generated for custom date ranges.",
      restricted: false
    },
    {
      title: "Data Integration",
      content: "Connect to third-party systems like iCabbi, Taxi Caller, and payment processors (Chase, Moneris) to automate data flow. Import trip records, driver shifts, and payment transactions automatically instead of manual entry.",
      restricted: false
    }
  ]
};
