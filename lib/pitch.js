class Pitch {

    constructor() {
        //this._width = 120 * 5;
        //this._height = 80 * 5;
        this._height = 120 * 5;
        this._width = 80 * 5;

        this._margin = {left: 30, right: 30, top: 30, bottom: 30};
        //this._dataurl = "/rawdata/data/";
        //this._match_id = 7586;
        this._selection = "body";

        this._events = Promise.resolve([]);
        this._lineup = Promise.resolve([]);
        this._drawtype = "passlocs"; // "passpaths"
    }
    selection(dom) {
        this._selection = dom;
        return this;
    }
    match_id(id) {
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
    bind_match_selector(dom) {
        let _this = this;
        let matches = d3.json("../rawdata/data/matches/43.json");
        let match_selector = d3.select(dom);
        match_selector.on("change", function() {
            let sel_value = match_selector.node().value;
            _this.match_id(sel_value);
            _this.draw();
        });
        matches.then(function(matches) {
            match_selector.selectAll("option")
                .data(matches)
                .enter()
                .append("option")
                .text(d => d.home_team.home_team_name + " vs " + d.away_team.away_team_name)
                .attr("value", d => d.match_id);
            let sel_value = match_selector.node().value;
            _this.match_id(sel_value);
            _this.draw();
        });
        return this;
    }

    scaledPitchXGen() {
        let width = this._width;
        let height = this._height;
        let scalePitchX = d3
            .scaleLinear()
            .domain([0, 80])
            .range([width, 0]);

        return function(loc, period) {
            return scalePitchX(loc[1]);
        };
    }
    scaledPitchYGen() {
        let width = this._width;
        let height = this._height;
        let norm_loc = function(location, period) {
            if (period % 2)
                return location;
            return [120 - location[0], location[1]];
        };
        let scalePitchY = d3.scaleLinear()
            .domain([0, 120])
            .range([height, 0]);
        return function(loc, period) {
            return scalePitchY(norm_loc(loc, period)[0]);
        };
    }
    oldScaledPitchXGen() {
        // Use horizontal locations
        let width = this._width;
        let height = this._height;
        let norm_loc = function(location, period) {
            if (period % 2)
                return location;
            return [120 - location[0], location[1]];
        };
        let scalePitchX = d3
            .scaleLinear()
            .domain([0, 120])
            .range([0, width]);

        return function(loc, period) {
            return scalePitchX(norm_loc(loc, period)[0]);
        };
    }
    oldScaledPitchYGen() {
        // Use horizontal locations
        let width = this._width;
        let height = this._height;
        let scalePitchY = d3
            .scaleLinear()
            .domain([0, 80])
            .range([height, 0]);
        return function(loc, period) {
            // Ignore period
            return scalePitchY(loc[1]);
        };
    }
    draw_init() {

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
        this.draw_init();
        if (this._drawtype === "passlocs")
            this.draw_passlocs();
        if (this._drawtype === "passpaths")
            this.draw_passpaths();
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
            .then(events => events.filter(d => d.type.name === "Pass"));
        let lineup = this._lineup;

        // Draw the pass locations
        Promise.all([events, lineup]).then(function([events, lineup]) {
            // Data driven layer
            console.log(events);
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
        });
    }
}


