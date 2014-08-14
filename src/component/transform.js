﻿FIRE.Transform = (function () {
    var _super = FIRE.Component;

    // constructor
    function Transform () {
        _super.call(this);
        init(this);
    }
    FIRE.extend(Transform, _super);
    Transform.prototype.__classname__ = "FIRE.Transform";

    // init
    var init = function (self) {
        self._parent = null;
        self._children = [];
        self._position = new FIRE.Vec2(0, 0);
    };

    // properties
    Transform.prototype.__defineGetter__('parent', function () { return this._parent; });
    Transform.prototype.__defineSetter__('parent', function (value) {
        if (this._parent != value) {
            if (value && value instanceof Transform === false) {
                console.error('Parent must be a Transform or null');
                return;
            }
            var oldParent = this._parent;
            if (oldParent) {
                oldParent._children.splice(oldParent._children.indexOf(this));
            }
            this._parent = value;
            if (value) {
                value._children.push(this);
            }
            this.entity._onHierarchyChanged(oldParent);
        }
    });

    Transform.prototype.__defineGetter__('childCount', function () {
        return this._children.length;
    });

    Transform.prototype.__defineGetter__('position', function () { return this._position; });
    Transform.prototype.__defineSetter__('position', function (value) {
        this._position = value;
    });

    // functions

    Transform.prototype.GetChild = function (index) {
        return this._children[index];
    };

    return Transform;
})();