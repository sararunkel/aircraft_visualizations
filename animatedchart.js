class LineChart {
  constructor(svgSelector, videoSelector, datajson, variable) {
      this.svg = d3.select(svgSelector);
      this.selector = svgSelector;
      this.video = document.getElementById(videoSelector);
      this.json = datajson;
      this.variable = variable;
      this.planeIconUrl = 'plane.png';
      this.updateDimensions();
      this.iconWidth = 16;
      this.yticks =5;
      this.initChart();
      this.initVideoSync();
      // Add resize event listener
      window.addEventListener('resize', () => this.onResize());
  }
  axis(scale, orientation = 'bottom') {
    if (orientation === 'bottom') {
      return d3.axisBottom(scale.range([20, this.width - 20]));
    } else if (orientation === 'left') {
      return d3.axisLeft(scale);
    }
  }
  initChart() {
      const { svg, margin, width, height, data } = this;

      // Append the svg object to the body of the page
      this.svg = svg.append("svg")
          .attr("class", "line-chart")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
    d3.json(this.json).then((DATA) => {
            //console.log(DATA);
              // Parse the date and value from the JSON
              // Extract the Time and data arrays
              const timeArray = DATA.coords.Time.data;
              const dataArray = DATA.data;
              const parseTime = d3.utcParse("%Y-%m-%dT%H:%M:%S");
              // Transform the data into an array of objects
              this.data = dataArray.map((value, index) => ({
                Time: parseTime(timeArray[index]),
                data: +value
              }));
      // Add X axis
      console.log(this.data)
      // Add X axis
    this.x = d3.scaleUtc()
    .domain(d3.extent(this.data, d => d.Time))
    .range([0, width]);
    this.xAxisGenerator = this.axis(this.x, 'bottom')
        .ticks(d3.timeMinute.every(15)); // Set ticks every 15 minutes

    this.xAxis = this.svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(this.xAxisGenerator);

    // Add X axis label
    this.svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.top + 20)
        .text("Time");

    // Add Y axis
    this.y = d3.scaleLinear()
        .domain([d3.min(this.data, d => d.data), d3.max(this.data, d => d.data)])
        .range([height, 0]);
    this.yAxisGenerator = this.axis(this.y, 'left')
        .ticks(this.yticks);

    this.yAxis = this.svg.append("g")
        .attr("class", "y-axis")
        .call(this.yAxisGenerator);

    // Add Y axis label
    this.svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", - height / 2 )
        .text(this.variable);
    // Add gridlines
    const makeXGridlines = () => d3.axisBottom(this.x).ticks(d3.timeMinute.every(15));
    const makeYGridlines = () => d3.axisLeft(this.y).ticks(5);

    // Add X gridlines
    this.svg.append("g")
        .attr("class", "x-grid grid")
        .attr("transform", `translate(0,${height})`)
        .call(makeXGridlines()
            .tickSize(-height)
            .tickFormat(""));

    // Add Y gridlines
    this.svg.append("g")
        .attr("class", "y-grid grid")
        .call(makeYGridlines()
            .tickSize(-width)
            .tickFormat(""));
      //add axis labels https://observablehq.com/@jeantimex/simple-line-chart-with-axis-labels
      // Add brushing
          // A function that updates the chart for given boundaries
    

      this.brush = d3.brushX()                   // Add the brush feature using the d3.brush function
        .extent( [ [0,0], [width,height] ] )  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
        .on("end", this.updateChart.bind(this))               // Each time the brush selection changes, trigger the 'updateChart' function
      
//
      // Add a clipPath: everything out of this area won't be drawn.
      this.clip = this.svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width )
        .attr("height", height )
        .attr("x", 0)
        .attr("y", 0);
      // Add the line
      //Create the line variable: where both the line and the brush take place
      this.line = this.svg.append('g')
        .attr("clip-path", "url(#clip)")
      this.line.append("path")
          .datum(this.data)
          .attr("class", "line")  
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr("d", d3.line()
              .x(d => this.x(d.Time))
              .y(d => this.y(d.data))
          );
      // Add the brushing
      this.line.append("g")
          .attr("class", "brush")
          .call(this.brush);

      // Add the plane icon
      this.planeIcon = this.svg.append("image")
          .attr("xlink:href", this.planeIconUrl)
          .attr("width", this.iconWidth)
          .attr("height", this.iconWidth)
          .attr("x", this.x(this.data[this.data.length - 1].Time) - this.iconWidth / 2) 
          .attr("y", this.y(this.data[this.data.length - 1].data) - this.iconWidth / 2);  
      // A function that set idleTimeOut to null


    // If user double clicks, reinitialize the chart
    this.svg.on("dblclick", () => {
      this.x.domain(d3.extent(this.data, d => d.Time));
      this.xAxis.transition().call(this.axis(this.x, 'bottom').ticks(d3.timeMinute.every(15)));
      this.line.select("path")
      .transition()
      .attr("d", d3.line()
        .x(d => this.x(d.Time))
        .y(d => this.y(d.data))
      );
      this.updateGridlines(0);
    });

  }); //end of d3.json
}
idled() {
  this.idleTimeout = null;
}

