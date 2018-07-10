import {
	html,
	render
} from './lit-html.js';


// lit-html constant
const greeting = (prefix, name) => {
	return html `
	    <h1>Well, hello there ${prefix} ${name}</h1>
		  `;
};

// lit-html constant
const greeting2 = (barval) => {
	console.log(barval)
	const itemTemplates = [];
	var i;
	for (i = 0; i < barval; i++) {
		itemTemplates.push(html `<li>${i}</li>`);
	}

	return html `
	  <ul>
		    ${itemTemplates}
	  </ul>
		`;
};

// lit-html constant
const providerTemplate = (barval) => {
	console.log("-----------------------------------------------")
	console.log(barval)
	var count = Object.keys(barval).length;
	const itemTemplates = [];
	var i;
	for (i = 0; i < count; i++) {
		itemTemplates.push(html `<div style="margin-top:30px"> 
		<img style="height:50px" src="${barval[i].logo}"><br>  ${barval[i].description}   (${barval[i].name} )  </div>`);
	}

	return html `
	  <div style="margin-top:30px">
		    ${itemTemplates}
      </div>
		`;
};

// lit-html constant
const searchTemplate = (barval) => {
	console.log("-----------------------------------------------")
	console.log(barval)
	var count = Object.keys(barval).length;
	const itemTemplates = [];
	var i;
	for (i = 0; i < count; i++) {
		itemTemplates.push(html `<li>${barval[i].position} - 
		<a target="_blank" href="${barval[i].URL}">${barval[i].URL}</a> 
		(${barval[i].score})  </li>`);
	}

	return html `
	  <ul>
		    ${itemTemplates}
	  </ul>
		`;
};


// lit-html constant
const threadTemplate = (barval) => {
	console.log("threadtemplate-----------------------------------------------")
	// console.log(barval)
	var count = Object.keys(barval).length;
	const itemTemplates = [];


	var i;
	for (i = 0; i < count; i++) {
		const detailsTemplate = []
		let orset = barval[i].or
		let orlen = orset.length

		var j;
		for (j = 0; j < orlen; j++) {
			// console.log("checkpoint3");
			detailsTemplate.push(html `<div>${orset[j].URL}</div`)
		}
		itemTemplates.push(html `<div>${barval[i].index} -  ${barval[i].highscore} <br> ${detailsTemplate} </div>`);
	}

	return html `
	  <div>
		    ${itemTemplates}
      </div>
		`;
};


const navui = (total_hits) => {

	let params = (new URL(location)).searchParams;
	let q = params.get('q');
	let n = params.get('n');
	let s = params.get('s');
	let i = params.get('i');

	if (s == "") {
		s = 0
	}

	function UpdateQueryString(key, value, url) {
		if (!url) url = window.location.href;
		var re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi"),
			hash;

		if (re.test(url)) {
			if (typeof value !== 'undefined' && value !== null)
				return url.replace(re, '$1' + key + "=" + value + '$2$3');
			else {
				hash = url.split('#');
				url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
				if (typeof hash[1] !== 'undefined' && hash[1] !== null)
					url += '#' + hash[1];
				return url;
			}
		} else {
			if (typeof value !== 'undefined' && value !== null) {
				var separator = url.indexOf('?') !== -1 ? '&' : '?';
				hash = url.split('#');
				url = hash[0] + separator + key + '=' + value;
				if (typeof hash[1] !== 'undefined' && hash[1] !== null)
					url += '#' + hash[1];
				return url;
			} else
				return url;
		}
	}


	var range = parseInt(s) + parseInt(n)
	var baserange = parseInt(s) - parseInt(n)
	if (baserange < 0) {
		baserange = 0
	}

	var restarturl = UpdateQueryString("s", 0, null)
	var lefturl = UpdateQueryString("s", baserange, null)
	var righturl = UpdateQueryString("s", range + 1, null)

	return html `
	  <div style="text-align: center;">
	  <a style="margin-right:5px" href="${restarturl}"> << </a> <a href="${lefturl}"> < </a>${s} to ${range} <a href="${righturl}"> ></a> of ${total_hits}
      </div>
		`;
}


