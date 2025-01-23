import { html } from '../html.js';

class Nav extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html`
      <nav>
        <ul>
        	<li><a class="plain" href="#"><strong>Budget App</strong></a></li>
        </ul>
        <ul>
          <label>
            <input name="demo-mode-switch" type="checkbox" role="switch" />
            Demo Mode
          </label>
        </ul>
        <ul>
          <li><a href="#/settings">Settings</a></li>
        </ul>
      </nav>
    `;
    const appContext = this.closest('x-app-context');
    const demoModeSwitch = this.querySelector('nav [name="demo-mode-switch"]');
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
    const demoModeSwitch = this.querySelector('nav [name="demo-mode-switch"]');
    demoModeSwitch.checked = appContext.demoMode;
    // Hide switch if demo mode not enabled
    if (appContext.demoMode) {
      demoModeSwitch.parentNode.classList.remove('-gone');
    } else {
      demoModeSwitch.parentNode.classList.add('-gone');
    }
  }
}

export const registerNav = () => {
  customElements.define('x-nav', Nav);
};
