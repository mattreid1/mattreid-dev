/**
 * A simple webserver with Mustache rendering.
 * 
 * Modified from https://stackoverflow.com/a/29046869
 */

const http = require("http");
const url = require("url");
const fs = require("fs-extra");
const path = require("path");
const Mustache = require("Mustache");
const port = 3000;

// Public directory (what to serve)
const publicDir = "./build";

// Static files directory (to be copied without any modification)
const staticDir = "./static"

// The file containing the data to fill the template
const jsonFile = "./data.json"

// Copy static files first as /index.html may not be a template
fs.copySync(staticDir, publicDir);

// Start server
http.createServer(function (req, res) {
	console.log(`${req.method} ${req.url}`);

	// Parse URL
	const parsedUrl = url.parse(req.url);

	// Extract URL path
	let pathName = `${publicDir}${parsedUrl.pathname}`;

	try {
		// If is a directory, search for index file matching the extention
		if (fs.statSync(pathName).isDirectory()) pathName += "index.html";
	} catch (error) {
		// Path is not a direcory or file
		res.statusCode = 404;
		res.end(`File ${pathName} not found!`);
		return;
	}

	// If the file has a template
	const templatePath = `./template${pathName.replace(publicDir, "")}`;
	if (fs.existsSync(templatePath)) {
		console.log(`Rendering ${templatePath}...`);

		const template = fs.readFileSync("./template/index.html", "utf8");
		const jsonData = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
		const output = Mustache.render(template, jsonData);

		fs.emptyDirSync(publicDir);
		fs.copySync(staticDir, publicDir);
		fs.writeFileSync(`${publicDir}/index.html`, output);
	}

	// Extract the file extention based on the URL path (e.g. .js, .doc, etc...) (if nothing, guess .html)
	const extension = ((path.parse(pathName).ext == "") ? ".html" : path.parse(pathName).ext);

	// Maps file extention to MIME type
	const map = {
		".ico": "image/x-icon",
		".html": "text/html",
		".js": "text/javascript",
		".json": "application/json",
		".css": "text/css",
		".png": "image/png",
		".jpg": "image/jpeg",
		".wav": "audio/wav",
		".mp3": "audio/mpeg",
		".svg": "image/svg+xml",
		".pdf": "application/pdf",
		".doc": "application/msword"
	};

	fs.exists(pathName, function (exist) {
		if (!exist) {
			// if the file is not found, return 404
			res.statusCode = 404;
			res.end(`File ${pathName} not found!`);
			return;
		}

		// Read file from file system
		fs.readFile(pathName, function (err, data) {
			if (err) {
				res.statusCode = 500;
				res.end(`Error getting the file: ${err}.`);
			} else {
				// If the file is found, set Content-type and send data
				res.setHeader("Content-type", map[extension] || "text/plain");
				res.end(data);
			}
		});
	});


}).listen(parseInt(port));

console.log(`Server listening on http://localhost:${port}/`);