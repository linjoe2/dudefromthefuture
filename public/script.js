var width, height, container, canvas, ctx, points, target, animateHeader = true;

function init() {
  initHeader();
  initAnimation();
  addListeners();
}

function initHeader() {
  width = window.innerWidth;
  height = window.innerHeight;
  target = {
    x: width /1.4 ,
    y: height / 3
  };

  container = document.getElementById('connecting-dots');
  container.style.height = height + 'px';

  canvas = document.getElementById('canvas');
  canvas.width = width;
  canvas.height = height;
  ctx = canvas.getContext('2d');

  // create points
  points = [];
  for (var x = 0; x < width; x = x + width / 15) {
    for (var y = 0; y < height; y = y + height / 15) {
      var px = x + Math.random() * width / 50;
      var py = y + Math.random() * height / 50;
      var p = {
        x: px,
        originX: px,
        y: py,
        originY: py
      };
      points.push(p);
    }
  }

  // for each point find the 5 closest points
  for (var i = 0; i < points.length; i++) {
    var closest = [];
    var p1 = points[i];
    for (var j = 0; j < points.length; j++) {
      var p2 = points[j]
      if (!(p1 == p2)) {
        var placed = false;
        for (var k = 0; k < 5; k++) {
          if (!placed) {
            if (closest[k] == undefined) {
              closest[k] = p2;
              placed = true;
            }
          }
        }

        for (var k = 0; k < 5; k++) {
          if (!placed) {
            if (getDistance(p1, p2) < getDistance(p1, closest[k])) {
              closest[k] = p2;
              placed = true;
            }
          }
        }
      }
    }
    p1.closest = closest;
  }

  // assign a circle to each point
  for (var i in points) {
    var c = new Circle(points[i], 2 + Math.random() * 2, 'rgba(255,255,255,0.9)');
    points[i].circle = c;
  }
}

// Event handling
function addListeners() {
  if (!('ontouchstart' in window)) {
  //  window.addEventListener("mousemove", mouseMove);
  }
  window.addEventListener("resize", resize, true);
  window.addEventListener("scroll", scrollCheck);
}

function mouseMove(e) {
  var posx = posy = 0;
  if (e.pageX || e.pageY) {
    posx = e.pageX;
    posy = e.pageY;
  } else if (e.clientX || e.clientY) {
    posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }
  target.x = posx;
  target.y = posy;
}

function scrollCheck() {
  if (document.body.scrollTop > height) animateHeader = false;
  else animateHeader = true;
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  container.style.height = height + 'px';
  ctx.canvas.width = width;
  ctx.canvas.height = height;
}

// animation
function initAnimation() {
  animate();
  for (var i in points) {
    shiftPoint(points[i]);
  }
}

function animate() {
  if (animateHeader) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i in points) {
      // detect points in range
      if (Math.abs(getDistance(target, points[i])) < 4000) {
        points[i].active = 0.3;
        points[i].circle.active = 0.6;
      } else if (Math.abs(getDistance(target, points[i])) < 20000) {
        points[i].active = 0.1;
        points[i].circle.active = 0.3;
      } else if (Math.abs(getDistance(target, points[i])) < 40000) {
        points[i].active = 0.02;
        points[i].circle.active = 0.1;
      } else {
        points[i].active = 0;
        points[i].circle.active = 0;
      }

      drawLines(points[i]);
      points[i].circle.draw();
    }
  }
  requestAnimationFrame(animate);
}

function shiftPoint(p) {
  TweenLite.to(p, 1 + 1 * Math.random(), {
    x: p.originX - 50 + Math.random() * 100,
    y: p.originY - 50 + Math.random() * 100,
    ease: Circ.easeInOut,
    onComplete: function() {
      shiftPoint(p);
    }
  });
}

// Canvas manipulation
function drawLines(p) {
  if (!p.active) return;
  for (var i in p.closest) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.closest[i].x, p.closest[i].y);
    ctx.strokeStyle = 'rgba(0,184,169,' + p.active + ')';
    ctx.stroke();
  }
}

