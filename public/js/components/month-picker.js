import { html } from '../html.js';

export function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

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

function yearMonthToText(yearMonth) {
  const [yr, mo] = yearMonth.split('-');
  return `${yr} ${monthNames[Number(mo) - 1]}`;
}

class MonthPicker extends HTMLElement {
  applySearchFilter() {
    this.querySelectorAll('button').forEach((btnEl) => {
      const searchString = searchEl.value.trim();
      if (
        searchString === '' ||
        btnEl.textContent.toLowerCase().includes(searchString)
      ) {
        btnEl.classList.remove('-gone');
      } else {
        btnEl.classList.add('-gone');
      }
    });
  }

  connectedCallback() {
    this.innerHTML = html`
      <details class="month-picker">
        <summary>Average</summary>
        <div class="content">
          <!--<input
            class="search gone"
            type="search"
            name="search"
            placeholder="Search"
            aria-label="Search"
          /> -->
          <div class="results">
            <button class="outline">Average</button>
          </div>
        </div>
      </details>
    `;

    const appContext = this.closest('x-app-context');
    const searchEl = this.querySelector('.search');
    const resultsEl = this.querySelector('.results');
    const summaryEl = this.querySelector('summary');

    // this.querySelector('summary').textContent = 'Select a month';

    const summaryTextNode = document.createTextNode(
      yearMonthToText(getCurrentYearMonth()),
    );
    summaryEl.innerHTML = '';
    summaryEl.appendChild(summaryTextNode);
    // On search input, filter results
    // searchEl.addEventListener('keyup', this.applySearchFilter);
    appContext.addEventListener('transactionsChange', () => this.update());
  }
  update() {
    const thisEl = this;
    const appContext = this.closest('x-app-context');
    const resultsEl = this.querySelector('.results');
    const curMonthYear = getCurrentYearMonth();
    // Remove old buttons
    this.querySelectorAll('button').forEach((btnEl) => {
      btnEl.remove();
    });

    function setupBtn(e, text, dataValue, onClick) {
      // unselected state will be only outline
      e.classList.add('outline');
      e.textContent = text;
      if (dataValue) {
        e.setAttribute('data-value', dataValue);
      }
      // create summary text from data value or text
      let summaryText = 'Select a Month';
      if (dataValue && dataValue !== 'average') {
        const [yr, mo] = dataValue.split('-');
        // e.g. 2024 September
        summaryText = `${yr} ${monthNames[Number(mo) - 1]}`;
      } else {
        summaryText = text;
      }
      e.addEventListener('click', () => {
        // update summary text
        thisEl.querySelector('summary').textContent = summaryText;
        // update highlighted button
        [...thisEl.querySelectorAll('button')]
          .filter((b) => b !== e)
          .forEach((b) => b.classList.add('outline'));
        e.classList.remove('outline');
        thisEl.querySelector('details').removeAttribute('open');
        // run onClick
        if (onClick) {
          onClick(e);
        }
      });
      return e;
    }
    const transactions = appContext.transactions ?? [];
    // Setup Average btn
    const avgBtn = document.createElement('button');
    setupBtn(avgBtn, 'Average', null, () => {
      appContext.selectedMonth = null;
    });
    resultsEl.appendChild(avgBtn);

    const curMonthBtn = document.createElement('button');
    setupBtn(curMonthBtn, 'Current Month', curMonthYear, () => {
      appContext.selectedMonth = curMonthYear;
    });
    resultsEl.appendChild(curMonthBtn);

    // Setup month buttons
    const yearMonths = [...new Set(transactions.map((t) => t.date.slice(0, 7)))]
      .sort()
      .reverse();
    for (const yearMonth of yearMonths) {
      if (yearMonth === curMonthYear) {
        continue;
      }
      const btn = document.createElement('button');
      setupBtn(btn, yearMonthToText(yearMonth), yearMonth, () => {
        appContext.selectedMonth = yearMonth;
      });
      resultsEl.appendChild(btn);
    }
    // this.applySearchFilter();
  }
}

export const registerMonthPicker = () => {
  customElements.define('x-month-picker', MonthPicker);
};
