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

function getRandomItem(arr) {
  return arr[getRandomInt(0, arr.length - 1)];
}
function generateTransactions() {
  const numMonths = 14;
  const now = new Date();
  const startYear = now.getFullYear();
  const startMonth = now.getMonth() + 1;
  const transactions = [];
  const bigIncomeDescriptions = ['JOB XYZ', 'UBER DRIVER'];
  const smallIncomeDescriptions = ['CARD REWARDS', 'INTEREST EARNED', 'PAYPAL'];
  const expenseDescriptions = [
    'WAL-MART #123',
    'WAL-MART #456',
    'AMAZON.COM A7878FS',
    'AMAZON MRKT 12345',
    'COSTCO 485',
    'COSTCO 2345',
    'CINEMARK MOVIE THEATER',
    'HOME DEPOT',
    'DOMINOS PIZZA',
    'SUSHI PLACE',
    'BIKE SHOP',
  ];

  const incomeAccounts = ['Chase Checking', 'Wells Fargo Checking'];
  const expenseAccounts = [
    'Chase Credit Card',
    'Chase Debit Card',
    'Wells Fargo Checking',
  ];

  const monthlyRecurring = [
    {
      description: getRandomItem(bigIncomeDescriptions),
      amount: getRandomInt(2000_00, 3000_00) / 100,
      account: getRandomItem(incomeAccounts),
    },
    {
      description: getRandomItem(bigIncomeDescriptions),
      amount: getRandomInt(2000_00, 3000_00) / 100,
      account: getRandomItem(incomeAccounts),
    },
    {
      description: 'VISTA APARTMENTS',
      amount: getRandomInt(1500_00, 1700_00) / 100,
      account: getRandomItem(expenseAccounts),
    },
    {
      description: 'GROCERY-MART',
      amount: getRandomInt(90_00, 200_00) / 100,
      account: getRandomItem(expenseAccounts),
    },
    {
      description: 'GROCERY-MART',
      amount: getRandomInt(90_00, 200_00) / 100,
      account: getRandomItem(expenseAccounts),
    },
    {
      description: 'ENERGY COMPANY',
      amount: getRandomInt(50_00, 95_00) / 100,
      account: getRandomItem(expenseAccounts),
    },
    {
      description: 'CITY WATER BILL',
      amount: getRandomInt(45_00, 50_00) / 100,
      account: getRandomItem(expenseAccounts),
    },

    {
      description: 'COMCAST INTERNET',
      amount: getRandomInt(75_00, 79_00) / 100,
      account: getRandomItem(expenseAccounts),
    },
  ];
  // generate numMonths worth of transactions starting at the current month
  for (let i = 0, yr = startYear, mo = startMonth; i < numMonths; i++) {
    const yearMonth = `${String(yr).padStart(4, '0')}-${String(mo).padStart(2, '0')}`;

    const numBigIncome = 2;
    const numSmallIncome = getRandomInt(1, 3);

    const numExpense = getRandomInt(5, 10);
    for (const transactionTemplete of monthlyRecurring) {
      const dayNum = getRandomInt(1, 29);

      const transaction = {
        ...transactionTemplete,
        date: `${yearMonth}-${String(dayNum).padStart(2, '0')}`,
      };
      transactions.push(transaction);
    }

    // generate income transactions
    for (let j = 0; j < numSmallIncome; j++) {
      const dayNum = getRandomInt(1, 29);
      // generate large amount for first two income description or small for rest
      const amount = Number(getRandomInt(5, 50_00) / 100);
      const transaction = {
        date: `${yearMonth}-${String(dayNum).padStart(2, '0')}`,
        description: getRandomItem(smallIncomeDescriptions),
        account: getRandomItem(incomeAccounts),
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
        amount: Number(getRandomInt(10_00, 295_00) / 100),
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
