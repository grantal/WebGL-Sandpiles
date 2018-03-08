function br(parent){
	var blank = document.createElement("br");
	parent.appendChild(blank);	
}

function add_select(parent, options, title, selectfunc){
	var select = document.createElement( 'select' );
	
	var option = document.createElement('option');
	option.textContent = title;
	option.value = null;
	option.disabled = true;
	option.selected = true;
	select.appendChild(option) ;
	
	for (var i = 0; i < options.length; i++) {
		var option = document.createElement('option');
		option.textContent = options[i][0];
		option.value = options[i][1];
		select.appendChild(option) ;
	}

	select.addEventListener( 'change', function (event) {		
		selectfunc(event);
		select.blur();
	});
	
	parent.appendChild(select);
}

function add_button(parent, buttontext, buttonfunc){
	var f = document.createElement('button'); 
	f.textContent = buttontext;
	f.addEventListener('click', function(event){
		event.preventDefault();
		buttonfunc();
		f.blur();
	}); 
	parent.appendChild( f );
}

function add_a(parent, buttontext, buttonfunc){
	var f = document.createElement('a'); 
	f.textContent = buttontext;
	f.addEventListener('click', function(event){
		event.preventDefault();
		buttonfunc();
	}); 
	parent.appendChild( f );
}

function add_dropdown(parent, title){
	var dd = document.createElement( 'div' );
	dd.className = 'dropdown';
	
	var ddbtn = document.createElement('button');
	ddbtn.className = 'dropbtn';
	ddbtn.textContent = title;
	dd.appendChild(ddbtn);
	
	var ddc = document.createElement('div');
	ddc.className = 'dropdown-content';
	ddc.id = title;
	dd.appendChild(ddc) ;
	
	parent.appendChild(dd);
	return ddc;
}

function add_option(parent, title, f){
	var option = document.createElement('a');
	option.textContent = title;
	option.onclick = f
	parent.appendChild(option);
	return option
}

function add_options(parent, options){
	for (i = 0; i < options.length; i++){
		add_option(parent, options[i][0], options[i][1])
	}
}

function add_submenu(parent, title, f){
	var submenu = document.createElement('div');
	submenu.className = 'dropdown-submenu';
	
	var subbtn = document.createElement('a');
	subbtn.textContent = title;
	subbtn.onclick = f;
	submenu.appendChild(subbtn);
	
	var submenucontent = document.createElement('div');
	submenucontent.className = 'dropdown-content';
	submenu.appendChild(submenucontent)
	
	
	parent.appendChild(submenu)
	return submenucontent
}

function add_slider(min, max, step, defaultval, size, f){
	var slider = document.createElement("input");
 	slider.className = 'slider';
	slider.type = 'range'; 
 	slider.min = min;
	slider.max = max;
	slider.step = step;
	slider.defaultValue = defaultval;
	slider.style.width = size[0];
	slider.style.height = size[1];
	slider.oninput = f; 
	document.body.appendChild(slider);
	return slider;
}

function add_form(parent, fieldname, fieldval, buttontext, buttonfunc){
	var f = document.createElement('form');	
	
	var i = document.createElement("input"); 	
	i.setAttribute('type',"text");
	i.setAttribute('id',fieldname);
	i.setAttribute('value',fieldval);

	var s = document.createElement('button'); 
	s.setAttribute('type',"submit");
	s.textContent = buttontext;
	
	f.addEventListener('submit', function(event){
		event.preventDefault();
		buttonfunc(fieldname);
		i.blur();
	}); 
	
	f.appendChild( i );
	f.appendChild( s );	
	parent.appendChild( f );
}

function first(f){
	d = new $.Deferred();
	setTimeout(f + 'd.resolve()', 0);				
	return d.promise()
}

function second(f){
	d = new $.Deferred();
	setTimeout(f +  'd.resolve()', 10);
	return d.promise()
}

function force_order(f1, f2){
	promise = first(f1).then(second(f2));
}

