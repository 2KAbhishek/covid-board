(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define(["d3-collection", "d3-selection"], factory);
  } else if (typeof module === "object" && module.exports) {
    var d3Collection = require("d3-collection"),
      d3Selection = require("d3-selection");
    module.exports = factory(d3Collection, d3Selection);
  } else {
    var d3 = root.d3;

    root.d3.tip = factory(d3, d3);
  }
})(this, function (d3Collection, d3Selection) {
  return function () {
    var direction = d3TipDirection,
      offset = d3TipOffset,
      html = d3TipHTML,
      node = initnode(),
      svg = null,
      point = null,
      target = null;

    function tip(vis) {
      svg = getSVGnode(vis);
      if (!svg) return;
      point = svg.createSVGPoint();
      document.body.appendChild(node);
    }

    tip.show = function () {
      var x = d3.event.x - 50;
      var y = d3.event.y + 10;
      var args = Array.prototype.slice.call(arguments);
      if (args[args.length - 1] instanceof SVGElement) target = args.pop();

      var content = html.apply(this, args),
        poffset = offset.apply(this, args),
        dir = direction.apply(this, args),
        nodel = getnodeEl(),
        i = directions.length,
        coords,
        scrollTop =
          document.documentElement.scrollTop || document.body.scrollTop,
        scrollLeft =
          document.documentElement.scrollLeft || document.body.scrollLeft;

      nodel.html(content).style("opacity", 1).style("pointer-events", "all");

      while (i--) nodel.classed(directions[i], false);
      coords = directionCallbacks.get(dir).apply(this);
      nodel
        .classed(dir, true)

        .style("top", y + scrollTop + "px")
        .style("left", x + scrollLeft + "px");

      return tip;
    };

    tip.hide = function () {
      var nodel = getnodeEl();
      nodel.style("opacity", 0).style("pointer-events", "none");
      return tip;
    };

    tip.attr = function (n, v) {
      if (arguments.length < 2 && typeof n === "string") {
        return getnodeEl().attr(n);
      }

      var args = Array.prototype.slice.call(arguments);
      d3Selection.selection.prototype.attr.apply(getnodeEl(), args);
      return tip;
    };

    tip.style = function (n, v) {
      if (arguments.length < 2 && typeof n === "string") {
        return getnodeEl().style(n);
      }

      var args = Array.prototype.slice.call(arguments);
      d3Selection.selection.prototype.style.apply(getnodeEl(), args);
      return tip;
    };

    tip.direction = function (v) {
      if (!arguments.length) return direction;
      direction = v == null ? v : functor(v);

      return tip;
    };

    tip.offset = function (v) {
      if (!arguments.length) return offset;
      offset = v == null ? v : functor(v);

      return tip;
    };

    tip.html = function (v) {
      if (!arguments.length) return html;
      html = v == null ? v : functor(v);

      return tip;
    };

    tip.destroy = function () {
      if (node) {
        getnodeEl().remove();
        node = null;
      }
      return tip;
    };

    function d3TipDirection() {
      return "n";
    }
    function d3TipOffset() {
      return [0, 0];
    }
    function d3TipHTML() {
      return " ";
    }

    var directionCallbacks = d3Collection.map({
        n: directionNorth,
        s: directionSouth,
        e: directionEast,
        w: directionWest,
        nw: directionNorthWest,
        ne: directionNorthEast,
        sw: directionSouthWest,
        se: directionSouthEast,
      }),
      directions = directionCallbacks.keys();

    function directionNorth() {
      var bbox = getScreenBBox();
      return {
        top: bbox.n.y - node.offsetHeight,
        left: bbox.n.x - node.offsetWidth / 2,
      };
    }

    function directionSouth() {
      var bbox = getScreenBBox();
      return {
        top: bbox.s.y,
        left: bbox.s.x - node.offsetWidth / 2,
      };
    }

    function directionEast() {
      var bbox = getScreenBBox();
      return {
        top: bbox.e.y - node.offsetHeight / 2,
        left: bbox.e.x,
      };
    }

    function directionWest() {
      var bbox = getScreenBBox();
      return {
        top: bbox.w.y - node.offsetHeight / 2,
        left: bbox.w.x - node.offsetWidth,
      };
    }

    function directionNorthWest() {
      var bbox = getScreenBBox();
      return {
        top: bbox.nw.y - node.offsetHeight,
        left: bbox.nw.x - node.offsetWidth,
      };
    }

    function directionNorthEast() {
      var bbox = getScreenBBox();
      return {
        top: bbox.ne.y - node.offsetHeight,
        left: bbox.ne.x,
      };
    }

    function directionSouthWest() {
      var bbox = getScreenBBox();
      return {
        top: bbox.sw.y,
        left: bbox.sw.x - node.offsetWidth,
      };
    }

    function directionSouthEast() {
      var bbox = getScreenBBox();
      return {
        top: bbox.se.y,
        left: bbox.se.x,
      };
    }

    function initnode() {
      var div = d3Selection.select(document.createElement("div"));
      div
        .style("position", "absolute")
        .style("top", 0)
        .style("opacity", 0)
        .style("pointer-events", "none")
        .style("box-sizing", "border-box");

      return div.node();
    }

    function getSVGnode(element) {
      var svgnode = element.node();
      if (!svgnode) return null;
      if (svgnode.tagName.toLowerCase() === "svg") return svgnode;
      return svgnode.ownerSVGElement;
    }

    function getnodeEl() {
      if (node == null) {
        node = initnode();

        document.body.appendChild(node);
      }
      return d3Selection.select(node);
    }

    function getScreenBBox() {
      var targetel = target || d3Selection.event.target;

      while (targetel.getScreenCTM == null && targetel.parentnode == null) {
        targetel = targetel.parentnode;
      }

      var bbox = {},
        matrix = targetel.getScreenCTM(),
        tbbox = targetel.getBBox(),
        width = tbbox.width,
        height = tbbox.height,
        x = tbbox.x,
        y = tbbox.y;

      point.x = x;
      point.y = y;
      bbox.nw = point.matrixTransform(matrix);
      point.x += width;
      bbox.ne = point.matrixTransform(matrix);
      point.y += height;
      bbox.se = point.matrixTransform(matrix);
      point.x -= width;
      bbox.sw = point.matrixTransform(matrix);
      point.y -= height / 2;
      bbox.w = point.matrixTransform(matrix);
      point.x += width;
      bbox.e = point.matrixTransform(matrix);
      point.x -= width / 2;
      point.y -= height / 2;
      bbox.n = point.matrixTransform(matrix);
      point.y += height;
      bbox.s = point.matrixTransform(matrix);

      return bbox;
    }

    function functor(v) {
      return typeof v === "function"
        ? v
        : function () {
            return v;
          };
    }

    return tip;
  };
});

