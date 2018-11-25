var main = d3.select('#main');
var wrapper = main.append('div')
				  .attr('id', 'wrapper');
var header = wrapper.append('header');
var title = header.append('text')
				  .text("Soccer Space")


var columnLeft = wrapper.append('div')
					.attr('class', 'column')
					.attr('id', 'columnLeft');

var field = columnLeft.append('div')
					.attr('id', 'soccerField');

var innerField = field.append('svg')
					.attr('id', "innerField");
var ratio = 6.75;
innerField.append('rect')
		  .attr('x', 36.34*ratio)
		  .attr('y', 3.56*ratio)
		  .attr('width', 7.32*ratio)
		  .attr('height', 2.44*ratio);

innerField.append('rect')
		  .attr('x', 36.34*ratio)
		  .attr('y', 126*ratio)
		  .attr('width', 7.32*ratio)
		  .attr('height', 2.44*ratio);
		  

innerField.append('rect')
		  .attr('class', 'innerSketch')
		  .attr('id', 'border')
		  .attr('x', 0)
		  .attr('y', 6*ratio)
		  .attr('width', 80*ratio)
		  .attr('height', 120*ratio);

innerField.append('line')
		  .attr('class', 'innerSketch')
		  .attr('x1', 0)
		  .attr('y1', 66*ratio)
		  .attr('x2', 80*ratio)
		  .attr('y2', 66*ratio);

innerField.append('circle')
		  .attr('class', 'innerSketch')
		  .attr('cx', 40*ratio)
		  .attr('cy', 66*ratio)
		  .attr('r', 10*ratio);

innerField.append('rect')
		  .attr('class', 'innerSketch')
		  .attr('x', 18*ratio)
		  .attr('y', 6*ratio)
		  .attr('width', 44*ratio)
		  .attr('height', 18*ratio);

innerField.append('rect')
		  .attr('class', 'innerSketch')
		  .attr('x', 18*ratio)
		  .attr('y', 108*ratio)
		  .attr('width', 44*ratio)
		  .attr('height', 18*ratio);


innerField.append('rect')
		  .attr('class', 'innerSketch')
		  .attr('x', 30*ratio)
		  .attr('y', 6*ratio)
		  .attr('width', 20*ratio)
		  .attr('height', 6*ratio);

innerField.append('rect')
		  .attr('class', 'innerSketch')
		  .attr('x', 30*ratio)
		  .attr('y', 120*ratio)
		  .attr('width', 20*ratio)
		  .attr('height', 6*ratio);



innerField.append('circle')
		  .attr('class', 'dots')
		  .attr('cx', 40*ratio)
		  .attr('cy', 66*ratio)
		  .attr('r', 0.5*ratio);

innerField.append('circle')
		  .attr('class', 'dots')
		  .attr('cx', 40*ratio)
		  .attr('cy', 17*ratio)
		  .attr('r', 0.5*ratio);

innerField.append('circle')
		  .attr('class', 'dots')
		  .attr('cx', 40*ratio)
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
	var start = polarToCartesian(x, y, radius, endAngle);
	var end = polarToCartesian(x, y, radius, startAngle);
	var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
		if (x==270){
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
				  .attr('class', 'innerField')
				  .attr('d', arc[i]);
				}