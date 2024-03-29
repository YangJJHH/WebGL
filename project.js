var gl;
var textureLoc;
var uColorLoc;
var points = [];
var normals = [];
var texCoords = [];
var moveSpeed = 0.1;
var term = 0;
var max = -90;
var tireTheta = 0;
var viewMode = 3;
var endPoint= -10;
var changeval = 0;
var Pos=[];
var GameOver = false;

var program0,program1,program2;
var modelMatrixLoc0, viewMatrixLoc0,modelMatrixLoc1, viewMatrixLoc1,modelMatrixLoc2, viewMatrixLoc2;
var vertCubeStart,numVertCubeTri, vertPyraStart,numVertPyraTri, vertGroundStart,numVertGroundTri, numVertGroundLine;
var eyePos = vec3(0.0, 1.0, 0.0);
var atPos = vec3(0.0, 1.0, -3.0);
var upVec = vec3(0.0, 1.0, 0.0);
var cameraVec = vec3(0.0, 0.0, -3.0); // 1.0/Math.sqrt(2.0)


var ambientProduct;
var diffuseProduct;
var specularProduct;

var theta = 0;
var timerID;
var totalTime;

window.onload = function init()
{
    start();
    GameOver = false;

    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if( !gl ) {
        alert("WebGL isn't available!");
    }

    generateTexGround(10);
    generateTexCube();
    generateHexaPyramid();
    


    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.4, 0.4, 0.9, 0.6);

    // Enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(0.01, 1);

    // Load shaders and initialize attribute buffers
    program0 = initShaders(gl, "colorVS", "colorFS");
    gl.useProgram(program0);

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program0, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    // Create a buffer object, initialize it, and associate it with 
    // the associated attribute variable in our vertex shader
    //var modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    modelMatrixLoc0 = gl.getUniformLocation(program0, "modelMatrix");
    //gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    //var viewMatrix = lookAt(eyePos, atPos, upVec);
    viewMatrixLoc0 = gl.getUniformLocation(program0, "viewMatrix");
    //gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));
  

    var aspect = canvas.width / canvas.height;
    var projectionMatrix = perspective(90, aspect, 0.1, 1000); 

    var projectionMatrixLoc = gl.getUniformLocation(program0, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));


    //////////////////////////////////////////////////////////
    /////////////////////// program1 : Phong shading

    program1 = initShaders(gl,"phongVS","phongFS");
    gl.useProgram(program1);

    gl.bindBuffer(gl.ARRAY_BUFFER,bufferId);
    vPosition = gl.getAttribLocation(program1,"vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var nBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program1, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    modelMatrixLoc1 = gl.getUniformLocation(program1, "modelMatrix");
    viewMatrixLoc1 = gl.getUniformLocation(program1, "viewMatrix");

    projectionMatrixLoc = gl.getUniformLocation(program1, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    
    setLighting(program1);
    ////////////////////////////////////////////////
    ///////////program2 : Texture mapping
    program2 = initShaders(gl,"texMapVS","texMapFS");
    gl.useProgram(program2);

    gl.bindBuffer(gl.ARRAY_BUFFER,bufferId);
    vPosition = gl.getAttribLocation(program2, "vPosition");
    gl.vertexAttribPointer(vPosition,4,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER,nBufferId);
    vNormal = gl.getAttribLocation(program2, "vNormal");
    gl.vertexAttribPointer(vNormal,4,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vNormal);

    var tBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,tBufferId);
    gl.bufferData(gl.ARRAY_BUFFER,flatten(texCoords),gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program2,"vTexCoord");
    gl.vertexAttribPointer(vTexCoord,2,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vTexCoord);

    modelMatrixLoc2 = gl.getUniformLocation(program2, "modelMatrix");
    viewMatrixLoc2 = gl.getUniformLocation(program2, "viewMatrix");

    projectionMatrixLoc = gl.getUniformLocation(program2, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    setLighting(program2);
    setTexture();
    for(var i=0; i<20; i++){
        Pos.push(Spawn());
        
        //console.log(coord);
    }
    render();
};
function start(){
    totalTime = 0;
    timerID = setInterval("timer()",1000);
}

function timer(){
    totalTime +=1;
    document.getElementById("time").innerText = "Time:"+totalTime;
    if(GameOver){
        clearInterval(timerID);
    }

}

window.onkeydown = function(event) {
    switch (event.keyCode) {
        case 37:    // left arrow
        case 65:    // 'A'
        case 97:    // 'a'
            var newPosX = eyePos[0] - 0.1;
            tireTheta = -20; //바퀴회전
            if (newPosX >= -4.5 ) {
                eyePos[0] = newPosX;
            } 
            break;
        case 39:    // right arrow
        case 68:    // 'D'
        case 100:   // 'd'
            var newPosX = eyePos[0] + 0.1;
            tireTheta = 20;  //바퀴회전
            if (newPosX <= 4.5) {
                eyePos[0] = newPosX;
            } 
            break;
        case 49:    // 1
            if(viewMode != 1){
                eyePos[1]+= -1.0;
                eyePos[2]+= -3.0;
                atPos[1]+= -1.0;;
                upVec = vec3(0.0, 1.0, 0.0);
                cameraVec = vec3(0.0, 0.0, -3.0); 
                viewMode = 1;
            }
            break;
        case 51:    // 3
            if(viewMode != 3){
                eyePos[1]+= 1.0;
                eyePos[2]+= 3.0;
                atPos[1]+= 1.0;;
                cameraVec = vec3(0.0, 0.0, -3.0);
                viewMode = 3;
            }
            break;
    }
    //render();
};
window.onkeyup = function(event){
    tireTheta = 0;
}

function setLighting(program) {
    var lightSrc = [0.0, 2.0, 1.0, 0.0];
    var lightAmbient = [0.4, 0.4, 0.4, 1.0];
    var lightDiffuse = [1.0, 1.0, 1.0, 1.0];
    var lightSpecular = [1.0, 1.0, 1.0, 1.0];
    
    var matAmbient = [1.0, 1.0, 1.0, 1.0];
    var matDiffuse = [1.0, 1.0, 1.0, 1.0];
    var matSpecular = [0.0, 0.0, 0.0, 1.0];
    
    ambientProduct = mult(lightAmbient, matAmbient);
    diffuseProduct = mult(lightDiffuse, matDiffuse);
    specularProduct = mult(lightSpecular, matSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "lightSrc"), lightSrc);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), ambientProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), diffuseProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), specularProduct);

    gl.uniform1f(gl.getUniformLocation(program, "shininess"), 100.0);
    gl.uniform3fv(gl.getUniformLocation(program, "eyePos"), flatten(eyePos));
    
   

};

