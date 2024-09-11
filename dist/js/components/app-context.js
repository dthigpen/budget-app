
class AppContext extends HTMLElement {
	#transactions = [];

	get transactions() { return this.transactions }
	set transactions(value) {
		console.log(`New transactions: ${JSON.stringify(value)}`);
		this.#transactions = value;
		this.dispatchEvent(new CustomEvent('transactionsChange'));
	}

	constructor() {
		super();
		this.style.display = 'contents';
  }

  
}
export const registerAppContext = 
	() => customElements.define('x-app-context', AppContext);

