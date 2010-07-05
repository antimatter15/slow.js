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

function _for(loop_test, counting_expr, loop_body, next){
  _while(loop_test, function(){
    counting_expr();
    loop_body();
  }, next);
}

function _while(loop_test, loop_body, next){
  //todo: error handling
  (function(){
    if(loop_test()){
      var _return = loop_body();
      if(_return === BREAK){
        return next();
      } //continue does nothing
      setTimeout(arguments.callee, 0);
    }else next();
  })();
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
  throw "This should never happen Paren";
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
      arrstr[end] += ', function(){'
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
      arrstr[end] += ', function(){'
      arrstr[parentend] += '})';
      arrstr[start - 1] = '}, function()';
    }
  }
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

stripComments((function(){
  //comment filtering test}
  alert('1')
  /*hello} this should throw an error*/
  alert('2')
  //////////////sdfsadfsadf
  alert('3') 
  /////*
  alert('4') /*asdfasdf*/
  //*/
  alert('5') //eadflkasdfkaf
  //*
    alert('6')
  //*/
  /*
    alert('asdfasdf')
  //*/
}).toString())


//blockScan('while("(45)(\')"){//hello\nvar a = 42\nwhile(true){\na++\n}\nalert("NEVER")}');
//blockScan('function(){alert("yay")}')
blockScan(stripComments((function(){
  //comment filtering test}
  /*hello} this should throw an error*/
  var a = 0;
  while(true){
    a++;
  }
  alert('hell froze over');
}).toString()))



blockScan(stripComments((function(){
  //comment filtering test}
  /*hello} this should throw an error*/
  for(var z = 0; z < 4; z++){
    for(var a = 0; a < 100; a++){
      console.log(a);
    }
    alert('Counted Two Uh Hundred');
    
    var a = 0;
    
    while(true){
      if(a++ > 42) break;
    }
    alert('hell froze over');
    
  }
}).toString()))


(function() {
  var z = 0;
  _for(function() {
    return z < 4
  }, function() {
    z++
  }, function() {
    var a = 0;
    _for(function() {
      return a < 100
    }, function() {
      a++
    }, function() {
      console.log(a)
    }, function() {
      alert("Counted Two Uh Hundred");
    })
  }, function() {
  })
});


for(var z = 0; z < 4; z++){
  for(var a = 0; a < 100; a++){
    console.log(a);
    for(var a = 0; a < 100; a++){
      console.log(a);
    }
    console.log('done')
  }
  alert('Counted Two Uh Hundred');
  Done()
}

