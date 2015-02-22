/**
 *
 * Created by pers on 20/02/15.
 */

/* Get canvas on load */
var context;
var canvas;

$( document ).ready(function() {
    canvas = document.getElementById('lsystem');
    context = canvas.getContext("2d");

    if (canvas.addEventListener) {
        canvas.addEventListener("mousewheel", MouseWheelHandler, false);
        canvas.addEventListener("mousedown", MouseDownHandler, false);
        canvas.addEventListener("mouseup", MouseUpHandler, false);
        canvas.addEventListener("mousemove", MouseMoveHandler, false);
    }
});




/* L-system data */
var variable_map = {};
var constant_map = {};
var rule_map = {};
var start = "";
var iter = 0;
var contex_line_data;

/* Mouse event data */
var pan_context = false;
var pan_dx = 0;
var pan_dy = 0;
var canvas_scale = 1.0;

/* Listen on scroll events */
function MouseWheelHandler(e) {
    // Prevent page from scrolling
    e.preventDefault();

    console.log(e.layerX + ' ' + e.layerY);

    /* Calculate scale */
    var scaleBy = e.wheelDeltaY/1000;

    /* Save scale for scrolling */
    canvas_scale *= 1+scaleBy;

    /* Translate and scale context */
    context.translate(e.layerX, e.layerY);
    context.scale(1+scaleBy, 1+scaleBy);
    context.translate(-e.layerX, -e.layerY);

    redraw(contex_line_data);
}

/* Listen for mouse up events */
function MouseDownHandler(e) {
    pan_context = true;
    pan_dx = e.x;
    pan_dy = e.y;
}

/* Listen for mouse up events */
function MouseUpHandler(e) {
    pan_context = false;
}

/* Listen for mouse move */
function MouseMoveHandler(e) {
    if (pan_context == true) {
        // Pan ccording to delta x, y and scale of canvas
        var panx = (e.x - pan_dx)/canvas_scale;
        var pany = (e.y - pan_dy)/canvas_scale;

        context.translate(panx, pany);
        redraw(contex_line_data);

        pan_dx = e.x;
        pan_dy = e.y;
    }
}


/* Check if a variable or a constant is a legal command */
function checkIfValidCommand(command) {

    var valid_commands = /df|mf|al[0-9]+|ar[0-9]|none+/i;

    if (valid_commands.test(command)) {
        return true;
    } else {
        console.log("Unknown command: " + command);
        return false;
    }
}

/* Parse input data */
function parseVariables(str, map) {

    if (str == null) {
        return;
    }

    var re = /(.+)=(.+)/;
    var res = str.split(';');

    for (var i = 0; i < res.length; i++) {
        var command = re.exec(res[i]);

        if (command != null && checkIfValidCommand(command[2])) {
            map[command[1]] = command[2];
        } else {
            console.log('WRONG!');
            return false
        }
    }
}

/* Parse input rules */
function parseRules(str, map) {

    if (str == null) {
        return;
    }

    var re = /(.+)->(.+)/;
    var res = str.split(';');

    for (var i = 0; i < res.length; i++) {
        var command = re.exec(res[i]);

        if (command != null) {
            map[command[1]] = command[2];
        } else {
            console.log('WRONG!');
            return false
        }
    }
}

/* Run rules on the start data */
function runRules(vmap, cmap, rmap, start, n) {

    var start_str = start;
    var result = "";

    for (var j = 0; j < n; j++) {
        for (var i = 0; i < start_str.length; i++) {
            // No rule found
            if (rmap[start_str[i]] == null) {
                result += start_str[i];
            } else {
                result += rmap[start_str[i]];
            }
        }
        start_str = result;
        result = "";
    }

    return start_str;
}


lsystemModule.controller('indexController', function ($scope) {


    $scope.setDefaultData = function () {
        $scope.inputVariables = "F=DF";
        $scope.inputConstants = "+=AL90;-=AR90";
        $scope.inputStart = "F";
        $scope.inputRules = "F->F+F-F-F+F";
        $scope.inputIterations= 1;
    };

    $scope.clearInput = function() {
        $scope.inputVariables = "";
        $scope.inputConstants = "";
        $scope.inputStart = "";
        $scope.inputRules = "";
        $scope.inputIterations="";
    };

    $scope.parseInput = function () {
        variable_map = {};
        constant_map = {};

        parseVariables($scope.inputVariables, variable_map);
        parseVariables($scope.inputConstants, constant_map);
        parseRules($scope.inputRules, rule_map);
        start = $scope.inputStart;
        iter = $scope.inputIterations;

        console.log(variable_map);
        console.log(constant_map);
        console.log(start);
        console.log(rule_map);


        var complete_str = runRules(variable_map, constant_map, rule_map, start, iter);
        draw(translateToRules(complete_str));

    }


});

// Translate string to draw rules
function translateToRules(pattern) {

    var commandString = "";

    for (var i = 0; i < pattern.length; i++) {
        // Variable match
        if (variable_map[pattern[i]] != null) {
            console.log(pattern[i]);
            commandString += variable_map[pattern[i]] + ";"
        } else if (constant_map[pattern[i]] != null) { // Constant match
            commandString += constant_map[pattern[i]] + ";"
        }
    }

    return commandString;
}

function pointOnCircle(cx, cy, r, a) {
    x = cx + r * Math.cos(a);
    y = cy + r * Math.sin(a);
    return [x, y];
}

function getAngle(str) {
    var re = /(AL)([0-9]+)|(AR)([0-9]+)/g;
    var cmd = re.exec(str);
    if (cmd != null) {
        // AL match
        if (cmd[1] != null) {
            return [cmd[1], cmd[2]];
        }
        // AR match
        if (cmd[3] != null) {
            return [cmd[3], cmd[4]];
        }
    } else {
        return null;
    }
}

function toRad(degrees) {
    return degrees * (Math.PI/180);
}

/* Canvas functions ,*/
function draw(ruleStr) {

    if (ruleStr == null) {
        return;
    }

    var height = canvas.height;
    var width = canvas.width;
    var step = 20;
    var new_val = [];

    var x = width/2;
    var y = height/2;

    contex_line_data = ruleStr;

    /* Create rule array */
    rules = ruleStr.split(';');
    //console.log(rules);

    // Start drawing to the left at a 90 degree angle
    var angle = 2 * Math.PI;

    // Clear the canvas
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();

    // Begin drawing
    context.beginPath();
    context.moveTo(x, y);
    for (var i = 0; i < rules.length; i++) {
        // Empty string
        if (rules[i] == "") {
            continue;
        } else if (rules[i].toUpperCase() == 'DF') { // Draw forward
            // Find new value
            new_val = pointOnCircle(x, y, step, angle);

            // Draw line
            context.lineTo(new_val[0], new_val[1]);

            // Update old values
            x = new_val[0];
            y = new_val[1];
        } else if (rules[i].toUpperCase() == 'MF') { // Move forward
            // Find new value
            new_val = pointOnCircle(x, y, step, angle);

            // Move point
            context.moveTo(new_val[0], new_val[1]);

            // Update old values
            x = new_val[0];
            y = new_val[1];
        } else if (rules[i].toUpperCase() == "NONE") { // Do nothing
            continue;
        } else { // Angle
            var cmd = getAngle(rules[i].toUpperCase());

            if( cmd[0].toUpperCase() == 'AR') {
                angle += toRad(cmd[1]);
            } else if ( cmd[0].toUpperCase() == 'AL') {
                angle -= toRad(cmd[1]);
            }
        }
    }

    context.stroke();
}

/* Redraw */
function redraw() {
    draw(contex_line_data);
}
