SAND.prototype.timing = function(f){
	var t0 = performance.now();
	f();
	var t1 = performance.now();
	alert("Calculation took " + (t1 - t0) + " milliseconds.")
};

SAND.prototype.check_unstable = function() {
	w = this.statesize.x, h = this.statesize.y;
    var state = this.get();
	
	for (var i = 0; i < state.length; i = i + 4) {      
		if (state[i] > 3){
			return 1
		}
	} 
	
	return 0	
};

SAND.prototype.stabilize = function() {
 	sand.stop();

	w = this.statesize.x, h = this.statesize.y;
    var state = this.get();

	if (sand.markov){
		alert("Cannot stabilize during markov process."); 
		return 0;
	}
	
	for (var i = 0; i < w * h * 4; i = i + 4) {      
		if (state[i + 1] == 2){
			alert("Cannot stabilize when source cells are present.");
			return 0;
		}
	}
	
	var n = 0;
	while (sand.check_unstable()){
		for (var i = 0; i < 1000; i++){
			sand.step();
			n++;
		}
	}

	sand.start();
	sand.draw();
	return 1;
};

SAND.prototype.stabilize_animation_start = function() {
	if (this.stab_timer == null) {
        this.stab_timer = setInterval(function(){
			console.log(sand.check_unstable());
			sand.step();
			sand.draw();
        }, 1);
    }
    return this;
};

SAND.prototype.stabilize_animation_stop = function() {
    clearInterval(this.stab_timer);
    this.stab_timer = null;
    return this;
};

SAND.prototype.fire_sink = function(n){
    var state = this.get();
	var region = this.get_region(state);	
	var vector = new Float32Array(region.length);
	
	for (var i = 0; i < vector.length; i += 1){
		vector[i] = -n;
	}	
	
	this.fire_vector(vector);
};

SAND.prototype.fire_sink_until_id = function(){
	var newstate, oldstate;
	var counter = 0;
	var equal = 0;
	
	while(!equal){
		
		oldstate = this.get();
		
		this.fire_sink(1);	
		this.stabilize();
		//this.draw();
		
		newstate = this.get();
		
		if (!this.is_equal(newstate, oldstate)){		
			counter += 1;	
		} else {
			equal = 1;
			this.set(oldstate);
		}
		console.log(counter);

	}
	
	return counter;
}; 

SAND.prototype.test_identity = function(){
	var s1 = this.get();
	this.fire_sink(1);
	this.stabilize();
	var s2 = this.get();
	if (this.is_equal(s1, s2)){
		return 1;
	} else {
		this.set(s1);
		return 0;
	}
};

SAND.prototype.rec_inverse = function() {
	this.stop();
	this.plus(6);
	this.stabilize();
	this.dualize();
	this.plus(3);
	this.stabilize();
	this.start();
	this.draw();
};

// approximating the identity

SAND.prototype.approximate_firing_vector_identity = function(n, shape_choice) {
        // d is the diameter of the circle we're going to approximate the firing vector
        let d = n + 1;
        if (shape_choice === 1) {
            d = Math.sqrt(2) * n;
        }
	//construct firing vector
	var v = new Float32Array(n*n);
        var l = (n - 1)/2;
        // 1 is square
        if (shape_choice === 1) {
	    //first guess coefficients
            var h  = Math.round(0.1674411791810444*n*n + 0.18971510117164725*n - 2.797811919063292);
            var c  = Math.round(-0.8361720629239193 + 1.4848313882485358*Math.log(n));
            var s  = Math.round(0.791548224489514*n - 1.158817405099287);
	    var model = function(x, y) {return h + (s-h)*(x*x + y*y) + (c + h - 2*s)*((x*x)*(y*y));};

            //center and scale poly
            var p = function(x, y) {return -Math.round(model((x - l)/l, (y - l)/l));};

            for (var j = 0; j < n; j++){
                for (var i = 0; i < n; i++){
                    v[n*j + i] = p(i, j);
                }
            }


        // 2 is circle
        //} else if (shape_choice === 2) {
        } else {
            var intercept  = 0.3553 + (-0.2145)*d + 0.1275*d*d;
            var x2coef     = -0.2006987 + (-0.0258973)*d + 0.0005293*d*d;
            var model = function(x, y) {return intercept + x2coef*(x*x + y*y);};
            //center and scale poly
            var p = function(x, y) {return -Math.round(model((x+0.5)/l, (y+0.5)/l));};
            //in the fire_vector function, each element of v lines up to each element of this.get_region
            let indices = this.get_region(this.get());
            for (var i = 0; i < indices.length; i++){
                let xy = this.convert_state_index_to_coord(indices[i]); 
                v[i] = p(xy[0], xy[1]);
            }
            
        } 
	return v;
};

