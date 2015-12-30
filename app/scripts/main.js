var s = {
  data: [
    { name: 'John', short: 'JN', salary: 12000, myTargetSalary: 0, order: 70 },
    { name: 'Ralph', short: 'R', salary: 16000, myTargetSalary: 0, order: 50 },
    { name: 'Josh', short: 'JS', salary: 13000, myTargetSalary: 0, order: 40 },
    { name: 'Sandy', short: 'S', salary: 20000, myTargetSalary: 0, order: 20 },
  ],

  refLines: {
    myTargetSalary: [{x:0,y:28000},{x:90,y:10000}],
  },

  progress: [.2, .3, .4, .1],

  salaryIncrease: 8000,

  maxOrder: 100,
  minSalary: 10000, maxSalary: 30000,

  width:  1100,
  height: 550,

  splitHeight: 250,
  splitWidth:  400,
  splitRowCount: 3,

  splitMaxSalary: 25000,
  splitMinSalary: 12000,
}

_.each(s.data, function(d) {
  if (!d.assignment) {
    d.assignment = [];
    d.roundResult = [];
    _.each(s.progress, function() {
      d.assignment.push(0);
      d.roundResult.push(0);
    });
  }
});

var m = [15, 15, 50, 60]; // margins
var sm = [10, 10, 30, 60]; // margins

function µ() {
  var scale = arguments[arguments.length - 1];
  var path = arguments[0];
  return function(d) {
    return scale(_.get(d, path));
  };
}

function setMyTargetSalary(d, v) {
  d.myTargetSalary = Math.max(Math.round(v), d.salary);
}

svg = d3.select("#main-chart");
svg.attr("width", s.width).attr("height", s.height);

var orderScale = d3.scale.linear().domain([0, s.maxOrder]).range([m[3], s.width - m[1]]);
var salaryScale = d3.scale.linear().domain([s.maxSalary, s.minSalary]).range([m[0], s.height - m[2]]);

svg.append("g").attr("class", "salary axis").attr("transform", "translate(" + orderScale(0) + ",0)").call(
  d3.svg.axis().scale(salaryScale).orient("left").ticks(10)
);

svg.append("g").attr("class", "order axis").attr("transform", "translate(0," + salaryScale(s.minSalary) + ")").call(
  d3.svg.axis().scale(orderScale).ticks(10).tickPadding(10)
);

var refLines = svg.append("g").attr("class", "ref-lines")
  .selectAll("line")
  .data(d3.keys(s.refLines))
  .enter().append("line");

var selectionSalary = svg.append("g").attr("class", "data-salary")
  .selectAll("circle")
  .data(s.data)
  .enter().append("circle")
  .attr("r", 5)
  .call(d3.behavior.drag().on("drag", function(d) {
    d.order = Math.round(orderScale.invert(d3.event.x));
    setMyTargetSalary(d, buildSalaryOrderScale()(d.order));
    updateGraph();
  }));

var selectionNames = svg.append("g").attr("class", "data-name")
  .selectAll("text")
  .data(s.data)
  .enter().append("text")
  .text(function(d) { return d.short; });

var selectionMyTargetSalary = svg.append("g").attr("class", "data-my-target-salary")
  .selectAll("circle")
  .data(s.data)
  .enter().append("circle")
  .attr("cy", µ('myTargetSalary', salaryScale))
  .attr("cx", µ('order', orderScale))
  .attr("r", 5)
  .call(d3.behavior.drag().on("drag", function(d) {
    setMyTargetSalary(d, salaryScale.invert(d3.event.y));
    updateGraph();
  }));

var refLineMyTargetSalary = svg.append("g").attr("class", "ref-line-my-target-salary")
  .selectAll("circle")
  .data(s.refLines.myTargetSalary)
  .enter().append("circle")
  .attr("r", 5)
  .call(d3.behavior.drag().on("drag", function(d) {
    d.x = Math.round(orderScale.invert(d3.event.x));
    d.y = Math.round(salaryScale.invert(d3.event.y));
    updateMyTargetSalaryFromLine();
    updateGraph();
  }));