function removeElementsByClass(className) {
  var elements = document.getElementsByClassName(className);
  while (elements.length > 0) {
    elements[0].parentnode.removeChild(elements[0]);
  }
}

function covidWorldMap() {
  var svg = d3
    .selectAll("#mapNode")
    .attr("width", document.getElementById("covidWorldMapDiv").offsetWidth);

  svg.selectAll("*").remove();

  removeElementsByClass("d3-tip n");

  var format = d3.format(",");

  var tip = d3
    .tip()
    .attr("class", "d3-tip")
    .offset([-10, 0])
    .html(function (d) {
      return (
        "<strong>Country: </strong><span class='details'>" +
        d.properties.name +
        "<br></span>" +
        "<strong>Confirmed: </strong><span class='details'>" +
        format(d.confirmed) +
        "<br></span>" +
        "<strong>Recovered: </strong><span class='details'>" +
        format(d.recovered) +
        "<br></span>" +
        "<strong>Deaths: </strong><span class='details'>" +
        format(d.deaths) +
        "<br></span>" +
        "<strong>Active: </strong><span class='details'>" +
        format(d.confirmed - d.recovered - d.deaths) +
        "<br></span>"
      );
    });

  var margin = { top: 0, right: 0, bottom: 0, left: 10 },
    s;
  (width =
    document.getElementById("covidWorldMapDiv").offsetWidth -
    margin.left -
    margin.right),
    (height =
      document.getElementById("covidWorldMapDiv").offsetHeight -
      margin.top -
      margin.bottom);

  var color = d3
    .scaleThreshold()
    .domain([
      10000, 100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000,
      500000000, 1500000000,
    ])
    .range([
      "rgb(247,251,255)",
      "rgb(222,235,247)",
      "rgb(198,219,239)",
      "rgb(158,202,225)",
      "rgb(107,174,214)",
      "rgb(66,146,198)",
      "rgb(33,113,181)",
      "rgb(8,81,156)",
      "rgb(8,48,107)",
      "rgb(3,19,43)",
    ]);

  var path = d3.geoPath();

  zoomed = () => {
    const { x, y, k } = d3.event.transform;
    let t = d3.zoomIdentity;
    t = t.translate(x, y).scale(k).translate(50, 50);
    svg.attr("transform", t);
  };
  var zoom = d3.zoom().scaleExtent([1, 30]).on("zoom", zoomed);

  var svg = d3
    .select("#mapNode")
    .attr("width", width)
    .attr("height", height)
    .call(zoom)
    .append("g")
    .attr("class", "map")
    .append("g")
    .attr("transform", "translate(50,50)");

  var projection = d3
    .geoMercator()
    .scale(0.03939 * width + 0.104166 * height + 20)
    .translate([width / 2.3, height / 1.85]);

  var path = d3.geoPath().projection(projection);

  svg.call(tip);

  queue()
.defer(d3.json, "data/world_countries.json")
    .defer(d3.tsv, "data/world_covid.tsv")
    .await(ready);

  function ready(error, data, population) {
    var topology = topojson.topology(data.features);
    topology = topojson.presimplify(topology);

    var final_data_simplified = [];
    for (i = 0; i < data.features.length; i++) {
      final_data_simplified.push(
        topojson.feature(topology, topology.objects[i])
      );
    }
    var populationById = {};

    population.forEach(function (d) {
      populationById[d.id] = +d.confirmed;
      populationById[d.id + 1] = +d.recovered;
      populationById[d.id + 2] = +d.deaths;
    });
    final_data_simplified.forEach(function (d) {
      d.confirmed = populationById[d.id];
      d.recovered = populationById[d.id + 1];
      d.deaths = populationById[d.id + 2];
    });

    svg
      .append("g")
      .attr("class", "countries")
      .selectAll("path")
      .data(final_data_simplified)
      .enter()
      .append("path")
      .attr("d", path)
      .style("fill", function (d) {
        return color(populationById[d.id] * 100);
      })
      .style("stroke", "white")
      .style("stroke-width", 0.5)
      .style("opacity", 1)

      .style("stroke", "white")
      .style("stroke-width", 0.3)
      .on("mouseover", function (d) {
        tip.show(d);

        d3.select(this)
          .style("opacity", 0.4)
          .style("stroke", "white")
          .style("stroke-width", 3);

        d3.select(this).style("cursor", "pointer");
      })
      .on("click", function (d) {
        tip.show(d);

        d3.select(this)
          .style("opacity", 0.4)
          .style("stroke", "white")
          .style("stroke-width", 3)
          .transition()
          .duration(200)
          .style("opacity", 0.8);

        covidStats(d.properties.name);
        covidPercentage(d.properties.name);

        document.getElementById("resetButton").style.visibility = "visible";
      })
      .on("mouseout", function (d) {
        tip.hide(d);

        d3.select(this)
          .style("opacity", 1)
          .style("stroke", "white")
          .style("stroke-width", 0.3);
      });

    svg
      .append("path")
      .datum(
        topojson.mesh(final_data_simplified, function (a, b) {
          return a.id !== b.id;
        })
      )

      .attr("class", "names")
      .attr("d", path);
  }
}

