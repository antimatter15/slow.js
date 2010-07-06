function LibSlow(){
  this.NextQueue = [];
  this.Returns = [];
  this.BREAK = {};
}

LibSlow.prototype.Next = function(){
  this.Returns.push(this.Skip()());
}

LibSlow.prototype.Skip = function(){
  return this.NextQueue.pop();
}

LibSlow.prototype.Queue = function(fn){
  this.NextQueue.push(fn);
}

LibSlow.prototype._while = function(loop_test, loop_body){
  var that = this;
  setTimeout(function(){
    that.Queue(function(){
      if(loop_test()){
        that.Queue(arguments.callee)
        var _return = loop_body();
        if(_return == that.BREAK) that.Skip();
        
      }
      setTimeout(function(){
        that.Next()
      }, 0);
    });
    that.Next();
  },0);
}

LibSlow.prototype._for = function(loop_test, counting_expr, loop_body){
  this._while(loop_test, function(){
    counting_expr();
    loop_body();
  });
}


LibSlow.prototype.sleep = function(duration){
  var that = this;
  setTimeout(function(){that.Next()}, duration);
}

LibSlow.prototype.download = function(url){
  var xhrobj = new XMLHttpRequest();
  xhrobj.open('get',url,true);
  xhrobj.onreadystatechange = function(){
    if(xhrobj.readyState == 4) Next();
  }
  xhrobj.send(null);
}