function buildSalaryOrderScale() {
  return d3.scale.linear()
    .domain([s.refLines.myTargetSalary[0].x, s.refLines.myTargetSalary[1].x])
    .range([s.refLines.myTargetSalary[0].y, s.refLines.myTargetSalary[1].y]);
}

function updateMyTargetSalaryFromLine() {
  var m = buildSalaryOrderScale();

  _.each(s.data, function(d) {
    setMyTargetSalary(d, m(d.order));
  });
}


var progressGaps = [];
_.each(s.progress, function(d, i) {
  var td = $("<td>");
  progressGaps.push(td);
  $("#gapStatus .values").append(td);
  $("#gapStatus .header").append($("<th>").text("A" + (i+1)));
});

function updateProgressGaps() {
  _.each(s.progress, function(p, i){
    var gap = s.progress[i] * s.salaryIncrease;
    _.each(s.data, function(d) {
      gap -= d.assignment[i];
    });
    progressGaps[i].text(gap);
  });
}


var names = _.map(s.data, 'name');

var tableControls = {} // Name => { updateGraph: function(data) {...} }
var table = $("#table table");
var headerRow = $("<tr>").append($("<th>").append("Nombre"));
_.each(s.progress, function(d, i) {
  headerRow.append($("<th>").append("A" + (i+1)));
  headerRow.append($("<th>").append("R" + (i+1)));
});
table.append(headerRow);

_.each(names, function(name) {
  var obj = {}
  tableControls[name] = obj;

  var row = $("<tr>");
  table.append(row);
  row.append($("<td>").append($("<p>").addClass("form-control-static").text(name)));

  var assignmentControls = [];
  var roundResultControls = [];

  _.each(s.progress, function(d, i) {
    var assignmentControl = $("<input>").attr("type", "number").addClass("form-control");
    var roundResultControl = $("<input>").attr("type", "number").addClass("form-control");

    assignmentControl.change(function(){
      obj.data.assignment[i] = Math.max(0, parseInt(assignmentControl.val()));
      updateGraph();
    });
    roundResultControl.change(function(){
      obj.data.roundResult[i] = Math.max(0, parseInt(roundResultControl.val()));
      updateGraph();
    });

    row.append($("<td>").append(assignmentControl));
    row.append($("<td>").append(roundResultControl));

    assignmentControls.push(assignmentControl);
    roundResultControls.push(roundResultControl);
  });

  obj.updateGraph = function(data) {
    obj.data = data;

    _.each(data.assignment, function(d, i) {
      assignmentControls[i].val(d);
    });

    _.each(data.roundResult, function(d, i) {
      roundResultControls[i].val(d);
    });
  };
});

var splitCharts = {} // Name => { svg: d3 , }
var splitProgressScale = d3.scale.linear().domain([0, 1]).range([sm[3], s.splitWidth - sm[1]]);