// lit-html constant
const nusearch = (barval, q) => {
	console.log("nusearchtemplate-----------------------------------------------")
	var count = Object.keys(barval.search_result.hits).length;
	const itemTemplates = [];


	function nametest(t) {
		if (t == "undefined") {
			return 'Un-named facility data set';
		}
		return t;
	}

	function desctest(t) {
		if (t == "undefined") {
			return 'No description for this data set is provided by the facility';
		}
		return t;
	}


	function hasPartAdditionalType(t, i) {
		if (t == "undefined") {
			return '';
		}

		const haspartTemplates = [];
		var detailsdom = ""

		var elements = barval.search_result.hits[i].fields["hasPart.identifier.url"]
		elements.forEach(function (element) {
			haspartTemplates.push(html `<span style="margin:5px"><a target="_blank" href="${element}">${element} <a/></span>`)
		});

		detailsdom = (html `<details><summary>Related parts</summary>${haspartTemplates}</details><br>`)
		return detailsdom;
	}


	// // .search_result.hits[2].fields["variableMeasured.name"]
	// // hasVarMeasuredName()
	function hasVarMeasuredName(t, i) {
		if (t == "undefined") {
			return '';
		}

		const haspartTemplates = [];
		var detailsdom = ""

		var elements = barval.search_result.hits[i].fields["variableMeasured.name"]
		// var elurl = barval.search_result.hits[i].fields["variableMeasured.url"]
		elements.forEach(function (element) {
			haspartTemplates.push(html `<span style="margin:5px">${element} </span>`)
		});

		detailsdom = (html `<details><summary>Variables measured</summary>${haspartTemplates}</details><br>`)
		return detailsdom;
	}

	function UpdateQueryString(key, value, url) {
		if (!url) url = window.location.href;
		var re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi"),
			hash;

		if (re.test(url)) {
			if (typeof value !== 'undefined' && value !== null)
				return url.replace(re, '$1' + key + "=" + value + '$2$3');
			else {
				hash = url.split('#');
				url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
				if (typeof hash[1] !== 'undefined' && hash[1] !== null)
					url += '#' + hash[1];
				return url;
			}
		} else {
			if (typeof value !== 'undefined' && value !== null) {
				var separator = url.indexOf('?') !== -1 ? '&' : '?';
				hash = url.split('#');
				url = hash[0] + separator + key + '=' + value;
				if (typeof hash[1] !== 'undefined' && hash[1] !== null)
					url += '#' + hash[1];
				return url;
			} else
				return url;
		}
	}

	// obviously pointless function..   do this test and a template push below....
	function curltest(t) {
		if (t == "undefined") {
			dataDownloadTemplates = (html `<span> </span>`)
			return dataDownloadTemplates
		} else {
			if (t.indexOf(",") >= 0) { // test if it's an array
				console.log("We are looking at an array");
				var dls = t.split(",")
				var len = t.split(",").length

				const itemTemplates = [];
				var i;
				for (i = 0; i < len; i++) {
					if (dls[i].includes("datapackage.json")) {
						console.log("This is a frictionless data package") //  this is a HACK..   to be replaced with a real solution later
						itemTemplates.push(html `<a target="_blank" href="${dls[i]}"><img style="margin-left:40px;height:20px" src="./images/fdp.png"></a>`);
					} else {
						itemTemplates.push(html `<a target="_blank" href="${dls[i]}"><img style="margin-left:40px;height:20px" src="./images/download.svg"></a>`);
					}
				}

				dataDownloadTemplates = (html `${itemTemplates}`)
				return dataDownloadTemplates

				console.log("Length of " + len)
				console.log("Items: " + itemTemplates)

			} else {
				// console.log("This is not an array...");
				dataDownloadTemplates = (html `<a target="_blank" href="${t}"><img style="margin-left:40px;height:20px" src="./images/download.svg"></a>`)
				return dataDownloadTemplates
			}
		}
	}

	// this should include the curltest function and replace it
	// function downloadparse(t) {
	// 	var dataDownloadTemplates = ""
	// 	if (t == "undefined") {
	// 		dataDownloadTemplates = (html `<a target="_blank" href="${curl}"><img style="margin-left:40px;height:20px" src="./images/download.svg"></a>`)
	// 		return dataDownloadTemplates
	// 	} else {
	// 		dataDownloadTemplates = (html `<span> </span>`)
	// 		return dataDownloadTemplates
	// 	}
	// }

	var i;
	for (i = 0; i < count; i++) {
		var desc = `${barval.search_result.hits[i].fields.description}`;
		var shortdesc = desc.slice(0, 500);
		shortdesc = desctest(shortdesc)

		var name = `${barval.search_result.hits[i].fields.name}`;
		name = nametest(name)

		// need to check for distribution..  then contentUrl
		// .search_result.hits["0"].fields["distribution.contentUrl"]
		// var curl = null
		// if (barval.search_result.hits[i].fields["distribution.contentUrl"] != null) {
		// 	var curl = `${barval.search_result.hits[i].fields["distribution.contentUrl"]}`; //
		// 	curl = curltest(curl)
		// }

		// // Set up the datadownload template
		// var dataDownloadTemplates = ""
		// if (curl != null) {
		// 	dataDownloadTemplates = (html `<a target="_blank" href="${curl}"><img style="margin-left:40px;height:20px" src="./images/download.svg"></a>`)
		// } else {
		// 	dataDownloadTemplates = (html `<span> </span>`)
		// }

		var dataDownloadTemplates = ""
		if (barval.search_result.hits[i].fields["distribution.contentUrl"] != null) {
			var curl = `${barval.search_result.hits[i].fields["distribution.contentUrl"]}`; //
			dataDownloadTemplates = curltest(curl)
		}


		// Set up the filter on source section
		var filterTemplates = ""
		var newq = `${q}  p418source:${barval.search_result.hits[i].fields.p418source}`
		var urlrewrite = UpdateQueryString("q", newq, null)
		filterTemplates = (html `<a href="${urlrewrite}">
		<img style="margin-left:20px;height:20px" src="./images/filter.svg"></a>`)


		// Look for addition types

		var hpat = hasPartAdditionalType(`${barval.search_result.hits[i].fields["hasPart.@type"]}`, i)
		var vm = hasVarMeasuredName(`${barval.search_result.hits[i].fields["variableMeasured.@type"]}`, i)


		// Main Item template
		itemTemplates.push(html `<div style="margin-top:15px">
		<a target="_blank" href="${barval.search_result.hits[i].fields.p418url}">${name}</a>
		  <br/>
			<img style="height:20px" src="${barval.search_result.hits[i].fields.p418logo}">
			
			
			${filterTemplates}
		 
			${dataDownloadTemplates}

			
			<br/>
	     <span> ${shortdesc}... </span>
		 <br/>
		 ${hpat} 
		 ${vm}
	
		<span style="font-size: smaller;" >(${barval.search_result.hits[i].score}) <span> </div>`);


	}

	return html `
	  <div>
		   ${itemTemplates}
      </div>
		`;
};

