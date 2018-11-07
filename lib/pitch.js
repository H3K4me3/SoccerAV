
let trans = {};


class Pitch {

    constructor() {
        this._width = 120 * 5;
        this._height = 80 * 5;
        this._margin = {left: 30, right: 30, top: 30, bottom: 30};
        //this._dataurl = "/rawdata/data/";
        //this._match_id = 7586;
        this._selection = "body";

        this._events = Promise.resolve([]);
        this._lineup = Promise.resolve([]);
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
        this.draw_passlocs();
        return this;
    }

    draw_passlocs() {
        // Variables
        let width = this._width;
        let height = this._height;
        let margin = this._margin;
        let svg = d3.select(this._selection).select("svg");

        // Data processing
        let events = this._events
            .then(events => events.filter(d => d.type.name === "Pass"))
            // Currently only show first period
            .then(events => events.filter(d => d.period === 1));
        let lineup = this._lineup;

        // Draw the pass locations
        Promise.all([events, lineup]).then(function([events, lineup]) {
            // Data driven layer
            // Also remove other layers with ddlayer class
            let ddlayer = svg
                .selectAll("g.ddlayer")
                .data(["pass_locs"]);
            ddlayer
                .enter()
                .append("g")
                .attr("class", "ddlayer")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            ddlayer
                .exit()
                .remove();
            ddlayer = svg.selectAll("g.ddlayer");

            let scalePitchX = d3
                .scaleLinear()
                .domain([0, 120])
                .range([0, width]);
            let scalePitchY = d3
                .scaleLinear()
                .domain([0, 80])
                .range([height, 0]);

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
                .attr("cx", d => scalePitchX(d.location[0]))
                .attr("cy", d => scalePitchY(d.location[1]))
                .attr("fill", d => scaleColor(d.team.id));
            pass_locs
                .exit()
                .remove();
            return this;
        });
    }
}


