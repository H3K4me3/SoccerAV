
class Pitch {

    constructor() {
        //this._width = 120 * 5;
        //this._height = 80 * 5;
        this._height = 120 * 5;
        this._width = 80 * 5;
        this._orientation = "vertical"; // "horizontal"

        //this._margin = {left: 30, right: 30, top: 30, bottom: 30};
        this._margin = {left: 30, right: 30, top: 30, bottom: 30};
        //this._dataurl = "/rawdata/data/";
        //this._match_id = 7586;
        this._selection = "body";

        this._events = Promise.resolve([]);
        this._lineup = Promise.resolve([]);
        this._drawtype = "passlocs"; // "passpaths", "players"

        this._timerange = [-1, Infinity];

        // Selected player
        this._selplayer = null;

        // Time vis settings
        this._tv_width = 600;
        this._tv_height = 200;
        this._tv_margin = {left: 30, right: 30, top: 30, bottom: 30};
    }
    orientation(ori, [width, height]) {
        if (ori !== "vertical" && ori !== "horizontal")
            throw Error("invalid argument");
        this._orientation = ori;
        if (width)
            this._width = width;
        if (height)
            this._height = height;
        return this;
    }
    selection(dom) {
        this._selection = dom;
        return this;
    }
    match_id(id) {

        if (this._match_id === id)
            return this;

        this._match_id = id;
        let dataurl = "../rawdata/data/";
        let events = d3.json(dataurl + "events/" + id + ".json");
        let lineup = d3.json(dataurl + "lineups/" + id + ".json");
        this._events = events;
        this._lineup = lineup;

        // Also reset the selected player
        this.selplayer(null);

        return this;
    }
    selplayer(id) {
        this._selplayer = id;
        return this;
    }
    drawtype(type) {
        this._drawtype = type;
        return this;
    }

    match_selector(dom) {
        this._match_selector = dom;
        return this;
    }
    match_selector_load() {
        // This function return a promise as handle
        let _this = this;
        let matches = d3.json("../rawdata/data/matches/43.json");
        let match_selector = d3.select(this._match_selector);

        match_selector.on("change", function() {
            _this.draw();
        });

        let ans = matches.then(function(matches) {
            match_selector.selectAll("option")
                .data(matches)
                .enter()
                .append("option")
                .text(d => d.home_team.home_team_name + " vs " + d.away_team.away_team_name)
                .attr("value", d => d.match_id);
            //let sel_value = match_selector.node().value;
            //_this.match_id(sel_value);
            //_this.draw();
        })
            .catch(err => console.log(err));

        // Return a promise
        return ans;
    }

    //time_slider(div) {
    //    let _this = this;
    //    let dom = d3.select(div).node();
    //    let slider = noUiSlider.create(dom, {
    //        start: [0, 2700], // FIXME: initial slider range
    //        connect: true,
    //        behaviour: "drag-tap-hover",
    //        range: {'min': 0, 'max': 5400}, // FIXME: initial extent of slider
    //        tooltips: [{to: d => String(Math.floor(d/60)) + ":" + String(Math.round(d % 60))},
    //                   {to: d => String(Math.floor(d/60)) + ":" + String(Math.round(d % 60))}]
    //    });
    //    slider.on("slide", function() {
    //        //let timerange = slider.get().map(Number.parseFloat);
    //        //_this.timerange(timerange);
    //        _this.draw();
    //    });
    //    this._time_slider = slider;
    //    return this;
    //}
    //time_slider_update() {
    //    // Update the range of the slider
    //    // It returns a promise as handle
    //    let _this = this;

    //    if (!this._time_slider) {
    //        console.error("Time slider has not been loaded");
    //    }
    //    let slider = this._time_slider;

    //    // We need the events data to figure out the actual time range
    //    let ans = this._events.then(function(events) {
    //        let last_event = events[events.length-1];
    //        let max_time = last_event.minute * 60 + last_event.second;
    //        slider.updateOptions({
    //            range: {'min': 0, 'max': max_time},
    //        });
    //        return _this;
    //    })
    //        .catch(err => console.log(err));

