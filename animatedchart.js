// set the dimensions and margins of the graph
const margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          `translate(${margin.left}, ${margin.top})`);

//Read the data
d3.json("ATXtf06.json").then(
  // When reading the csv, I must format variables:
    // Parse the date and value from the JSON

  // Now I can use this dataset:
    function(data) {
    // Extract the Time and data arrays
    const timeArray = data.coords.Time.data;
    const dataArray = data.data;
    const parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S");
    // Transform the data into an array of objects
    const transformedData = dataArray.map((value, index) => ({
      Time: parseTime(timeArray[index]),
      data: +value
    }));
    console.log(transformedData);
    // Add X axis --> it is a date format
    const x = d3.scaleTime()
      .domain(d3.extent(transformedData, function(d) { return d.Time; }))
      .range([ 0, width ]);
    xAxis = svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x));

    // Add Y axis
    const y = d3.scaleLinear()
      .domain([d3.min(transformedData, function(d) { return +d.data; }), d3.max(transformedData, function(d) { return +d.data; })])
      .range([ height, 0 ]);
    yAxis = svg.append("g")
      .call(d3.axisLeft(y));

    // Add a clipPath: everything out of this area won't be drawn.
    const clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width )
        .attr("height", height )
        .attr("x", 0)
        .attr("y", 0);

    // Add brushing
    const brush = d3.brushX()                   // Add the brush feature using the d3.brush function
        .extent( [ [0,0], [width,height] ] )  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
        .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function

    // Create the line variable: where both the line and the brush take place
    const line = svg.append('g')
      .attr("clip-path", "url(#clip)")

    // Add the line
    line.append("path")
      .datum(transformedData)
      .attr("class", "line")  // I add the class line to be able to modify this line later on.
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(function(d) { return x(d.Time) })
        .y(function(d) { return y(d.data) })
        )

    // Add the brushing
    line
      .append("g")
        .attr("class", "brush")
        .call(brush);

    // A function that set idleTimeOut to null
    let idleTimeout
    function idled() { idleTimeout = null; }

    // A function that update the chart for given boundaries
    function updateChart(event,d) {

      // What are the selected boundaries?
      extent = event.selection

      // If no selection, back to initial coordinate. Otherwise, update X axis domain
      if(!extent){
        if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
        x.domain([ 4,8])
      }else{
        x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
        line.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
      }

      // Update axis and line position
      xAxis.transition().duration(1000).call(d3.axisBottom(x))
      line
          .select('.line')
          .transition()
          .duration(1000)
          .attr("d", d3.line()
            .x(function(d) { return x(d.Time) })
            .y(function(d) { return y(d.data) })
          )
    }

    // If user double click, reinitialize the chart
    svg.on("dblclick",function(){
      x.domain(d3.extent(transformedData, function(d) { return d.Time; }))
      xAxis.transition().call(d3.axisBottom(x))
      line
        .select('.line')
        .transition()
        .attr("d", d3.line()
          .x(function(d) { return x(d.Time) })
          .y(function(d) { return y(d.data) })
      )
    });
    const tooltip = d3.select("#my_dataviz")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")



  // A function that change this tooltip when the user hover a point.
  // Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
  const mouseover = function(event, d) {
    tooltip
      .style("opacity", 1)
  }

  const mousemove = function(event, d) {
    tooltip
      .html(`Temperature (C): ${d.GrLivArea}`)
      .style("left", (event.x)/2 + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
      .style("top", (event.y)/2 + "px")
  }

  // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
  const mouseleave = function(event,d) {
    tooltip
      .transition()
      .duration(200)
      .style("opacity", 0)
  }
  // svg.selectAll("dot")
  //   .data(transformedData)
  //   .enter().append("circle")
  //     .attr("r", 5)
  //     .attr("cx", function(d) { return x(d.Time); })
  //     .attr("cy", function(d) { return y(d.data); })
  //     .on("mouseover", mouseover)
  //     .on("mousemove", mousemove)
  //     .on("mouseleave", mouseleave);
    // Sync with video
    const video = document.getElementById('myVideo');
    video.addEventListener('timeupdate', function() {
      console.log(video.cur);
      const currentTime = video.currentTime;
      let progress = currentTime / video.duration;

      // Calculate the number of data points to display based on the progress
      const totalDataPoints = transformedData.length;
      const dataPointsToShow = Math.floor(progress * totalDataPoints);
      // Filter the data to show only the portion corresponding to the video's progress
      const currentData = transformedData.slice(0, dataPointsToShow);
      // Update the line chart
      line
        .select('.line')
        .datum(currentData)
        .attr("d", d3.line()
          .x(function(d) { return x(d.Time) })
          .y(function(d) { return y(d.data) })
        );
    });

})

//html video events
//set current time to ten --- normalized progress from chart to get to video
