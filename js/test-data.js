/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTransactions() {
  const numMonths = 14;
  const now = new Date();
  const startYear = now.getFullYear();
  const startMonth = now.getMonth() + 1;
  const transactions = [];
  const incomeDescriptions = [
    'JOB XYZ',
    'UBER DRIVER',
    'CARD REWARDS',
    'INTEREST EARNED',
  ];
  const expenseDescriptions = [
    'WAL-MART #123',
    'WAL-MART #456',
    'AMAZON.COM A7878FS',
    'COSTCO 485',
    'COSTCO 2345',
    'CINEMARK MOVIE THEATER',
    'HOME DEPOT',
    'ENERGY COMPANY',
    'CITY WATER BILL',
    'COMCAST INTERNET',
  ];

  const incomeAccounts = ['Chase Checking', 'Wells Fargo Checking'];
  const expenseAccounts = [
    'Chase Credit Card',
    'Chase Debit Card',
    'Wells Fargo Checking',
  ];
  for (let i = 0, yr = startYear, mo = startMonth; i < numMonths; i++) {
    const yearMonth = `${String(yr).padStart(4, '0')}-${String(mo).padStart(2, '0')}`;
    const numIncome = getRandomInt(1, 3);
    const numExpense = getRandomInt(10, 25);

    // generate income transactions
    for (let j = 0; j < numIncome; j++) {
      const dayNum = getRandomInt(1, 29);
      // generate large amount for first two income description or small for rest
      const amount =
        j <= 1
          ? Number(getRandomInt(300000, 400000) / 100)
          : Number(getRandomInt(5, 5999) / 100);
      const transaction = {
        date: `${yearMonth}-${String(dayNum).padStart(2, '0')}`,
        description: incomeDescriptions[j],
        account: incomeAccounts[getRandomInt(0, incomeAccounts.length - 1)],
        amount: amount,
      };
      transactions.push(transaction);
    }
    for (let j = 0; j < numExpense; j++) {
      const dayNum = getRandomInt(1, 29);
      const transaction = {
        date: `${yearMonth}-${String(dayNum).padStart(2, '0')}`,
        description:
          expenseDescriptions[getRandomInt(0, expenseDescriptions.length - 1)],
        account: expenseAccounts[getRandomInt(0, expenseAccounts.length - 1)],
        amount: Number(getRandomInt(1000, 29599) / 100),
      };
      transactions.push(transaction);
    }
    // decrement yr, mo
    if (mo - 1 <= 0) {
      yr--;
      mo = 12;
    } else {
      mo--;
    }
  }
  return transactions;
}

function generateBudget() {
  return {
    categories: [
      {
        name: 'Electric',
        includes: [
          {
            description: 'ENERGY',
          },
        ],
      },
      {
        name: 'Groceries',
        goal: 1000,
        includes: [
          {
            description: 'WAL-MART|COSTCO',
          },
        ],
      },
      {
        name: 'Entertainment',
        goal: 150,
        includes: [
          {
            description: 'THEATER',
          },
        ],
      },
      {
        name: 'Household',
        goal: 200,
        includes: [
          {
            description: 'HOME DEPOT',
          },
        ],
      },
      {
        name: 'Internet',
        includes: [
          {
            description: 'COMCAST',
          },
        ],
      },
      {
        name: 'Job',
        type: 'income',
        includes: [
          {
            description: 'JOB XYZ',
          },
        ],
      },
      {
        name: 'Supplemental',
        type: 'income',
        includes: [
          {
            description: 'UBER DRIVER',
          },
        ],
      },
    ],
  };
}

function generateSettings() {
  return {};
}
const APP_STATE_STORAGE_KEY = 'budget-app-state';

export function generateTestData() {
  const state = {
    budget: generateBudget(),
    transactions: generateTransactions(),
    settings: generateSettings(),
  };
  localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
}
