'use strict';

const test = require('tape');
const EE = require('..');

test('Basic API', function (t) {
	const emitter = new EE();
	let emitted = 0;

	function fooListener() {
		emitted += 1;
	}

	emitter.on('foo', fooListener);
	emitter.once('foo', fooListener);
	emitter.once('foo', fooListener);

	emitter.emit('bar');
	emitter.emit('foo');

	t.equal(emitted, 3);

	emitter.emit('foo');

	t.equal(emitted, 4);

	t.end();
});


test('new/remove Listener', function (t) {
	const emitter = new EE();
	const emitted = {
		new: 0,
		remove: 0,
		foo: 0
	};

	function newListener() {
		emitted.new += 1;
	}

	function removeListener() {
		emitted.remove += 1;
	}

	function fooListener() {
		emitted.foo += 1;
	}

	emitter.on('newListener', newListener);
	emitter.on('removeListener', removeListener);

	emitter.on('foo', fooListener);
	emitter.once('foo', fooListener);
	emitter.once('foo', fooListener);

	t.equal(emitter.listeners('foo').length, 3);
	t.equal(emitter.listeners('newListener').length, 1);
	t.equal(emitter.listeners('removeListener').length, 1);
	t.equal(emitter.hasListeners('foo'), true);

	emitter.emit('bar');
	emitter.emit('foo');

	t.equal(emitted.foo, 3);
	t.equal(emitted.new, 4);
	t.equal(emitted.remove, 2);

	emitter.emit('foo');

	t.equal(emitted.foo, 4);
	t.equal(emitted.new, 4);
	t.equal(emitted.remove, 2);

	emitter.removeListener('foo', fooListener);

	t.equal(emitter.hasListeners('foo'), false);
	t.equal(emitted.foo, 4);
	t.equal(emitted.new, 4);
	t.equal(emitted.remove, 3);

	emitter.emit('foo');

	t.equal(emitted.foo, 4);
	t.equal(emitted.new, 4);
	t.equal(emitted.remove, 3);

	t.end();
});

test('Race condition tests', function (t) {
	const emitter = new EE();
	const emitted = {
		new: 0,
		remove: 0,
		foo: 0
	};

	function newListener() {
		emitted.new += 1;
		emitter.removeListener('newListener', newListener);
	}

	function removeListener() {
		emitted.remove += 1;
	}

	function fooListener() {
		emitted.foo += 1;
		emitter.removeListener('foo', fooListener);
	}

	emitter.on('newListener', newListener);

	t.equal(emitted.new, 0);

	emitter.on('removeListener', removeListener)

	t.equal(emitted.new, 1);

	emitter.on('foo', fooListener);
	emitter.on('foo', fooListener);

	emitter.emit('foo');

	t.equal(emitted.foo, 2);

	emitter.emit('foo');

	t.equal(emitted.foo, 2);
	t.equal(emitter.hasListeners('foo'), false);
	t.equal(emitted.new, 1);

	t.end();

});
