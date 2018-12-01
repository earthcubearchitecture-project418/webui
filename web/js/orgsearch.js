import {
	html,
	render
} from './lit-html.js';



const activesearch = () => {
	console.log("There is an active search underway..  waiting for response")

	return html `
	<div class="loader">Loading...</div>
		`;
}


// lit-html constant
const searchTemplate = (barval) => {
	console.log("-----------------------------------------------")
	console.log(barval)
	var count = Object.keys(barval.Results.Bindings).length;
	const itemTemplates = [];
	var i;
	for (i = 0; i < count; i++) {
		itemTemplates.push(html `<li>${barval.Results.Bindings[i].name.Value}</li>`);
	}

	return html `
	  <ul>
		    ${itemTemplates}
	  </ul>
		`;
};

// lit-html constant
const bleveTemplate = (barval) => {
	console.log("-----------------------------------------------")
	console.log(barval)
	var count = Object.keys(barval).length;
	const itemTemplates = [];
	var i;
	for (i = 0; i < count; i++) {
		itemTemplates.push(html `<li>${barval[i].index} ( ${barval[i].highscore} )</li>`);
	}

	return html `
	  <ul>
		    ${itemTemplates}
	  </ul>
		`;
};


// popstate for history button
window.onpopstate = event => {
	console.log("opnpopstate seen")
	console.log(event.state)
	 //window.location.reload()
}

// core init code
let params = (new URL(location)).searchParams;
let q = params.get('q');
let n = params.get('n');
let s = params.get('s');
let i = params.get('i');

// trap n = null to prime the number return do
if (n == null) {
	n = 20
}

// trap s = nul and prime to 0
if (s == null) {
	s = 0
}

// Set the values of the query boxes based on URL parameters
let qdo = document.querySelector('#q');
let ndo = document.querySelector('#nn');
let sdo = document.querySelector('#s');
let ido = document.querySelector('#i');
qdo.value = q;
ndo.value = n;
sdo.value = s;
ido.value = i;

// if q is not null..   fire off a search, 
if (q != null) {
	searchActions();
}

// event listeners
document.querySelector('#q').addEventListener('keyup', function (e) {
	if (e.keyCode === 13) {
		searchActions();
	}
});

document.querySelector('#update').addEventListener('click', searchActions);
// document.querySelector('#providers').addEventListener('click', providerList);

// --------  funcs and constants below here   ---------------------
function searchActions() {
	// let params = (new URL(location)).searchParams;
	let q = document.querySelector('#q').value
	let s = document.querySelector('#s').value
	let n = document.querySelector('#nn').value


	var ddbox = document.getElementById("dd").checked;
	console.log(ddbox)
	// let s = params.get('s');
	// let i = params.get('i');

	updateURL();

	// Different search options
	simpleSearch(q, n, s, i, ddbox); 

	// updateNav();   // write to content div 1
}



function simpleSearch(q, n, s, i, ddbox) {
	const el = document.querySelector('#container2');
	render(activesearch(), el)

	fetch(`http://geodex.org/api/v1/textindex/searchset?q=${q}&n=15&s=0`)
		.then(function (response) {
			return response.json();
		})
		.then(function (myJson) {
			console.log(myJson);
			const el = document.querySelector('#container2');
			render(bleveTemplate(myJson), el);
		});
}



function graphSearch(q, n, s, i, ddbox) {
	const el = document.querySelector('#container2');
	render(activesearch(), el)

	fetch(`http://localhost:6789/api/dev/graph/orgsearch?r=${q}`)
		.then(function (response) {
			return response.json();
		})
		.then(function (myJson) {
			console.log(myJson);
			const el = document.querySelector('#container2');
			render(searchTemplate(myJson), el);
		});
}

function updateURL() {
	let qdo = document.querySelector('#q');
	let ndo = document.querySelector('#nn');
	let sdo = document.querySelector('#s');
	let ido = document.querySelector('#i');

	let params = new URLSearchParams(location.search.slice(1));
	params.set('q', qdo.value);
	params.set('n', ndo.value);
	params.set('s', sdo.value);
	params.set('i', ido.value);

	//window.history.replaceState({}, '', location.pathname + '?' + params);
	const state = {
		geodexsearch: q
	}
	window.history.pushState({}, '', location.pathname + '?' + params);
}

