/*
slow(functiono(){
  var a = 0;
  while(true){
    a++;
  }
  alert('end of neverland');
})



function(){
  var a = 0;
  LoopStack.push(function(){
    alert('end of neverland');
  });
  _while(function(){return true},
         function(){
    a++;
  }, function(){
    //finish
    Next();
  });
}
*/

var BREAK = {}; //this will be used to check if you're breaking

slow = {
  sleep: function(duration){
    setTimeout(Next, duration);
  }

}

function _for(loop_test, counting_expr, loop_body){
  _while(loop_test, function(){
    counting_expr();
    loop_body();
  });
}


NextQueue = [];
function Next(){

  //console.log('Popped',NextQueue.length-1);
  NextQueue.pop()();
  
}
function QueueNext(fn){
  NextQueue.push(fn)
  //console.log('Queued',NextQueue.length,fn);
}

/*
function _while(loop_test, loop_body){
  //todo: error handling
  setTimeout(function(){
    if(loop_test()){
      var reIterate = arguments.callee;
      QueueNext(function(){
        setTimeout(reIterate, 0);
      });
      var _return = loop_body();
      if(_return === BREAK){
        NextQueue.pop();
        return Next();
      } //continue does nothing
      Next();
    }else Next();
  },0);
}
*/
function _while(loop_test, loop_body){
  setTimeout(function(){
    QueueNext(function(){
      if(loop_test()){
        QueueNext(arguments.callee)
        loop_body()
      }
      setTimeout(Next, 0);
    });
    Next();
  },0);
}


function reverseParen(str, start){
  var parenStack = [];
  var inDbl = false, inSgl = false;
  while(start-- + 1){
    var chr = str.charAt(start);
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

function blockModify(arrstr, str, start, end, parentend){
  var ArgEnd = reverseParen(str, start); //in while(blahblahblah){} get to where the while( is
  var NameBegin = reverseName(str, ArgEnd);
  var Name = trim(str.substring(NameBegin, ArgEnd));
  var Args = str.substring(ArgEnd, start);
  var Body = str.substring(start + 1, end);

  if(Name == 'function'){
    //console.log('lookitsafunction')
  }else{
    arrstr[NameBegin] = '_'+arrstr[NameBegin];
    
    var breaks = Body.replace(/[^\w]break[^\w]/g, function(a, c){
      //c = index
      c += start + 1;
      console.log('break', c);
      for(var l = c+1, e = l+5; l < e; l++){
        arrstr[l] = '';
      }
      arrstr[c+1] = 'return BREAK';
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
      arrstr[end] += ');QueueNext(function(){'
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
      arrstr[end] += ');QueueNext(function(){'
      arrstr[start - 1] = '}, function()';
      arrstr[parentend ] += '})';
    }
  }
  
  Body.replace(/[^\w](slow\s*\.\s*\w+)/g, function(a, b, c){
      //c = index
      c += start + 1;
      var endParen = forwardParen(str, c+b.length);
      
      //arrstr[c+b.length] += '____';
      arrstr[endParen+1] += ';QueueNext(function(){';
      arrstr[parentend] = '})' + arrstr[parentend];
      console.log('Fn Arg', c);

  });
  console.log(Name, Args)
  console.log(Body);
}

function blockArray(levels, index, arrstr, str){
  for(var q = levels.length, b = 0; b < q; b++){
    var lev = levels[b];
    blockModify(arrstr, str, lev[0], lev[1], index - 1);
  }
}

function blockScan(str){
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
        blockArray(blockLevels[level+1], i, arrstr, str);
        console.log('handling block array ',level)
        blockLevels[level+1] = [];
      }
      if(!blockLevels[level]) blockLevels[level] = [];
      blockLevels[level].push([index, i])
      //blockModify(str, index, i);
    }
  }
  if(blockLevels[0]){
    blockArray(blockLevels[0], i, arrstr, str);
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




//blockScan('while("(45)(\')"){//hello\nvar a = 42\nwhile(true){\na++\n}\nalert("NEVER")}');
//blockScan('function(){alert("yay")}')
/*
blockScan(stripComments((function(){
  var a = 0;
  while(true){
    a++;
  }
  alert('hell froze over');
}).toString()))
*/

/*
var s = ('('+blockScan(stripComments((function(){
  for(var z = 0; z < 2; z++){
    console.log(z,'A',z,NextQueue.length);
    for(var a = 0; a < 2; a++){
      console.log(z,'B',a,NextQueue.length);
    }
    for(var a = 0; a < 2; a++){
      console.log(z,'C',a,NextQueue.length);
    }
  }

}).toString()))+')');
*/





var s = ('('+blockScan(stripComments((function(){
  //comment filtering test}
  /*hello} this should throw an error*/
  slow.sleep(4200);
  alert('woke up');

}).toString()))+')');
console.log(s);
//eval(s)();

