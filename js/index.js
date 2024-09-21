import { registerAppContext } from './components/app-context.js';
import { generateReports } from './budget-reporter.js';
import { generateTestData } from './test-data.js';

// Generate test data and save to local storage
generateTestData();

// Mount functions

function MonthSelectorBar(monthContainerEl) {
  const appContext = monthContainerEl.closest('x-app-context');
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  function updateMonthButtons() {
    let selected = null;
    // Remove old buttons
    monthContainerEl.querySelectorAll('button').forEach((btnEl) => {
      if (!btnEl.classList.contains('outline')) {
        selected = btnEl.getAttribute('data-value');
        console.log({ selected });
      }
      btnEl.remove();
    });
    if (!appContext.reports) {
      return;
    }

    function setupBtn(e, onClick) {
      e.addEventListener('click', () => {
        [...monthContainerEl.querySelectorAll('button')]
          .filter((b) => b !== e)
          .forEach((b) => b.classList.add('outline'));
        e.classList.remove('outline');
        if (onClick) {
          onClick(e);
        }
      });
    }
    // Setup Average btn
    const avgBtn = document.createElement('button');
    setupBtn(avgBtn, () => {
      appContext.selectedMonth = null;
    });
    avgBtn.textContent = 'Average';
    if (selected) {
      avgBtn.classList.add('outline');
    }
    monthContainerEl.appendChild(avgBtn);
    // Setup month buttons
    const sortedReports = Object.values(appContext.reports).sort((a, b) => {
      if (a.month < b.month) {
        return 1;
      }
      if (a.month > b.month) {
        return -1;
      }
      return 0;
    });
    for (const report of sortedReports) {
      const btn = document.createElement('button');
      const [yr, mo] = report.month.split('-');
      btn.textContent = `${yr} ${monthNames[mo - 1]}`;
      btn.setAttribute('data-value', report.month);
      if (selected !== report.month) {
        btn.classList.add('outline');
      }
      setupBtn(btn, () => {
        appContext.selectedMonth = report.month;
      });
      monthContainerEl.appendChild(btn);
    }
  }
  appContext.addEventListener('reportsChange', updateMonthButtons);
}
function TransactionsTable(tableEl) {
  const appContext = tableEl.closest('x-app-context');

  function updateTable() {
    console.log('Updating table');
    tableEl
      .querySelector('tbody')
      .querySelectorAll('tr')
      .forEach((rowEl) => {
        // if(!rowEl.classList.contains('header-row')) {
        rowEl.parentNode.removeChild(rowEl);
        // }
      });
    for (const transaction of appContext.transactions) {
      const row = tableEl.querySelector('tbody').insertRow();
      const data = [
        transaction.date,
        transaction.description,
        transaction.amount,
        transaction.account,
        'Uncategorized',
        'Entered',
      ];
      data.forEach((d) =>
        row.insertCell().appendChild(document.createTextNode(d)),
      );
    }
  }
  appContext.addEventListener('transactionsChange', () => updateTable());
}

function TransactionsUpload(el) {
  el.addEventListener('click', () => {
    document.getElementById('file-upload-input').click();
    // TODO put this on liustener that has json of file
    el.closest('x-app-context').transactions = [
      { description: 'foo', amount: 123.45 },
    ];
  });
}

