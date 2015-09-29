var nodeCount = 40;
var radius = 200;
var boundarySize = 500;
var nodeSize = 10;

var nodes = [];
var rggLinks = [];
var convexHullLinks = [];
var rggLinksAdjacencyList = {};

function cross(o, a, b) {
    var result = (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    return result;
}

/**
 * @param points An array of [X, Y] coordinates
 */
function convexHull(points) {

    var lower = [];
    for (var i = 0; i < points.length; i++) {
        var p = points[i];
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
            lower.pop();
        }
        lower.push(p);
    }


    var upper = [];
    for (var i = points.length - 1; i >= 0; i--) {
        var p = points[i];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
            upper.pop();
        }
        upper.push(p);
    }

    upper.pop();
    lower.pop();

    var combined = lower.concat(upper);
    return combined;
}



function updateGraph(graph, renderer) {

    graph.clear();
    renderer.reset();

    nodeCount = $('#nodesInput').val();
    radius = $('#radiusInput').val();
    boundarySize = $('#boundaryInput').val();
    nodeSize = $('#nodeSizeInput').val();
    nodes = [];

    for(var i = 0; i < nodeCount; i++) {
        nodes.push({
            x: _.random(0,boundarySize),
            y: _.random(0,boundarySize)
        });
    }

    //nodes = _.sortBy(nodes, 'x');
    nodes = _.sortByAll(nodes, ['x','y']);

    _.each(nodes, function(node, index) {
        node.id = index;
        graph.addNode(node.id, node);
    });

    var hullNodes = convexHull(nodes);

    convexHullLinks = [];

    for(var i = 0; i < hullNodes.length; i++) {


        var node1 = hullNodes[i];
        var node2 = hullNodes[(i + 1) % hullNodes.length];

        var l = graph.addLink(node1.id, node2.id, {isHull: true});
        convexHullLinks.push(l);

    }

    rggLinks = [];

    for(var i = 0; i < nodeCount; i++) {
        var point1 = nodes[i];
        for(var j = 0; j < nodeCount; j++) {
            if(i == j) continue;

            var point2 = nodes[j];

            var dist = getDistance(point1.x, point1.y, point2.x, point2.y);

            if(dist <= radius) {

                var l = graph.addLink(point1.id, point2.id, {isHull: false});
                rggLinks.push(l);

                var point1List = rggLinksAdjacencyList[point1.id];
                if(!point1List) {
                    rggLinksAdjacencyList[point1.id] = [];
                }
                rggLinksAdjacencyList[point1.id].push(point2.id);
            }
        }
    }

    //console.log(rggLinksAdjacencyList);

    var maxDegree = 0;
    var maxDegreeNode = null;

    var minDegree = -1;
    var minDegreeNode = null;
    _.forOwn(rggLinksAdjacencyList, function(list, nodeId) {
        var length = list.length;

        if(length > maxDegree) {
            maxDegree = length;
            maxDegreeNode = nodeId;
        }

        if(length >= 0 && (minDegree == -1 || length < minDegree)) {
            minDegree = length;
            minDegreeNode = nodeId;
        }
    });


    console.log('Min Degree: ', minDegree);
    console.log('Min Degree Node: ', minDegreeNode);
    console.log('Min Degree Links: ', rggLinksAdjacencyList[minDegreeNode]);


    console.log('Max Degree: ', maxDegree);
    console.log('Max Degree Node: ', maxDegreeNode);
    console.log('Max Degree Links: ', rggLinksAdjacencyList[maxDegreeNode]);

    // Center the view
    renderer.moveTo(boundarySize / 2,boundarySize / 2);
}
function onLoad() {
    var graph = Viva.Graph.graph();
    var layout = Viva.Graph.Layout.constant(graph);
    var graphics = Viva.Graph.View.svgGraphics();

    // highlight all related links
    // when user hovers mouse over a node:
    var highlightRelatedNodes = function(nodeId, isOn) {

        var baseNodeUI = graphics.getNodeUI(nodeId);
        if(baseNodeUI) {

            var mainNode = baseNodeUI.childNodes[0];
            var circleOverlay = baseNodeUI.childNodes[1];

            mainNode.attr('stroke', isOn ? 'green' : 'black')

            if (isOn && !circleOverlay) {
                baseNodeUI.append(Viva.Graph.svg('circle')
                    .attr('r', radius)
                    .attr('pointer-events', 'none')
                    .attr('fill', 'red')
                    .attr('opacity', 0.01));
            } else if (!isOn && circleOverlay) {
                circleOverlay.remove();
            }
        }

            // just enumerate all related nodes and update link color:
        graph.forEachLinkedNode(nodeId, function(node, link){
            var linkUI = graphics.getLinkUI(link.id);
            if (linkUI) {
                // linkUI is a UI object created by graphics below
                linkUI.attr('stroke', isOn ? 'red' : (link.data.isHull ? 'blue' : 'gray'));
            }

            var nodeUI = graphics.getNodeUI(node.id);
            if(nodeUI) {
                var nodeRect = nodeUI.childNodes[0];
                nodeRect.attr('stroke', isOn? 'red' : 'black');
            }



        });
    };

    var params = getQueryParams();

    if(params) {
        if(params.nodeCount) {
            nodeCount = params.nodeCount;
        }
        if(params.radius) {
            radius = params.radius;
        }
        if(params.boundarySize) {
            boundarySize = params.boundarySize;
        }
        if(params.nodeSize) {
            nodeSize = params.nodeSize;
        }

    }

    $('#nodesInput').val(nodeCount);
    $('#radiusInput').val(radius);
    $('#boundaryInput').val(boundarySize);
    $('#nodeSizeInput').val(nodeSize);


    var selectedNode = null;

    /*
    Mobile doesn't accept the click event
    $('#graphDiv').on('click',function() {
        console.log('tap');
        if(selectedNode) {
            highlightRelatedNodes(selectedNode.id, false);
        }
    });
     */

    graphics.node(function(node) {

        var ui = Viva.Graph.svg('g');

        var rect = Viva.Graph.svg('rect')
            .attr('width', nodeSize)
            .attr('height', nodeSize)
            .attr('stroke-width', 3)
            .attr('stroke', 'black');
        ui.append(rect);

        /*
         Mobile doesn't accept the click event
        $(rect).click(function(event) {
            highlightRelatedNodes(node.id, true);
            selectedNode = node;
            event.stopPropagation();
            return true;
        });
        */

        $(rect).hover(function() { // mouse over
            highlightRelatedNodes(node.id, true);

            ui.append(Viva.Graph.svg('circle')
                .attr('r', radius)
                .attr('pointer-events', 'none')
                .attr('fill', 'red')
                .attr('opacity', 0.1));



        }, function() { // mouse out
            highlightRelatedNodes(node.id, false);
            ui.childNodes[1].remove();

        });
        return ui;
    }).placeNode(function(nodeUI, pos) {
        nodeUI.attr('transform',
            'translate(' +
            (pos.x - nodeSize/2) + ',' + (pos.y - nodeSize/2) +
            ')');
    });

    layout.placeNode(function(node) {
        return nodes[node.id];
    });

    graphics.link(function(link){
        return Viva.Graph.svg('path')
            .attr('stroke', link.data.isHull ? 'blue' : 'gray')
            .attr('stroke-width', '1');

    }).placeLink(function(linkUI, fromPos, toPos) {

        var data = 'M' + fromPos.x + ',' + fromPos.y +
            'L' + toPos.x + ',' + toPos.y;
        linkUI.attr("d", data);
    })

    var renderer = Viva.Graph.View.renderer(graph, {
        graphics : graphics,
        layout   : layout,
        interactive: 'scroll drag',
        container  : document.getElementById('graphDiv')
    });

    renderer.run();

    updateGraph(graph, renderer);


    $('#graphForm').submit(function(event) {
        // UPDATE GRAPH
        event.preventDefault();
        updateGraph(graph, renderer);
    });

    $('#showRGGLinks').click(function(event) {

        var isChecked = $('#showRGGLinks').prop("checked");

        _.each(rggLinks, function(link) {
            var linkUI = graphics.getLinkUI(link.id);
            linkUI.attr('stroke-width', isChecked ? '1' : '0');
        });
    });

    $('#showConvexHullLinks').click(function(event) {

        var isChecked = $('#showConvexHullLinks').prop("checked");

        _.each(convexHullLinks, function(link) {
            var linkUI = graphics.getLinkUI(link.id);
            linkUI.attr('stroke-width', isChecked ? '1' : '0');
        });
    });


}

function getDistance(x1,y1,x2,y2) {
    var x = x2-x1;
    var y = y2-y1;
    return Math.sqrt(x*x + y*y);
}

/**
 * Parse query string.
 * ?a=b&c=d to {a: b, c: d}
 * @param {String} (option) queryString
 * @return {Object} query params
 */
function getQueryParams(queryString) {
    var query = (queryString || window.location.search).substring(1); // delete ?
    if (!query) {
        return false;
    }
    return _
        .chain(query.split('&'))
        .map(function(params) {
            var p = params.split('=');
            return [p[0], decodeURIComponent(p[1])];
        })
        .object()
        .value();
}