const query1 = (q, n, s) => {

	return `
	{
		"search_request": {
		  "query": {
			"query": "${q}"
		  },
		  "size": ${n},
		  "from": ${s},
		  "fields": [
			"*"
		  ],
		  "sort": [
			"-_score"
		  ],
		  "highlight": {
			"style": "html",
			"fields": [
			  "name",
			  "description"
			]
		  }
		}
	  }
	  `

}


// popstate for history button
window.onpopstate = event => {
	console.log("opnpopstate seen")
	console.log(event.state)
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
document.querySelector('#providers').addEventListener('click', providerList);

// --------  funcs and constants below here   ---------------------
function searchActions() {
	// let params = (new URL(location)).searchParams;
	let q = document.querySelector('#q').value
	let s = document.querySelector('#s').value
	let n = document.querySelector('#nn').value
	// let s = params.get('s');
	// let i = params.get('i');

	updateURL();

	// Different search options
	blastsearchsimple(q, n, s);
	// threadSearch(q, n, s, i); 
	// simpleSearch();

	// updateNav();   // write to content div 1
}

function blastsearchsimple(q, n, s) {
	// var formData = new FormData();
	var data = query1(q, n, s);
	console.log(data)

	//fetch(`http://localhost:6789/api/v1/textindex/getnusearch?q=${data}`)
	fetch(`http://192.168.2.50:6789/api/v1/textindex/getnusearch?q=${data}`)
		.then(function (response) {
			return response.json();
		})
		.then(function (myJson) {
			console.log(myJson);
			const el = document.querySelector('#container2');
			const navel = document.querySelector('#container1');
			render(nusearch(myJson, q), el);
			render(navui(myJson.search_result.total_hits), navel);
		});
}

function threadSearch(q, n, s, i) {
	fetch(`https://geodex.org/api/v1/textindex/searchset?q=${q}&n=${n}&s=${s}&i=${i}`)
		.then(function (response) {
			return response.json();
		})
		.then(function (myJson) {
			// console.log(myJson);
			const el = document.querySelector('#container2');
			render(threadTemplate(myJson), el);
		});
}

function simpleSearch(q, n, s, i) {
	fetch(`https://geodex.org/api/v1/textindex/search?q=${q}&n=${n}&s=${s}&i=${i}`)
		.then(function (response) {
			return response.json();
		})
		.then(function (myJson) {
			// console.log(myJson);
			const el = document.querySelector('#container2');
			render(searchTemplate(myJson), el);
		});
}

function providerList() {
	fetch('http://192.168.2.50:6789/api/v1/typeahead/providers')
		.then(function (response) {
			return response.json();
		})
		.then(function (myJson) {
			// console.log(myJson);
			const el = document.querySelector('#container2');
			render(providerTemplate(myJson), el);
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