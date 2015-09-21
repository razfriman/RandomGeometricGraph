var nodesCount = 40;
var radius = 200;
var boundarySize = 500;
var nodeSize = 10;
var nodes = [];

function updateGraph(graph, renderer) {

    graph.clear();
    renderer.reset();

    nodesCount = $('#nodesInput').val();
    radius = $('#radiusInput').val();
    boundarySize = $('#boundaryInput').val();
    nodeSize = $('#nodeSizeInput').val();
    nodes = [];

    for(var i = 0; i < nodesCount; ++i) {
        nodes.push({
            id: i,
            x: _.random(0,boundarySize),
            y: _.random(0,boundarySize)
        });
    }

    _.each(nodes, function(node) {
        graph.addNode(node.id, node);
    });

    for(var i = 0; i < nodesCount; ++i) {
        var point1 = nodes[i];
        for(var j = 0; j < nodesCount; ++j) {
            if(i == j) continue;

            var point2 = nodes[j];

            var dist = getDistance(point1.x, point1.y, point2.x, point2.y);

            if(dist <= radius) {
                graph.addLink(i, j);
            }
        }
    }

    renderer.moveTo(300,300);
}
function onLoad() {
    var graph = Viva.Graph.graph();
    var layout = Viva.Graph.Layout.constant(graph);
    var graphics = Viva.Graph.View.svgGraphics();

    // highlight all related links
    // when user hovers mouse over a node:
    var highlightRelatedNodes = function(nodeId, isOn) {
        // just enumerate all related nodes and update link color:
        graph.forEachLinkedNode(nodeId, function(node, link){
            var linkUI = graphics.getLinkUI(link.id);
            if (linkUI) {
                // linkUI is a UI object created by graphics below
                linkUI.attr('stroke', isOn ? 'red' : 'gray');
            }
        });
    };

    $('#nodesInput').val(nodesCount);
    $('#radiusInput').val(radius);
    $('#boundaryInput').val(boundarySize);
    $('#nodeSizeInput').val(nodeSize);



    graphics.node(function(node) {

        var ui = Viva.Graph.svg('g');

        var rect = Viva.Graph.svg('rect')
            .attr('width', nodeSize)
            .attr('height', nodeSize);
        ui.append(rect);

        $(rect).hover(function() { // mouse over
            highlightRelatedNodes(node.id, true);

            ui.append(Viva.Graph.svg('circle')
                .attr('r', radius)
                .attr('pointer-events', 'none')
                .attr('fill', 'green')
                .attr('opacity', 0.5));



        }, function() { // mouse out
            highlightRelatedNodes(node.id, false);


            console.log(ui);
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
            .attr('stroke', 'gray')
            .attr('stroke-width', 1);

    }).placeLink(function(linkUI, fromPos, toPos) {

        var data = 'M' + fromPos.x + ',' + fromPos.y +
            'L' + toPos.x + ',' + toPos.y;
        linkUI.attr("d", data);
    })

    var renderer = Viva.Graph.View.renderer(graph, {
        graphics : graphics,
        layout   : layout,
        container  : document.getElementById('graphDiv')
    });

    renderer.run();

    updateGraph(graph, renderer);


    $('#graphForm').submit(function(event) {
        // UPDATE GRAPH
        event.preventDefault();
        updateGraph(graph, renderer);

    });


}

function getDistance(x1,y1,x2,y2) {
    var x = x2-x1;
    var y = y2-y1;
    return Math.sqrt(x*x + y*y);
}