var set_id_command = `var id = sand.seek_identity();
                      if (id != null){
                        sand.set(sand.identity_saves[id][0]);
                      } else {
                        var m = sand.shape_choice;
                        console.log("shape choice: " + m);
                        // square, circle, diamond
                        if ((m == 1 || m == 2 || m == 4) && sand.altered == 0){
                        //if (sand.altered == 0){
                          sand.surface_method(sand.m, m);
                          sand.save_identity();
                          sand.draw();
                        } else {
                          sand.naive_method();
                          sand.save_identity();
                          sand.draw();}
                      }
                      $(".thinking").text("");`
// sets the board to the identity
function set_identity(){

  force_order(
    '$(".thinking").text("Computing identity...");', 
    set_id_command 
  );
}

// adds the board to the identity
function add_identity(){
  // we store the current state, then set the state to the identity
  // then we add the saved state to the new state
  var store_state = 'var curr = sand.get();';
  var add_state = `var newstate = sand.get();
                   sand.set(sand.add(curr, newstate));`;
  force_order(
    '$(".thinking").text("Computing identity...");', 
    store_state + set_id_command + add_state 
  );
}

function init_ui(){
	var menubar = document.createElement( 'div' );
	menubar.id = "menubar";
	menubar.className = "container";
	menubar.style.position = 'absolute';	
	menubar.style.top = '0px';
	menubar.style.left = '0px';
	document.body.appendChild( menubar );

	var file = add_dropdown(menubar, "File")
	var save = add_submenu(file, "Save sandpile", function(){
		sand.save();	
		sand.user_saves += 1;
		
		var id = sand.save_id - 1
		var s = add_option(load, $('.size').text() + ' #' + id, function(){
			sand.load(id);
		})
		s.id = id
		
		// careful here, if the graph differs, you might get weird results. add() uses the graph of the first input for the graph of the output, and just adds sand from the second input where it could go
		var a = add_option(add, $('.size').text() + ' #' + id, function(){
			sand.set(sand.add(sand.get(), sand.saves[id]));
		})
	})
	
	var saveas = add_submenu(file, "Save sandpile as", function(){
		sand.save();	
		sand.user_saves += 1;
		var id = sand.save_id - 1
		var name = prompt("Please enter a name:", $('.size').text() + ' #' + id);
		if (name == null){name = $('.size').text() + ' #' + id}
		
		var s = add_option(load, name, function(){
			sand.load(id);
		})
		s.id = id
		
		var a = add_option(add, name, function(){
			sand.set(sand.add(sand.get(), sand.saves[id]));
		})
	})

	var load = add_submenu(file, "Load sandpile")
	var add = add_submenu(file, "Add saved sandpile to current sandpile")

	var savefv = add_submenu(file, "Save firing vector", function(){
		sand.save_firing_vector();	
		
		var id = sand.firing_vector_id - 1
		var save = add_option(loadfv, "Vector #" + id + 1, function(){
			sand.fire_vector(sand.firing_vectors[id]);
		})
		

	})
	
	var loadfv = add_submenu(file, "Fire saved vector")
	

	add_options(file, [
/* 		['Export sandpile', function(){		
			var state = sand.get();
			download("data:text/csv;charset=utf-8," + state, $( "#name_field").val() + ".txt");
		}],
		['Import sandpile', function(){sand.reset();}], */
		['Clear sandpile (DEL)', function(){sand.reset();}],
		['Download state (heights only)', function(){
			var state = sand.get();		
			var region = sand.get_region(state);
			var output = new Float32Array(region.length);
			for (var i = 0; i < output.length; i += 1){
				output[i] = state[region[i]];
			}	
			
			download("data:text/csv;charset=utf-8," + output, "mysandpile.txt");

		}]
	])

	var algs = add_dropdown(menubar, "Algorithms")
	add_options(algs, [
		['Stabilize', function(){
			$('.thinking').text("Stabilizing...");
			if (confirm("Warining! This could take a while.")){		
				sand.stabilize();
				sand.draw();
			}
			$('.thinking').text("");

		}],	
		['Compute Identity', function(){set_identity();}],
		['Fire sink n times', function(){
			var n = prompt("Please enter a number:", 1);
			sand.fire_sink(n);
	
		}],
		['Fire sink until Identity', function(){
			if (confirm("Warining! This could take an extremely long time.")){		
				alert("Fired sink " + sand.fire_sink_until_id() + " times.");
			}
		}],
		['Toggle Markov Process', function(){sand.markov_process(10);}],
		['Add a random grain', function(){	
			sand.set(sand.add_random(sand.get()));
			sand.draw();
		}],
		['Random stable configuration',  function() {sand.setRandom(); sand.draw();}],		
		['Add n grains to each cell', function(){
			var n = prompt("Please enter a number:", 4);
			if (n != null){
				sand.plus(n);
				sand.draw()
			}
		}],
		['Set each cell to n grains', function(){
			var n = prompt("Please enter a number:", 4);
			sand.set(sand.fullstate(n));	
		}],
		['Find recurrent inverse of current state', function(){
			if (confirm("Warining! This could take a while.")){		
				sand.rec_inverse();
				sand.draw();
			}
		}],
		['Dualize', function(){
			sand.dualize();
		}],
		['Toggle sinks', function(){
			sand.toggle_sinks();
		}],
		['Secret Message', function(){
			alert("This process will let you create two random looking sandpiles whose sum stabilizes to a hidden message of your choice.")
			alert("First, write your secret message on the following sandpile, by adding single grains only.")
			document.getElementById("done").style.display = "block";
			sand.set(sand.fullstate(2));
			sand.brush_type = 4;
			sand.brush_height = 3;
			if (sm_done == 1){
				sm_load_1.style.display = 'none';
				sm_load_2.style.display = 'none';
				sm_add_1.style.display = 'none';
				sm_add_2.style.display = 'none';
			};
		
		}]
	])
 
	var brush = add_dropdown(menubar, "Brush")
	add_options(brush, [
		['Pan', function(){sand.brush_type = 7;}],
		['Drop sand', function(){sand.brush_type = 0;}],
		['Add sinks', function(){sand.brush_type = 1;}],
	    ['Add sources', function(){sand.brush_type = 2;}],
	    ['Add walls', function(){sand.brush_type = 3;}],
		['Fire cells', function(){sand.brush_type = 5;}],
		['Set clicked cells to n grains', function(){
			var n = prompt("Please enter a number:", 4);
			if (n != null){
				sand.brush_height = (n);
				sand.brush_type = 4;
			}
		}],
		['Inspect', function(){		
			sand.brush_type = 6;
		}]
	])
	
	var color = add_dropdown(menubar, "Color Scheme")
	add_options(color, [
		['Wesley', function(){sand.color = 0;sand.draw();}],
		['Luis', function(){sand.color = 1;sand.draw();}],	
		['Unstable cells', function(){sand.color = 3;sand.draw();}],
		['Firing vector', function(){sand.color = 4;sand.draw();}],
		//['256*3 colors', function(){sand.color = 5;sand.draw();}],
		['256^3 colors', function(){sand.color = 6;sand.draw();}],
		['Grayscale', function(){sand.color = 7;sand.draw();}],
		['Outdegrees', function(){sand.color = 2;sand.draw();}]
	])

	var settings = add_dropdown(menubar, "Settings")
	var shape = add_submenu(settings, "Choose boundary shape")
	add_options(shape, [
		["Square", function(){
			sand.shape_choice = 1;
			sand.reset();
			//sand.set_surface(sand.shape_choice);
		}],
		["Circle", function(){
			sand.shape_choice = 2;
			sand.reset();
			//sand.set_surface(sand.shape_choice);
		}],
		["Ellipse", function(){
			var n = prompt("Please enter a factor:", 2);
			if (n != null){
				sand.shape_choice = 3;
				sand.reset();
				sand.set_surface(sand.shape_choice, n);
			}
		}],
		["Annulus", function(){
			var n = prompt("Please enter an inner radius:", sand.m/2);
			if (n != null){
				sand.shape_choice = 5;
				sand.reset();
				sand.set_surface(sand.shape_choice, n);
			}
		}],
		/* ["??", function(){

			var n = prompt("Please enter a power:", 2);

			sand.shape_choice = 0;
			sand.reset();
			sand.set_surface(sand.shape_choice, n);

		}], */
		["Diamond", function(){

			
			sand.shape_choice = 4;
			sand.reset();
			sand.set_surface(sand.shape_choice);

		}]
	])
	add_options(settings, [
		['Choose grid size', function(){
			var n = prompt("Please enter a grid size (max "+ (Math.min(sand.w, sand.h) - 2)+ ")", sand.m);
			
			if (n != null){
				if(n < Math.min(sand.w, sand.h)){
					sand.m = n;
					sand.n = n;
					
					if (sand.shape_choice != 3){
						sand.reset();
						sand.set_surface(sand.shape_choice);
					} else {
						sand.reset();
						sand.set_surface(sand.shape_choice, 2);
					}
                                        // if we're in 2D mode, this will remake the buffers next time we enter 3D mode
                                        sand.buffers3d = undefined;
                                        // if in 3d mode, we need to reset the buffers now
                                        if (!sand.is2D){
                                          sand.make_buffers_wrapper();
                                        }

				} else {
					alert("Please choose a smaller grid. Max is " + (Math.min(sand.w, sand.h) - 2) + ".");
				}
			}
		}],
		['Set speed', function(){
			var n = prompt("Please enter a speed (frames per millisecond, can be less than 1):", 1);
			if (n != null){
				if (n < 1){
					sand.set_speed(1, 1/n);
				} else {
					sand.set_speed(n, 1);
				}
			}
		}],
		['Run for n frames', function(){
			var n = prompt("Please enter a number:", 100);
			if (n != null){
				sand.run(n);
				sand.draw()
			}
		}],
		['Toggle 2D/3D', function(){
                    sand.toggle_2D_3D();
		}],
		['Reset camera', function(){
                    sand.reset_camera();
		}],
	])
	
	var window = add_dropdown(menubar, "Window")
	    $("#highlights").css("display","none");
	add_options(window, [
		['Highlights', function(){
	                $("#highlights").css("display", "block");
		}],
		['Toolbox', function(){
			document.getElementById("toolbar").style.display = "block";
			//document.getElementById("toolbar").style.display = "block";
		}],
	])
	
	 //var debug = add_dropdown(menubar, "Debug")
	/* add_options(debug, [
		['Enumerate', function(){
			sand.enumerate();
		}],
		['statesize', function(){
			var state = sand.get();
			var n = 0;
			for (var i = 0; i < state.length; i += 4){
				if (state[i + 1] == 1){ 
					n++
				}
			}
			alert(n)
		}],
		['outdeg', function(){
			sand.set_outdegree();
		}],
	])  */
	
	var fps  = document.createElement('div')
	fps.className = "fps"	
	document.body.appendChild(fps);

	var zoom = document.createElement('div');
	zoom.className = "zoom"
	document.body.appendChild(zoom);
	
	var size = document.createElement('div');
	size.className = "size"
	document.body.appendChild(size);
	
	var thinking = document.createElement('div');
	thinking.className = "thinking"
	document.body.appendChild(thinking);

	// sliders and stuff
	
	//min, max, step, defaultval, size, f
	var speed_slider = add_slider(0, 12, 1, 4, ["100px", "10px"], function(){	
		var n = Number(this.value);
		
		switch(n){
			case 0:
				sand.set_speed(1, 1000);
				break
			case 1:
				sand.set_speed(1, 100);
				break
			case 2:
				sand.set_speed(1, 50);
				break
			case 3:
				sand.set_speed(1, 10);
				break
			case 4:
				sand.set_speed(1, 1);
				break			
			case 5:
				sand.set_speed(2, 1);
				break			
			case 6:
				sand.set_speed(3, 1);
				break			
			case 7:
				sand.set_speed(4, 1);
				break
			case 8:
				sand.set_speed(5, 1);
				break
			case 9:
				sand.set_speed(10, 1);
				break
			case 10:
				sand.set_speed(20, 1);
				break
			case 11:
				sand.set_speed(50, 1);
				break
			case 12:
				sand.set_speed(100, 1);
				break
		}
		/* if (n < .5){
			var m = (Number(n)*2);
			sand.set_speed(1, 1/m);
		} else {
			var m = (Math.log((Number(n) + .5)**60) + 1);
			sand.set_speed(m, 1);
			
		} */
		
		console.log('speed slider: ' + n);

		/* if (n < 1){
			sand.set_speed(1, 1/n);
		} else {
			sand.set_speed(n, 1);
		 */
	});
	
	speed_slider.style.position = 'fixed';
	speed_slider.style.right = '80px';
	speed_slider.style.bottom = '-1px';
	//speed_slider.style.transform = 'rotate(270deg)';
	
	
	var size_slider = add_slider(1, Math.min(sand.w, sand.h) - 2, 1, 100, ["100px", "10px"], function(){
		var n = this.value;
		console.log('size slider: ' + n);
		sand.m = n;
		sand.n = n;
		if (sand.shape_choice != 3){
			sand.set_surface(sand.shape_choice);
		} else {
			sand.set_surface(sand.shape_choice, 2);
		}
	});

	size_slider.style.position = 'fixed';
	size_slider.style.right = '80px';
	size_slider.style.bottom = '14px';
	
	var zoom_slider = add_slider(0, 3, 1, 2, ["100px", "10px"], function(){
		var n = Number(this.value);

		console.log('zoom slider: ' + n);
		
		switch(n){
			case 0:
				sand.scale = .3;			
				break
				
			case 1:
				sand.scale = 1;
				break				
			case 2:
				sand.scale = 12;
				break
		}
		
		sand.draw();
		console.log(sand.scale)
		
		$('.zoom').text(Number((sand.scale).toFixed(1)) + 'x zoom');
	
	});

	zoom_slider.style.position = 'fixed';
	zoom_slider.style.right = '80px';
	zoom_slider.style.bottom = '29px';
		
	var sm_done = 0;
	var done = document.createElement( 'button' );
	done.id = "done";
	done.style.position = 'fixed';
	done.style.right = '5px';
	done.style.bottom = '55px';
	done.style.display = 'none';
	done.textContent = 'Click me when done';
	done.addEventListener('click', function(event){
		event.preventDefault();
		
	
		done.style.display = 'none';

		var message = sand.get();
		alert("Your secret message has been saved. Now to create two random looking sandpiles.")
		
		sand.setRandom();
		sand.draw();
		
		var c1 = sand.get();
		

		
		alert("Calculating the recurrent inverse of this random sandpile. Might take a minute.")
		
		sand.rec_inverse();
		sand.draw();
		var c2 = sand.get();
			
		alert("Now we add your secret message to this new sandpile.")
		
		sand.set(sand.add(message, c2));
		sand.stabilize();
		c2 = sand.get();
		
		alert('Now adding this sandpile to the original random one will make your message appear!')
		
		var sm_load_1 = document.createElement( 'button' );
		sm_load_1.id = "sm_load_1";
		sm_load_1.style.position = 'fixed';
		sm_load_1.style.right = '5px';
		sm_load_1.style.bottom = '130px';
		sm_load_1.textContent = 'Load first random sandpile.';
		sm_load_1.style.display = 'block';
		sm_load_1.addEventListener('click', function(event){
			event.preventDefault();
			sand.set(c1);
		})
		document.body.appendChild( sm_load_1 );

		
		var sm_load_2 = document.createElement( 'button' );
		sm_load_2.id = "sm_load_2";
		sm_load_2.style.position = 'fixed';
		sm_load_2.style.right = '5px';
		sm_load_2.style.bottom = '105px';
		sm_load_2.textContent = 'Load second random sandpile.';
		sm_load_2.style.display = 'block';
		sm_load_2.addEventListener('click', function(event){
			event.preventDefault();
			sand.set(c2);
		})
		document.body.appendChild( sm_load_2 );

		
		var sm_add_1 = document.createElement( 'button' );
		sm_add_1.id = "sm_add_1";
		sm_add_1.style.position = 'fixed';
		sm_add_1.style.right = '5px';
		sm_add_1.style.bottom = '80px';
		sm_add_1.textContent = 'Add first random sandpile.';
		sm_add_1.style.display = 'block';
		sm_add_1.addEventListener('click', function(event){
			event.preventDefault();
			sand.set(sand.add(sand.get(), c1));
		})
		document.body.appendChild( sm_add_1 );

		
		var sm_add_2 = document.createElement( 'button' );
		sm_add_2.id = "sm_add_2";
		sm_add_2.style.position = 'fixed';
		sm_add_2.style.right = '5px';
		sm_add_2.style.bottom = '55px';
		sm_add_2.textContent = 'Add second random sandpile.';
		sm_add_2.style.display = 'block';
		sm_add_2.addEventListener('click', function(event){
			event.preventDefault();
			sand.set(sand.add(sand.get(), c2));
		})
		document.body.appendChild( sm_add_2 );

		
		sm_done = 1;
	}); 
	document.body.appendChild( done );
	
	
	
	
	
	
	//size_slider.style.transform = 'rotate(270deg)';	
/* 	var size_input = add_form(size_slider, "size_field", 100, "Grid size", function(){
		var n = this.value;
		console.log('size slider: ' + n);
		sand.m = n;
		sand.n = n;
		if (sand.shape_choice != 3){
			sand.set_surface(sand.shape_choice);
		} else {
			sand.set_surface(sand.shape_choice, 2);
		}
	})
 */

	
/* 	var size_slider = document.createElement('input')
	size_slider.className = 'slider';
	size_slider.type = 'range';
	size_slider.min = 1;
	size_slider.max = 10;
	size_slider.step = 1;
	size_slider.defaultValue = 1;
	size_slider.style.width = '100px';
	size_slider.style.height = '10px';
	size_slider.style.position = 'absolute';
	size_slider.style.transform = 'rotate(270deg)';
	size_slider.style.top = '100px';
	size_slider.oninput = function(){
		console.log(this.value);
		sand.set_speed(this.value, 1);
	}
	document.body.appendChild(size_slider);
	 */
	


	
	// all below is deprecated, delete eventually
	
	var toolbar = document.createElement( 'div' );
	toolbar.id = "toolbar";
	toolbar.className = 'toolbar'
	document.body.appendChild( toolbar );

	var rightside = document.createElement( 'div' );
	rightside.style.cssFloat = 'left';
	toolbar.appendChild( rightside );
	
	var top = document.createElement( 'div' );
	top.className = 'top'
	top.textContent = "Toolbox"
	toolbar.appendChild( top );
	
	var close = document.createElement( 'button' );
	close.className = 'close'
	close.textContent = "X"
	close.addEventListener('click', function(event){
		document.getElementById("toolbar").style.display = "none";
	}); 
	top.appendChild( close );
	


	
	$("#toolbar").draggable();
	//$("#toolbar").resizable();
	


/* 
	var save_div = document.createElement( 'div' );
	save_div.setAttribute('id', 'saves');
	
	var adds_div = document.createElement( 'div' );
	adds_div.setAttribute('id', 'adds');
	
	
	add_form(toolbar, "save_field", "my sandpile", 'Save state', f = function() {
		sand.save();	
		sand.user_saves += 1;
		
		var newButton = document.createElement("input");
		newButton.type = "button";
		newButton.id = sand.save_id - 1;
		newButton.value = "load " + ($("#save_field").val());		
		newButton.onclick = function(){
			sand.load(newButton.id);
		};
		document.getElementById("saves").appendChild(newButton); 
		
		var newButtonAdd = document.createElement("input");
		newButtonAdd.type = "button";
		newButtonAdd.id = sand.save_id - 1;
		newButtonAdd.value = "add " + ($("#save_field").val());		
		newButtonAdd.onclick = function(){
			sand.set(sand.add(sand.saves[newButtonAdd.id], sand.get()));
		};
		document.getElementById("adds").appendChild(newButtonAdd); 	
	});	
	toolbar.appendChild(save_div);	
	toolbar.appendChild(adds_div);
	
	var firing_vectors_div = document.createElement( 'div' );
	firing_vectors_div.setAttribute('id', 'firing_vectors');	
	add_form(toolbar, "save_firing_vector_field", "my vector", 'Save firing vector', f = function() {

		sand.save_firing_vector();
		var newButton = document.createElement("input");
		newButton.type = "button";
		newButton.id = sand.firing_vector_id - 1;
		newButton.value = "fire " + ($("#save_firing_vector_field").val());		
		newButton.onclick = function(){
			sand.fire_vector(sand.firing_vectors[newButton.id]);

		};
		document.getElementById("firing_vectors").appendChild(newButton); 
	});		
	
	toolbar.appendChild(firing_vectors_div); */
		
	add_form(toolbar, "name_field", "my sandpile", 'Download state', f = function() {
		var state = sand.get();
		download("data:text/csv;charset=utf-8," + state, $( "#name_field").val() + ".txt");
	});		
	


	
/* 	add_button(rightside, 'Add a random grain', f = function() {
		sand.set(sand.add_random(sand.get()));
		sand.draw();
	});
	
	 */
	$( "#size_field" ).val(sand.m);
	
	add_form(toolbar, "state_val", "", 'Get state', f = function() {
		$("#state_val").val(sand.get());
	});



	add_form(toolbar, "vector_val", "", 'Get firing vector', f = function() {
		var vec = sand.get_firing_vector(sand.get());
		$("#vector_val").val(vec);
		copyToClipboard(vec);
	});

/* 	add_button(rightside, 'get h, c, s', f = function() {
		var vec = sand.get_firing_vector(sand.get());
		alert([vec[(sand.m/2)*(sand.m) + (sand.m/2)], vec[0], vec[sand.m/2]]);
	});
	 */
	br(rightside);
/* 	add_button(rightside, 'Naive method', f = function() {
		var n = sand.n;
		var m = sand.m;
		if (n == m){
			sand.naive_method();
		} else {
			alert("This function not yet implemented for nonsquare grids")
		}
	});	
	
	add_button(rightside, 'Burning config method', f = function() {
		var n = sand.n;
		var m = sand.m;
		if (n == m){
			sand.burning_config_method();
		} else {
			alert("This function not yet implemented for nonsquare grids")
		}
	}); */
	
/* 
	add_button(rightside, 'Approximate k', f = function() {
		$("#fire_sink_field").val(sand.approx_k());
	}); */
	

		
/* 	add_button(rightside, 'Test if identity', f = function() {
		alert(sand.test_identity());
	}); */
		 	
/* 	add_form(toolbar, "d_field", "0", 'Approx identity with certain d', f = function() {
		var n = sand.n;
		sand.reset();		
		var t0 = performance.now();
		sand.approx_identity_alg(n, $("#d_field").val());
		sand.stabilize();
		var t1 = performance.now();
		alert("Calculation took " + (t1 - t0) + " milliseconds.")
	});	
		 */
	br(rightside);
		


	
	br(rightside);
		
	add_form(toolbar, "fire_field", "my vector", 'Fire a vector', f = function() {
		sand.fire_vector($("#fire_field").val().split(",").map(Number));
	});	
	
	add_form(toolbar, "paste_field", "my state", 'Load a state', f = function() {
		sand.set($( "#paste_field" ).val().split(",").map(Number));
		sand.draw()
	});	


	
        // make highlights box draggable
        $("#highlights").draggable();

        // make it closeable
        $("#highlights-close").click( function closeHighlights() {
	    $("#highlights").css("display","none");
        });

        // Make highlights buttons work
        $("#markonoffswitch").click(function highslightsMarkov() {sand.markov_process(10);});

        $("#dimensionswitch").click(function highslights2D3D() {sand.toggle_2D_3D();});

        $("#dropsandrow").click(function highlightsDropSand(){
          // get sand height from number field
          var n = Number($("#dropsand").val()); 
          if (typeof n !== "number"){
            n = 1;
          }
          sand.brush_height = n;

          // get whether it should set sand to a height or add sand from the switch
          var isadd = $("#droponoffswitch").prop("checked");
          if (isadd){
            sand.brush_type = 0;
          } else {
            sand.brush_type = 4;
          }
        });

        $('#ngrainsform').submit(function ngrainsformsubmit() {
          let n = Number($("#ngrains").val()); 
          if (typeof n !== "number"){
            n = 1;
          }
          // add or set n grains to each cell
          let isadd = $("#ngonoffswitch").prop("checked");
          if (isadd){ 
            sand.plus(n);
            sand.draw()
          } else {
            sand.set(sand.fullstate(n));	
          }
          return false;
        });

        $('#identityform').submit(function identityformsubmit() {
          // add or set the configuration to the identity
          let isadd = $("#idonoffswitch").prop("checked");
          if (isadd){ 
            add_identity();
          } else {
            set_identity();
          }
          return false;
        });
        $('#randomsandform').submit(function ngrainsformsubmit() {
          let n = Number($("#random").val()); 
          if (typeof n !== "number"){
            n = 1;
          }
          // add a random grain to the board n times
          for (let i = 0; i < n; i += 1){
            sand.set(sand.add_random(sand.get()));
          }
          sand.draw();
          return false;
        });
        
}
