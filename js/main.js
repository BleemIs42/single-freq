$(function(){
	var scale = 5;
	var W = 100 * scale;
	var H = 80 * scale;
	var PI = Math.PI;

	var video = $('#video')[0];
	// $('video').attr({
	// 	'width': W,
	// 	'height': H
	// })

    var canvas = $('#canvas')[0];
    var ctxView = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;

    var camera = $('#camera')[0];
    var ctxCamera = camera.getContext('2d');
    camera.width = W;
    camera.height = H;

    navigator.getUserMedia = (navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia);
    if (navigator.getUserMedia) {
        navigator.getUserMedia(
            {video: true },
            function (localMediaStream) {
                video.src = window.URL.createObjectURL(localMediaStream);
            },
            function () {}
        );
    } else {
        alert('getUserMedia Not Support!');
    }

    // drawVideo(ctxView);

    var timer;
    function drawVideo(ctx){
    	clearTimeout(timer);
    	ctx.drawImage(video, 0, 0, W, H);
    	timer = setTimeout(function(){
    		drawVideo(ctx);
    	}, 1000 / 60);
    }

    var currentCanvas = canvas;
    var toggle = false;
    $('.toggle').on('click', function(){
    	if(toggle){
    		currentCanvas = canvas;
    		drawVideo(ctxCamera);
			ctxView.clearRect(0, 0, W, H);
    	}else{
    		currentCanvas = camera;
    		drawVideo(ctxView);
    	}
    	toggle = !toggle;
    })

    $('.step-grating').on('click', function(){
    	takePhoto();
    });

    $('.auto-grating').on('click', function(){
    	var timer = setInterval(function(){
    		if(step > setStep){
    			clearInterval(timer);
    		}
    		takePhoto();
    	}, 1000);
    })

    $('#select').on('click', function(){
    	step = 0;
    })

    // 相移步数
    var step = 0;
    // 第几组图    1:标定前   2:标定后   3:物体
    var times = 1;
    var setStep = 4;

    function takePhoto(){
    	step++;
    	if(step > setStep){
    		return;
    	}
    	creatGrating( ctxView, step - 1, getVideoPhoto );
    }

    // 生成光栅: phase = 1, 2, 3, 4
    function creatGrating(ctx, phase, cb){
    	if(toggle){
    		cb();
    		return;
    	}

    	var f = parseInt( $('.freq').val() ) || 1;
    	var w = scale * parseInt( $('.width').val() ) || 100;
    	var h = scale * parseInt( $('.height').val() ) || 80;

    	var img = ctx.createImageData(W, H);

    	for(var i = 0; i < h; i++){
	    	for(var j = 0; j < w * 4; j += 4 ){
	    		var n = i * w * 4 + j;
	    		for(var k = 0; k < 3; k++){
	    			img.data[n+k] = 127.5 + 127.5 * Math.cos( (j / f * 2 +  phase / 2) * PI);
	    		}
	    		img.data[n+3] = 255;
	    	}
    	}

		ctx.clearRect(0, 0, W, H);
    	ctx.putImageData(img, 0, 0, 0, 0, W, H);

    	setTimeout(function(){
    		cb();
    	}, 300)
    }

    var tempImgList = [];
    var frontImgList = [];
    var backImgList = [];
    var objImgList = [];

    // 抓取视频或显示区域的快照, 保存图片像素数据
    function getVideoPhoto(){

    	var img = new Image();
    	img.onload = function(){
    		$('.photos').append(img);    		  		
    	}
    	img.src = canvas.toDataURL("image/png");
    	tempImgList.push( getImgPiexlData(img) );

    	var val = parseInt( $('#select').val() );
    	if(tempImgList.length == 4){
    		if(val == 1){
    			frontImgList = tempImgList;
    		}else if(val == 2){
    			backImgList = tempImgList;
    		}else if(val == 3){
    			objImgList = tempImgList;
    		}
    		tempImgList = [];
    	}
    }

    function getImgPiexlData(img){
    	var tempCanvas = $('<canvas/>')[0];
    	var tempCtx = tempCanvas.getContext('2d');
    	tempCanvas.width = W;
    	tempCanvas.height = H;
    	tempCtx.drawImage(img, 0, 0);
    	return tempCtx.getImageData(0, 0, W, H).data;
    }

    $('.untiephase').on('click', function(){
    	untiePhase();
    })

    // 解相位
    function untiePhase(){
    	var I1, I2;


    	I1 = imgSubtract( frontImgList[3],  frontImgList[1] );
    	I2 = imgSubtract( frontImgList[0],  frontImgList[2] );
    	frontImgList = getPhase( I1, I2);

    	I1 = imgSubtract( backImgList[3],  backImgList[1] );
    	I2 = imgSubtract( backImgList[0],  backImgList[2] );
    	backImgList = getPhase( I1, I2);

    	// I1 = imgSubtract( objImgList[3],  objImgList[1] );
    	// I2 = imgSubtract( objImgList[0],  objImgList[2] );
    	// objImgList = getPhase( I1, I2);

    	// frontImgList = getPhase( 
    	// 	imgSubtract( frontImgList[3],  frontImgList[1] ), 
    	// 	imgSubtract( frontImgList[0],  frontImgList[2] ) 
    	// );

    	// backImgList = getPhase( 
    	// 	imgSubtract( backImgList[3],  backImgList[1] ),  
    	// 	imgSubtract( backImgList[0],  backImgList[2] ) 
    	// );

    	// objImgList = getPhase( 
    	// 	imgSubtract( objImgList[3],  objImgList[1] ),  
    	// 	imgSubtract( objImgList[0],  objImgList[2] ) 
    	// );

    	showImgData(ctxView, frontImgList);
    	showImgData(ctxView, backImgList);
    	showImgData(ctxView, objImgList);
    }

    // 图片相减
    function imgSubtract(I1, I2){
    	if(!I1 || !I1.length || !I2 || !I2.length) return;

    	var I = [];
    	for(var i = 0; i < H; i++){
	    	for(var j = 0; j < W * 4; j += 4 ){
	    		var n = i * W * 4 + j;
	    		for(var k = 0; k < 3; k++){
	    			I[n+k] = I1[n+k] - I2[n+k];
	    		}
	    		I[n+3] = 255;
	    	}
    	}
    	return I;
    }

    // Φ = arctan( I1=(I4 - I2) / I2=(I1 - I3) )
    function getPhase(I1, I2){
    	if(!I1 || !I1.length || !I2 || !I2.length) return;

    	var I = [];
    	for(var i = 0; i < H; i++){
	    	for(var j = 0; j < W * 4; j += 4 ){
	    		var n = i * W * 4 + j;
	    		for(var k = 0; k < 3; k++){

	    			//貌似有点问题，好像是边界判断
	    			// if( I1[n+k] >= 0 && I2[n+k] == 0 ){
	    			// 	I[n+k] = PI / 2;
	    			// }else if( I1[n+k] < 0 && I2[n+k] == 0 ){
	    			// 	I[n+k] = PI * 3 / 2;
	    			// }else if( I1[n+k] >= 0 && I2[n+k] > 0 ){
	    			// 	I[n+k] = Math.atan( I1[n+k] / I2[n+k] )
	    			// }else if( I1[n+k] >= 0 && I2[n+k] < 0 ){
	    			// 	I[n+k] = Math.atan( I1[n+k] / I2[n+k] ) + PI;
	    			// }else if( I1[n+k] < 0 && I2[n+k] < 0 ){
	    			// 	I[n+k] = Math.atan( I1[n+k] / I2[n+k] ) + PI;
	    			// }else{
	    			// 	I[n+k] = Math.atan( I1[n+k] / I2[n+k] ) + 2 * PI;
	    			// }

	    			// 第一二象限  atan2(y, x):返回从 x 轴到点 (x,y) 的角度
	    			if( I2[n+k] >= 0 ){
	    				I[n+k] = Math.atan2( I2[n+k], I1[n+k] );
	    			}else{
	    				I[n+k] = Math.atan2( I2[n+k], I1[n+k] ) + 2 * PI;
	    			}

	    			I[n+k] = I[n+k] / 2 / PI * 255;
	    		}
	    		I[n+3] = 255;
	    	}
    	}

    	return I;
    }

    function showImgData(ctx, data){
    	if(!data || !data.length) return;

    	var imgData = ctx.createImageData(W, H);
    	// 直接赋值不行，并不知道原因，所以用循环,
    	// canvas像素自动向上取整了
    	var len = data.length;
    	var max = 0;
    	for(var l = 0; l < len; l++){
    		if(data[l] > max){
    			max = data[l];
    		}
    	}
    	// var max = Math.max.apply(this, data);

    	for(var i = 0; i < len; i += 4){    		
    		for(var j = 0; j < 3; j++){
    			imgData.data[i+j] = Math.round(data[i]) / max * 255;
    		}
    		imgData.data[i+3] = 255;
    	}

    	ctx.clearRect(0, 0, W, H);
    	ctx.putImageData(imgData, 0, 0, 0, 0, W, H);

    	var img = new Image();
    	img.onload = function(){
    		$('.photos').append(img);		  		
    	}
    	img.src = canvas.toDataURL("image/png");
    }

    $('.unwrapper').on('click', function(){
    	unwrapping(frontImgList);
    })
    //解包裹
    function unwrapping(I){
    	if(!I.length) return;

    	for(var i = 0; i < H; i++){
	    	var grade = 0;
	    	for(var j = 0; j < (W-1) * 4; j += 4 ){
	    		var n = i * W * 4 + j;
	    		var m = Math.abs( I[n] - I[n+4] );

	    		if(m > 128){	    			
	    			grade ++;
	    		}

	    		for(var k = 0; k < 3; k++){
	    			tempImgList[n+k] = I[n+k] + 255 * grade;
	    		}

	    		tempImgList[n+3] = 255;
	    	}
    	}
    	showImgData(ctxView, tempImgList);
    }

    $('.imgs').on('change', function(e){
    	var self = $(this)[0];
    	var len = self.files.length;

    	// if(len !== 4) return;
    	if(len === 0) return;

    	for(var i = 0; i < len; i++){
    		(function(j){
    			var fileReader = new FileReader();
				fileReader.readAsDataURL(self.files[j]);
				fileReader.onload = function(e){
					img = new Image();
					img.src = e.target.result;
					img.onload = function(){
						console.log(img)
					}
				}
    		})(i)
    	}
    });

    

})