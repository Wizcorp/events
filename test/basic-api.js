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

	t.throws(function () {
		emitter.on('foo', 'foo');
	});

	t.end();
});

test('Unsupported setMaxListeners', function (t) {
	const emitter = new EE();
	let logged = 0;

	var oldFn = console.warn;

	console.warn = function () {
		logged += 1;
	};

	emitter.setMaxListeners(2);
	emitter.setMaxListeners(3);

	t.equal(logged, 1);

	console.warn = oldFn;

	t.end();
});

test('Remove all listeners', function (t) {
	const emitter = new EE();
	function foo() {}

	emitter.on('foo', foo);
	emitter.on('foo', foo);
	emitter.on('foo', foo);

	t.deepEqual(emitter.listeners('foo'), [foo, foo, foo]);

	emitter.removeAllListeners('foo');

	t.deepEqual(emitter.listeners('foo'), []);

	emitter.on('foo', foo);
	emitter.on('foo', foo);
	emitter.on('foo', foo);

	emitter.removeAllListeners();

	t.deepEqual(emitter.listeners('foo'), []);

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

	function noop() {}

	emitter.on('newListener', newListener);
	emitter.on('removeListener', removeListener);

	emitter.on('foo', noop);
	emitter.on('foo', fooListener);
	emitter.once('foo', fooListener);
	emitter.once('foo', fooListener);

	t.equal(EE.listenerCount(emitter, 'foo'), 4);

	t.equal(emitter.listeners('foo').length, 4);
	t.equal(emitter.listeners('newListener').length, 1);
	t.equal(emitter.listeners('removeListener').length, 1);
	t.equal(emitter.hasListeners('foo'), true);

	emitter.emit('bar');
	emitter.emit('foo');

	t.equal(emitted.foo, 3);
	t.equal(emitted.new, 5);
	t.equal(emitted.remove, 2);

	emitter.emit('foo');

	t.equal(emitted.foo, 4);
	t.equal(emitted.new, 5);
	t.equal(emitted.remove, 2);

	emitter.removeListener('foo', fooListener);
	emitter.removeListener('foo', noop);

	t.equal(emitter.hasListeners('foo'), false);
	t.equal(emitted.foo, 4);
	t.equal(emitted.new, 5);
	t.equal(emitted.remove, 4);

	emitter.emit('foo');

	t.equal(emitted.foo, 4);
	t.equal(emitted.new, 5);
	t.equal(emitted.remove, 4);

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

test('Arguments', function (t) {
	const emitter = new EE();

	function fooListener(a, b, c) {
		t.equal(a, 'hello');
		t.equal(b, 'world');
		t.equal(c, undefined);
		t.end();
	}

	emitter.on('foo', fooListener);
	emitter.emit('foo', 'hello', 'world');
});