    //    // Return a promise as handle
    //    return ans;
    //}
    timevis(div) {
        let _this = this;
        let timevisdiv = d3.select(div);
        if (!timevisdiv.nodes().length)
            console.error("The div does not exists");

        // Variables
        let tv_width = this._tv_width;
        let tv_height = this._tv_height;
        let tv_margin = this._tv_margin;

        timevisdiv.selectAll("svg").data([0])
            .enter()
            .append("svg")
            .merge(timevisdiv)
            .attr("width", tv_width + tv_margin.left + tv_margin.right)
            .attr("height", tv_height + tv_margin.top + tv_margin.bottom);

        this._timevis = timevisdiv.select("svg");

        return this;
    }
    timevis_update() {
        // Variables
        const _this = this;
        const tv_width = this._tv_width;
        const tv_height = this._tv_height;
        const tv_margin = this._tv_margin;

        const y_middleline = tv_margin.top + (tv_height / 2);
        const d_middle = 30;

        // timevis
        const timevis = this._timevis;

        // Scales
        const tv_scaleX = d3.scaleLinear().range([tv_margin.left, tv_margin.left + tv_width]);
        const tv_scaleY_t1 = d3.scaleLinear()
            .range([y_middleline - d_middle, tv_margin.top])
            .domain([0, 0.0015]);
        const tv_scaleY_t2 = d3.scaleLinear()
            .range([y_middleline + d_middle, tv_margin.top + tv_height])
            .domain([0, 0.0015]);

        // Load data
        let ans = Promise.all([this._events, this._lineup]).then(function([events, lineup]) {
            const get_seconds = function(event) {
                return event.minute * 60 + event.second;
            };

            // Set X axis scale domain
            tv_scaleX.domain([0, get_seconds(events.slice(-1)[0])]);

            // Color Scale
            const scaleTeamColor = d3.scaleOrdinal()
                .domain(lineup.map(d => d.team_id))
                .range(["#edebbd", "#85d8e9"]);

            const kernelDensityEstimator = function(k, X) {
                // Refer: https://bl.ocks.org/mbostock/4341954
                function kernelEpanechnikov(k) {
                    return function(v) {
                        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
                    };
                }
                let kernel = kernelEpanechnikov(k);
                return function(V) {
                    return X.map(function(x) {
                        return [x, d3.mean(V, function(v) { return kernel(x - v); })];
                    });
                };
            };

            // FIXME: Include other types of events
            const pass_events = events.filter(d => d.type.name === "Pass");

            const pass_events1 = pass_events.filter(d => d.team.id === lineup[0].team_id);
            const pass_events2 = pass_events.filter(d => d.team.id === lineup[1].team_id);

            // TODO: adjust the options
            const kde_es = kernelDensityEstimator(7, tv_scaleX.ticks(300));

            const density1 = kde_es(pass_events1.map(get_seconds));
            const density2 = kde_es(pass_events2.map(get_seconds));

            const passfreq_t1 = timevis.selectAll("path.passfreq_t1")
                  .data([density1]);
            const passfreq_t2 = timevis.selectAll("path.passfreq_t2")
                  .data([density2]);

            passfreq_t1.enter()
                .append("path")
                .attr("class", "passfreq_t1")

                .merge(passfreq_t1)
                .attr("stroke", "#edebbd")
                .attr("fill", "#edebbd")
                .attr("stroke-width", 1)
                .attr("stroke-linejoin", "round")
                .attr("d", d3.area()
                      .curve(d3.curveBasis)
                      .x(d => tv_scaleX(d[0]))
                      .y1(d => tv_scaleY_t1(d[1]))
                      .y0(y_middleline - d_middle));

            passfreq_t2.enter()
                .append("path")
                .attr("class", "passfreq_t2")

                .merge(passfreq_t2)
                .attr("stroke", "#85d8e9")
                .attr("fill", "#85d8e9")
                .attr("stroke-width", 1)
                .attr("stroke-linejoin", "round")
                .attr("d", d3.area()
                      .curve(d3.curveBasis)
                      .x(d => tv_scaleX(d[0]))
                      .y1(d => tv_scaleY_t2(d[1]))
                      .y0(y_middleline + d_middle));


            // Possession
            let possession = []; {
                let maxtime = get_seconds(events.slice(-1)[0]);
                let last_poss;
                let last_time;
                events.forEach((d, i, array) => {
                    let current_poss = d.possession_team.id;
                    let current_time = get_seconds(d);

                    if (current_poss === undefined) {
                        // Should not happen
                        console.error("current_poss is undefined");
                        return;
                    }

                    if (last_poss === undefined) {
                        last_poss = current_poss;
                        last_time = current_time;
                        return;
                    }
                    if (last_poss === current_poss) {
                        // If not last iteration, return
                        if (i !== array.length - 1)
                            return;
                    }
                    possession.push({start: last_time, end: current_time, possession: last_poss});
                    last_poss = current_poss;
                    last_time = current_time;
                    return;
                });
                // May not be necessary?
                possession = possession.filter(d => d.start !== d.end);
            };

            // Draw possession rects
            const padding_middle = 15;
            const rect_height = 11;
            const scaleRectY = d3.scaleOrdinal()
                  .domain(lineup.map(d => d.team_id))
                  .range([y_middleline - padding_middle - rect_height, y_middleline + padding_middle]);

            let possG = timevis.selectAll("g.possession")
                  .data([_this._match_id], d => d);
            possG.exit().remove();
            possG.enter()
                .append("g")
                .attr("class", "possession")
                // There is no need to update the rects for one match,
                // so we just use enter selection.
                .selectAll("rect.possession")
                .data(possession)
                .enter()
                .append("rect")
                .attr("class", "possession")
                .attr("x", d => tv_scaleX(d.start))
                .attr("y", d => scaleRectY(d.possession))
                .attr("width", d => tv_scaleX(d.end) - tv_scaleX(d.start))
                .attr("height", rect_height)
                .attr("stroke", "blue")
                .attr("fill", d => scaleTeamColor(d.possession));

            // Draw shot and goals
            const shot_events = events.filter(d => d.type.name === "Shot");
            const is_goal = function(event) {
                return event.shot.outcome.name === "Goal";
            };
            const starsymbol = d3.symbol().type(d3.symbolStar);

            const scaleStarY = d3.scaleOrdinal()
                .domain(lineup.map(d => d.team_id))
                .range([y_middleline - d_middle, y_middleline + d_middle]);
            let shotsG = timevis.selectAll("g.shots")
                .data([_this._match_id], d => d);
            shotsG.exit().remove();
            shotsG.enter()
                .append("g")
                .attr("class", "shots")
                .selectAll("path.shot")
                .data(shot_events)
                .enter()
                .append("path")
                .attr("class", "shot")
                .attr("d", d => {
                    if (is_goal(d))
                        return starsymbol.size(100)(d);
                    else
                        return starsymbol.size(45)(d);
                })
                .attr("fill", d => {
                    if (is_goal(d))
                        return "yellow";
                    else
                        return "none";
                })
                .attr("stroke", d => {
                    if (is_goal(d))
                        return "yellow";
                    else
                        return "blue";
                })
                .attr("transform", d => {
                    let x = tv_scaleX(get_seconds(d));
                    let y = scaleStarY(d.team.id);
                    return `translate(${x}, ${y})`;
                });

            // Draw axis
            let xaxis = timevis.selectAll("g.xaxis")
                .data([_this._match_id], d => d);
            xaxis.enter()
                .append("g")
                .attr("class", "xaxis")
                .attr("transform", `translate(0, ${y_middleline})`)
                .call(d3.axisBottom(tv_scaleX)
                      .tickFormat(d => Math.round(d/60) + "m")
                      .tickSize(-3)
                      .tickValues([15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165].map(d => d * 60)));
            xaxis.exit()
                .remove();


            // Brush
            const onbrush = function(d, i) {
                const pitch = _this;
                const brush = d3.brushSelection(this);
                if (brush === null) {
                    // TODO
                    pitch._timerange = [-1, Infinity];
                    pitch.draw();
                    return;
                }
                const start = tv_scaleX.invert(brush[0]);
                const end   = tv_scaleX.invert(brush[1]);
                pitch._timerange = [start, end];
                pitch.draw();
            };
            const brushG = timevis.selectAll("g.brush")
                  .data([_this._match_id], d => d);
            brushG
                .enter()
                .append("g")
                .attr("class", "brush")
                .call(d3.brushX()
                      .extent([[tv_margin.left, tv_margin.top],
                               [tv_margin.left + tv_width, tv_margin.top + tv_height]])
                      .on("brush", onbrush)
                      .on("end", onbrush));
            brushG.exit().remove();

        });

        return ans;
    }
    timerange(range) {
        this._timerange = range;
        return this;
    }
    scaledPitchXGen() {
        let width = this._width;
        let height = this._height;
        let scalePitchX;
        if (this._orientation === "vertical") {
            scalePitchX = d3.scaleLinear().domain([0, 80]).range([width, 0]);
            return function(loc) {
                return scalePitchX(loc[1]);
            };
        }
        else if (this._orientation === "horizontal") {
            scalePitchX = d3.scaleLinear().domain([0, 120]).range([0, width]);
            return function(loc) {
                return scalePitchX(loc[0]);
            };
        }
        else
            throw Error();
    }
    scaledPitchYGen() {
        let width = this._width;
        let height = this._height;
        let scalePitchY;
        if (this._orientation === "vertical") {
            scalePitchY = d3.scaleLinear().domain([0, 120]).range([height, 0]);
            return function(loc) {
                return scalePitchY(loc[0]);
            };
        }
        else if (this._orientation === "horizontal") {
            scalePitchY = d3.scaleLinear().domain([0, 80]).range([height, 0]);
            return function(loc) {
                return scalePitchY(loc[1]);
            };
        }
        else
            throw Error();
    }
    draw_pitch() {

        // Variables
        let width = this._width;
        let height = this._height;
        let margin = this._margin;

        let div = d3.select(this._selection);

        function pitch_template(div, width, height, margin) {

            //var wrapper = main.append('div')
				    //    .attr('id', 'wrapper');
            //var header = wrapper.append('header');
            //var title = header.append('text')
		        //    .text("Soccer Space");

            //var columnLeft = wrapper.append('div')
					  //    .attr('class', 'column')
					  //    .attr('id', 'columnLeft');

            // The svg element
            let innerField = div.append("svg")
                .attr("class", "innerField")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

            // Calculate ratio
            let ratio = width/80;
            if (Math.abs(ratio - height/120) > 0.01) {
                console.error("width and height is not consistent",
                              "ratio = " + ratio,
                              "width = " + width,
                              "height = " + height,
                              "Math.abs(ratio - height/120) = " + Math.abs(ratio - height/120));
            }

            innerField.append('rect')
		            .attr('class', 'innerSketch')
		            .attr('x', margin.left + 36.34*ratio)
		            .attr('y', 3.56*ratio)
		            .attr('width', 7.32*ratio)
		            .attr('height', 2.44*ratio);
            
            innerField.append('rect')
		            .attr('class', 'innerSketch')
		            .attr('x', margin.left + 36.34*ratio)
		            .attr('y', 126*ratio)
		            .attr('width', 7.32*ratio)
		            .attr('height', 2.44*ratio);

            // The real soccer field
            innerField.append('rect')
		            .attr('class', 'innerSketch')
		            .attr('id', 'border')
		            .attr('x', margin.left + 0)
		            .attr('y', 6*ratio)
		            .attr('width', 80*ratio)
		            .attr('height', 120*ratio);
            
            innerField.append('line')
		            .attr('class', 'innerSketch')
		            .attr('x1', margin.left + 0)
		            .attr('y1', 66*ratio)
		            .attr('x2', margin.left + 80*ratio)
		            .attr('y2', 66*ratio);
            
            innerField.append('circle')
		            .attr('class', 'innerSketch')
		            .attr('cx', margin.left + 40*ratio)
		            .attr('cy', 66*ratio)
		            .attr('r', 10*ratio);
            
            innerField.append('rect')
		            .attr('class', 'innerSketch')
		            .attr('x', margin.left + 18*ratio)
		            .attr('y', 6*ratio)
		            .attr('width', 44*ratio)
		            .attr('height', 18*ratio);
            
            innerField.append('rect')
		            .attr('class', 'innerSketch')
		            .attr('x', margin.left + 18*ratio)
		            .attr('y', 108*ratio)
		            .attr('width', 44*ratio)
		            .attr('height', 18*ratio);
            
            
            innerField.append('rect')
		            .attr('class', 'innerSketch')
		            .attr('x', margin.left + 30*ratio)
		            .attr('y', 6*ratio)
		            .attr('width', 20*ratio)
		            .attr('height', 6*ratio);
            
            innerField.append('rect')
		            .attr('class', 'innerSketch')
		            .attr('x', margin.left + 30*ratio)
		            .attr('y', 120*ratio)
		            .attr('width', 20*ratio)
		            .attr('height', 6*ratio);
            
            innerField.append('circle')
		            .attr('class', 'dots')
		            .attr('cx', margin.left + 40*ratio)
		            .attr('cy', 66*ratio)
		            .attr('r', 0.5*ratio);
            
            innerField.append('circle')
		            .attr('class', 'dots')
		            .attr('cx', margin.left + 40*ratio)
		            .attr('cy', 17*ratio)
		            .attr('r', 0.5*ratio);
            
            innerField.append('circle')
		            .attr('class', 'dots')
		            .attr('cx', margin.left + 40*ratio)
		            .attr('cy', 115*ratio)
		            .attr('r', 0.5*ratio);
            
            //draw angles
            function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
	              var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
		            return {
				            x: centerX + (radius * Math.cos(angleInRadians)),
				            y: centerY + (radius * Math.sin(angleInRadians))
				        };
            }
            
            function describeArc(x, y, radius, startAngle, endAngle){
                var x = margin.left + x;
	              var start = polarToCartesian(x, y, radius, endAngle);
	              var end = polarToCartesian(x, y, radius, startAngle);
	              var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
		            if (endAngle == 45 ||endAngle == 225){
					          var d = [
					              "M", start.x, start.y, 
					              "A", radius, radius, 0, arcSweep, 0, end.x, end.y,
					              "L", start.x, start.y
					          ].join(" ");
					      }else{
						        var d = [
					              "M", start.x, start.y, 
					              "A", radius, radius, 0, arcSweep, 0, end.x, end.y,
					              "L", x,y,
					              "L", start.x, start.y
					          ].join(" ");
                    
					      }
				        return d;       
            }
            
            var arc = [describeArc(0, 6*ratio, ratio, 90, 180),
			                 describeArc(0, 126*ratio, ratio, 0, 90),
			                 describeArc(80*ratio, 6*ratio, ratio, 180, 270),
			                 describeArc(80*ratio, 126*ratio, ratio, 270, 360),
			                 describeArc(40*ratio, 17*ratio, 10*ratio, 135, 225),
			                 describeArc(40*ratio, 115*ratio, 10*ratio, -45, 45),
			                ];
            
            for (var i=0; i < arc.length; i++){
		            innerField.append('path')
				            .attr('class', 'innerSketch')
				            .attr('d', arc[i]);
				    }
        }