function slow(input, no_exec){
  function createNamespace(){
    return '__slow'//$'+Math.random().toString(36).substr(5)
  }


  function insertHeader(str, namespace){
    var spl = str.split('{')
    spl[1] = 'var '+namespace+'=new LibSlow();'+spl[1];
    return spl.join('{')
  }

  function reverseParen(str, start){
    var parenStack = [];
    var inDbl = false, inSgl = false;
    while(start-- + 1){
      var chr = str.charAt(start);
      if(/[\s \t]/.test(chr)) continue;
      if(chr == '"' && !inSgl){
        inDbl = !inDbl;
      }else if(chr == "'" && !inDbl){
        inSgl = !inSgl;
      }else if(inSgl || inDbl){
        //neener neener
      }else if(chr == ')'){ //close paren = open
        parenStack.push(start);
      }else if(chr == '('){ //open paren = close
        parenStack.pop();
      }
      if(parenStack.length == 0) return start;
    }
    throw "This should never happen Paren Rev";
  }

  function forwardParen(str, start){
    var parenStack = [];
    var inDbl = false, inSgl = false;
    var sl = str.length;
    while(++start < sl){
      var chr = str.charAt(start);
      if(/[\s \t]/.test(chr)) continue;
      if(chr == '"' && !inSgl){
        inDbl = !inDbl;
      }else if(chr == "'" && !inDbl){
        inSgl = !inSgl;
      }else if(inSgl || inDbl){
        //neener neener
      }else if(chr == '('){ //close paren = close
        parenStack.push(start);
      }else if(chr == ')'){ //open paren = open
        parenStack.pop();
      }
      if(parenStack.length == 0) return start;
    }
    throw "This should never happen Paren For";
  }


  function reverseName(str, start){
    var everything = "";
    while(start--){
      everything += str.charAt(start);
      if(!/^[ ]*[A-Za-z0-9_$]*[A-Za-z_$]*$/.test(everything)) //regex is backwards because everything is backwards
       return start+1;
    }
    return 0;
  }

  function trim(str){
    return str.replace(/^\s+|\s+$/g, '');
  }

  function blockModify(arrstr, str, start, end, parentend, namespace){
    var ArgEnd = reverseParen(str, start); //in while(blahblahblah){} get to where the while( is
    var NameBegin = reverseName(str, ArgEnd);
    var Name = trim(str.substring(NameBegin, ArgEnd));
    var Args = str.substring(ArgEnd, start);
    var Body = str.substring(start + 1, end);

    if(Name == 'function'){
      //console.log('lookitsafunction')
    }else if(Name == 'while' || Name == 'for'){
      arrstr[NameBegin] = namespace+'._'+arrstr[NameBegin];
      
      var breaks = Body.replace(/[^\w]break[^\w]/g, function(a, c){
        //c = index
        c += start + 1;
        //console.log('break', c);
        for(var l = c+1, e = l+5; l < e; l++){
          arrstr[l] = '';
        }
        arrstr[c+1] = 'return '+namespace+'.BREAK';
      });
      var continues = Body.replace(/[^\w]continue[^\w]/g, function(a, c){
        //c = index
        c += start + 1;
        for(var l = c+1, e = l+8; l < e; l++){
          arrstr[l] = '';
        }
        arrstr[c+1] = 'return';
      });
      
      if(Name == 'while'){
        arrstr[ArgEnd] = '(function(){return '+arrstr[ArgEnd];
        arrstr[start - 1] += '}, ';
        arrstr[start] = 'function()'+arrstr[start]+' ';
        arrstr[end - 1] += '';
        arrstr[end] += ');'+namespace+'.Queue(function(){'
        arrstr[parentend] += '})';
      }else if(Name == 'for'){
        //this one requires a bit of inner-arg rewriting, warning: its pretty nasty
        //also it really needs rewriting
        var arg = Args.split(';');
        arrstr[NameBegin-1] += arg[0].substr(1)+';';
        for(var x = arg[0].length; x--;)
          arrstr[ArgEnd + x + 1] = '';
        arrstr[ArgEnd + 1] += 'function(){return ('
        var mid_arg = ArgEnd + arg[0].length+arg[1].length + 1;
        arrstr[mid_arg] = ')}, function(){'
        arrstr[end] += ');'+namespace+'.Queue(function(){'
        arrstr[start - 1] = '}, function()';
        arrstr[parentend ] += '})';
      }
    }
    
    Body.replace(/[^\w](slow\s*\.\s*\w+)/g, function(a, b, c){
        //c = index
        c += start + 1;
        var endParen = forwardParen(str, c+b.length);
         for(var l = c+1, e = l+4; l < e; l++){
          arrstr[l] = '';
        }
        arrstr[c+1] = namespace;
        //arrstr[c+b.length] += '____';
        arrstr[endParen+1] += ';'+namespace+'.Queue(function(){';
        arrstr[parentend] = '})' + arrstr[parentend];

    });
    console.log(Name, Args)
    console.log(Body);
  }

  function blockArray(levels, index, arrstr, str, namespace){
    for(var q = levels.length, b = 0; b < q; b++){
      var lev = levels[b];
      blockModify(arrstr, str, lev[0], lev[1], index - 1, namespace);
    }
  }

  function blockScan(str, namespace){
    var blockStack = [];
    var blockLevels = {}; //each is = to blockStack.length
    var inDbl = false, inSgl = false;
    arrstr = str.split(''); //it's easier to do insertions without worrying about changing order this way
    //todo: comments, but Function.toString() usually strips comments
    for(var i = 0, l = str.length; i < l; i++){
      var chr = str.charAt(i);
      if(chr == '"' && !inSgl){
        inDbl = !inDbl;
      }else if(chr == "'" && !inDbl){
        inSgl = !inSgl;
      }else if(inSgl || inDbl){
        //neener neener
      }else if(chr == '{'){
        blockStack.push(i);
      }else if(chr == '}'){
        var index = blockStack.pop();
        if(!index) throw "This should never happen";
        var level = blockStack.length;
        if(blockLevels[level+1]){
          blockArray(blockLevels[level+1], i, arrstr, str, namespace);
          console.log('handling block array ',level)
          blockLevels[level+1] = [];
        }
        if(!blockLevels[level]) blockLevels[level] = [];
        blockLevels[level].push([index, i])
      }
    }
    if(blockLevels[0]){
      blockArray(blockLevels[0], i, arrstr, str, namespace);
      console.log('handling block array ',0)
      blockLevels[0] = [];
    }
    return arrstr.join('');
  }




  function stripComments(str){
    var inDbl = false, inSgl = false, multiLine = false, singleLine = false, endMultiLine = false;
    var newstr = '';
    for(var i = 0, l = str.length; i < l; i++){
      var chr = str.charAt(i), sub = str.substr(i, 2);
      if(chr == '"' && !inSgl){
        inDbl = !inDbl;
      }else if(chr == "'" && !inDbl){
        inSgl = !inSgl;
      }else if(inSgl || inDbl){
        //neener neener
      }else if(chr == '\n' && singleLine){
        singleLine = false;
      }else if(sub == '*/' && multiLine){
        endMultiLine = true;
      }else if(multiLine || singleLine){
      }else if(sub == '//'){
        singleLine = true;
      }else if(sub == '/*'){
        multiLine = true;
      }
      if(!multiLine && !singleLine)
        newstr += chr;
      if(endMultiLine && multiLine && chr == '/')
        multiLine = endMultiLine = false;
    }
    return newstr;
  }

  var str = input.toString();
  var noComments = stripComments(str);
  var ns = createNamespace();
  var firstPass = blockScan(noComments, ns);
  var secondPass = insertHeader(firstPass, ns);
  var out_str = '('+secondPass+')';
  if(no_exec){
    return out_str
  }else{
    return eval(out_str)();
  }
}