SAND.prototype.surface_method = function(n, shape_choice){
	this.reset();		
	v = this.approximate_firing_vector_identity(n, shape_choice);
	this.fire_vector(v);	
        // fire sink if not circle
        if (shape_choice === 1) {
	    var k = 0.01285796899499506*n*n + -0.14120481213637398*n + 3.916531993030239;	
	    this.fire_sink(k + 15);	
        }
        this.stabilize(); //this one also takes time
};

SAND.prototype.naive_method = function() {	
	this.set(sand.fullstate(6));
	this.stabilize();
	this.dualize();
	this.plus(3);
	this.stabilize();
};

SAND.prototype.approx_k = function() {	
	return Math.floor((2/3)*(Math.floor(sand.m/2)*Math.floor(sand.m/2)) + .40476*(Math.floor(sand.m/2)) + .40476/2)
};

SAND.prototype.burning_config_method = function() {	
	k = this.approx_k();
	sand.reset();		
	this.fire_sink(k)
	this.stabilize();
	this.fire_sink_until_id();
};

// this one is with choice of d for more general surface

SAND.prototype.approx_firing_vector_identity_generalized = function(n, h, c, s, d) {
	//alert([n,h,c,s,d])
	var l = (n - 1)/2
	var model = function(x, y) {return h + (s-h)*(x*x + y*y) + (c + h - 2*s - 2*d)*((x*x)*(y*y)) + d*((x*x)*(y*y*y*y) + (x*x*x*x)*(y*y));};

	//center and scale poly
	var p = function(x, y) {return Math.round(model((x - l)/l, (y - l)/l));};

	//construct firing vector
	var v = new Float32Array(n*n);
	for (var j = 0; j < n; j++){
		for (var i = 0; i < n; i++){
			v[n*j + i] = p(i, j);
		}
	}
	//alert(p(1,1))
	return v;
};

/* SAND.prototype.toggle_markov_process = function() {
	if (sand.markov == 0){
		sand.markov = 1
	} else {
		sand.markov = 0
	} 
}; */

SAND.prototype.markov_process = function(n) {
	if (sand.markov){
		sand.markov = 0;
		sand.start();
	} else {
		sand.markov = 1;
		sand.stop();
		
		sand.set(sand.add_random(sand.get()));

		var n = sand.speed.x;
		var m = sand.speed.y;
		var markov_timer = setInterval(function(){
			if (sand.markov){	
				for (var i = 0; i < n; i++){
					sand.step(); 
				}
				sand.draw();
				
				var unst = sand.check_unstable();
	/* 			if (unst == 0){
					sand.step(0);
					unst = sand.check_unstable();
				} */
				console.log(unst);
				
				if (!unst){
					sand.set(sand.add_random(sand.get()));
				}
			} else {
				clearInterval(markov_timer);
			}
        }, m);
	}
}; 

// the following are deprecated

SAND.prototype.approx_identity_old = function(n) {
	//first guess coefficients and scaling factor
	var a = 0.003923647*n + 0.478870693;
    var b = -0.643221*n  + 1.669965;
    var c = -1.145061*n    + 4.808167;
	
	//alert(a);
	//alert(b);
	//alert(c);
	
	var k = -this.approx_k();
	
	//alert(k);
	
	
	//create spanning polynomials
	var f = function(x) {return a*x*x + b*x + c;};
    var g = function(y) {return a*y*y + b*y + c;};
	var h = function(x, y) {return Math.round(f(x)*g(y)/k);};
	
	//alert(h(0,0));
	
	//construct firing vector
	var v = new Float32Array(n*n);
	for (var j = 0; j < n; j++){
		for (var i = 0; i < n; i++){
			v[n*j + i] = h(i, j);
		}
	}
	
	//console.log(v);
	return v;
};

SAND.prototype.approx_identity = function(n) {
	//first guess coefficients
	var coeffs = this.approx_coeffs(n);
	var h  = coeffs[0]
	var c  = coeffs[1]
	var s  = coeffs[2]
	
	//create firing vector
	var v = this.approx_firing_vector(n, h, c, s, 0);
	return v;
};

SAND.prototype.approx_identity_2 = function(n) {
	//first guess coefficients
	var h = -0.16573652165412933*n*n + -0.7710039875902805*n + -0.5866930171310152
    var c = 0.0014357061858030207*n*n + -0.13699963669877713*n + -1.4496706192412137
    var s = -0.0004727325274926919*n*n + -0.7596584069827825*n + -0.7816864295162682
    /* 
	alert(h);
	alert(c);
	alert(s);
	 */
    var l = (n - 1)/2
	var model = function(x, y) {return h + (s-h)*(x*x + y*y) + (c + h - 2*s)*((x*x)*(y*y));};
  
	//center and scale poly
	var p = function(x, y) {return Math.round(model((x - l)/l, (y - l)/l));};

	//construct firing vector
	var v = new Float32Array(n*n);
	for (var j = 0; j < n; j++){
		for (var i = 0; i < n; i++){
			v[n*j + i] = p(i, j);
		}
	}
	//console.log(v);
	return v;
};

