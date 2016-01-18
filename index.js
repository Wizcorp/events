function EventEmitter() {
	this._events = {};
}

EventEmitter.EventEmitter = EventEmitter;

module.exports = EventEmitter;

EventEmitter.listenerCount = function (emitter, evt) {
	var handlers = emitter._events[evt];
	return handlers ? handlers.length : 0;
};

EventEmitter.prototype.on = function (evt, fn) {
	if (typeof fn !== 'function') {
		throw new TypeError('Tried to register non-function as event handler for event: ' + evt);
	}

	// we emit first, because if evt is "newListener" it would go recursive
	this.emit('newListener', evt, fn);

	var handlers = this._events[evt];
	var newHandlers;

	if (handlers === undefined) {
		// first event handler for this event type
		newHandlers = [fn];
	} else {
		// copy all existing handlers and append the new one
		var len = handlers.length;
		var newHandlers = new Array(len + 1);

		for (var i = 0; i < len; i += 1) {
			newHandlers[i] = handlers[i];
		}

		newHandlers[len] = fn;
	}

	this._events[evt] = newHandlers;

	return this;
};

EventEmitter.prototype.addListener = EventEmitter.prototype.on;

EventEmitter.prototype.once = function (evt, fn) {
	if (fn.once) {
		fn.once += 1;
	} else {
		fn.once = 1;
	}

	return this.on(evt, fn);
};

var warned = false;

EventEmitter.prototype.setMaxListeners = function () {
	if (!warned) {
		console.warn('Method setMaxListeners not supported, there is no limit to the number of listeners');
		warned = true;
	}
};

EventEmitter.prototype.removeListener = function (evt, handler) {
	// If this was a "once" handler, update its "once" property

	if (handler.once) {
		if (handler.once > 1) {
			handler.once--;
		} else {
			delete handler.once;
		}
	}

	// Like Node.js, we only remove a single listener at a time, even if it occurs multiple times

	var handlers = this._events[evt];
	if (handlers !== undefined) {
		var newHandlers = [];
		var isRemoved = false;

		for (var i = 0; i < handlers.length; i += 1) {
			if (isRemoved) {
				newHandlers.push(handlers[i]);
			} else if (handlers[i] === handler) {
				isRemoved = true;
			} else {
				newHandlers.push(handlers[i]);
			}
		}

		if (isRemoved) {
			if (newHandlers.length === 0) {
				delete this._events[evt];
			} else {
				this._events[evt] = newHandlers;
			}

			this.emit('removeListener', evt, handler);
		}
	}

	return this;
};

EventEmitter.prototype.removeAllListeners = function (evt) {
	if (evt) {
		delete this._events[evt];
	} else {
		this._events = {};
	}
	return this;
};

EventEmitter.prototype.hasListeners = function (evt) {
	return this._events[evt] !== undefined;
};

EventEmitter.prototype.listeners = function (evt) {
	var handlers = this._events[evt];
	if (handlers !== undefined) {
		var len = handlers.length;
		var copy = new Array(len);

		for (var i = 0; i < len; i += 1) {
			copy[i] = handlers[i];
		}

		return copy;
	}

	return [];
};

EventEmitter.prototype.emit = function (evt) {
	var handlers = this._events[evt];
	if (handlers === undefined) {
		return false;
	}

	// copy all arguments, but skip the first (the event name)
	var argsLen = arguments.length;
	var args = new Array(argsLen - 1);
	for (var i = 1; i < argsLen; i++) {
		args[i - 1] = arguments[i];
	}

	var hadListener = false;

	for (var i = 0, len = handlers.length; i < len; i++) {
		var handler = handlers[i];

		handler.apply(this, args);
		hadListener = true;

		if (handler.once) {
			this.removeListener(evt, handler);
		}
	}

	return hadListener;
};