function setTexture(){
    var image0 = new Image();
    image0.src = "../images/road1.bmp"

    var texture0 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,texture0);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, image0);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);

    var image1 = new Image();
    image1.src = "../images/crate.bmp"

    var texture1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D,texture1);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, image1);

    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);


    var image2 = new Image();
    image2.src = "../images/brick.bmp"
    var texture2 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D,texture2);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, image2);

    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);

    var image3 = new Image();
    image3.src = "../images/outdoor.bmp"
    var texture3 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D,texture3);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, image3);

    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);

    var image4 = new Image();
    image4.src = "../images/tire.bmp"
    var texture4 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D,texture4);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, image4);

    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);

    var image5 = new Image();
    image5.src = "../images/guard.bmp"
    var texture5 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D,texture5);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, image5);

    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);

    var image6 = new Image();
    image6.src = "../images/danger.bmp"
    var texture6 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D,texture6);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, image6);

    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);

}

function render() {
    if(!GameOver){
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        eyePos[2] -=moveSpeed;
        atPos[0] = eyePos[0] + cameraVec[0];
        atPos[1] = eyePos[1] + cameraVec[1];
        atPos[2] = eyePos[2] + cameraVec[2];
        var viewMatrix = lookAt(eyePos, atPos, upVec);
        gl.useProgram(program0);
        gl.uniformMatrix4fv(viewMatrixLoc0, false, flatten(viewMatrix));
        gl.useProgram(program1);
        gl.uniformMatrix4fv(viewMatrixLoc1, false, flatten(viewMatrix));
        gl.useProgram(program2);
        gl.uniformMatrix4fv(viewMatrixLoc2, false, flatten(viewMatrix));
        
        /* let currTime = new Date();
        let elapsedTime = currTime.getTime() - prevTime.getTime();
        theta += (elapsedTime / 10);
        prevTime = currTime; */
        theta += 1.0;
    
        uColorLoc = gl.getUniformLocation(program0,"uColor");
        textureLoc = gl.getUniformLocation(program2,"texture");
    
        changeObstacleCoordinate();    
        //var uColorLoc = gl.getUniformLocation(program0, "uColor");
        //var diffuseProductLoc = gl.getUniformLocation(program1, "diffuseProduct");
        //var textureLoc = gl.getUniformLocation(program2,"texture");
        
        if((atPos[2]-max)<=50){ //절반까지 왔을때 전방 맵 미리 생성
            //term = max;
            ground(term-100);
            map(term-100);
            
    
    
        }
        if(atPos[2]<=max){
            term += -100;
            max += -100;
        }
        ground(term);
        map(term);
        //////////////car
        if(viewMode ==3){
            player();
        }
        
        
    
        moveSpeed+=0.00001;
    
    }
    window.requestAnimationFrame(render);
}
function ground(term2){
        
        // draw the ground
    //gl.uniform4f(uColorLoc, 0.8, 0.8, 0.8, 1.0);    // gray
    gl.useProgram(program2);
    
    //gl.uniform4f(diffuseProductLoc,0.8,0.8,0.8,1.0);
    for(var i=0; i<5; i++){
        modelMatrix = translate(0,0,term2+(i*-20));
        gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
        gl.uniform1i(textureLoc,2);
        gl.drawArrays(gl.TRIANGLES, vertGroundStart, vertGroundStart+120*5); //한줄에 120 5줄은 120*5
        gl.uniform1i(textureLoc,0);
        gl.drawArrays(gl.TRIANGLES, vertGroundStart+120*5, vertGroundStart+120*10);
        gl.uniform1i(textureLoc,2);
        gl.drawArrays(gl.TRIANGLES, vertGroundStart+120*5+vertGroundStart+120*10, 120*5); //한줄에 120 5줄은 120*5

    }
}