updateChart(event) {
  const extent = event.selection;

  // If no selection, back to initial coordinate. Otherwise, update X axis domain
  if (!extent) {
    if (!this.idleTimeout) return this.idleTimeout = setTimeout(this.idled.bind(this), 350); // This allows to wait a little bit
    this.x.domain([4,8]);
  } else {
    this.x.domain([this.x.invert(extent[0]), this.x.invert(extent[1])]);
    this.line.select(".brush").call(this.brush.move, null); // This removes the grey brush area as soon as the selection has been done
  }

  // Update axis and line position
  this.xAxis.transition().duration(1000).call(this.axis(this.x, 'bottom').ticks(this.yticks));
  this.line.select("path")
  .transition()
  .duration(1000)
  .attr("d", d3.line()
    .x(d => this.x(d.Time))
    .y(d => this.y(d.data))
  );
  this.updateGridlines();
};
updateGridlines(duration = 1000) {
  // Update X gridlines
  this.svg.select(".x-grid")
    .transition()
    .duration(duration)
    .call(d3.axisBottom(this.x)
      .ticks(d3.timeMinute.every(15))
      .tickSize(-this.height)
      .tickFormat(""));

  // Update Y gridlines
  this.svg.select(".y-grid")
    .transition()
    .duration(duration)
    .call(d3.axisLeft(this.y)
      .ticks(this.yticks)
      .tickSize(-this.width)
      .tickFormat(""));
}
initVideoSync() {
  this.video.addEventListener('timeupdate', () => {
      const currentTime = this.video.currentTime;
      const duration = this.video.duration;
      const progress = currentTime / duration;

      // Calculate the number of data points to display based on the progress
      const totalDataPoints = this.data.length;
      const dataPointsToShow = Math.floor(progress * totalDataPoints);

      // Filter the data to show only the portion corresponding to the video's progress
      const currentData = this.data.slice(0, dataPointsToShow);

      // Update the line chart
      this.line.select(".line").datum(currentData)
          .attr("d", d3.line()
              .x(d => this.x(d.Time))
              .y(d => this.y(d.data))
          );

      // Update the plane icon position
      if (currentData.length > 0) {
          const latestData = currentData[currentData.length - 1];
          this.planeIcon
              .attr("x", this.x(latestData.Time) - this.iconWidth / 2)
              .attr("y", this.y(latestData.data) - this.iconWidth / 2);
      }
  });
}
updateDimensions() {
  this.margin = { top: 20, right: 20, bottom: 50, left: 50 };
  this.width = window.innerWidth/2 - this.margin.left - this.margin.right;
  this.height = window.innerHeight / 4 - this.margin.top - this.margin.bottom;
}
onResize() {
  // Update dimensions
  this.updateDimensions();

  // Update SVG dimensions
  d3.select(this.selector).select("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

  this.updateChart();
}


}

const chart1 = new LineChart("#my_dataviz", "myVideo", "ATXtf06.json", 'Temperature (C)');
const chart2 = new LineChart("#chart2", "myVideo", "WICtf06.json", "Wind Speed (m/s)");