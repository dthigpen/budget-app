export function BudgetEditor(parentEl) {
  const appContext = parentEl.closest('x-app-context');
  const textArea = parentEl.querySelector('textarea');
  const saveButton = parentEl.querySelector('button.save');
  const resetDefaultButton = parentEl.querySelector('button.reset-default');
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
    console.log({ budget, defaultBudget });
    textArea.value = JSON.stringify(budget, null, 2);
  }
  updateTextArea();
  function isValidBudget(budgetStr) {
    try {
      const budgetObj = JSON.parse(budgetStr);
      // TODO check schema
      return true;
    } catch (e) {
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