function player(){
    gl.useProgram(program1);
    var diffuseProductLoc = gl.getUniformLocation(program1, "diffuseProduct");
    gl.uniform4f(diffuseProductLoc,0.0,2.0,0.0,1.0);

    console.log(atPos[2]);
    //차 본체
    modelMatrix = translate(atPos[0], -0.3, atPos[2]);
    var sMatrix = mat4(0.5,0.0,0.0,0.0 ,0.0,0.5,0.0,0.0 ,0.0,0.0,0.5,0.0 ,0.0,0.0,0.0,1.0);
    modelMatrix = mult(modelMatrix,sMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);


    modelMatrix = translate(atPos[0], 0.2, atPos[2]);
    var sMatrix = mat4(0.5,0.0,0.0,0.0 ,0.0,0.5,0.0,0.0 ,0.0,0.0,0.5,0.0 ,0.0,0.0,0.0,1.0);
    modelMatrix = mult(modelMatrix,sMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);


    gl.uniform4f(diffuseProductLoc,0.0,2.0,0.0,1.0);
    modelMatrix = translate(atPos[0], 0.0, atPos[2]);
    var sMatrix = mat4(1.0,0.0,0.0,0.0 ,0.0,0.5,0.0,0.0 ,0.0,0.0,1.0,0.0 ,0.0,0.0,0.0,1.0);
    modelMatrix = mult(modelMatrix,sMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    //후방등
    gl.uniform4f(diffuseProductLoc,2.0,0.0,0.0,1.0);
    modelMatrix = translate(atPos[0]-0.25, 0.2, atPos[2]+0.9);
    var sMatrix = mat4(0.2,0.0,0.0,0.0 ,0.0,0.1,0.0,0.0 ,0.0,0.0,0.1,0.0 ,0.0,0.0,0.0,1.0);
    modelMatrix = mult(modelMatrix,sMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    modelMatrix = translate(atPos[0]+0.25, 0.2, atPos[2]+0.9);
    var sMatrix = mat4(0.2,0.0,0.0,0.0 ,0.0,0.1,0.0,0.0 ,0.0,0.0,0.1,0.0 ,0.0,0.0,0.0,1.0);
    modelMatrix = mult(modelMatrix,sMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    
    //바퀴
    gl.useProgram(program2);
    gl.uniform1i(textureLoc,4);
    var sMatrix = mat4(0.2,0.0,0.0,0.0 ,0.0,0.3,0.0,0.0 ,0.0,0.0,0.3,0.0 ,0.0,0.0,0.0,1.0);
    modelMatrix = mult(rotateX(theta+moveSpeed),sMatrix);
    modelMatrix = mult(rotateY(tireTheta),modelMatrix);
    modelMatrix = mult(translate(atPos[0]-0.35, -0.5, atPos[2]+0.25), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    modelMatrix = mult(rotateX(theta+moveSpeed),sMatrix);
    modelMatrix = mult(rotateY(tireTheta),modelMatrix);
    modelMatrix = mult(translate(atPos[0]+0.35, -0.5, atPos[2]+0.25), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    detectCollision(atPos[0],atPos[2]);

    
}
function map(term2){
    var diffuseProductLoc = gl.getUniformLocation(program1, "diffuseProduct");
    for(var i=0; i<5; i++){
  
        var ambientProductLoc = gl.getUniformLocation(program2, "ambientProduct");
      
        //건물
        gl.useProgram(program2);
        gl.uniform1i(textureLoc,3);
        var sMatrix = mat4(2.0,0.0,0.0,0.0 ,0.0,15.0,0.0,0.0 ,0.0,0.0,9.0,0.0 ,0.0,0.0,0.0,1.0);
        modelMatrix = mult(translate(-9, -1.0, 10+term2+(i*-20)),sMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

        modelMatrix = mult(translate(9, -1.0, term2+(i*-20)),sMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);


       
        ambientProduct = mult([1.0, 1.0, 1.0, 1.0],[1.0, 1.0, 1.0, 1.0]);
        gl.uniform4fv(ambientProductLoc, ambientProduct);
        // 가드레일
        for(var k=0; k<20; k++){
            gl.uniform1i(textureLoc,5);
            modelMatrix = translate(-5, -0.5, 10+term2+(i*-20)-k);
            var sMatrix = mat4(0.3,0.0,0.0,0.0 ,0.0,0.3,0.0,0.0 ,0.0,0.0,0.8,0.0 ,0.0,0.0,0.0,1.0);
            modelMatrix = mult(modelMatrix,sMatrix);
            gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
            gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

            modelMatrix = translate(5, -0.5, 10+term2+(i*-20)-k);
            var sMatrix = mat4(0.3,0.0,0.0,0.0 ,0.0,0.3,0.0,0.0 ,0.0,0.0,0.8,0.0 ,0.0,0.0,0.0,1.0);
            modelMatrix = mult(modelMatrix,sMatrix);
            gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
            gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
        }

        ambientProduct = mult([0.4, 0.4, 0.4, 1.0],[1.0, 1.0, 1.0, 1.0]);
        gl.uniform4fv(ambientProductLoc, ambientProduct);
    }
    //장애물
    gl.uniform1i(textureLoc,6);
    for(var j =0; j<Pos.length; j++){
        modelMatrix = mult(translate(Pos[j][0],Pos[j][1],Pos[j][2]+term2),rotateZ(90));
        gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    }
}
function detectCollision(newPosX,newPosZ){
    for(var i=0; i<Pos.length; i++){
        if(Math.abs(newPosX-Pos[i][0]) < 1.0 && Math.abs(newPosZ-(Pos[i][2]+changeval)) < 1.0){
            var value = confirm("Timer record:"+totalTime+"\n게임을 다시 시작하려면 확인 버튼을 누르세요");
            if(value){
                GameOver = true;
                window.location.reload();
            }

            
        }
    }
}

function changeObstacleCoordinate(){
    if(atPos[2]<=max){
        changeval += -100;
        
    }

}

function Spawn(){
    var newPos;
    var xPos=(Math.random()*(4.5+4.5))-4.5;
    var yPos = -0.5;
    var zPos=(Math.random()*((max+100)-max))+max;
    newPos=vec3(xPos,yPos,zPos);
    return newPos;
}

function generateTexCube() {
    vertCubeStart = points.length;
    numVertCubeTri = 0;
    texQuad(1, 0, 3, 2);
    texQuad(2, 3, 7, 6);
    texQuad(3, 0, 4, 7);
    texQuad(4, 5, 6, 7);
    texQuad(5, 4, 0, 1);
    texQuad(6, 5, 1, 2);
}

function texQuad(a, b, c, d) {
    vertexPos = [
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4( 0.5, -0.5, -0.5, 1.0),
        vec4( 0.5,  0.5, -0.5, 1.0),
        vec4(-0.5,  0.5, -0.5, 1.0),
        vec4(-0.5, -0.5,  0.5, 1.0),
        vec4( 0.5, -0.5,  0.5, 1.0),
        vec4( 0.5,  0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0)
    ];

    vertexNormals = [
        vec4(-0.57735, -0.57735, -0.57735, 0.0),
        vec4( 0.57735, -0.57735, -0.57735, 0.0),
        vec4( 0.57735,  0.57735, -0.57735, 0.0),
        vec4(-0.57735,  0.57735, -0.57735, 0.0),
        vec4(-0.57735, -0.57735,  0.57735, 0.0),
        vec4( 0.57735, -0.57735,  0.57735, 0.0),
        vec4( 0.57735,  0.57735,  0.57735, 0.0),
        vec4(-0.57735,  0.57735,  0.57735, 0.0)
    ];

    var texCoord = [
        vec2(0,0),
        vec2(0,1),
        vec2(1,1),
        vec2(1,0)
    ];


    // two triangles: (a, b, c) and (a, c, d)
    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    numVertCubeTri++;

    points.push(vertexPos[b]);
    normals.push(vertexNormals[b]);
    texCoords.push(texCoord[1]);
    numVertCubeTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    numVertCubeTri++;

    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    numVertCubeTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    numVertCubeTri++;

    points.push(vertexPos[d]);
    normals.push(vertexNormals[d]);
    texCoords.push(texCoord[3]);
    numVertCubeTri++;
}

function generateTexGround(scale) {
    vertGroundStart = points.length;
    numVertGroundTri = 0;
    for(var x=-scale; x<scale; x++) {
        for(var z=-scale; z<scale; z++) {
            // two triangles
            points.push(vec4(x, -1.0, z, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(0,0));
            numVertGroundTri++;

            points.push(vec4(x, -1.0, z+1, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(1,0));
            numVertGroundTri++;

            points.push(vec4(x+1, -1.0, z+1, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(1,1));
            numVertGroundTri++;

            points.push(vec4(x, -1.0, z, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(0,0));
            numVertGroundTri++;

            points.push(vec4(x+1, -1.0, z+1, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(1,1));
            numVertGroundTri++;

            points.push(vec4(x+1, -1.0, z, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(0,1));
            numVertGroundTri++;

        }
    }
    
  /*   numVertGroundLine = 0;
    // grid lines
    for(var x=-scale; x<=scale; x++) {
        points.push(vec4(x, -1.0, -scale, 1.0));
        normals.push(vec4(0.0, 0.0, 0.0, 0.0));
        numVertGroundLine++;
        points.push(vec4(x, -1.0, scale, 1.0));
        normals.push(vec4(0.0, 0.0, 0.0, 0.0));
        numVertGroundLine++;
    }
    for(var z=-scale; z<=scale; z++) {
        points.push(vec4(-scale, -1.0, z, 1.0));
        normals.push(vec4(0.0, 0.0, 0.0, 0.0));
        numVertGroundLine++;
        points.push(vec4(scale, -1.0, z, 1.0));
        normals.push(vec4(0.0, 0.0, 0.0, 0.0));
        numVertGroundLine++;
    } */
}

function generateHexaPyramid() {
    vertPyraStart = points.length;
    const vertexPos = [
        vec4(0.0, 0.5, 0.0, 1.0),
        vec4(1.0, 0.5, 0.0, 1.0),
        vec4(0.5, 0.5, -0.866, 1.0),
        vec4(-0.5, 0.5, -0.866, 1.0),
        vec4(-1.0, 0.5, 0.0, 1.0),
        vec4(-0.5, 0.5, 0.866, 1.0),
        vec4(0.5, 0.5, 0.866, 1.0),
        vec4(0.0, -1.0, 0.0, 1.0)
    ];

    const vertexNormal = [
        vec4(0.0, 1.0, 0.0, 0.0),
        vec4(1.0, 0.0, 0.0, 0.0),
        vec4(0.5, 0.0, -0.866, 0.0),
        vec4(-0.5, 0.0, -0.866, 0.0),
        vec4(-1.0, 0.0, 0.0, 0.0),
        vec4(-0.5, 0.0, 0.866, 0.0),
        vec4(0.5, 0.0, 0.866, 0.0),
        vec4(0.0, -1.0, 0.0, 0.0)
    ];

    numVertPyraTri = 0;
    for (var i=1; i<6; i++) {
        points.push(vertexPos[0]);
        normals.push(vertexNormal[0]);
        numVertPyraTri++;
        points.push(vertexPos[i]);
        normals.push(vertexNormal[0]);
        numVertPyraTri++;
        points.push(vertexPos[i+1]);
        normals.push(vertexNormal[0]);
        numVertPyraTri++;

        points.push(vertexPos[7]);
        normals.push(vertexNormal[7]);
        numVertPyraTri++;
        points.push(vertexPos[i+1]);
        normals.push(vertexNormal[i+1]);
        numVertPyraTri++;
        points.push(vertexPos[i]);
        normals.push(vertexNormal[i]);
        numVertPyraTri++;
    }
    points.push(vertexPos[0]);
    normals.push(vertexNormal[0]);
    numVertPyraTri++;
    points.push(vertexPos[6]);
    normals.push(vertexNormal[0]);
    numVertPyraTri++;
    points.push(vertexPos[1]);
    normals.push(vertexNormal[0]);
    numVertPyraTri++;

    points.push(vertexPos[7]);
    normals.push(vertexNormal[7]);
    numVertPyraTri++;
    points.push(vertexPos[1]);
    normals.push(vertexNormal[1]);
    numVertPyraTri++;
    points.push(vertexPos[6]);
    normals.push(vertexNormal[6]);
    numVertPyraTri++;
}
