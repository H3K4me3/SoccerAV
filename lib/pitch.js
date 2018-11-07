
let trans = {};


class Pitch {

    constructor() {
        this._width = 120 * 5;
        this._height = 80 * 5;
        this._margin = 30;
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

    init() {

        // Variables
        let width = this._width;
        let height = this._height;
        let margin = this._margin;

        // Append svg to the div
        let svg = d3.select(this._selection).append("svg")
            .attr("width", width + margin * 2)
            .attr("height", height + margin * 2);

        // Draw the pitch
        svg.append("rect")
            .attr("width", width + margin * 2)
            .attr("height", height + margin * 2)
            .style("fill", "grey");
        svg.append("rect")
            .attr("x", margin)
            .attr("y", margin)
            .attr("width", width)
            .attr("height", height)
            .style("fill", d3.schemeAccent[0]);

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
                .attr("transform", `translate(${margin},${margin})`);
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
        });
    }
}


