import { html } from '../html.js';

class BudgetEditor extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html` <article class="budget-editor-container">
      <header>
        <h3>Budget JSON Editor</h3>
      </header>
      <!-- <div class="budget-editor-container"> -->
      <textarea
        name="budget-editor-text-area"
        aria-label="Budget JSON Editor"
        rows="10"
      ></textarea>
      <!-- </div> -->
      <footer>
        <button class="reset-default">Load Default</button>
        <button class="save">Save</button>
      </footer>
    </article>`;
    const appContext = this.closest('x-app-context');
    const textArea = this.querySelector('textarea');
    const saveButton = this.querySelector('button.save');
    const resetDefaultButton = this.querySelector('button.reset-default');
    const defaultBudget = {
      categories: [
        {
          name: 'Electric',
          includes: [
            {
              description: 'ENERGY',
            },
          ],
        },
      ],
    };
    textArea.placeholder =
      'Something like...\n' + JSON.stringify(defaultBudget, null, 2);
    function updateTextArea() {
      // TODO convey that the default budget is unsaved and Save needs to be pressed
      const budget = appContext.budget ?? defaultBudget;
      textArea.value = JSON.stringify(budget, null, 2);
    }
    updateTextArea();
    function isValidBudget(budgetStr) {
      try {
        JSON.parse(budgetStr);
        // TODO check schema
        return true;
      } catch {
        return false;
      }
    }
    textArea.addEventListener('change', () => {
      const isValid = isValidBudget(textArea.value);
      console.log(`Is valid: ${isValid}`);
      textArea.setAttribute('aria-invalid', isValid ? 'false' : 'true');
    });
    saveButton.addEventListener('click', () => {
      const isValid = isValidBudget(textArea.value);
      if (isValid) {
        // saveButton.removeAttribute('disabled')
        appContext.budget = JSON.parse(textArea.value);
        console.log({ newBudget: appContext.budget });
      } else {
        // saveButton.setAttribute('disabled', true)
        textArea.focus();
      }
      // TODO show indication of save success/failure
    });
    resetDefaultButton.addEventListener('click', () => {
      textArea.value = JSON.stringify(defaultBudget, null, 2);
    });

    appContext.addEventListener('budgetChange', () => {
      updateTextArea();
    });
  }
  update() {}
}

export const registerBudgetEditor = () => {
  customElements.define('x-budget-editor', BudgetEditor);
};
