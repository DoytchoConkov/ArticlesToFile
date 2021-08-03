const https = require('https');

const fs = require('fs');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const baseUrl = 'https://aws.amazon.com';
const url = baseUrl + '/new/?whats-new-content-all'


const fileLinksDir = './listUrl/'
const fileLinksFile = fileLinksDir + 'links.json' // file contains Array of downloaded articles ['url_1', 'url_2' , ......]
const dirDownloadArticlesDir = './articles/'


function parseHTMLArticle(html, title) {
	let dom = new JSDOM(html);
	let article = dom.window.document.querySelector('section').outerHTML; // Save Article HTML 
	let fileName = title.replace(/\W/g, '_'); // Replace all characters, which are leters or _
	fs.writeFileSync(dirDownloadArticlesDir + fileName + ".txt", article)

}

function downloadArticle(url, title) {
	url = baseUrl + url;
	https.get(url, response => {
		// console.log(response.statusCode )	;

		if (response.statusCode !== 200) {
			throw "Error Get HTML content " + response.statusCode
		}
		let html = '';
		response.on('data', (data) => {
			html += data.toString();
		});
		response.on('end', () => {
			//console.log(html)
			parseHTMLArticle(html, title);
		});

	})
}
function checkToDownload(articles) {
	let downloadedArticvlesArray = JSON.parse(fs.readFileSync(fileLinksFile, { encoding: 'utf8' }))
	let numArticles = 0;
	for (let i = 0; i < articles.length; i++) {
		if (downloadedArticvlesArray.indexOf(articles[i].url) === -1) {
			downloadedArticvlesArray.push(articles[i].url);
			setImmediate(downloadArticle, articles[i].url, articles[i].title)
			numArticles++;
		}
	}

	if (numArticles) fs.writeFileSync(fileLinksFile, JSON.stringify(downloadedArticvlesArray))
	if (numArticles === 0) console.log('No New Articles');
	else console.log(numArticles + ' new Articles are downloaded in ' + dirDownloadArticlesDir + ' directory');
}

function parseHTML(html) {
	let articles = []
	let dom = new JSDOM(html);
	let thisWeekAnnouncementsH2 = dom.window.document.querySelector('div > h2')
	let thisWeekAnnouncementsDivArray = thisWeekAnnouncementsH2.parentNode.querySelectorAll(['div.lb-xbcol'])
	for (let i = 0; i < thisWeekAnnouncementsDivArray.length; i++) {
		let articleTitle = thisWeekAnnouncementsDivArray[i].querySelector('h5').textContent.trim();
		let articleUrl = thisWeekAnnouncementsDivArray[i].querySelector('a').getAttribute('href')
		articles.push({ "title": articleTitle, "url": articleUrl })
	}

	checkToDownload(articles)
}

function downloadUrl(url) {
	https.get(url, response => {
		// console.log(response.statusCode )	;

		if (response.statusCode !== 200) {
			throw "Error Get HTML content " + response.statusCode
		}
		let html = '';
		response.on('data', (data) => {
			html += data.toString();
		});
		response.on('end', () => {
			//console.log(html)
			parseHTML(html);
		});

	})

}

// Create file with the list of Links , if not exists
if (!fs.existsSync(fileLinksDir)) {
	fs.mkdirSync(fileLinksDir);
	fs.writeFileSync(fileLinksFile, '[]')
}

// Create directory "to" - to download Articles.
if (!fs.existsSync(dirDownloadArticlesDir)) {
	fs.mkdirSync(dirDownloadArticlesDir);
}


downloadUrl(url)