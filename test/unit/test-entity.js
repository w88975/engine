﻿// jshint ignore: start

largeModule('Entity', TestEnv);

test('basic test', function () {
    var entity = new Entity();
    ok(entity.name, 'entity has default name');
    strictEqual(new Entity('myEntity').name, 'myEntity', 'can specify entity name');

    strictEqual(entity.active, true, 'entity is active');
    strictEqual(entity.activeInHierarchy, true, 'entity is activeInHierarchy');

    entity.active = false;

    strictEqual(entity.active, false, 'entity is deactive');
    strictEqual(entity.activeInHierarchy, false, 'entity is deactiveInHierarchy');

    entity._destroyImmediate();
    strictEqual(entity.isValid, false, 'entity can be destoryed');
});

test('test hierarchy', function () {
    var parent = new Fire.Entity();
    var child1 = new Fire.Entity();
    var child2 = new Fire.Entity();

    strictEqual(parent.parent, null, 'entity\'s default parent is null');
    strictEqual(parent.childCount, 0, 'entity\'s default child count is 0');

    child1.parent = parent;
    strictEqual(child1.parent, parent, 'can get/set parent');
    strictEqual(parent.childCount, 1, 'child count increased to 1');
    strictEqual(parent.getChild(0), child1, 'can get child1');

    child2.parent = parent;
    strictEqual(parent.childCount, 2, 'child count increased to 2');
    strictEqual(parent.getChild(1), child2, 'can get child2');

    child1.destroy();

    FO._deferredDestroy();

    strictEqual(parent.childCount, 1, 'child count should return to 1');
    strictEqual(parent.getChild(0), child2, 'only child2 left');

    // TODO: what if parent.parent = child2 ?
});

test('activeInHierarchy', function () {
    var parent = new Entity();
    var child = new Entity();
    child.parent = parent;

    strictEqual(parent.activeInHierarchy, true, 'parent activeInHierarchy');
    strictEqual(child.activeInHierarchy, true, 'child activeInHierarchy');

    child.active = false;

    strictEqual(parent.activeInHierarchy, true, 'parent unchanged');
    strictEqual(child.activeInHierarchy, false, 'child deactiveInHierarchy');

    parent.active = false;

    strictEqual(parent.activeInHierarchy, false, 'parent deactiveInHierarchy');
    strictEqual(child.activeInHierarchy, false, 'child still deactiveInHierarchy');

    child.active = true;

    strictEqual(parent.activeInHierarchy, false, 'parent unchanged');
    strictEqual(child.activeInHierarchy, false, 'child deactiveInHierarchy because parent deactived');

    parent.active = true;

    strictEqual(parent.activeInHierarchy, true, 'parent become activeInHierarchy');
    strictEqual(child.activeInHierarchy, true, 'child become activeInHierarchy because parent actived');
});

test('component', function () {
    // 这里主要测试entity，不是测试component

    // my component
    var MyComponentBase = Fire.define('', CallbackTester);
    var MyComponent = Fire.define('', MyComponentBase, function () {
        MyComponentBase.call(this);
        this.expect(CallbackTester.OnLoad, 'call onLoad while attaching to entity');
        this.expect(CallbackTester.OnEnable, 'then call onEnable if entity active', true);
    });

    var obj = new Entity();
    var comp = obj.addComponent(MyComponent); // onEnable

    strictEqual(comp.entity, obj, 'can get entity from component');

    comp.expect(CallbackTester.OnDisable);
    obj.active = false; // onDisable

    comp.expect(CallbackTester.OnEnable);
    obj.active = true;  // onEnable

    strictEqual(obj.getComponent(Fire.Transform), obj.transform, 'getComponent: can get transform');
    strictEqual(obj.getComponent(MyComponent), comp, 'getComponent: can get my component');
    strictEqual(obj.getComponent(MyComponentBase), comp, 'getComponent: can get component by base type');

    comp.expect(CallbackTester.OnDisable, 'should called onDisable when destory');

    comp.destroy();     // onDisable
    
    comp.notExpect(CallbackTester.OnDisable, 'onDisable should called only once');
    comp.destroy();

    strictEqual(obj.getComponent(MyComponent), comp, 'can still get component in this frame');

    comp.expect(CallbackTester.OnDestroy);
    FO._deferredDestroy();    // onDestroy

    strictEqual(obj.getComponent(MyComponent), null, 'can not get component after this frame');

    comp.stopTest();
});