var splitContainer = $('#split');
_.each(_.chunk(names, s.splitRowCount), function(rowNames) {
  var rowContainer = $('<div>').addClass("row");
  splitContainer.append(rowContainer);

  _.each(rowNames, function(name) {
    var container = $('<div>').addClass("col-md-" + 12 / s.splitRowCount);
    rowContainer.append(container);
    container.append($("<p>").addClass("name").text(name));

    var svg = d3.select(container[0]).append("svg").attr("width", s.splitWidth).attr("height", s.splitHeight);

    var salaryAxis = svg.append("g").attr("class", "salary axis");

    svg.append("g").attr("class", "progress axis").attr("transform", "translate(0," + (s.splitHeight - sm[2]) + ")").call(
      d3.svg.axis().scale(splitProgressScale)
    );

    var targetRef = svg.append("line").attr("class", "split-target-ref")
    var initialSalary = svg.append("circle").attr("r", 5);
    var targetSalary = svg.append("circle").attr("class", "split-target").attr("r", 5);

    var roundResultSelection = svg.append("g").attr("class", "split-round-result").selectAll("circle").data(s.progress)
      .enter().append("circle").attr("r", 5)
      .attr("cx", function(d, i) { return splitProgressScale(_.sum(_.slice(s.progress, 0, i+1))); });

    var assignmentSelection = svg.append("g").attr("class", "split-round-assignment").selectAll("circle").data(s.progress)
      .enter().append("circle").attr("r", 5)
      .attr("cx", function(d, i) { return splitProgressScale(_.sum(_.slice(s.progress, 0, i+1))); })
      .call(d3.behavior.drag().on("drag", function(d, i) {
        obj.data.assignment[i] = Math.max(0, Math.round(obj.splitSalaryScale.invert(d3.event.y)) - obj.baseSalaryForAssignment(obj.data, i));
        updateGraph();
      }));

    var obj = splitCharts[name] = {};
    obj.svg = svg;
    obj.updateGraph = function(data) {
      obj.data = data;
      obj.splitSalaryScale = d3.scale.linear().domain([data.myTargetSalary + (data.myTargetSalary-data.salary) * .3, data.salary]).range([sm[0], s.splitHeight - sm[2]]);

      salaryAxis.attr("transform", "translate(" + splitProgressScale(0) + ",0)").call(
        d3.svg.axis().scale(obj.splitSalaryScale).orient("left").ticks(10)
      );

      initialSalary
        .attr("cy", obj.splitSalaryScale(data.salary))
        .attr("cx", splitProgressScale(0.0));

      targetSalary
        .attr("cy", obj.splitSalaryScale(data.myTargetSalary))
        .attr("cx", splitProgressScale(1.0));

      targetRef
        .attr("x1", splitProgressScale(0.0))
        .attr("y1", obj.splitSalaryScale(data.salary))
        .attr("x2", splitProgressScale(1.0))
        .attr("y2", obj.splitSalaryScale(data.myTargetSalary));

      assignmentSelection
        .attr("cy", function(d, i) { return obj.splitSalaryScale(obj.baseSalaryForAssignment(data, i) + data.assignment[i]); } )

      roundResultSelection
        .attr("cy", function(d, i) { return obj.splitSalaryScale(obj.baseSalaryForAssignment(data, i) + data.roundResult[i]); } )
    };

    obj.baseSalaryForAssignment = function(data, i) {
      return data.salary + _.sum(_.slice(data.roundResult, 0, i));
    };

  });
});


function updateGraph() {
  renderStatus();

  updateProgressGaps();

  refLines
    .attr("x1", function(d){ return orderScale(s.refLines[d][0].x) } )
    .attr("y1", function(d){ return salaryScale(s.refLines[d][0].y) } )
    .attr("x2", function(d){ return orderScale(s.refLines[d][1].x) } )
    .attr("y2", function(d){ return salaryScale(s.refLines[d][1].y) } );

  selectionSalary
    .attr("cy", µ('salary', salaryScale))
    .attr("cx", µ('order', orderScale));

  selectionNames
    .attr("y", function(d){ return salaryScale(d.salary) + 20; })
    .attr("x", µ('order', orderScale));

  selectionMyTargetSalary
    .attr("cy", µ('myTargetSalary', salaryScale))
    .attr("cx", µ('order', orderScale));

  refLineMyTargetSalary
    .attr("cy", µ('y', salaryScale))
    .attr("cx", µ('x', orderScale));


  _.each(s.data, function(data) {
    splitCharts[data.name].updateGraph(data);
    tableControls[data.name].updateGraph(data);
  });
}

function renderStatus() {
  $('#status').text(JSON.stringify(s, null, 2));

  $('#targetSalaryGap').text(s.salaryIncrease - (_.sum(s.data, 'myTargetSalary') - _.sum(s.data, 'salary')));
}

updateGraph();
