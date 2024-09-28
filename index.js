/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Jörðin (sem teningur!) snýst um sólina (stærri teningur!).
//     Tunglið snýst í kringum jörðina.
//
//    Hjálmtýr Hafsteinsson, september 2024
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numVertices  = 36;

var points = [];
var colors = [];

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var rotYear = 0.0;
var rotDay = 0.0;
var earthTilt = 23.5;

var rotHour = 0.0;  

var matrixLoc;


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation( program, "rotation" );

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (origX - e.offsetX) ) % 360;
            spinX = ( spinX + (origY - e.offsetY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );

    render();
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) 
{
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    //vertex color assigned by the index of the vertex
    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
        
    }
}


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    rotHour += 0.01

    var mv = mat4();
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) );

    // draw center of clock
    mv = mult( mv, scalem( 0.1, 0.1, 0.1 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    // draw hour hand
    mvH = mult( mv, rotateZ( rotHour ) );
    mvH = mult( mvH, translate( 6.0, 0.0, 0.0 ) );
    mvH = mult( mvH, scalem( 0.5, 0.5, 0.5 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mvH));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    // draw longer arm over the hour hand
    
    mvH1 = mult( mvH, translate( -6.0, 0.0, 0.0 ) );
    mvH1 = mult( mvH1, scalem( 12.5, 1.0, 1.0 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mvH1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );


    // draw minute hand
    var mvMin = mult( mvH, rotateZ( 60.0*rotHour) );
    mvMin = mult( mvMin, translate( 5.0, 0.0, 0.0 ) );
    mvMin = mult( mvMin, scalem( 0.9, 0.9, 0.9 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mvMin));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    // draw longer arm over the minute hand

    mvMin1 = mult( mvMin, translate( -2.5, 0.0, 0.0 ) );
    mvMin1 = mult( mvMin1, scalem( 5.5, 1.0, 1.0 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mvMin1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );


    // draw second hand

    var mvSec = mult( mvMin, rotateZ( 3600.0*rotHour ) );
    mvSec = mult( mvSec, translate( 3.0, 0.0, 0.0 ) );
    mvSec = mult( mvSec, scalem( 0.9, 0.9, 0.9 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mvSec));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );


    // draw longer arm over the second hand

    mvSec1 = mult( mvSec, translate( -1.5, 0.0, 0.0 ) );
    mvSec1 = mult( mvSec1, scalem( 4.0, 1.0, 1.0 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mvSec1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );


   



    requestAnimFrame( render );
}
