
function norm_loc(location, period) {
    if (period % 2)
        return location;
    return [120 - location[0], location[1]];
};


class Pitch {

    constructor() {
        //this._width = 120 * 5;
        //this._height = 80 * 5;
        this._height = 120 * 5;
        this._width = 80 * 5;
        this._orientation = "vertical"; // "horizontal"

        this._margin = {left: 30, right: 30, top: 30, bottom: 30};
        //this._dataurl = "/rawdata/data/";
        //this._match_id = 7586;
        this._selection = "body";

        this._events = Promise.resolve([]);
        this._lineup = Promise.resolve([]);
        this._drawtype = "passlocs"; // "passpaths"

        this._timerange = [-1, Infinity];
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
        let dataurl = "/rawdata/data/";
        let events = d3.json(dataurl + "events/" + id + ".json");
        let lineup = d3.json(dataurl + "lineups/" + id + ".json");
        this._events = events;
        this._lineup = lineup;
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

    time_slider(div) {
        let _this = this;
        let dom = d3.select(div).node();
        let slider = noUiSlider.create(dom, {
            start: [0, 2700], // FIXME: initial slider range
            connect: true,
            behaviour: "drag-tap-hover",
            range: {'min': 0, 'max': 5400}, // FIXME: initial extent of slider
            tooltips: [{to: d => String(Math.floor(d/60)) + ":" + String(Math.round(d % 60))},
                       {to: d => String(Math.floor(d/60)) + ":" + String(Math.round(d % 60))}]
        });
        slider.on("slide", function() {
            //let timerange = slider.get().map(Number.parseFloat);
            //_this.timerange(timerange);
            _this.draw();
        });
        this._time_slider = slider;
        return this;
    }
    time_slider_update() {
        // Update the range of the slider
        // It returns a promise as handle
        let _this = this;

        if (!this._time_slider) {
            console.error("Time slider has not been loaded");
        }
        let slider = this._time_slider;

        // We need the events data to figure out the actual time range
        let ans = this._events.then(function(events) {
            let last_event = events[events.length-1];
            let max_time = last_event.minute * 60 + last_event.second;
            slider.updateOptions({
                range: {'min': 0, 'max': max_time},
            });
            return _this;
        })
            .catch(err => console.log(err));

        // Return a promise as handle
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
            return function(loc, period) {
                // Ignore period
                return scalePitchX(loc[1]);
            };
        }
        else if (this._orientation === "horizontal") {
            scalePitchX = d3.scaleLinear().domain([0, 120]).range([0, width]);
            return function(loc, period) {
                return scalePitchX(norm_loc(loc, period)[0]);
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
            return function(loc, period) {
                return scalePitchY(norm_loc(loc, period)[0]);
            };
        }
        else if (this._orientation === "horizontal") {
            scalePitchY = d3.scaleLinear().domain([0, 80]).range([height, 0]);
            return function(loc, period) {
                // Ignore period
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

        // Append svg to the div
        let svg = d3.select(this._selection).selectAll("svg").data([0]);
        let svgenter = svg.enter().append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        // Draw the pitch
        svgenter.append("rect")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("fill", "grey");
        svgenter.append("rect")
            .attr("x", margin.left)
            .attr("y", margin.top)
            .attr("width", width)
            .attr("height", height)
            .style("fill", d3.schemeAccent[0]);

        return this;
    }
    draw() {
        let _this = this;

        if (this._not_first_draw) {
            console.log("INFO:", "Draw", this._selection);
            // Set the match id if we have the match selector
            if (this._match_selector) {
                let match_selector = d3.select(this._match_selector);
                let sel_value = match_selector.node().value;
                _this.match_id(sel_value);
            }
            if (this._time_slider) {
                let slider = this._time_slider;
                let timerange = slider.get().map(Number.parseFloat);
                _this.timerange(timerange);
            }

            if (this._drawtype === "passlocs")
                this.draw_passlocs();
            if (this._drawtype === "passpaths")
                this.draw_passpaths();
            return this;
        }

        // --------- If this is the first draw --------------- //

        console.log("INFO:", "Init", this._selection);
        // Draw the pitch
        this.draw_pitch();

        let handle = Promise.resolve();

        // If we have bound a match selector
        if (this._match_selector) {
            // Load the match selector
            handle = handle.then(() => {
                return this.match_selector_load();
            });
            // Set the match id according to the initial option,
            // which is needed to update the slider range
            handle = handle.then(() => {
                let match_selector = d3.select(this._match_selector);
                let sel_value = match_selector.node().value;
                _this.match_id(sel_value);
            });
        }
        if (this._time_slider) {
            // Update the slider range according to the match id
            handle = handle.then(() => {
                // wait for the update
                return _this.time_slider_update();
            });
            // Set the time range according to the slider
            handle = handle.then(() => {
                let slider = this._time_slider;
                let timerange = slider.get().map(Number.parseFloat);
                _this.timerange(timerange);
            });
        }
        handle.catch(err => console.log(err));

        // Enter the other block and draw it
        this._not_first_draw = true;
        handle.then(() => _this.draw());

        return this;

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
                .attr("cx", d => scalePitchX(d.location, d.period))
                .attr("cy", d => scalePitchY(d.location, d.period))
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
                .attr("x1", d => scalePitchX(d.location, d.period))
                .attr("y1", d => scalePitchY(d.location, d.period))
                .attr("x2", d => scalePitchX(d.pass.end_location, d.period))
                .attr("y2", d => scalePitchY(d.pass.end_location, d.period))
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
                .attr("cx", d => scalePitchX(d.location, d.period))
                .attr("cy", d => scalePitchY(d.location, d.period))
                .attr("fill", d => scaleColor(d.team.id));
            pass_locs
                .exit()
                .remove();
            return this;
        })
            .catch(err => console.log(err));
    }
}


