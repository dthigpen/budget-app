import { registerAppContext } from './components/app-context.js'

// Mount function
function TransactionsUpload(el) {
	el.addEventListener('click', () => {
		document.getElementById('file-upload-input').click()
		// TODO put this on liustener that has json of file
		el.closest('x-app-context').transactions = [{'description': 'foo', 'amount': 123.45}]
	})
}
const app = () => {
	console.log('Loading app')
	registerAppContext();

	TransactionsUpload(document.getElementById('file-upload-btn'))
}

document.addEventListener('DOMContentLoaded', app)

