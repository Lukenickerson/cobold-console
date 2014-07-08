
function ConsoleClass () 
{
	if (typeof $ === 'undefined') {
		console.error("Cobold Console won't work because jQuery is not loaded (as $) first.");
		return;
	}
	//====Elements
    this.$elt 			= $('#console');
    this.elt 			= this.$elt[0];
    this.$inputElt 		= this.$elt.find('#consoleInput');
    this.inputElt 		= this.$inputElt[0];
    this.$inputForm 	= this.$inputElt.find('form').first();
    this.$inputTextArea = this.$inputForm.find('textarea').first();
    this.$outputElt 	= this.$elt.find('#consoleOutput');
    this.outputElt 		= this.$outputElt[0];
	//====Other Vars
    this.size = { x : 50, y : 50 };
    this.html = "";
    this.lines = [];    // Output content
    this.queue = [];    // Actions
    this.queueTimerId = 0;
    this.queueDelayTime = 20;
    this.submitCallback = function(){ return "Ok"; };
    this.inputTypeIndex 	= 0;
	this.lastInputTypeIndex = 0;
	this.inputTypeArray 	= ["none", "text+enter", "one-character"];
    
    
    /* *** TO DO:
        [X] fix .add
        [X] toggle for accepting one-character inputs vs. text+enter
		[X] make addText break lines automatically
        .addDelay function
        [X] .collapse Queue
        .show/hide/stop/startInput - blue and hide input elt
        */
    
    
    

    this.add = function (what) 
    {
        switch (typeof what) {
            case 'object':
				if (Array.isArray(what)) {
					//^ note http://stackoverflow.com/a/4775741/1766230
					this._mergeToQueue(what);
				} else {
					this._addToQueue(what);
				}
                break;
			case 'symbol':
            case 'string':
                this.addLine(what);
                break;
			case 'function': 
				this._addToQueue(what);
				break;				
            case 'undefined':
                return this;
                break;
            default:
                this.addLine(what.toString());
        }
        this.refresh();
        return this;        
    }
    
    this.addNewLine = function () {
		this._addToQueue('\n');
		return this;
    }   
    
    this.addLine = function (t) {
        this.addText(t);
		//this.addNewLine();
        return this;
    }
    
    this.addText = function (t) {
		this._addToQueue(t);
        return this;
	}

	//================ QUEUE
	
    this.startQueue = function () {
        if (this.queueTimerId == 0) this.processQueue();
    }
    
    this.processQueue = function (delayTime) {
        var o = this;
        if (typeof delayTime === 'undefined') {
            delayTime = o.queueDelayTime;
        }
		//console.log("Q:", o.queue, delayTime);
        if (o.queue.length > 0) {
            this.queueTimerId = setTimeout(function(){
                var topOfQueue = o.queue[0];
                var removeTop = true;
                switch (typeof topOfQueue) {
                    case "function":
                        topOfQueue();
                        break;
					case "number":
						topOfQueue = '' + topOfQueue;
						//topOfQueue = '' + String.fromCharCode(topOfQueue);
						// ^*** Necessary?
                    case "string":
						// If the first character is a backslash, 
						// then look at 2 characters
                        if (topOfQueue.substr(0,1) == '\\') { 
                            var charsToUse = 2; 
                        } else {
                            var charsToUse = 1;
                        }
						// If the length of this string is longer than what we're
						// looking at...
                        if (topOfQueue.length > charsToUse) {
                            o._addStringToLine(topOfQueue.substr(0,charsToUse));
                            o.queue[0] = topOfQueue.substr(charsToUse);
                            removeTop = false;
                        } else {
                            o._addStringToLine(topOfQueue);
							o._addNewLine();
                        }
                        break;
                    case "object":
						// *** do anything special with arrays?
					
						if (typeof topOfQueue.inputTypeIndex === "number") {
							o._setInputType(topOfQueue.inputTypeIndex);
						}
						if (typeof topOfQueue.queueDelayTime === "number") {
							o._setQueueDelayTime(topOfQueue.queueDelayTime);
						}						
                        // *** allow delays, etc.
                        break;
                }
                if (removeTop) {
                    var topRemoved = o.queue.shift();
                }
                o.refresh();
                o.processQueue();
            }, delayTime);
            
        } else {
            o.queueTimerId = 0;         
        }
        return this;        
    }
    
	this._addToQueue = function (x) {
		this.queue.push(x);
		this.startQueue();
	}
	
	this._mergeToQueue = function (x) {
		this.queue = this.queue.concat(x);
		this.startQueue();
	}	

	//======== Queue Timing
	
	this.rush = function (rushTime) {
		if (typeof rushTime === 'undefined') rushTime = 0;
		// Set the delay time to zero for now
		// and when the queue is 
		this._addToQueue({ "queueDelayTime" : this.queueDelayTime });
		this._setQueueDelayTime(rushTime);
		return this;
	}
	
	this.addDelay = function (delayTime) {
		this._addToQueue({ "queueDelayTime" : delayTime });
		this._addToQueue({ "queueDelayTime" : this.queueDelayTime });
		return this;
	}
	
	this._setQueueDelayTime = function (dt) {
		this.queueDelayTime = dt;
	}
	
	//================ SCREEN
    
    this.clear = function () {
        this.lines = [{ "text" : "" }];
        this.html = "";       
        this.refresh();
        return this;        
    }
    
    this.refresh = function () {
        this._buildHtml();
        this.outputElt.innerHTML = this.html;
        this.elt.scrollTop = this.elt.scrollHeight;        
        return this;
    }
	
	this.setPrompt = function (t) {
		if (typeof t === 'undefined') t = "&gt;";
		var $label = this.$inputForm.find('label');
		console.log(t, t.length);
		if (t.substr(0,1) != "&" && t.length > 1) {
			$label.addClass("long");
		} else {
			$label.removeClass("long");
		}
		$label.html(t);
		
		return this;
	}
    
	
	//================ INPUT
	
	this.acceptTextEnterInput = function() {
		this._addToQueue({ "inputTypeIndex" : 1 });
		return this;
	}
	
	this.acceptOneCharacterInput = function() {
		this._addToQueue({ "inputTypeIndex" : 2 });
		return this;
	}
	
    this.stopInput = function(){
		this._addToQueue({ "inputTypeIndex" : 0 });
		return this;
    }
	
	this.startInput = function(){
		if (this.lastInputTypeIndex > 0) {
			this._addToQueue({ "inputTypeIndex" : this.lastInputTypeIndex });
		} else {
			this._addToQueue({ "inputTypeIndex" : 1 });
		}
		return this;
	}
	
	this.clearInput = function() {
		this.$inputTextArea.val('');
		this.$inputTextArea.css("height", "1em");
		return this;
	}	
	
	this._setInputType = function (i) {
		if (i > 0) {
			this.$inputElt.show();
			this.$inputTextArea.focus(); 
		} else {
			this.$inputElt.hide();
		}
		if (this.inputTypeIndex == i) {
			return false;
		} else {
			this.lastInputTypeIndex = this.inputTypeIndex;
			this.inputTypeIndex = i;
			return true;
		}
	}
	
    
    this.submitInput = function(t){
        /*
		var originalT = t;
		if (typeof t === 'number') {
			t = this._stringFromCharCode(t);
		}
		console.log("Submitting Input", originalT, t);
		*/
        var submitResponse = this.submitCallback(t);
        this.lines.push({
            "text" : ">" + t
            ,"classes" : "input"
        });
		this._addNewLine();
		//console.log("submitResponse = ", submitResponse, typeof submitResponse);
        this.add(submitResponse);
		this.refresh();
        return this;
    };

    //================ INTERNAL FUNCTIONS
	
	this._stringFromCharCode = function (key) {
		// from http://stackoverflow.com/a/5829387/1766230
		return String.fromCharCode((96 <= key && key <= 105)? key-48 : key);
	}

	this._addStringToLine = function (t) {
        if (t == "\n") {
            this._addNewLine();
        } else {
            // *** If t has a \n in it, then split into multiple lines?
            //var newLineTextArray = t.split("\n");
			
			var lastLineIndex = (this.lines.length - 1);
			/*
			if ((t.length + this.lines[lastLineIndex].text.length) >= this.size.x) {
				this._addNewLine();	
				var extra = t.substr(this.size.x);
				t = t.substr(0, this.size.x);
				this._addStringToLine(extra);
			}
			*/
            this.lines[lastLineIndex].text += t;
        }
    }
	
	this._addNewLine = function (t) {
		this.lines.push({ "text" : "" });
	}
	
    this._buildHtml = function () {
        var i;
        var outputLineTotal = this.lines.length;
        var inputLineTotal = 2;
        // ^ *** Get this from textarea
        var outputLineSpace = this.size.y - inputLineTotal;
        // If there's not enough space for the total 
        // number of output lines
        if (outputLineSpace < outputLineTotal) {
            var startOutputIndex = outputLineTotal - outputLineSpace;
        } else {
            var startOutputIndex = 0;
        }
        
        var c = "";
        this.html = "<pre>";
        for (i=startOutputIndex; i<outputLineTotal; i++) {
            if (typeof this.lines[i].classes === "string") {
                c = this.lines[i].classes;
            } else {
                c = "";
            }
            this.html += '<span class="line ' + c + '">'
                + this.lines[i].text.replace("\n", "<br />") 
                + '<br /></span>'
        }
		this.html += '</pre>';
        return this.html;
    }
    

    
    this._setupEvents = function () {
        var o = this;

        o.$inputForm.submit(function(e){
            var v = "";
			// Need a delay so we make sure we get the latest val
			setTimeout(function(){ 
				v = o.$inputTextArea.val(); 
				
				// *** Get only the first character
				// Work-around because sometimes multiple characters can get
				// input when we expect only one character.
				if (o.inputTypeIndex == 2) {
					v = v.substr(0,1);
				}
				o.submitInput( v );
				o.clearInput();
			}, 0);
            
            e.preventDefault();
        });
        o.$inputTextArea.on("keydown cut paste drop change", function(e){
			// Ignore some keys...
			// 16 = Shift
			// 17 = Ctrl
			// 18 = Alt
			if (e.keyCode >= 16 && e.keyCode <= 18) {
				// Ignore; do nothing
				return;
			} else {
				
				if (o.inputTypeIndex == 1) //"text+enter"
				{
					if (e.keyCode == 13) {
						o.$inputForm.submit();
						e.preventDefault();
						return;
					}
					var v = o.$inputTextArea.val();
					
					//console.log(v, (v == '\n'), o.$inputTextArea[0].scrollHeight);
					o.$inputTextArea.css("height", "1em");
					if (v != '\n') {
						o.$inputTextArea.css("height",  o.$inputTextArea[0].scrollHeight+'px');
					}
					
					/*console.log(o.$inputTextArea[0].scrollHeight
								,o.$inputTextArea[0].height
							   ,o.$inputTextArea);
					*/
				} 
				else if (o.inputTypeIndex == 2) //"one-character"
				{
					o.$inputForm.submit();
					return;
				}
			}
        });
        o.$inputTextArea.focus();
        o.$elt.click(function(e){
            o.$inputTextArea.focus();    
        });

		/*
        $('body').keypress(function(e){
            if (o.allowInput) {
                //console.log("keypress", e.keyCode, String.fromCharCode(e.keyCode));
                switch (e.keyCode) {
                    case 13:
                        //o.$inputForm.submit();
                        //e.preventDefault();
                        break;
                    default:
                }
            }
            
        });

        o.allowInput = true;
		*/
    }
    
    //==== Construction
    this._setupEvents();
	this._setInputType(1);
    this.clear();
}



