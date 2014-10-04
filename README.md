webbf.js
========

An optimizing brainfuck interpreter to write web applications with, can execute code both synchronously and asynchronously.

# Instructions
The tape extends to the right and doesn't wrap to the left.
The tape consists of Javascript numbers, which can go negative and don't wrap around.
```
+-[]<> work as in brainfuck
. outputs the current value in the current position on the tape as character
, grabs the first char of the element value
: like . but outputs a number
; like , but grabs a digit
# sets the current element to the element with id: "id"+[the current value of the current position of the tape]
```

# How to use
```javascript
// Synchronously 
// returns the resulting tape
console.log(webbf("+++>++>+"));

// Asynchronously 
// the callbacks gets the tape as argument
webbf("+++>++>+", function(tape) {
	console.log(tape);
});
// or without callback
webbf("+++>++>+", true);
```