function covidPercentage(country) {
  d3.tsv("data/world_population.tsv", function (data_population) {
    var width = document.getElementById("covidPercentageDiv").offsetWidth;
    var height = document.getElementById("covidPercentageDiv").offsetHeight;

    d3.selectAll("#percentNode").selectAll("*").remove();

    var svg = d3
      .selectAll("#percentNode")
      .append("g")
      .attr("width", width)
      .attr("height", height);

    d3.tsv("data/world_covid.tsv", function (data) {
      var aggregation = aggregate(data, country);

      if (country == "all") {
        var percent_of_world_infected = (aggregation[0] / 7794798739) * 100;
      } else {
        for (i = 0; i < data_population.length; i++) {
          if (data_population[i]["name"] == country) {
            var percent_of_world_infected =
              (aggregation[0] / parseInt(data_population[i]["population"])) *
              100;
          }
        }
      }

      var percent_str = (percent_of_world_infected + "").substr(0, 6) + "%";

      // Draw a line for the percentage of the world infected
      svg
        .append("line")
        .attr("x1", 0)
        .attr("y1", height - height * 0.1)
        .attr("x2", (width / 100 * percent_of_world_infected) * 10)
        .attr("y2", height - height * 0.1)
        .attr("stroke", "#1688f0")
        .attr("stroke-width", 8)
        .attr("stroke-dasharray", "2,1");

      svg
        .selectAll("#percentNode")
        .data(["text"])
        .enter()
        .append("text")
        .text(function (d) {
          if (country == "all") {
            return "3.2201%";
          }
          return percent_str;
        })
        .attr("x", 0.38 * width)
        .attr("y", 0.38 * height)
        .style("fill", "#1688f0")
        .style("font-size", "2em");

      svg
        .selectAll("#percentNode")
        .data(percent_str)
        .enter()
        .append("text")
        .text("People Infected")
        .attr("x", 0.35 * width)
        .attr("y", 0.55 * height)
        .style("fill", "#1688f0")
        .style("font-size", "1.5em");
    });
  });
}