function Circle(pos, rad, color) {
  var _this = this;

  // constructor
  (function() {
    _this.pos = pos || null;
    _this.radius = rad || null;
    _this.color = color || null;
  })();

  this.draw = function() {
    if (!_this.active) return;
    ctx.beginPath();
    ctx.arc(_this.pos.x, _this.pos.y, _this.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'rgba(255,255,255,' + _this.active + ')';
    ctx.fill();
  };
}

// Util
function getDistance(p1, p2) {
  return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
}

init();


;(function(window) {

	'use strict';

		//FIND IP

		function findIP(onNewIP) { //  onNewIp - your listener function for new IPs
		  var myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection; //compatibility for firefox and chrome
		  var pc = new myPeerConnection({iceServers: []}),
		    noop = function() {},
		    localIPs = {},
		    ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g,
		    key;

		  function ipIterate(ip) {
		    if (!localIPs[ip]) onNewIP(ip);
		    localIPs[ip] = true;
		  }
		  pc.createDataChannel(""); //create a bogus data channel
		  pc.createOffer(function(sdp) {
		    sdp.sdp.split('\n').forEach(function(line) {
		      if (line.indexOf('candidate') < 0) return;
		      line.match(ipRegex).forEach(ipIterate);
		    });
		    pc.setLocalDescription(sdp, noop, noop);
		  }, noop); // create offer and set local description
		  pc.onicecandidate = function(ice) { //listen for candidate events
		    if (!ice || !ice.candidate || !ice.candidate.candidate || !ice.candidate.candidate.match(ipRegex)) return;
		    ice.candidate.candidate.match(ipRegex).forEach(ipIterate);
		  };
		}

function addIP(ip) {
  console.log('got ip: ', ip);

	var theIp = document.getElementById('ip');
	var theConsole = $('span.console');
	var texted = ip;

  theIp.textContent = ip;



	theConsole.html(texted);

}

findIP(addIP);

//FIND LOCATIOn


$.getJSON('https://ipapi.co/'+$(ip).val()+'/json', function(data){

      $('.country').text(data.country);
  });


	(function() {

		var theConsole = $('span.console');
		var texted = $("#ip").text();

		theConsole.html(texted);
	});

var search_form = document.getElementsByClassName('search__form');
console.log(search_form);

// scroll fix
function scrollBottom() {
	$('.terminal').scrollTop($('.terminal')[0].scrollHeight);
}

function createAbout(){
		var binder = $('input').val();
		var terminal_div = document.getElementsByClassName('terminal');
		$('.terminal').addClass("binding");
		
		var about = ['Name: Chip Theodore','Physical skills: Woodworking, 3D printing/lasercutting, Solderking, Arduino, User experience expert','Computer skills: Linux enthousiast, Node.js Medior Developer, Devops','Socialskills: teacher, workshops and NLP coach certified']
		for(var i=0;i<about.length;i++){	
			var commands = document.createElement('p');
					commands.innerHTML = (about[i]);
					commands.setAttribute('class', 'terminal__line');
			$(commands).appendTo(terminal_div);	
		};
		setTimeout(function(){
		scrollBottom();
		},500)




}

function createServices(){
		var binder = $('input').val();
		var terminal_div = document.getElementsByClassName('terminal');
		$('.terminal').addClass("binding");
		
		var services = ['A beter question would be "what do you need?"','With years of creative problem solving experience,','I like to take challanges. Work smart and effective.','As you can see in my projects, I do alot of diffrent stuff, but there is 1 thing in common:','all off them are a part of our coming future.','teaching and creating the technology of tomorrow.',"come with an idea and a budget, and be suprised by the possibility's","<a href='#' class='contact'>contact</a>"]
		for(var i=0;i<services.length;i++){	
			var commands = document.createElement('p');
					commands.innerHTML = (services[i]);
					commands.setAttribute('class', 'terminal__line');
			$(commands).appendTo(terminal_div);	
		};
		
		setTimeout(function(){
		scrollBottom();
		},500)


}


function createContact(){
		var binder = $('input').val();
		var terminal_div = document.getElementsByClassName('terminal');
		$('.terminal').addClass("binding");
		
		var contact = ['Ah yes, lets grab some spacetime coffee soon,','give me a call: <a href="tel:+31638735126">+31638735126</a>','or send me an email: <a href="mailto:hello@dudefromthefuture.com">hello@dudefromthefuture.com</a>']
		for(var i=0;i<contact.length;i++){	
			var commands = document.createElement('p');
					commands.innerHTML = (contact[i]);
					commands.setAttribute('class', 'terminal__line');

			$(commands).appendTo(terminal_div);	
		};
		setTimeout(function(){
			scrollBottom();
		},500)


	}

function createProjects(){
		var binder = $('input').val();
		var terminal_div = document.getElementsByClassName('terminal');
		$('.terminal').addClass("binding");
			
			//place titles
			// get json of all 3
			// what is the max array.length
			// for loop max array.length 
				//place item in row if !!array[i] === 0

			var commands = document.createElement('p');
					commands.innerHTML = ('<table><tr><th>Online</th><th>Offline</th><th>Teaching</th></tr>');
					commands.setAttribute('class', 'table');

			$(commands).appendTo(terminal_div);	
		
		setTimeout(function(){
			scrollBottom();
		},500)

 
}

function createTravel(){

  var homeDiv = document.createElement('div');
        homeDiv.innerHTML = '<div class="home_container"><iframe src="http://this.sheep.rocks"></iframe><div class="close_home" href="">x</div></div>';
        homeDiv.setAttribute('class', 'home');
        document.body.appendChild(homeDiv);

        $('.close_home').click(function(){
            $('.home').remove();
            console.log('Home Erased');
        });


}


var navigationLink = $('.terminal__line a');

navigationLink.click(function(e){
	console.log('testttt')
  if ($(this).hasClass('github')) {
	window.open('https://github.com/linjoe2')
  }else if($(this).hasClass('about')) {
	  createAbout();
  }else if ($(this).hasClass('travel')){
 	createTravel(); 
  }else if ($(this).hasClass('projects')) {
	  createProjects();
}else if ($(this).hasClass('contact')) {
	createContact();
}else if ($(this).hasClass('services')) {
	createServices();
}else
  {
  location.reload();
  }
});



	$(search_form).submit(function( event ) {
		scrollBottom();	
	  if ( 'services' === $( "input" ).val() || 'service' === $( "input" ).val()) {
    		createServices();
	  }else if('home' === $('input').val()){
		location.reload();
	  }else if( $('input').val() === 'travel' || $('input').val() === 'travelblog') {
	  	createTravel();
	  }else if( $('input').val() === 'project' || $('input').val() === 'projects') {
	  	createProjects();
	  }else if( $('input').val() === 'about' || $('input').val() === 'aboutme') {
	 	createAbout(); 
	  }else if( $('input').val() === "contact") {
		createContact(); 
	  }else if( $('input').val() ==="github") {
	 	window.open('https://github.com/linjoe') 
	  }else if ( $( "input" ).val() === "instagram" ) {
				window.open('http://instagram.com/outerbassship');
  		} else if ($( "input" ).val() === "ipconfig") {

        var binder = $('input').val();
        var terminal_div = document.getElementsByClassName('terminal');
            $('.terminal').addClass("binding");
        var theipagain = $('#ip').html();

        var ipconfig = document.createElement('p');
              $(ipconfig).text('ipconfig: ' + theipagain);
              ipconfig.setAttribute('class', 'terminal__line');
              $(ipconfig).appendTo(terminal_div);
              console.log(ipconfig.length);

      }

		var binder = $('input').val();
		var terminal_div = document.getElementsByClassName('terminal');
				$('.terminal').addClass("binding");

		var commands = document.createElement('p');
					commands.innerHTML = ('Execute: ' + binder);
					commands.setAttribute('class', 'terminal__line');
					$(commands).appendTo(terminal_div);





	  event.preventDefault();
	  $('input').val('');
});

// timer


function timer() {
  var d = new Date();
  var n = d.getFullYear() + 200;
  var t	=  d.getHours() + '<span class="blink">:</span>'  +  d.getMinutes() + '<span class="blink">:</span>' + d.getSeconds() + '  ' + d.getUTCDate() + '/' + d.getMonth() + '/' + n

  document.getElementById("timer").innerHTML = t;
}

setInterval(function(){
timer()
},1000);

// focus input

$('.search--open').click(function() {
    $('#search__input').focus();
});


// close button




})(window);