SAND.prototype.approx_identity_3 = function(n, d) {
	//first guess coefficients
	
	var coeffs = this.approx_coeffs(n);
	var h  = coeffs[0]
	var c  = coeffs[1]
	var s  = coeffs[2]
	
	/* var h = -0.16573652165412933*n*n + -0.7710039875902805*n + -0.5866930171310152
    var c = 0.0014357061858030207*n*n + -0.13699963669877713*n + -1.4496706192412137
    var s = -0.0004727325274926919*n*n + -0.7596584069827825*n + -0.7816864295162682
 */
    var l = (n - 1)/2
	var model = function(x, y) {return h + (s-h)*(x*x + y*y) + (c + h - 2*s - 2*d)*((x*x)*(y*y)) + d*((x*x)*(y*y*y*y) + (x*x*x*x)*(y*y));};
  
	//center and scale poly
	var p = function(x, y) {return Math.round(model((x - l)/l, (y - l)/l));};

	//construct firing vector
	var v = new Float32Array(n*n);
	for (var j = 0; j < n; j++){
		for (var i = 0; i < n; i++){
			v[n*j + i] = p(i, j);
		}
	}
	//console.log(v);
	return v;
};


SAND.prototype.approx_coeffs = function(n){
	var h = -0.16573652165412933*n*n + -0.7710039875902805*n + -0.5866930171310152
    var c = 0.0014357061858030207*n*n + -0.13699963669877713*n + -1.4496706192412137
    var s = -0.0004727325274926919*n*n + -0.7596584069827825*n + -0.7816864295162682
	return [h, c, s];
};


SAND.prototype.markov_approximation = function(target) {
/* 	//if n is zero iterate until done
	if (n == 0) {
		var d; 
		while(d != 0){
			d = sand.markov_approximation(1, target);	
		}		
	} else {	 */
	
	//get state		
	var gl = this.gl, w = this.statesize.x, h = this.statesize.y;
	var init_state = this.get();

	//compare with target
	var d1 = sand.distance(init_state, target);
	
	//add a random grain
	var new_state = this.get();
	this.set(this.add_random(new_state));
	
	//while(!sand.check_stable()){sand.step();};
	//this.pause_markov_approximation();

	this.stabilize();//still not sure whats going wrong here, if anything
/* 	for(var i = 0; i < 1000; i++){
		this.step();
		this.draw();
	}
 */
	
	//compare with target
	var d2 = sand.distance(new_state, target);

/* 	alert(d1);
	alert(d2); */

	//if further, return to initial state
	if (d2 > d1) {
		this.set(init_state); 
		/* this.setFull(4); */alert(d1);alert(d2);
	}
 
	//display the state
	sand.draw();
		
	return sand.distance(this.get(), target);
};

SAND.prototype.start_markov_approximation = function(target, n) {
	sand.toggle();
	if (this.markov_timer == null) {
        this.markov_timer = setInterval(function(){
			for (var i = 0; i < n; i++) {
				if (sand.markov_approximation(target) == 0){
					sand.pause_markov_approximation();
				}	
				//sand.draw();	
			}
			
		}, 1);
    }
	sand.toggle();
};

SAND.prototype.pause_markov_approximation = function() {
	clearInterval(this.markov_timer);
    this.markov_timer = null;
};

/**
 * This will report the times it takes to compute the identity with
 * the surface method and the naive method, respectively
 * it will do it how ever many times you ask and send you the average time for each
 */
SAND.prototype.time_id_methods = function(times_to_test) {
    let nai_time_sum = 0;
    let sur_time_sum = 0;
    for (let i = 0; i < times_to_test; i++) {
        // naive method
        var nai_start = new Date();
        this.naive_method();
        var nai_finish = new Date();
        var nai_time = new Date();
        nai_time.setTime(nai_finish.getTime() - nai_start.getTime());

        // reset
        this.reset();

        // surface method
        var sur_start = new Date();
        this.surface_method(this.m, this.shape_choice);
        var sur_finish = new Date();
        var sur_time = new Date();
        sur_time.setTime(sur_finish.getTime() - sur_start.getTime());
        
        nai_time_sum += nai_time.getMilliseconds();
        sur_time_sum += sur_time.getMilliseconds();
    }

    this.save_identity(); //why not?
    this.draw();

    return [sur_time_sum / times_to_test, nai_time_sum / times_to_test];
};
