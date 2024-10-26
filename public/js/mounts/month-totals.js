import {
  calculateCategoryAmounts,
  categorizeTransactions,
} from '../budget-reporter.js';
import { CategoryType } from '../types.js';
import { groupBy } from '../util.js';
import { html } from '../html.js';

export function MonthTotalsPanel(totalsListEl) {
  const appContext = totalsListEl.closest('x-app-context');
  function updateTotals() {
    if ((appContext.budget?.categories ?? []).length === 0) {
      // TODO display message when no categories
      return;
    }
    const categorizedTransactions = categorizeTransactions(
      appContext.budget?.categories ?? [],
      appContext.periodTransactions,
    );
    const categoryAmounts = calculateCategoryAmounts(categorizedTransactions);
    const categoryTypeTotals = Object.entries(categoryAmounts)
      .map(([categoryName, categoryAmount]) => {
        let categoryType = null;
        if (categoryName === 'uncategorized') {
          categoryType = 'uncategorized';
        } else {
          const budgetCategories = appContext.budget?.categories ?? [];
          const category = budgetCategories.find(
            (c) => c.name === categoryName,
          );
          if (!category) {
            console.warn(`Unrecognized transaction category: ${categoryName}`);
          } else {
            categoryType = category.type ?? CategoryType.EXPENSE;
          }
        }
        return [categoryType, categoryAmount];
      })
      .filter((e) => e[0] !== null) // filter out unknown categories
      .reduce((acc, cur) => {
        const [categoryType, categoryAmount] = cur;
        if (!(categoryType in acc)) {
          acc[categoryType] = 0.0;
        }
        acc[categoryType] += categoryAmount;
        return acc;
      }, {});
    const numMonths = Object.values(
      groupBy(categorizedTransactions, (t) => t.date.slice(0, 7)),
    ).length;
    // change amounts from totals to monthly avg
    Object.keys(categoryTypeTotals).forEach((c) => {
      categoryTypeTotals[c] = categoryTypeTotals[c] / numMonths;
    });
    const currencySymbol = appContext.settings.currencySymbol;
    const uncategorizedTotal = categoryTypeTotals.uncategorized ?? 0.0;
    const incomeTotal = categoryTypeTotals.income ?? 0.0;
    const expenseTotal = categoryTypeTotals.expense ?? 0.0;
    const savingsTotal = incomeTotal - expenseTotal;
    const savingsPercent =
      incomeTotal > 0 ? Math.round((savingsTotal / incomeTotal) * 100) : 0;
    function formatMoney(num) {
      const sign = num < 0 ? '-' : '';
      return sign + currencySymbol + Math.abs(num).toFixed(2);
    }

    totalsListEl.innerHTML = html`
      <div>
        <div>Income</div>
        <div>${formatMoney(incomeTotal)}</div>
      </div>
      <div>
        <div>Expenses</div>
        <div>${formatMoney(expenseTotal)}</div>
      </div>
      <div>
        <div>Savings</div>
        <div>(${savingsPercent}%) ${formatMoney(savingsTotal)}</div>
      </div>
      <div>
        <div>Uncategorized</div>
        <div>${formatMoney(incomeTotal)}</div>
      </div>
    `;
  }
  appContext.addEventListener('transactionsChange', updateTotals);
  appContext.addEventListener('budgetChange', updateTotals);
  appContext.addEventListener('selectedMonthChange', updateTotals);
}