test('component in hierarchy', 4, function () {
    // 这里主要测试entity，不是测试component
    var parent = new Entity();
    var child = new Entity();
    child.parent = parent;
    parent.active = false;

    var MyComponent = Fire.define('', CallbackTester, function () {
        CallbackTester.call(this);
        this.notExpect(CallbackTester.OnLoad, 'should not call onLoad while entity inactive');
    });
    var comp = child.addComponent(MyComponent);
    
    comp.expect(CallbackTester.OnLoad, 'should call onLoad while entity activated');
    comp.expect(CallbackTester.OnEnable, 'should enable when parent become active', true);
    parent.active = true;   // onEnable

    comp.expect(CallbackTester.OnDisable, 'should disable when parent become deactive');
    parent.active = false;   // onDisable

    comp.expect(CallbackTester.OnEnable, 'should enable when entity detached from its parent');
    child.parent = null;

    comp.stopTest();
});

test('destroy', function () {
    var parent = new Entity();
    var child = new Entity();

    // add child component
    var ChildComp = Fire.define('', CallbackTester, function () {
        CallbackTester.call(this);
        this.expect([CallbackTester.OnLoad, CallbackTester.OnEnable]);
    });
    var childComp = child.addComponent(ChildComp);
    
    // expect ondisable
    childComp.expect(CallbackTester.OnDisable, 'should disable while destroy parent');
    childComp.notExpect(CallbackTester.OnDestroy, 'can not destroyed before the end of this frame');

    child.parent = parent;
    // call destroy
    parent.destroy();
    
    childComp.notExpect(CallbackTester.OnDisable, 'child comp should only disabled once');
    childComp.notExpect(CallbackTester.OnEnable, 'child component should not re-enable when parent destroying');
    childComp.expect(CallbackTester.OnDestroy, 'should destroyed at the end of frame');

    // try add component after destroy

    var ChildComp_new = Fire.define('', CallbackTester, function () {
        CallbackTester.call(this);
        this.expect(CallbackTester.OnLoad, 'new child component should onLoad even if added after destroy');
        this.expect(CallbackTester.OnEnable, 'new child component should enable even if added after destroy', true);
        this.expect(CallbackTester.OnDisable, 'new component\'s onDisable should be called before its onDestroy', true);
        this.expect(CallbackTester.OnDestroy, 'new component should also destroyed at the end of frame', true);
    });
    var childComp_new = child.addComponent(ChildComp_new);

    var NewParentComp = Fire.define('', CallbackTester, function () {
        CallbackTester.call(this);
        this.expect([CallbackTester.OnLoad,
                     CallbackTester.OnEnable,
                     CallbackTester.OnDisable,
                     CallbackTester.OnDestroy]);
    });
    var newParentComp = parent.addComponent(NewParentComp);

    // try add child after destroy

    var NewChildEntityComp = Fire.define('', CallbackTester, function () {
        CallbackTester.call(this);
        this.expect([CallbackTester.OnLoad,
                     CallbackTester.OnEnable,
                     CallbackTester.OnDisable,
                     CallbackTester.OnDestroy]);
    });
    var newChildEntity = new Entity();
    newChildEntity.parent = parent;
    var newChildEntityComp = newChildEntity.addComponent(NewChildEntityComp);

    // do destory

    FO._deferredDestroy();

    strictEqual(childComp_new.isValid, false, 'entity will finally destroyed with its component which added after calling destroy');
    strictEqual(childComp.isValid, false, 'entity will destroyed with its child components');
    strictEqual(child.isValid, false, 'entity will destroyed with its children');
    strictEqual(newChildEntity.isValid, false, 'entity will destroyed with its new children');

    childComp.stopTest();
    childComp_new.stopTest();
    newParentComp.stopTest();
    newChildEntityComp.stopTest();
});

test('isChildOf', function () {
    var ent1 = new Fire.Entity();
    var ent2 = new Fire.Entity();
    var ent3 = new Fire.Entity();

    ent2.parent = ent1;
    ent3.parent = ent2;

    strictEqual(ent1.isChildOf(ent2), false, 'not a child of its children');
    strictEqual(ent1.isChildOf(ent1), true, 'is child of itself');
    strictEqual(ent2.isChildOf(ent1), true, 'is child of its parent');
    strictEqual(ent3.isChildOf(ent1), true, 'is child of its ancestor');
});

// jshint ignore: end