function aggregate(json_array, country) {
  if (country == "all") {
    var total_confirmed = 0;
    var total_recovered = 0;
    var total_deaths = 0;
    for (i = 0; i < json_array.length; i++) {
      total_confirmed += parseInt(json_array[i]["confirmed"]);
      total_recovered += parseInt(json_array[i]["recovered"]);
      total_deaths += parseInt(json_array[i]["deaths"]);
    }
    var total_active = total_confirmed - total_recovered - total_deaths;
    return [total_confirmed, total_recovered, total_deaths, total_active];
  } else {
    for (i = 0; i < json_array.length; i++) {
      if (json_array[i]["name"] == country) {
        return [
          json_array[i]["confirmed"],
          json_array[i]["recovered"],
          json_array[i]["deaths"],
          json_array[i]["active"],
        ];
      }
    }
  }
}

function covidStats(country) {
  d3.selectAll("#statsNode").selectAll("*").remove();

  d3.tsv("data/world_covid.tsv", function (data) {
    var aggregation = aggregate(data, country);

    var margin = { top: 10, right: 30, bottom: 0, left: 30 },
      width =
        document.getElementById("covidStatsDiv").offsetWidth -
        margin.left -
        margin.right,
      height =
        document.getElementById("covidStatsDiv").offsetHeight * 0.8 -
        margin.top -
        margin.bottom;

    var svg = d3
      .selectAll("#statsNode")
      .append("svg")
      .attr(
        "width",
        document.getElementById("covidStatsDiv").offsetWidth +
          margin.left +
          margin.right
      )
      .attr(
        "height",
        document.getElementById("covidStatsDiv").offsetHeight * 1.2 +
          margin.top +
          margin.bottom
      )
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var domain_array = ["Confirmed", "Recovered", "Deaths", "Active"];

    var colors = [
      "rgb(30, 150, 250)",
      "rgb(30, 120, 150)",
      "rgb(30, 100, 100)",
      "rgb(30, 90, 50)",
    ];
    var x = d3.scaleBand().range([0, width]).domain(domain_array).padding(1);

    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .style("fill", "white")
      .style("stroke-width", 0.5);

    var y = d3.scaleLinear().domain([0, aggregation[0]]).range([height, 90]);

    svg
      .selectAll("myline")
      .data(aggregation)
      .enter()
      .append("line")
      .attr("x1", function (d, i) {
        return x(domain_array[i]);
      })
      .attr("x2", function (d, i) {
        return x(domain_array[i]);
      })
      .attr("y1", function (d, i) {
        return y(aggregation[i]);
      })
      .attr("y2", y(0))
      .attr("stroke", function (d, i) {
        return colors[i];
      })
      .style("stroke-width", 50);

    svg
      .selectAll("mycircle")
      .data(aggregation)
      .enter()
      .append("circle")
      .attr("cx", function (d, i) {
        return x(domain_array[i]);
      })
      .attr("cy", function (d, i) {
        return y(aggregation[i]);
      })
      .attr("r", "4")
      .style("fill", "#69b3a2")
      .attr("stroke", "black");

    svg
      .selectAll("body")
      .data(["text"])
      .enter()
      .append("text")
      .text(function (d) {
        if (country == "all") {
          return "Worldwide Stats";
        } else {
          return `${country} Stats`;
        }
      })
      .attr("x", width / 7.5)
      .attr("y", 0.2 * height)
      .style("fill", "#1688f0")
      .style("font-style", "bold")
      .style("font-size", "1.5em");
  });
}

covidWorldMap();
covidStats("all");
covidPercentage("all");

var w = window.innerWidth;
var h = window.innerHeight;
window.addEventListener("resize", function (event) {
  var new_w = window.innerWidth;
  var new_h = window.innerHeight;

  if (Math.abs(w * h - new_w * new_h) > 100000) {
    covidWorldMap();
    covidStats("all");
    covidPercentage("all");
  }
});
