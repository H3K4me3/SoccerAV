var main = d3v3.select('#main');
var width = 880, height = 880,
//outerRadius = Math.min(width, height) / 2 - 10,
outerRadius = Math.min(width, height) / 2 - 150,
//innerRadius = outerRadius - 24;
innerRadius = outerRadius - 40;
 
var arc = d3v3.svg.arc()
		.innerRadius(innerRadius)
		.outerRadius(outerRadius);
 
var layout = d3v3.layout.chord()
		.padding(.02)
		.sortSubgroups(d3v3.descending)
		.sortChords(d3v3.ascending);
 
var path = d3v3.svg.chord()
.radius(innerRadius);

 
var svg = main.append("svg")
.attr("width", width)
.attr("height", height)
.append("g")
.attr("id", "circle")
.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
 
svg.append("circle")
.attr("r", outerRadius);
 
d3v3.csv("teams.csv", function(countries) {
d3v3.json("matrix.json", function(matrix) {
 
// Compute the chord layout.
chord=layout.matrix(matrix);
 
// Add a group per neighborhood.
var group = svg.selectAll(".group")
.data(layout.groups)
.enter().append("g")
.attr("class", "group")
.on("mouseover", mouseover);
 
//Add a mouseover title.
group.append("title").text(function(d, i) {
   return countries[i].name + " scores : " + d.value.toFixed(0);
 });
 
// Add the group arc.
var colors =  {group: '#8A9A5B', round16: '#9DC183',
    quarterFinal: '#00A86B', semiFinal: '#98F898', final: '#C7EA46'};
var groupPath = group.append("path")
.attr("id", function(d, i) { return "group" + i; })
.attr("d", arc)
.style("fill", function(d){
	return colors[countries[d.index].stage];
});
 
var groupCode = ["A", "B", "C", "D", "E", "F", "G", "H"];
var seperate = group.append("text")
		.filter(function(d){ return d.index%4 == 0;})
		.attr("dy", ".35em")
        .attr("class", "groupTitles")
        .attr("text-anchor", function(d) { return d.startAngle > Math.PI ? "end" : null; })
        .attr("transform", function(d) {
              return "rotate(" + (d.startAngle * 180 / Math.PI - 90) + ")"
              + "translate(" + (outerRadius+55) + ")"
              + (d.startAngle > Math.PI ? "rotate(180)" : "");
            })
        .text(function(d, i){return "Group "+groupCode[i];})
        .style("fill", "white")
        .style("font-family", "Futura")
        .style("font-size", "20px")
        .style("opacity", 0.3);

 group.append("text")
            .each(function(d){ d.angle = (d.startAngle + d.endAngle) / 2; })
            .attr("dy", ".35em")
            .attr("class", "titles")
            .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
            .attr("transform", function(d) {
              return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
              + "translate(" + (outerRadius + 10) + ")"
              + (d.angle > Math.PI ? "rotate(180)" : "");
            })
            .text(function(d,i){ return countries[i].name; })
            .style("font-size", "15px")
            .style('fill', 'white');

 
// Add the chords.

var chord = svg.selectAll(".chord")
.data(layout.chords)
.enter().append("path")
.attr("class", "chord")
.style("fill", function(d){
	if (countries[d.source.index].rank > countries[d.target.index].rank){
		var pathColor = colors[countries[d.source.index].stage];
	}else{
		var pathColor = colors[countries[d.target.index].stage]
	}
	return pathColor;
})
.style('stroke-width', 0)
.attr("d", path)
//*****add onclick value*****
.on("click", function(d){
	var teamA = countries[d.source.index].name;
	var teamB = countries[d.target.index].name;
    tournament_click(teamA, teamB);
});

function tournament_click(teamA, teamB) {
    let matches = d3v5.json("../rawdata/data/matches/43.json").then(function(matches) {
        let match = matches.find(m =>
            (m.away_team.away_team_name === teamB && m.home_team.home_team_name === teamA) ||
            (m.away_team.away_team_name === teamA && m.home_team.home_team_name === teamB));
        console.log([teamA], [teamB])
        console.log("Loading match", match.match_id)
        pitch.match_id(match.match_id).draw();
    })
    return matches;
}

 
// Add an elaborate mouseover title for each chord.
 chord.append("title").text(function(d) {
 	if (countries[d.source.index].name == "England" && countries[d.target.index].name == "Belgium"){
 		return "England: Belgium  0:1/0:2";
 	}else if(countries[d.source.index].name == "Belgium" && countries[d.target.index].name == "England"){
 		return "Belgium:England  1:0/2:0";
 	}else {
			 return countries[d.source.index].name
			 + " : " + countries[d.target.index].name
			 + "  " + Math.floor(d.source.value)
			 + ":" + Math.floor(d.target.value);
			}
 });
 
function mouseover(d, i) {
		chord.classed("fade", function(p) {
				return p.source.index != i
				&& p.target.index != i;
				});
		}
		});
});

