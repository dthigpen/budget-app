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

  const descriptions = [
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
    'JOB XYZ',
    'UBER DRIVER',
  ];
  const accounts = [
    'Chase Credit Card',
    'Chase Debit Card',
    'Wells Fargo Checking',
  ];
  for (let i = 0, yr = startYear, mo = startMonth; i < numMonths; i++) {
    const yearMonth = `${String(yr).padStart(4, '0')}-${String(mo).padStart(2, '0')}`;
    const numTransactions = getRandomInt(3, 25);
    for (let j = 0; j < numTransactions; j++) {
      const dayNum = getRandomInt(1, 29);
      const transaction = {
        date: `${yearMonth}-${String(dayNum).padStart(2, '0')}`,
        description: descriptions[getRandomInt(0, descriptions.length - 1)],
        account: accounts[getRandomInt(0, accounts.length - 1)],
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
        includes: [
          {
            description: 'WAL-MART|COSTCO',
          },
        ],
      },
      {
        name: 'Entertainment',
        includes: [
          {
            description: 'THEATER',
          },
        ],
      },
      {
        name: 'Household',
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
  console.log(generateTransactions());
}
