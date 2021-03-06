var matter = require('gray-matter');
var dir = require('node-dir');
var marked = require('marked');
var fs = require('fs');

//clean files
fs.writeFile("./public/json/offline.json","[]", function (err) {
  if (err) throw err;
  console.log('Emptied offline!');
});
fs.writeFile("./public/json/online.json","[]", function (err) {
  if (err) throw err;
  console.log('Emptied online!');
});

fs.writeFile("./public/json/teaching.json","[]", function (err) {
  if (err) throw err;
  console.log('Emptied teaching!');
});

// read files
dir.readFiles("posts/", {
		match: /.md$/,
		exclude: /^\./,
		shortName: false
	}, function(err, content, filename, next) {
		if (err) throw err;
		filename = filename.slice(5, -3);
		htmlify(content, filename);
		next();
	},
	function(err, files) {
		if (err) throw err;
		console.log('finished reading files:', files);
	});
// take content > write to file "filename.html"
// 
function htmlify(content, filename) {
	json = matter(content);
	html = marked(json.content);
	// html = facebookify(html, filename)
	if(filename != '/now'){html = linkify(html, filename)}
	if(json.data.youtube != null){html=youtubeify(html,json.data.youtube)}
	htmlfile = "./public/posts" + filename + ".html"
	fs.writeFile(htmlfile, html, function (err) {
  if (err) throw err;
  console.log('Saved!');
});
	jsonify(json.data, htmlfile);
}

//open json file > take object > add filepath to object > add object to json file > write 
function jsonify(object, filelocation) {
	if(object.youtube != null){
		object.image = 'https://img.youtube.com/vi/' + object.youtube + '/sddefault.jpg'
	}
	object.htmlfile = filelocation
	if (filelocation.includes("offline")) {
		fs.readFile('./public/json/offline.json', (err, data) => {
			if (err) throw err;
			var file = JSON.parse(data)
			file.push(object)
			fs.writeFile("./public/json/offline.json",JSON.stringify(file),(err) => {if (err) throw err});
		});
	}
	if (filelocation.includes("online")) {
		fs.readFile('./public/json/online.json', (err, data) => {
			if (err) throw err;
			var file = JSON.parse(data)
			file.push(object)
			fs.writeFile("./public/json/online.json",JSON.stringify(file),(err) => {if (err) throw err});
			mapify(object)
		});
	}
	if (filelocation.includes("teaching")) {
		fs.readFile('public/json/teaching.json', (err, data) => {
			if (err) throw err;
			var file = JSON.parse(data)
			file.push(object)
			fs.writeFile("./public/json/teaching.json",JSON.stringify(file),(err) => {if (err) throw err});
			mapify(object)
		});
	}
}

function youtubeify(html, video) {
	newHtml = '<div id="video"><iframe id="videoplayer" src="https://www.youtube.com/embed/'+video+'"></iframe></div><div id="content">'+html+'</div><script>$("#videoplayer, #content").css("height", $(window).height());</script>'
	return newHtml
}

function linkify(html, filename) {
	newHtml = html+'<script>history.pushState(null, null, "'+filename+'");</script>'
	return newHtml
}