function MonthPanel(el, options = {}) {
  const defaultOptions = {
    avg: true,
  };

  options = { ...defaultOptions, ...options };
  const appContext = el.closest('x-app-context');

  function updateMonth() {
    const selectedMonth = appContext.selectedMonth;
    const reports = appContext.reports ?? {};
    const budget = appContext.budget;
    const transactions =
      appContext.transactions?.sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      ) ?? [];

    console.log({ budget: budget, transactions });
    // TODO handle when no budget
    if (!budget || (budget?.categories ?? []).length === 0) {
      console.log('Unable to update panel, no budget data.');
      return;
    }
    // TODO handle No transactions

    // const dataRange = el.getAttribute("data-range");
    let startYearMonth = null;
    let endYearMonth = null;
    if (selectedMonth === null || selectedMonth === undefined) {
      // default to avg of all data
      const dates = transactions.map((t) => t.date);
      startYearMonth = dates.at(0).slice(0, 7);
      endYearMonth = dates.at(-1).slice(0, 7);
    } else {
      startYearMonth = selectedMonth;
      endYearMonth = selectedMonth;
    }

    let report = null;
    if (startYearMonth === endYearMonth) {
      report = reports[startYearMonth];
    } else {
      console.log({ startYearMonth, endYearMonth });
      const splitStartYearMonth = startYearMonth.split('-');
      const startDate = new Date(
        Number(splitStartYearMonth[0]),
        Number(splitStartYearMonth[1]) - 1,
        1,
      );
      // use zero for day to get last day of prev month
      const splitEndYearMonth = endYearMonth.split('-');
      const endDate = new Date(
        Number(splitEndYearMonth[0]),
        Number(splitEndYearMonth[1]),
        0,
      );
      console.log({ startDate, endDate });
      const reportsInRange = Object.values(reports).filter(
        (r) => r.month >= startYearMonth && r.month <= endYearMonth,
      );
      report = {
        month: 'average',
        summary: reportsInRange.map((r) => r.summary)[0],
        /*
          .reduce((acc, cur) => {
          	console.log({acc, cur})
            if (acc === null) {
              acc = JSON.parse(JSON.stringify(cur));
              return acc;
            }
            // Merge each summary type
            ["expense", "income", "uncategorized"].forEach((type) => {
							
            	if(type in cur && !(type in acc)) {
             		acc[type] = JSON.parse(JSON.stringify(cur[type]))
             	} else {
	              for (const [category, amount] of Object.entries(
	                cur?.[type]?.categories ?? {},
	              )) {
	              	
	                if (category in acc[type].categories) {
	                  acc[type].categories[category] += amount;
	                } else {
	                  acc[type].categories[category] = amount;
	                }
	              }
             	}
              return acc;
            });
          }, null),
          */
        // TODO sort transactions
        transactions: reportsInRange.map((r) => r.transactions)[0],
        /*
        .reduce(
        	(acc, cur) => {
        		if (acc === null) {
        			acc = JSON.parse(JSON.stringify(cur));
              return acc;
        		}
        		for (const [type, transactionsOfType] of Object.entries(cur)) {
        			if (!(type in acc)){
        				acc[type] = []
        			}
        			acc[type].push(...transactionsOfType)
        		}
        		return acc
        	}, null
        ),
        */
      };
    }
    console.log(report);
    const panelTransactions = Object.values(report.transactions).flat();
    // // Calculate values for overall total section
    // const total = panelTransactions
    //   .map((t) => t.amount)
    //   .reduce((acc, cur) => acc + cur, 0);
    const incomeTotal = report.summary?.income?.total ?? 0.0;
    const expensesTotal = report.summary?.expense?.total ?? 0.0;
    const savingsTotal = incomeTotal - expensesTotal;
    const savingsPercent =
      incomeTotal > 0 ? Math.round((savingsTotal / incomeTotal) * 100) : 0;
    const totalsEl = el.querySelector('.overall-section-totals');
    function formatMoney(num) {
      return '$' + num.toFixed(2);
    }
    totalsEl.querySelector('[data-field="income"]').textContent =
      formatMoney(incomeTotal);
    totalsEl.querySelector('[data-field="expenses"]').textContent =
      formatMoney(expensesTotal);
    totalsEl.querySelector('[data-field="savings"]').textContent =
      `(${savingsPercent}%) ` + formatMoney(savingsTotal);
  }
  // appContext.addEventListener('transactionsChange', updateMonth);
  appContext.addEventListener('selectedMonthChange', updateMonth);
}

const app = () => {
  console.log('Loading app');
  registerAppContext();

  TransactionsUpload(document.getElementById('file-upload-btn'));
  TransactionsTable(document.getElementById('transactions-table'));
  MonthPanel(document.querySelector('.overall-section'));
  MonthSelectorBar(document.querySelector('.month-bar'));
};

document.addEventListener('DOMContentLoaded', app);