        pitch_template(div, width, height, margin);

        // // Append svg to the div
        // let svg = d3.select(this._selection).selectAll("svg").data([0]);
        // let svgenter = svg.enter().append("svg")
        //     .attr("width", width + margin.left + margin.right)
        //     .attr("height", height + margin.top + margin.bottom);

        // // Draw the pitch
        // svgenter.append("rect")
        //     .attr("width", width + margin.left + margin.right)
        //     .attr("height", height + margin.top + margin.bottom)
        //     .style("fill", "grey");
        // svgenter.append("rect")
        //     .attr("x", margin.left)
        //     .attr("y", margin.top)
        //     .attr("width", width)
        //     .attr("height", height)
        //     .style("fill", d3.schemeAccent[0]);

        return this;
    }
    async draw() {
        let _this = this;

        if (this._not_first_draw) {
            console.log("INFO:", "Draw", this._selection);
            // Set the match id if we have the match selector
            if (this._match_selector) {
                let match_selector = d3.select(this._match_selector);
                let sel_value = match_selector.node().value;
                _this.match_id(sel_value);
            }
            //if (this._time_slider) {
            //    // Update the slider range according to the match id
            //    await _this.time_slider_update();
            //    // Set the time range according to the slider
            //    let slider = this._time_slider;
            //    let timerange = slider.get().map(Number.parseFloat);
            //    _this.timerange(timerange);
            //}
            if (this._timevis) {
                await _this.timevis_update();
            }

            if (this._drawtype === "passlocs")
                this.draw_passlocs();
            if (this._drawtype === "passpaths")
                this.draw_passpaths();
            if (this._drawtype === "players")
                this.draw_players();
            return this;
        }

        // --------- If this is the first draw --------------- //

        console.log("INFO:", "Init", this._selection);
        // Draw the pitch
        this.draw_pitch();

        // If we have bound a match selector
        if (this._match_selector) {
            // Load the match selector
            await _this.match_selector_load();
            // Set the match id according to the initial option,
            // which is needed to update the slider range
            let match_selector = d3.select(this._match_selector);
            let sel_value = match_selector.node().value;
            _this.match_id(sel_value);
        }
        //if (this._time_slider) {
        //    // Update the slider range according to the match id
        //    await _this.time_slider_update();
        //    // Set the time range according to the slider
        //    let slider = this._time_slider;
        //    let timerange = slider.get().map(Number.parseFloat);
        //    await _this.timerange(timerange);
        //}
        if (this._timevis) {
            await _this.timevis_update();
        }

        // Enter the other block and draw it
        this._not_first_draw = true;
        _this.draw();

        return this;
    }

    draw_players() {
        // Variables
        let width = this._width;
        let height = this._height;
        let margin = this._margin;
        let svg = d3.select(this._selection).select("svg");
        let _this = this;

        const allevents = this._events;
        const lineup = this._lineup;

        Promise.all([allevents, lineup]).then(function([allevents, lineup]) {
            //================  Data processing  ==================//

            // All types of events
            const allevents_avl = allevents.filter(d => {
                // Filter by time range
                let time = d.minute * 60 + d.second;
                return time >= d3.min(_this._timerange) && time <= d3.max(_this._timerange);
            });

            // Pass events with a recipient (will be further filtered later)
            let pass_events = allevents_avl.filter(d => {
                if (d.type.name === "Pass") {
                    if (d.pass.recipient !== undefined)
                        return true;
                }
                return false;
            });

            // Shot events
            const shot_events = allevents_avl.filter(d => {
                if (d.type.name === "Shot")
                    return true;
                return false;
            });

            // Player locations
            let players = pass_events.reduce(function(players, event) {
                let player_id = event.player.id;
                players[player_id] = players[player_id] || {
                    "id": player_id,
                    "name": event.player.name,
                    "team_id": event.team.id,
                    "locs": []
                };
                players[player_id].locs.push(event.location);
                return players;
            }, Object.create(null));

            // Convert to array
            players = Object.values(players);

            // Calculate avg locations
            players.forEach(player => {
                player.avg_loc = [
                    d3.mean(player.locs, d => d[0]),
                    d3.mean(player.locs, d => d[1])
                ];
            });

            // Player Set in the time range
            let players_set = new Set(players.map(d => d.id));

            // Only use pass events with a recipient that exists in that time range to
            // draw the links.
            pass_events = pass_events.filter(d => players_set.has(d.pass.recipient.id));


            //================  Add Groups       ==================//

            // Links Group
            let linksG = svg.selectAll("g.links").data([0]);
            linksG.enter()
                .append("g")
                .attr("class", "links")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            linksG = svg.selectAll("g.links");

            // Players Group
            let playersG = svg.selectAll("g.players").data([0]);
            playersG.enter()
                .append("g")
                .attr("class", "players")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            playersG = svg.selectAll("g.players");

            const scalePitchX = _this.scaledPitchXGen();
            const scalePitchY = _this.scaledPitchYGen();
            const scaleTeamColor = d3.scaleOrdinal()
                .domain(lineup.map(d => d.team_id))
                .range(["#edebbd", "#85d8e9"]);

            draw_linksL();
            draw_playersL();


            function draw_linksL() {
                // Utils
                const is_pass_success = function(event) {
                    return event.pass.outcome === undefined;
                };

                let paths = linksG.selectAll("path.pass_path").data(pass_events, d => d.id);
                paths.exit().remove();
                paths.enter()
                    .append("path")
                    .attr("class", "pass_path")
                    .attr("stroke", d => {
                        return scaleTeamColor(d.team.id);
                    })
                    .attr("fill", "none")
                    .attr("stroke-width", 1.5)
                    .attr("stroke-opacity", 0.8)

                    .merge(paths)
                    .transition()
                    .duration(100)
                    .attr("d", d => {
                        let x = scalePitchX(d.location);
                        let y = scalePitchY(d.location);
                        let xend = scalePitchX(d.pass.end_location);
                        let yend = scalePitchY(d.pass.end_location);

                        let playerloc = players.find(p => p.id == d.player.id).avg_loc;
                        let reciploc  = players.find(p => p.id == d.pass.recipient.id).avg_loc;

                        let dist = Math.pow((Math.pow((yend-y),2) + Math.pow((xend-x),2)), 0.5);
                        let player_avgdist = Math.pow((Math.pow((playerloc[0]-reciploc[0]),2) +
                                                       Math.pow((playerloc[1]-reciploc[1]),2)), 0.5);

                        let r = player_avgdist * (40 / (dist / player_avgdist)); // FIXME

                        let player_x = scalePitchX(playerloc);
                        let player_y = scalePitchY(playerloc);

                        let recip_x = scalePitchX(reciploc);
                        let recip_y = scalePitchY(reciploc);

                        let ans = `M${player_x},${player_y}A${r},${r} 0 0,1 ${recip_x},${recip_y}`;
                        return ans;
                    });
                paths.exit().remove();
            }

            function draw_playersL() {

                let scaleColor = d3.scaleOrdinal()
                    .domain(lineup.map(d => d.team_id))
                    .range(["#edebbd", "#85d8e9"]);

                let scaleR = d3.scaleSqrt()
                // FIXME: choose a constant domain and range
                //.domain(d3.extent(players, d => d.locs.length))
                    .domain([0, 30])
                    .range([1, 40]);

                // Draw locations
                let player_locs = playersG
                    .selectAll("circle.player_loc")
                    .data(players, d => d.id);

                player_locs
                    .enter()
                    .append("circle")
                    .attr("class", "player_loc")
                    .attr("cx", d => scalePitchX(d.avg_loc))
                    .attr("cy", d => scalePitchY(d.avg_loc))
                    .attr("opacity", d => {
                        return 0.8;
                    })
                    .on('click', function(d) {
                        let this_playerid = d3.select(this).datum().id;
                        let cur_selplayer = _this._selplayer;
                        if (cur_selplayer === null) {
                            _this.selplayer(this_playerid);
                        }
                        else if (cur_selplayer === this_playerid) {
                            _this.selplayer(null);
                        }
                        else {
                            _this.selplayer(this_playerid);
                        }
                        _this.draw();
                    })
                    //.on('mouseover',function(d) {
                    //    let this_playerid = d3.select(this).datum().id;

                    //    // The recipient_players to highlight
                    //    let recipient_players = new Set();
                    //    events_with_rec.forEach(event => {
                    //        //console.log(event);
                    //        if (event.player.id === this_playerid)
                    //            recipient_players.add(event.pass.recipient.id);
                    //    });

                    //    // Add classes to circle
                    //    playersL
                    //        .selectAll("circle.player_loc")
                    //        .classed("unhovered", true);
                    //    d3.select(this)
                    //        .classed("unhovered", false)
                    //        .classed("hovered", true);
                    //    playersL
                    //        .selectAll("circle.player_loc")
                    //        .filter(function(d) {
                    //            return recipient_players.has(d.id);
                    //        })
                    //        .classed("unhovered", false)
                    //        .classed("hovered", true);
                    //    // Add classes to text
                    //    playersL.selectAll("text.player_name")
                    //        .classed("unhovered", true)
                    //        .filter(d => d.id === this_playerid)
                    //        .classed("unhovered", false)
                    //        .classed("hovered", true);
                    //    playersL
                    //        .selectAll("text.player_name")
                    //        .filter(function(d) {
                    //            return recipient_players.has(d.id);
                    //        })
                    //        .classed("unhovered", false)
                    //        .classed("hovered", true);
                    //    // Add classes to links
                    //    let links = linksL.selectAll("path.pass_path").classed("unhovered", true);
                    //    links.filter(d => d.player.id === this_playerid)
                    //        .classed("unhovered", false)
                    //        .classed("hovered", true);
                    //})
                    //.on('mouseout',function (d) {
                    //    // Remove classes
                    //    playersL.selectAll("circle.player_loc")
                    //        .classed("unhovered", false)
                    //        .classed("hovered", false);
                    //    playersL.selectAll("text.player_name")
                    //        .classed("unhovered", false)
                    //        .classed("hovered", false);

                    //    linksL.selectAll("path.pass_path")
                    //        .classed("unhovered", false)
                    //        .classed("hovered", false);
                    //})

                    .merge(player_locs)
                    .transition()
                    .duration(100)
                    .attr("r", d => scaleR(d.locs.length))
                    .attr("cx", d => scalePitchX(d.avg_loc))
                    .attr("cy", d => scalePitchY(d.avg_loc))
                    .attr("fill", d => scaleColor(d.team_id));
                player_locs
                    .exit()
                    .remove();

                // Add player names
                let player_names = playersG.selectAll("text.player_name").data(players, d => d.id);
                player_names
                    .enter()
                    .append("text")
                    .attr("class", "player_name")
                    .attr("x", d => scalePitchX(d.avg_loc))
                    .attr("y", d => scalePitchY(d.avg_loc))
                    .text(d => d.name.split(" ").slice(-1)[0])

                    .merge(player_names)
                    .transition()
                    .duration(100)
                    .attr("x", d => scalePitchX(d.avg_loc))
                    .attr("y", d => scalePitchY(d.avg_loc));
                player_names
                    .exit()
                    .remove();
            }

        })
            .catch(err => console.log(err));
    }

    draw_passpaths() {
        // Variables
        let width = this._width;
        let height = this._height;
        let margin = this._margin;
        let svg = d3.select(this._selection).select("svg");
        let _this = this;

        // Data processing
        let events = this._events
          // Filter by time range
            .then(events => events.filter(d => {
                let time = d.minute * 60 + d.second;
                return time >= d3.min(_this._timerange) && time <= d3.max(_this._timerange);
            }))
          // FIXME: include other types of events that have location information
            .then(events => events.filter(d => d.type.name === "Pass"));
        let lineup = this._lineup;

        // Draw the pass locations
        Promise.all([events, lineup]).then(function([events, lineup]) {
            // Data driven layer
            let ddlayer = svg
                .selectAll("g.ddlayer")
                .data(["pass_paths"], d => d);
            ddlayer
                .enter()
                .append("g")
                .attr("class", "ddlayer")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            ddlayer
                .exit()
                .remove();
            ddlayer = svg.selectAll("g.ddlayer");

            let scalePitchX = _this.scaledPitchXGen();
            let scalePitchY = _this.scaledPitchYGen();

            let scaleColor = d3.scaleOrdinal()
                .domain(lineup.map(d => d.team_id))
                .range(["red", "yellow"]);

            // Draw start locations
            let pass_locs = ddlayer
                .selectAll("circle.path_start")
                .data(events, d => d.id);

            pass_locs
                .enter()
                .append("circle")
                .attr("class", "path_start")
                .attr("r", 2)
                .attr("cx", d => scalePitchX(d.location))
                .attr("cy", d => scalePitchY(d.location))
                .attr("fill", d => scaleColor(d.team.id));
            pass_locs
                .exit()
                .remove();

            // Draw pass paths
            let pass_paths = ddlayer
                .selectAll("line.pass_paths")
                .data(events, d => d.id);

            pass_paths
                .enter()
                .append("line")
                .attr("class", "pass_paths")
                .attr("x1", d => scalePitchX(d.location))
                .attr("y1", d => scalePitchY(d.location))
                .attr("x2", d => scalePitchX(d.pass.end_location))
                .attr("y2", d => scalePitchY(d.pass.end_location))
                .attr("stroke", d => scaleColor(d.team.id));
            pass_paths
                .exit()
                .remove();
            return this;
        })
            .catch(err => console.log(err));

    }

    draw_passlocs() {
        // Variables
        let width = this._width;
        let height = this._height;
        let margin = this._margin;
        let svg = d3.select(this._selection).select("svg");
        let _this = this;

        // Data processing
        let events = this._events
          // Filter by time range
            .then(events => events.filter(d => {
                let time = d.minute * 60 + d.second;
                return time >= d3.min(_this._timerange) && time <= d3.max(_this._timerange);
            }))
          // FIXME: include other types of events that have location information
            .then(events => events.filter(d => d.type.name === "Pass"));
        let lineup = this._lineup;

        // Draw the pass locations
        Promise.all([events, lineup]).then(function([events, lineup]) {
            // Data driven layer
            // Also remove other layers with ddlayer class
            let ddlayer = svg
                .selectAll("g.ddlayer")
                .data(["pass_locs"], d => d);
            ddlayer
                .enter()
                .append("g")
                .attr("class", "ddlayer")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            ddlayer
                .exit()
                .remove();
            ddlayer = svg.selectAll("g.ddlayer");

            let scalePitchX = _this.scaledPitchXGen();
            let scalePitchY = _this.scaledPitchYGen();

            let scaleColor = d3.scaleOrdinal()
                .domain(lineup.map(d => d.team_id))
                .range(["red", "yellow"]);

            let pass_locs = ddlayer
                .selectAll("circle.pass_locs")
                .data(events, d => d.id);

            pass_locs
                .enter()
                .append("circle")
                .attr("class", "pass_locs")
                .attr("r", 2)
                .attr("cx", d => scalePitchX(d.location))
                .attr("cy", d => scalePitchY(d.location))
                .attr("fill", d => scaleColor(d.team.id));
            pass_locs
                .exit()
                .remove();
            return this;
        })
            .catch(err => console.log(err));
    }
}


