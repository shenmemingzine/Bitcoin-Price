// special document elements
var one_month_id = "one-month";
var five_months_id = "five-months";
var one_year_id = "one-year";
var five_years_id = "five-years";

document.getElementById(one_month_id).onclick = function() { d3.selectAll("svg > *").remove(); drawChart(31); };
document.getElementById(five_months_id).onclick = function() { d3.selectAll("svg > *").remove(); drawChart(152); };
document.getElementById(one_year_id).onclick = function() { d3.selectAll("svg > *").remove(); drawChart(356); };
document.getElementById(five_years_id).onclick = function() { d3.selectAll("svg > *").remove(); drawChart(1825); };

// createChart(null);
drawChart(null)

//https://www.coindesk.com/api
//API to fetch historical data of Bitcoin Price Index

/**
 * Loading data from API when DOM Content has been loaded'.
 */

// function createChart(days) {document.addEventListener("DOMContentLoaded", function(event) {
//     var api = getJSON(days);
//     fetch(api).then(function(response) { return response.json(); })
//               .then(function(data) {
//                   var parsedData = parseData(data);
//                   drawChart(parsedData);
//                   })
//               .catch(function(err) { console.log(err); })
// });
// };

function getJSON(days = null) {
    if (days === null) {return "https://api.coindesk.com/v1/bpi/historical/close.json"}
    else {var start = updateDate(parseInt(days));
          var end = formatDate(new Date());
          return "https://api.coindesk.com/v1/bpi/historical/close.json?start=" + start + "&end=" + end}
};

// get end date
function updateDate(days) {
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - days);
    return formatDate(currentDate);
};

// format date to YYYY-MM-DD
function formatDate(date) {
    var d = new Date(date);
    var month = "" + (d.getMonth() + 1);
    var day = "" + d.getDate();
    var year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
};

/**
 * Parse data into key-value pairs
 * @param {object} data Object containing historical data of BPI
 */
function parseData(data) {
    var arr = [];
    for (var i in data.bpi) {
        arr.push({
            date: new Date(i), //date
            value: +data.bpi[i] //convert string to number
        });
    }
    return arr;
}

// drawChart(data)
function drawChart(days) {
api = getJSON(days)
d3.json(api, function(error, data) {
data = parseData(data);
var svgWidth = 600, svgHeight = 400;
var margin = { top: 20, right: 20, bottom: 30, left: 50 };
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

var svg = d3.selectAll("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add x axis
var x = d3.scaleTime()
      .domain(d3.extent(data, function(d) { return d.date; }))
      .range([ 0, width ]);
xAxis = svg.append("g")
           .attr("transform", "translate(0," + height + ")")
           .call(d3.axisBottom(x));

// add y axis
var y = d3.scaleLinear()
          .domain([0, d3.max(data, function(d) { return +d.value; })])
          .range([ height, 0 ]);
yAxis = svg.append("g")
           .call(d3.axisLeft(y));

// define a clip-path so that everything out of this area won't be drawn later
var clip = svg.append("defs")
              .append("svg:clipPath")
              .attr("id", "clip")
              .append("svg:rect")
              .attr("width", width )
              .attr("height", height )
              .attr("x", 0)
              .attr("y", 0);

// define brushing
var brush = d3.brushX()                   
              .extent([[0,0], [width, height]])  
              .on("end", updateChart);               

// define line
var line = svg.append("g")
              .attr("clip-path", "url(#clip)");

// define area
var area = d3.area()
             .x(function(d) { return x(d.date); })
             .y0(height)
             .y1(function(d) {return y(d.value); });
             
// add area under line
line.append("path")
    .datum(data)
    .attr("class", "area")
    .attr("d", area);
    
// add line
line.append("path")
    .datum(data)
    .attr("class", "line") 
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
    .x(function(d) { return x(d.date) })
    .y(function(d) { return y(d.value) }));

// add brushing
line.append("g")
    .attr("class", "brush")
    .call(brush);

// ------------------------------------------------------------------
// credit: https://www.d3-graph-gallery.com/graph/line_brushZoom.html
// A function that set idleTimeOut to null
var idleTimeout;
function idled() { idleTimeout = null; }

// A function that update the chart for given boundaries
function updateChart() {

// What are the selected boundaries?
extent = d3.event.selection

// If no selection, back to initial coordinate. Otherwise, update X axis domain
if(!extent){
    if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
        x.domain([4, 8])
    }else{
        x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
        line.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
    }

// Update axis and line position
xAxis.transition().duration(15).call(d3.axisBottom(x))
line.select(".area").transition().duration(15).attr("d", area)
line.select(".line")
    .transition()
    .duration(15)
    .attr("d", d3.line()
                 .x(function(d) { return x(d.date) })
                 .y(function(d) { return y(d.value) }))
}

// If user double click, reinitialize the chart
svg.on("dblclick",function(){
    x.domain(d3.extent(data, function(d) { return d.date; }))
    xAxis.transition().call(d3.axisBottom(x))
    line.select(".area").transition().attr("d", area)
    line.select(".line")
        .transition()
        .attr("d", d3.line()
          .x(function(d) { return x(d.date) })
          .y(function(d) { return y(d.value) })
      )
    });
// ------------------------------------------------------------------

})
}
