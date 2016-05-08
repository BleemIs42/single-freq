$(function(){
	var W = 100;
	var H = 80;

	var video = $('#video')[0];

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

    drawVideo();
    function drawVideo(){
    	ctxCamera.drawImage(video, 0, 0, W, H);
    	setTimeout(drawVideo, 1000 / 60);
    }

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
    var setStep = $('.phase-step').val();

    function takePhoto(){
    	step++;
    	if(step > setStep){
    		return;
    	}
    	creatGrating( ctxView, step - 1, getVideoPhoto );
    }

    // 生成光栅: phase = 1, 2, 3, 4
    function creatGrating(ctx, phase, cb){
    	var f = parseInt( $('.freq').val() ) || 1;
    	var w = parseInt( $('.width').val() ) || 100;
    	var h = parseInt( $('.height').val() ) || 80;

    	var img = ctx.createImageData(W, H);

    	for(var i = 0; i < h; i++){
	    	for(var j = 0; j < w * 4; j += 4 ){
	    		for(var k = 0; k < 3; k++){
	    			img.data[i*w*4+j+k] = 127.5 + 127.5 * Math.cos( j / f * 2 * Math.PI + Math.PI * phase / 2);
	    		}
	    		img.data[i*w*4+j+3] = 255;
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

    // 抓取视频快照, 保存图片像素数据
    function getVideoPhoto(){
    	var img = new Image();
    	img.onload = function(){
    		$('.photos').append(img);    		  		
    	}
    	img.src = camera.toDataURL("image/png");
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
    		console.log(frontImgList);
    		console.log(backImgList);
    		console.log(objImgList);
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