/* 
var s = slow(function(){
  slow.sleep(4200);
  console.log('woke up');
  var xhrobj = new XMLHttpRequest();
  xhrobj.open('get','/',true);
  xhrobj.send(null);
  while(xhrobj.readyState != 4){};
  console.log(xhrobj.responseText);
});


var s = slow(function(){
  slow.sleep(4200);
  var ctr = 0;
  while(true){
    if(ctr++ > 42) break;
    console.log('yay');
  }
});


var s = slow(function(){
  function a(){
    var z = '';
    while(z.length < 32){
      z+= "eh"
    }
    return z;
  }
  function b(){
    return "bee";
  }
  var c = function(k){
    return k+"tree";
  }
  return c(a()+b());
},true);
console.log(s);
//eval(s)();

*/


function sha1Hash(msg)
{
    var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];


    msg += String.fromCharCode(0x80); 

    var l = msg.length/4 + 2;  
    var N = Math.ceil(l/16);  
    var M = new Array(N);
    for (var i=0; i<N; i++) {
        M[i] = new Array(16);
        for (var j=0; j<16; j++) { 
            M[i][j] = (msg.charCodeAt(i*64+j*4)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16) | 
                      (msg.charCodeAt(i*64+j*4+2)<<8) | (msg.charCodeAt(i*64+j*4+3));
        }
    }
    M[N-1][14] = ((msg.length-1)*8) / Math.pow(2, 32); M[N-1][14] = Math.floor(M[N-1][14])
    M[N-1][15] = ((msg.length-1)*8) & 0xffffffff;

    var H0 = 0x67452301;
    var H1 = 0xefcdab89;
    var H2 = 0x98badcfe;
    var H3 = 0x10325476;
    var H4 = 0xc3d2e1f0;


    var W = new Array(80); var a, b, c, d, e;
    for (var i=0; i<N; i++) {

        for (var t=0;  t<16; t++){ W[t] = M[i][t]};
        for (var t=16; t<80; t++){ W[t] = ROTL(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16], 1)};

        a = H0; b = H1; c = H2; d = H3; e = H4;

        for (var t=0; t<80; t++) {
            var s = Math.floor(t/20); 
            var T = (ROTL(a,5) + f(s,b,c,d) + e + K[s] + W[t]) & 0xffffffff;
            e = d;
            d = c;
            c = ROTL(b, 30);
            b = a;
            a = T;
        }

        H0 = (H0+a) & 0xffffffff;  
        H1 = (H1+b) & 0xffffffff; 
        H2 = (H2+c) & 0xffffffff; 
        H3 = (H3+d) & 0xffffffff; 
        H4 = (H4+e) & 0xffffffff;
    }

    return H0.toHexStr() + H1.toHexStr() + H2.toHexStr() + H3.toHexStr() + H4.toHexStr();
}

function f(s, x, y, z) 
{
    switch (s) {
    case 0: return (x & y) ^ (~x & z);           // Ch()
    case 1: return x ^ y ^ z;                    // Parity()
    case 2: return (x & y) ^ (x & z) ^ (y & z);  // Maj()
    case 3: return x ^ y ^ z;                    // Parity()
    }
}

//
// rotate left (circular left shift) value x by n positions [§3.2.5]
//
function ROTL(x, n)
{
    return (x<<n) | (x>>>(32-n));
}

//
// extend Number class with a tailored hex-string method 
//   (note toString(16) is implementation-dependant, and 
//   in IE returns signed numbers when used on full words)
//
Number.prototype.toHexStr = function()
{
    var s="", v;
    for (var i=7; i>=0; i--) { v = (this>>>(i*4)) & 0xf; s += v.toString(16); }
    return s;
}
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
