var main = d3v3.select('#main');

//draw chords diagram
var width = 1600, height = 760,
outerRadius = Math.min(width, height) / 2 - 150,
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

var svg= main.append("svg")
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
                        })
                        .on('mouseover', function(){
                            d3.select(this).style("cursor", "pointer"); 
                        })
         
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
                    .enter()
                    .append("a")
                    .attr("xlink:href", "#pitch")
                    .append("path")
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
                    .style("opacity", 0.6)
                    .on('mouseover', function() {
                        d3.select(this)
                        .style("opacity", 1);
                     })
                    .on('mouseout', function() {
                        d3.select(this)
                        .style("opacity", 0.6);
                     })
                    .on("click", function(d){
                    	var teamA = countries[d.source.index].name;
                    	var teamB = countries[d.target.index].name;
                        tournament_click(teamA, teamB);
                    })

//add chord legends
    var cLegendNames =  {group: 'Group', round16: 'Round of 16',
            quarterFinal: 'Quater Final', semiFinal: 'Semi Final', final: 'Final'};

    var chordLegends = svg.append('svg')
                          .attr('class', 'chordLegends')
    var cLegendCy = 125;
    var cLegendY = 130
    for (key of Object.keys(cLegendNames)){
         cLegendY += 30;
         chordLegends.append('text')
                    .text(cLegendNames[key])
                    .attr('class', 'cLegend')
                    .attr('x', 420)
                    .attr('y', cLegendY)
                    .style('font-size', 15)
    }
    for (key of Object.keys(colors)){
        cLegendCy += 30;
        chordLegends.append('circle')
                    .style('fill', colors[key])
                    .attr('class', 'cLegend')
                    .attr('r', 10)
                    .attr('cx', 400)
                    .attr('cy', cLegendCy);
    }
    chordLegends.append('text')
                .text('*Width of the arc represents the scores of the team.')
                .attr('x', 420)
                .attr('y', 310)
                .attr('class', 'cLegend');
    chordLegends.append('text')
                .text('*The colors of edges are dominated by the team that went further.')
                .attr('class', 'cLegend')
                .call(d3.util.wrap(320, 420, 320));

    chordLegends.append('text')
                .text('*Arc colors represent how far the team went.')
                .attr('class', 'cLegend')
                .call(d3.util.wrap(320, 400, 110));

//add tutorial and intro
    svg.append('text')
       .attr('class', "tutorial")
       .text('The chord diagram shows the tournament of 32 teams in 2018 FIFA World Cup. ')
       .style('fill', 'white')
       .style('font-size', 20)
       .call(d3.util.wrap(320, -750, -150));

    svg.append('text')
       .attr('class', "tutorial")
       .text('The diagram gives an overview of team competency, group competency and allows comparison among the teams.')
       .style('fill', 'white')
       .call(d3.util.wrap(320, -750, -50))
       .style('font-size', 16)
       .style('opacity', 0.6);

var tutorial2 = svg.append('g')
                   .attr('id', 'tutorial2')

    tutorial2.append('rect')
             .attr('x', 380)
             .attr('y', -320)
             .attr('width', 380)
             .attr('height', 300)
             .style('fill', 'white')
             .style('opacity', 0.3);

    tutorial2.append('rect')
             .attr('x', 400)
             .attr('y', -75)
             .attr('width', 80)
             .attr('height', 40)
             .style('fill', '#1f6e66')

    
    tutorial2.append('line')
        .attr('x1', 400)
        .attr('y1', -280)
        .attr('x2', 150)
        .attr('y2', -170)
        .style("stroke-dasharray", ("3, 3"));

    tutorial2.append('line')
        .attr('x1', 400)
        .attr('y1', -200)
        .attr('x2', 80)
        .attr('y2', -120)
        .style("stroke-dasharray", ("3, 3"))

    tutorial2.append('line')
        .attr('x1', 400)
        .attr('y1', -120)
        .attr('x2', 80)
        .attr('y2', -120)
        .style("stroke-dasharray", ("3, 3"))

    tutorial2.append('text')
       .attr('class', "tutorial2")
       .text('Hover on an arc to see scores of a team')
       .style('fill', 'white')
       .call(d3.util.wrap(350, 400, -300));

    tutorial2.append('text')
       .attr('class', "tutorial2")
       .text('Hover on an edge to see the match score')
       .style('fill', 'white')
       .call(d3.util.wrap(350, 400, -220));

    tutorial2.append('text')
       .attr('class', "tutorial2")
       .text('Click on an edge to recap the match')
       .style('fill', 'white')
       .call(d3.util.wrap(350, 400, -140));

    tutorial2.append('text')
       .attr('class', "tutorial2")
       .text('Got it')
       .style('fill', 'white')
       .call(d3.util.wrap(350, 410, -70))
       .on('mouseover', function(){
            d3.select(this).style("cursor", "pointer"); 
       })
       .on('click', function(){
            d3.selectAll('#tutorial2').style('visibility', 'hidden');
            d3.selectAll('.tutorial2').style('visibility', 'hidden');
       });


function tournament_click(teamA, teamB) {
    let matches = d3v5.json("rawdata/data/matches/43.json").then(function(matches) {
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

//wrap text width
d3.util = d3.util || {};

d3.util.wrap = function(_wrapW, x, y){ 
    return function(d, i){
        var that = this;
        var tx = x;
        var ty = y;
        function tspanify(){ 
            var lineH = this.node().getBBox().height;
            this.text('')
                .selectAll('tspan')
                .data(lineArray)
                .enter().append('tspan')
                .attr({
                    x: tx,
                    y: function(d, i){ return ty+(i + 1) * lineH; } 
                })
                .text(function(d, i){ return d.join(' '); })
        }   

        function checkW(_text){ 
            var textTmp = that
                .style({visibility: 'hidden'})
                .text(_text);
            var textW = textTmp.node().getBBox().width;
            that.style({visibility: 'visible'}).text(text);
            return textW; 
        }

        var text = this.text();
        var parentNode = this.node().parentNode;
        var textSplitted = text.split(' ');
        var lineArray = [[]];
        var count = 0;
        textSplitted.forEach(function(d, i){ 
            if(checkW(lineArray[count].concat(d).join(' '), parentNode) >= _wrapW){
                count++;
                lineArray[count] = [];
            }
            lineArray[count].push(d)
        });

        this.call(tspanify)
    }
};
