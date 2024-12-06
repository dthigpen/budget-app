import { html } from '../html.js';

class Settings extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html` <article>
      <header>
        <h3>Settings</h3>
      </header>
      <div class="settings-container form-container">
        <h4>Data</h4>
        <div class="form-row">
          <button id="delete-all-data-btn" disabled>Delete data</button>
          <p>
            (Not implemented) Removes all data from the browser storage.
            Consider making a backup first.
          </p>
        </div>
        <div class="form-row">
          <label>
            <input name="demo-mode-switch" type="checkbox" role="switch" />
            Demo Mode
          </label>
          <p>
            Use fake prepopulated data. Enabling demo mode will not remove user
            data.
          </p>
        </div>
      </div>
    </article>`;
    const appContext = this.closest('x-app-context');
    const demoModeSwitch = this.querySelector(
      '.settings-container [name="demo-mode-switch"]',
    );
    // update setting when switch toggled
    demoModeSwitch.addEventListener('click', function () {
      const checked = this.checked;
      appContext.demoMode = checked;
    });
    appContext.addEventListener('settingsChange', () => this.update());
    this.update();
  }
  update() {
    const appContext = this.closest('x-app-context');
    const demoModeSwitch = this.querySelector(
      '.settings-container [name="demo-mode-switch"]',
    );
    demoModeSwitch.checked = appContext.demoMode;
  }
}

export const registerSettings = () => {
  customElements.define('x-settings', Settings);
};
