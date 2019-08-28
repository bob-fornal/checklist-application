
var oldState = { ...state };

var mockState = {
  storage: {},
  stateKey: '~~key~~',
  stateDefault: {
    debug: false,
    displayMode: ''
  },
  get: async (key) => {
    if (key in mockState.storage) {
      return await mockState.storage[key];
    } else {
      return null;
    }
  },
  set: async (key, value) => {
    mockState.storage[key] = value;
  }
};
var mockLocalStorage = {
  storage: {},
  stateKey: '~~key~~',
  stateDefault: {
    debug: false,
    displayMode: ''
  },
  getItem: async (key) => {
    if (!(key in mockLocalStorage.storage)) {
      return null;
    }
    return await mockLocalStorage.storage[key];
  },
  setItem: async (key, item) => {
    mockLocalStorage.storage[key] = await item;
  },
  removeItem: async (key) => {
    await delete mockLocalStorage.storage[key];
  }
};

const helpers = {
  createInputElement: (type, attributes = {}) => {
    let element = document.createElement('input');
    element.setAttribute('type', type);
    for (let key in attributes) {
      if (attributes.hasOwnProperty(key)) {
        element.setAttribute(key, attributes[key])
      }
    }
    return element;
  }
};

describe('Testing Checklist', () => {

  beforeEach(function() {
    fetchMock.get('./testing.json', { 'test': 'object' });

    timerCallback = jasmine.createSpy("timerCallback");
    jasmine.clock().install();
  });
  
  afterEach(function() {
    fetchMock.reset();

    jasmine.clock().uninstall();
  });

  describe('"logging" object', () => {
    beforeEach(() => {
      logging.state = null;
    });

    it('expects constant initialization', () => {
      expect(logging.state).toBeNull();
    });

    it('expects functions', () => {
      expect(logging.init).toEqual(jasmine.any(Function));
      expect(logging.show).toEqual(jasmine.any(Function));
    });

    it('expects "show" to not console.log [state.debug=FALSE]', () => {
      logging.init({ debug: false });
      spyOn(console, 'log').and.stub();

      logging.show('test');

      expect(console.log).not.toHaveBeenCalled();
    });
    it('expects "show" to console.log [state.debug=TRUE]', () => {
      logging.init({ debug: true });
      spyOn(console, 'log').and.stub();

      logging.show('test');

      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('"state" object', () => {
    beforeEach(() => {
      state.debug = oldState.debug;
      state.displayMode = oldState.displayMode;
      state.colors = oldState.colors;

      mockState.storage = {};
      mockState.stateDefault = {
        debug: false,
        displayMode: ''
      };
    });

    it('expects constant initialization', () => {
      expect(state.debug).toEqual(false);
      expect(state.displayMode).toEqual('');
      expect(state.colors).toEqual({});
      
      expect(state.colorDefault).toEqual({
        backgroundColor: '#ffffff',
        foregroundColor: '#000000',
        altBackgroundColor: '#fafad2'
      });
      expect(state.colorCustomStart).toEqual({
        backgroundColor: '#111111',
        foregroundColor: '#eeeeee',
        altBackgroundColor: '#2f4f4f'
      });
    });

    it('expects functions', () => {
      expect(state.init).toEqual(jasmine.any(Function));
      expect(state.calculateLogoColor).toEqual(jasmine.any(Function));
      expect(state.calculateIndividualColorAdjust).toEqual(jasmine.any(Function));
      expect(state.calculateBrightness).toEqual(jasmine.any(Function));
      expect(state.hexToRGB).toEqual(jasmine.any(Function));
      expect(state.componentToHex).toEqual(jasmine.any(Function));
      expect(state.rgbToHex).toEqual(jasmine.any(Function));
    });

    it('expects "rgbToHex" to return hex values', () => {
      expect(state.rgbToHex({ r: 0, g: 0, b: 0 })).toEqual('#000000');
      expect(state.rgbToHex({ r: 255, g: 255, b: 255 })).toEqual('#ffffff');
    });
    it('expects "componentToHex" to return a two character hex value', () => {
      expect(state.componentToHex(0)).toEqual('00');
      expect(state.componentToHex(255)).toEqual('ff');
    });
    it('expects "hexToRGB" to return separated RGB from hex code', () => {
      expect(state.hexToRGB('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(state.hexToRGB('000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(state.hexToRGB('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(state.hexToRGB('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });
    it('expects "calculateBrightness to return brightness from 0 to 255', () => {
      expect(state.calculateBrightness('#000000')).toEqual(0);   // dark
      expect(state.calculateBrightness('#ffffff')).toEqual(255); // light
    });
    it('expects "calcularIndividualColorAdjust" to return correct color', () => {
      expect(state.calculateIndividualColorAdjust(0, 255, 255)).toEqual(255);
      expect(state.calculateIndividualColorAdjust(0, 255, 0)).toEqual(0);
    });
    it('expects "calculateLogoColor" to return correct color', () => {
      expect(state.calculateLogoColor('#000000')).toEqual('#f08080'); // dark
      expect(state.calculateLogoColor('#ffffff')).toEqual('#800000'); // light
    });

    it('expects "init(store)" to configure values properly [default]', async () => {
      await state.init(mockState);

      expect(state.debug).toEqual(false);
      expect(state.colors).toEqual({
        backgroundColor: '#ffffff',
        foregroundColor: '#000000',
        altBackgroundColor: '#fafad2'
      });
      expect(mockState.storage[mockState.stateKey]).toEqual({
        debug: false,
        displayMode: ''
      });
    });
    it('expects "init(store)" to configure values properly [debug=true]', async () => {
      mockState.storage['~~key~~'] = {
        debug: true,
        displayMode: ''
      };
      mockState.debug = true;

      await state.init(mockState);

      expect(state.debug).toEqual(true);
      expect(state.colors).toEqual({
        backgroundColor: '#ffffff',
        foregroundColor: '#000000',
        altBackgroundColor: '#fafad2'
      });
      expect(mockState.storage[mockState.stateKey]).toEqual({
        debug: true,
        displayMode: ''
      });
    });
    it('expects "init(store)" to configure values properly [colors=customMode]', async () => {
      mockState.storage['~~key~~'] = {
        debug: false,
        displayMode: 'customMode',
        colors: {
          backgroundColor: '#111111',
          foregroundColor: '#eeeeee',
          altBackgroundColor: '#2f4f4f'
        }
      };
      mockState.displayMode = 'customMode';

      await state.init(mockState);

      expect(state.debug).toEqual(false);
      expect(state.colors).toEqual({
        backgroundColor: '#111111',
        foregroundColor: '#eeeeee',
        altBackgroundColor: '#2f4f4f'
      });
      expect(mockState.storage[mockState.stateKey]).toEqual({
        debug: false,
        displayMode: 'customMode',
        colors: {
          backgroundColor: '#111111',
          foregroundColor: '#eeeeee',
          altBackgroundColor: '#2f4f4f'
        }
      });
    });
  });

  describe('"store" object', () => {
    beforeEach(() => {
      store.init(mockLocalStorage);
    });

    it('expects constant initialization', () => {
      expect(store.storage).not.toBeNull();
      expect(store.storedKey).toEqual('~~stored~~');
      expect(store.stateKey).toEqual('~~state~~');
      
      expect(store.stateDefault).toEqual({
        debug: false,
        displayMode: ''
      });
    });

    it('expects functions', () => {
      expect(store.init).toEqual(jasmine.any(Function));
      expect(store.get).toEqual(jasmine.any(Function));
      expect(store.set).toEqual(jasmine.any(Function));
      expect(store.remove).toEqual(jasmine.any(Function));
      expect(store.getStructure).toEqual(jasmine.any(Function));
    });

    it('expects "getStructure" to fetch testing.json file', async () => {
      const result = await store.getStructure();
      expect(result).toEqual({ 'test': 'object' });
    });

    it('expects "remove" to removeItem from storage', async () => {
      mockLocalStorage.storage.test = 'tested';
      await store.remove('test');
      expect('test' in mockLocalStorage.storage).toEqual(false);
    });

    it('expects "set" to place an item into storage', async () => {
      await store.set('test', 'tested');
      expect(mockLocalStorage.storage.test).toEqual('"tested"');
    });
    it('expects "set" to replace an item into storage', async () => {
      mockLocalStorage.storage.test = 'tested';
      await store.set('test', 'tested again');
      expect(mockLocalStorage.storage.test).toEqual('"tested again"');
    });

    it('expects "get" to retrieve an item from storage', async () => {
      await store.set('test', 'tested');
      const result = await store.get('test');
      expect(result).toEqual('tested');
      expect(mockLocalStorage.storage.test).toEqual('"tested"');
    });
  });

  describe('"html" object', () => {
    it('expects "fragmentFromString" to create content fragment', () => {
      const result = html.fragmentFromString('test');

      expect(result.nodeName).toEqual('#document-fragment');
      expect(result.textContent).toEqual('test');
    });
  });

  describe('"testing" object', () => {
    let forTesting = {};

    beforeEach(async () => {
      const divs = [
        'checklist-name',
        'new-categories',
        'checklists',
        'settings',
        'nav-new-checklist-item',
        'nav-copy-checklist-item',
        'nav-settings-item',
        'message',
        'new-checklist-wrapper',
        'displayed-checklist',
        'trigger-copy'
      ];
      const colors = [
        'background-color',
        'alt-background-color',
        'foreground-color'
      ];
      const input = [
        'edit-name'
      ];
      const editDiv = [
        'checklist-test',
        'actions-test',
        'actions-save-test',
        'title-test'
      ];
      const editInput = [
        'edit-test'
      ];
      const testarea = [
        'copy-area'
      ];
      document.getElementById = jasmine.createSpy('HTML Element').and.callFake((key) => {
        if (key === 'body') {
          return document.createElement('body');
        } else if (divs.includes(key)) {
          return document.createElement('div');
        } else if (colors.includes(key)) {
          return document.createElement('input').setAttribute('type', 'color');
        } else if (testarea.includes(key)) {
          return document.createElement('textarea');
        } else if (input.includes(key)) {
          let input = document.createElement('input');
          input.value = 'new-name';
          return input;
        } else if (editDiv.includes(key)) {
          forTesting[key] = document.createElement('div');
          return forTesting[key];
        } else if (editInput.includes(key)) {
          forTesting[key] = document.createElement('input');
          return forTesting[key];
        } else {
          console.log('mocking ... getElementById', { key });
        }
      });

      await store.init(mockLocalStorage);
      await state.init(store);
      await html.init();
      await logging.init(state);
      await testing.init(state, store, html, logging);
    });

    afterEach(() => {
      testing.settingsList = null;
      testing.selectedCategory = null;

      forTesting = {};

      mockState.storage = {};
      mockLocalStorage.storage = {};
    });

    it('expects constant initialization', () => {
      expect(testing.state).not.toBeNull();
      expect(testing.store).not.toBeNull();
      expect(testing.html).not.toBeNull();
      expect(testing.logging).not.toBeNull();

      expect(testing.newChecklist.selectedCategory).toBeNull();
    });

    it('expects functions', () => {
      expect(testing.init).toEqual(jasmine.any(Function));

      expect(testing.getStoredElements).toEqual(jasmine.any(Function));

      expect(testing.buildChecklistElement).toEqual(jasmine.any(Function));

      expect(testing.handleKeypress).toEqual(jasmine.any(Function));
      expect(testing.handleNamedKeypress).toEqual(jasmine.any(Function));

      expect(testing.newChecklist.close).toEqual(jasmine.any(Function));
      expect(testing.newChecklist.createChecklistCategories).toEqual(jasmine.any(Function));
      expect(testing.newChecklist.checkboxCategoryChange).toEqual(jasmine.any(Function));
      expect(testing.newChecklist.trigger).toEqual(jasmine.any(Function));
      expect(testing.newChecklist.save).toEqual(jasmine.any(Function));

      expect(testing.triggerDelete).toEqual(jasmine.any(Function));

      expect(testing.edit.close).toEqual(jasmine.any(Function));
      expect(testing.edit.trigger).toEqual(jasmine.any(Function));
      expect(testing.edit.save).toEqual(jasmine.any(Function));
      expect(testing.edit.cancel).toEqual(jasmine.any(Function));

      expect(testing.buildChecklist.state).toEqual(jasmine.any(Function));
      expect(testing.buildChecklist.copy).toEqual(jasmine.any(Function));

      expect(testing.checklist.view).toEqual(jasmine.any(Function));
      expect(testing.checklist.copy).toEqual(jasmine.any(Function));
      expect(testing.checklist.close).toEqual(jasmine.any(Function));

      expect(testing.checkboxStateChange).toEqual(jasmine.any(Function));

      expect(testing.buildSettingsState).toEqual(jasmine.any(Function));
      expect(testing.settings.trigger).toEqual(jasmine.any(Function));
      expect(testing.settings.close).toEqual(jasmine.any(Function));

      expect(testing.settings.disableCustomColorModeStates).toEqual(jasmine.any(Function));

      expect(testing.settings.changeCustomMode).toEqual(jasmine.any(Function));
      expect(testing.settings.changeDebugMode).toEqual(jasmine.any(Function));
      expect(testing.settings.changeIndividualColor).toEqual(jasmine.any(Function));

      expect(testing.settings.removeCustomColors).toEqual(jasmine.any(Function));
      expect(testing.settings.setCustomColors).toEqual(jasmine.any(Function));
    });

    describe('[init function]', () => {
      it('expects "init" to handle displayMode [""]', async () => {
        mockState.storage['~~key~~'] = {
          debug: false,
          displayMode: '',
          colors: {
            backgroundColor: '#111111',
            foregroundColor: '#eeeeee',
            altBackgroundColor: '#2f4f4f'
          }
        };
        mockState.displayMode = '';  
        await state.init(mockState);
        spyOn(testing.settings, 'setCustomColors').and.stub();
  
        await testing.init(state, store, html, logging);

        const bodyState = testing.body.getAttribute('class');
        expect(bodyState).toBeNull();
        expect(testing.settings.setCustomColors).not.toHaveBeenCalled();
      });
      it('expects "init" to handle displayMode ["customMode"]', async () => {
        mockState.storage['~~key~~'] = {
          debug: false,
          displayMode: 'customMode',
          colors: {
            backgroundColor: '#111111',
            foregroundColor: '#eeeeee',
            altBackgroundColor: '#2f4f4f'
          }
        };
        mockState.displayMode = 'customMode';  
        await state.init(mockState);
        spyOn(testing.settings, 'setCustomColors').and.stub();
  
        await testing.init(state, store, html, logging);
        
        const bodyState = testing.body.getAttribute('class');
        expect(bodyState).toEqual('dark-mode');
        expect(testing.settings.setCustomColors).toHaveBeenCalled();
      });
    });

    it('expects "getStoredElements" to attach checklist elements to passed in DOM element', async () => {
      const element = document.createElement('div');
      mockLocalStorage.storage['~~stored~~'] = JSON.stringify([{
        name: 'test-name',
        title: 'test-title'
      }]);

      await testing.getStoredElements(element);

      const elementState = element.innerHTML.replace(/\s/gm, '');
      expect(elementState).toEqual('<divid="checklist-test-name"class="active-checklist"><aid="title-test-name"class="checklist-title"href="#"onclick="testing.checklist.view(\'test-name\')"><divclass="active-title">test-name</div><divclass="active-category">test-title</div></a><inputid="edit-test-name"class="input-textedit-checklist-namehidden"value="test-name"onkeypress="returntesting.handleNamedKeypress(\'test-name\',event)"><spanid="actions-save-test-name"class="checklist-actioneditinghidden"><ahref="#"onclick="testing.edit.save(\'test-name\')"><imgsrc="images/checked.svg"></a><ahref="#"onclick="testing.edit.cancel(\'test-name\')"><imgsrc="images/error.svg"></a></span><spanid="actions-test-name"class="checklist-action"><ahref="#"onclick="testing.edit.trigger(\'test-name\')"><imgsrc="images/edit.svg"></a><ahref="#"onclick="testing.triggerDelete(\'test-name\')"><imgsrc="images/trash.svg"></a></span></div>');
    });

    describe('[handle keypress functionality', () => {
      it('expects "handleKeypress" to not newChecklist.save [type!=checklist-name and keycode!=13]', () => {
        spyOn(testing.newChecklist, 'save').and.stub();

        const result = testing.handleKeypress('not-checklist-name', { keyCode: 14 });

        expect(result).toEqual(true);
        expect(testing.newChecklist.save).not.toHaveBeenCalled();
      });
      it('expects "handleKeypress" to not newChecklist.save [type=checklist-name and keycode!=13]', () => {
        spyOn(testing.newChecklist, 'save').and.stub();

        const result = testing.handleKeypress('checklist-name', { keyCode: 14 });

        expect(result).toEqual(true);
        expect(testing.newChecklist.save).not.toHaveBeenCalled();
      });
      it('expects "handleKeypress" to not newChecklist.save [type!=checklist-name and keycode=13]', () => {
        spyOn(testing.newChecklist, 'save').and.stub();

        const result = testing.handleKeypress('not-checklist-name', { keyCode: 13 });

        expect(result).toEqual(true);
        expect(testing.newChecklist.save).not.toHaveBeenCalled();
      });
      it('expects "handleKeypress" to newChecklist.save [type=checklist-name and keycode=13]', () => {
        spyOn(testing.newChecklist, 'save').and.stub();

        const result = testing.handleKeypress('checklist-name', { keyCode: 13 });

        expect(result).toEqual(false);
        expect(testing.newChecklist.save).toHaveBeenCalled();
      });

      it('expects "handleNamedKeypress" to return true on keyCode not 13', () => {
        spyOn(testing.edit, 'save').and.stub();

        const result = testing.handleNamedKeypress('test', { keyCode: 14 });

        expect(result).toEqual(true);
        expect(testing.edit.save).not.toHaveBeenCalledWith('test');
      });
      it('expects "handleNamedKeypress" to triggerExitSave with name on keyCode 13', () => {
        spyOn(testing.edit, 'save').and.stub();

        const result = testing.handleNamedKeypress('test', { keyCode: 13 });

        expect(result).toEqual(false);
        expect(testing.edit.save).toHaveBeenCalledWith('test');
      });
    });

    describe('[checklist functionality]', () => {
      it('expects "newChecklist.close" to set wrapper state and hidden appropriately', () => {
        testing.checklistName.value = 'testing';
        testing.newChecklistWrapperState = true;
        testing.newChecklistWrapper.classList.remove('hidden');

        testing.newChecklist.close();

        expect(testing.checklistName.value).toEqual('');
        expect(testing.newChecklistWrapperState).toEqual(false);
        const classes = testing.newChecklistWrapper.getAttribute('class');
        expect(classes).toEqual('hidden');
      });
      it('expects "newChecklist.createChecklistCategories" to create a checklist and update testing.newCategories', () => {
        testing.structure = {
          categories: [
            { title: 'first' },
            { title: 'second' },
            { title: 'third' }
          ]
        };
        
        testing.newChecklist.createChecklistCategories();

        expect(testing.newChecklist.selectedCategory).toEqual({ title: 'first' });
        const newCategoriesState = testing.newCategories.innerHTML.replace(/\s/gm, '');
        expect(newCategoriesState).toEqual('<labelclass="checkbox-label"><inputclass="all-categories"type="checkbox"data-title="first"id="select-0"name="select-first"checked=""onchange="testing.newChecklist.checkboxCategoryChange(\'first\',event)"><spanclass="checkbox-custom"></span><spanclass="checkbox-title">first</span></label><labelclass="checkbox-label"><inputclass="all-categories"type="checkbox"data-title="second"id="select-1"name="select-second"onchange="testing.newChecklist.checkboxCategoryChange(\'second\',event)"><spanclass="checkbox-custom"></span><spanclass="checkbox-title">second</span></label><labelclass="checkbox-label"><inputclass="all-categories"type="checkbox"data-title="third"id="select-2"name="select-third"onchange="testing.newChecklist.checkboxCategoryChange(\'third\',event)"><spanclass="checkbox-custom"></span><spanclass="checkbox-title">third</span></label>');
      });
      it('expects "newChecklist.checkboxCategoryChange" to set the correct category', () => {
        let element1, element2, element3;
        testing.structure = {
          categories: [
            { title: 'title1' },
            { title: 'title2' },
            { title: 'title3' }
          ]
        };
        document.getElementsByClassName = jasmine.createSpy('HTML Element').and.callFake((key) => {
          if (key === 'all-categories') {
            element1 = document.createElement('input');
            element1.setAttribute('type', 'checkbox');
            element1.setAttribute('data-title', 'title1');
            element1.removeAttribute('checked');

            element2 = document.createElement('input');
            element2.setAttribute('type', 'checkbox');
            element2.setAttribute('data-title', 'title2');
            element2.removeAttribute('checked');

            element3 = document.createElement('input');
            element3.setAttribute('type', 'checkbox');
            element3.setAttribute('data-title', 'title3');
            element3.removeAttribute('checked');

            const elements = [element1, element2, element3];
            return elements;
          } else {
            console.log('mocking ... getElementsByClassName', { key });
          }
        });

        testing.newChecklist.checkboxCategoryChange('title2');

        expect(element1.checked).toEqual(false);
        expect(element2.checked).toEqual(true);
        expect(element3.checked).toEqual(false);
        expect(testing.newChecklist.selectedCategory).toEqual({ title: 'title2' });
      });
      it('expects "newChecklist.trigger" to change state and make visible [TRUE]', () => {
        testing.newChecklistWrapperState = false;
        spyOn(testing.newChecklist, 'createChecklistCategories').and.stub();

        testing.newChecklist.trigger();

        expect(testing.newChecklistWrapperState).toEqual(true);
        const newChecklistWrapperState = testing.newChecklistWrapper.getAttribute('class');
        expect(newChecklistWrapperState).toBeNull();
        expect(testing.newChecklist.createChecklistCategories).toHaveBeenCalled();
      });
      it('expects "newChecklist.trigger" to change state and make hidden [FALSE]', () => {
        testing.newChecklistWrapperState = true;

        testing.newChecklist.trigger();

        expect(testing.newChecklistWrapperState).toEqual(false);
        const newChecklistWrapperState = testing.newChecklistWrapper.getAttribute('class');
        expect(newChecklistWrapperState).toEqual('hidden');
      });
      it('expects "newChecklist.save" to fail out [name=""]', async () => {
        spyOn(testing.newChecklist, 'close').and.stub();
        spyOn(testing, 'getStoredElements').and.stub();
        testing.checklistName.value = '';
        testing.newChecklist.selectedCategory = {};
        mockLocalStorage.storage['~~stored~~'] = JSON.stringify([{
          name: 'test-name'
        }]);

        await testing.newChecklist.save();

        expect(testing.newChecklist.selectedCategory).not.toBeNull();
        expect(testing.newChecklist.close).not.toHaveBeenCalled();
        expect(testing.getStoredElements).not.toHaveBeenCalled();
      });
      it('expects "newChecklist.save" to fail out [selectedCategory=NULL]', async () => {
        spyOn(testing.newChecklist, 'close').and.stub();
        spyOn(testing, 'getStoredElements').and.stub();
        testing.checklistName.value = 'test-name';
        testing.newChecklist.selectedCategory = null;
        mockLocalStorage.storage['~~stored~~'] = JSON.stringify([{
          name: 'test-name'
        }]);

        await testing.newChecklist.save();

        expect(testing.newChecklist.selectedCategory).toBeNull();
        expect(testing.newChecklist.close).not.toHaveBeenCalled();
        expect(testing.getStoredElements).not.toHaveBeenCalled();
      });
      it('expects "newChecklist.save" to attempt checklist creation [EXIST]', async () => {
        spyOn(testing.newChecklist, 'close').and.stub();
        spyOn(testing, 'getStoredElements').and.stub();
        testing.checklistName.value = 'test-name';
        testing.newChecklist.selectedCategory = {};
        mockLocalStorage.storage['~~stored~~'] = JSON.stringify([{
          name: 'test-name'
        }]);

        await testing.newChecklist.save();

        expect(testing.newChecklist.selectedCategory).not.toBeNull();
        expect(testing.newChecklist.close).not.toHaveBeenCalled();
        expect(testing.getStoredElements).not.toHaveBeenCalled();
      });
      it('expects "newChecklist.save" to attempt checklist creation [NOT EXIST]', async () => {
        spyOn(testing.newChecklist, 'close').and.stub();
        spyOn(testing, 'getStoredElements').and.stub();
        testing.checklistName.value = 'test-name';
        testing.newChecklist.selectedCategory = { data: 'mock-data' };
        mockLocalStorage.storage['~~stored~~'] = JSON.stringify([{
          name: 'test-not-name'
        }]);

        await testing.newChecklist.save();

        const stored = JSON.parse(mockLocalStorage.storage['~~stored~~']);
        const data = JSON.parse(mockLocalStorage.storage['test-name']);
        expect(stored).toEqual([{
          name: 'test-not-name'
        }, {
          name: 'test-name'
        }]);
        expect(data).toEqual({ data: 'mock-data' });
        expect(testing.selectedCategory).toBeNull();
        expect(testing.newChecklist.close).toHaveBeenCalled();
        expect(testing.getStoredElements).toHaveBeenCalled();
      });
    });

    it('expects "triggerDelete" to remove stored data and getStoredElements', async () => {
      spyOn(testing, 'getStoredElements').and.stub();
      mockLocalStorage.storage['~~stored~~'] = JSON.stringify([{
        name: 'name'
      }]);
      mockLocalStorage.storage.name = JSON.stringify({
        title: 'title-name'
      });

      await testing.triggerDelete('name');

      const stored = JSON.parse(mockLocalStorage.storage['~~stored~~']);
      const nameData = mockLocalStorage.storage.name || null;
      expect(stored).toEqual([]);
      expect(nameData).toBeNull();
    });

    describe('[title edit functionality', () => {
      it('expects "edit.close" to set up hidden classes', () => {
        testing.edit.close('test');

        const editingState = forTesting['checklist-test'].getAttribute('class');
        const actionsState = forTesting['actions-test'].getAttribute('class');
        const saveState = forTesting['actions-save-test'].getAttribute('class');
        const titleState = forTesting['title-test'].getAttribute('class');
        const inputState = forTesting['edit-test'].getAttribute('class');
        expect(editingState).toBeNull();
        expect(actionsState).toBeNull();
        expect(saveState).toEqual('hidden');
        expect(titleState).toBeNull();
        expect(inputState).toEqual('hidden');
      });
      it('expects "edit.trigger" to set up hidden classes', () => {
        testing.edit.trigger('test');

        const editingState = forTesting['checklist-test'].getAttribute('class');
        const actionsState = forTesting['actions-test'].getAttribute('class');
        const saveState = forTesting['actions-save-test'].getAttribute('class');
        const titleState = forTesting['title-test'].getAttribute('class');
        const inputState = forTesting['edit-test'].getAttribute('class');
        expect(editingState).toEqual('editing');
        expect(actionsState).toEqual('hidden');
        expect(saveState).toBeNull();
        expect(titleState).toEqual('hidden');
        expect(inputState).toBeNull();
      });
      it('expects "edit.save" to trigger closeEdit with name and store', async () => {
        spyOn(testing.edit, 'close').and.stub();
        mockLocalStorage.storage['~~stored~~'] = JSON.stringify([{
          name: 'list'
        }, {
          name: 'name'
        }]);
        mockLocalStorage.storage.name = JSON.stringify({ title: 'test' });

        await testing.edit.save('name');

        expect(testing.edit.close).toHaveBeenCalledWith('name');
        const stored = JSON.parse(mockLocalStorage.storage['~~stored~~']);
        const oldList = mockLocalStorage.storage.name || null;
        const newList = JSON.parse(mockLocalStorage.storage['new-name']);
        expect(stored).toEqual([{
          name: 'list'
        }, {
          name: 'new-name'
        }]);
        expect(oldList).toBeNull();
        expect(newList).toEqual({ title: 'test' });
      });
      it('expects "edit.cancel" to trigger edit.close with name', () => {
        spyOn(testing.edit, 'close').and.stub();

        testing.edit.cancel('name');

        expect(testing.edit.close).toHaveBeenCalledWith('name');
      });
    });

    describe('[checklist functionality]', () => {
      it('expects "buildChecklist.copy" to generate copied content from state', () => {
        const template = testing.buildChecklist.copy({
          name: 'name',
          title: 'test-title',
          questions: [{
            checked: true,
            title: 'question 1'
          }, {
            checked: false,
            title: 'question 2'
          }]
        }).replace(/\s/gm, '');

        expect(template).toEqual('##name###test-title[x]question1[]question2');
      });

      it('expects "checklist.view" to set up hidden classes and build state', async () => {
        mockLocalStorage.storage.name = JSON.stringify({
          title: "test",
          questions: [{
            title: "Question 1",
            checked: false
          }, {
            title: "Question 2",
            checked: true
          }]
        });

        await testing.checklist.view('name');

        const onclickState = testing.triggerCopyItem.getAttribute('onclick');
        expect(onclickState).toEqual('testing.checklist.copy(\'name\')');
        const displayedChecklist = testing.displayedChecklist.innerHTML.replace(/\s/gm, '');
        expect(displayedChecklist).toEqual('<h2class="section-title">name</h2><h3class="category-title">test</h3><labelclass="checkbox-label"><inputtype="checkbox"id="question-0"name="question-0"onchange="testing.checkboxStateChange(\'name\',\'0\',event)"><spanclass="checkbox-custom"></span><spanclass="checkbox-title">Question1</span></label><labelclass="checkbox-label"><inputtype="checkbox"id="question-1"name="question-1"checked=""onchange="testing.checkboxStateChange(\'name\',\'1\',event)"><spanclass="checkbox-custom"></span><spanclass="checkbox-title">Question2</span></label>');
        const newChecklistItemState = testing.newChecklistItem.getAttribute('class');
        const copyChecklistItemState = testing.copyChecklistItem.getAttribute('class');
        const checklistsState = testing.checklists.getAttribute('class');
        const displayedChecklistState = testing.displayedChecklist.getAttribute('class');
        expect(newChecklistItemState).toEqual('hidden');
        expect(copyChecklistItemState).toBeNull();
        expect(checklistsState).toEqual('hidden');
        expect(displayedChecklistState).toBeNull();
      });
      it('expects "checklist.copy" to build a markdown copy', async () => {
        mockLocalStorage.storage.name = JSON.stringify({
          title: 'test',
          questions: [{
            checked: true,
            title: 'Question 1'
          }, {
            checked: false,
            title: 'Question 2'
          }]
        });

        await testing.checklist.copy('name', true);

        const copycontent = testing.copyAreaItem.value.replace(/\s/gm, '');
        expect(copycontent).toEqual('##name###test[x]Question1[]Question2');
      });
      it('expects "checklist.close" to clean up hidden classes', () => {
        testing.checklist.close();

        const newChecklistItemState = testing.newChecklistItem.getAttribute('class');
        const copyChecklistItemState = testing.copyChecklistItem.getAttribute('class');
        const checklistsState = testing.checklists.getAttribute('class');
        const displayedChecklistState = testing.displayedChecklist.getAttribute('class');
        expect(newChecklistItemState).toBeNull();
        expect(copyChecklistItemState).toEqual('hidden');
        expect(checklistsState).toBeNull();
        expect(displayedChecklistState).toEqual('hidden');
      });
    });

    it('expects "checkboxStateChange" to change the state of a question', async () => {
      const event = {
        target: {
          checked: true
        }
      };
      mockLocalStorage.storage.name = JSON.stringify({
        questions: [
          { item: 'test', checked: false }
        ]
      });

      await testing.checkboxStateChange('name', 0, event);

      const result = JSON.parse(mockLocalStorage.storage.name);
      expect(result.questions[0].checked).toEqual(true);
    });

    describe('[settings functionality]', () => {
      it('expects "buildSettingsState" to generate settings content [debug=FALSE, displayMode=""]', () => {
        testing.state.debug = false;
        testing.state.displayMode = '';

        testing.buildSettingsState();

        const innerHTML = testing.settingsList.innerHTML.replace(/\s/gm, '');
        expect(innerHTML).toEqual(`<labelclass="checkbox-label"><inputtype="checkbox"id="debug-mode"name="debug-mode"onchange="testing.settings.changeDebugMode()"><spanclass="checkbox-custom"></span><spanclass="checkbox-title">Debug</span></label><labelclass="checkbox-label"><inputtype="checkbox"id="custom-mode"name="custom-mode"onchange="testing.settings.changeCustomMode()"><spanclass="checkbox-custom"></span><spanclass="checkbox-title">DarkMode</span></label><divclass="group"><inputtype="color"id="background-color"name="background-color"value="#ffffff"disabled="true"onchange="testing.settings.changeIndividualColor()"><labelfor="background-color">BackgroundColor</label></div><divclass="group"><inputtype="color"id="alt-background-color"name="alt-background-color"value="#fafad2"disabled="true"onchange="testing.settings.changeIndividualColor()"><labelfor="alt-background-color">Alt.BackgroundColor</label></div><divclass="group"><inputtype="color"id="foreground-color"name="foreground-color"value="#000000"disabled="true"onchange="testing.settings.changeIndividualColor()"><labelfor="foreground-color">ForegroundColor</label></div>`);
      });
      it('expects "buildSettingsState" to generate settings content [debug=TRUE, displayMode=""]', () => {
        testing.state.debug = true;
        testing.state.displayMode = '';

        testing.buildSettingsState();

        const innerHTML = testing.settingsList.innerHTML.replace(/\s/gm, '');
        expect(innerHTML).toEqual(`<labelclass="checkbox-label"><inputtype="checkbox"id="debug-mode"name="debug-mode"checked=""onchange="testing.settings.changeDebugMode()"><spanclass="checkbox-custom"></span><spanclass="checkbox-title">Debug</span></label><labelclass="checkbox-label"><inputtype="checkbox"id="custom-mode"name="custom-mode"onchange="testing.settings.changeCustomMode()"><spanclass="checkbox-custom"></span><spanclass="checkbox-title">DarkMode</span></label><divclass="group"><inputtype="color"id="background-color"name="background-color"value="#ffffff"disabled="true"onchange="testing.settings.changeIndividualColor()"><labelfor="background-color">BackgroundColor</label></div><divclass="group"><inputtype="color"id="alt-background-color"name="alt-background-color"value="#fafad2"disabled="true"onchange="testing.settings.changeIndividualColor()"><labelfor="alt-background-color">Alt.BackgroundColor</label></div><divclass="group"><inputtype="color"id="foreground-color"name="foreground-color"value="#000000"disabled="true"onchange="testing.settings.changeIndividualColor()"><labelfor="foreground-color">ForegroundColor</label></div>`);
      });

      it('expects "settings.trigger" to set up hidden classes and build state', () => {
        testing.settings.trigger(true);

        const innerHTML = testing.settingsList.innerHTML.replace(/\s/gm, '');
        expect(innerHTML).toEqual(`<labelclass="checkbox-label"><inputtype="checkbox"id="debug-mode"name="debug-mode"onchange="testing.settings.changeDebugMode()"><spanclass="checkbox-custom"></span><spanclass="checkbox-title">Debug</span></label><labelclass="checkbox-label"><inputtype="checkbox"id="custom-mode"name="custom-mode"onchange="testing.settings.changeCustomMode()"><spanclass="checkbox-custom"></span><spanclass="checkbox-title">DarkMode</span></label><divclass="group"><inputtype="color"id="background-color"name="background-color"value="#ffffff"disabled="true"onchange="testing.settings.changeIndividualColor()"><labelfor="background-color">BackgroundColor</label></div><divclass="group"><inputtype="color"id="alt-background-color"name="alt-background-color"value="#fafad2"disabled="true"onchange="testing.settings.changeIndividualColor()"><labelfor="alt-background-color">Alt.BackgroundColor</label></div><divclass="group"><inputtype="color"id="foreground-color"name="foreground-color"value="#000000"disabled="true"onchange="testing.settings.changeIndividualColor()"><labelfor="foreground-color">ForegroundColor</label></div>`);
        const newChecklistItemState = testing.newChecklistItem.getAttribute('class');
        const newChecklistWrapperState = testing.newChecklistWrapper.getAttribute('class');
        const checklistsState = testing.checklists.getAttribute('class');
        const settingsState = testing.settingsList.getAttribute('class');
        const settingsItemState = testing.settingsItem.getAttribute('class');
        expect(newChecklistItemState).toEqual('hidden');
        expect(newChecklistWrapperState).toEqual('hidden');
        expect(checklistsState).toEqual('hidden');
        expect(settingsState).toBeNull();;
        expect(settingsItemState).toBeNull();
      });
      it('expects "settings.close" to clean up hidden classes', () => {
        testing.settings.close();

        const newChecklistItemState = testing.newChecklistItem.getAttribute('class');
        const checklistsState = testing.checklists.getAttribute('class');
        const settingsState = testing.settingsList.getAttribute('class');
        const settingsItemState = testing.settingsItem.getAttribute('class');
        expect(newChecklistItemState).toBeNull();
        expect(checklistsState).toBeNull();
        expect(settingsState).toEqual('hidden');
        expect(settingsItemState).toEqual('hidden');
      });
    });

    it('expects "settings.disableCustomColorModeStates" to change disabled state [TRUE]', () => {
      testing.background = helpers.createInputElement('color');
      testing.altBackground = helpers.createInputElement('color');
      testing.foreground = helpers.createInputElement('color');

      testing.settings.disableCustomColorModeStates(true);

      const backgroundState = testing.background.getAttribute('disabled');
      const altBackgroundState = testing.altBackground.getAttribute('disabled');
      const foregroundState = testing.foreground.getAttribute('disabled');
      expect(backgroundState).toEqual('');
      expect(altBackgroundState).toEqual('');
      expect(foregroundState).toEqual('');
    });
    it('expects "settings.disableCustomColorModeStates" to change disabled state [FALSE]', () => {
      testing.background = helpers.createInputElement('color', { disabled: true });
      testing.altBackground = helpers.createInputElement('color', { disabled: true });
      testing.foreground = helpers.createInputElement('color', { disabled: true });

      testing.settings.disableCustomColorModeStates(false);

      const backgroundState = testing.background.getAttribute('disabled');
      const altBackgroundState = testing.altBackground.getAttribute('disabled');
      const foregroundState = testing.foreground.getAttribute('disabled');
      expect(backgroundState).toBeNull();
      expect(altBackgroundState).toBeNull();
      expect(foregroundState).toBeNull();
    });

    describe('[configure modes]', () => {
      it('expects "settings.changeCustomMode" to toggle custom mode [ON]', async () => {
        testing.state.displayMode = '';
        testing.background = helpers.createInputElement('color', { disabled: true });
        testing.altBackground = helpers.createInputElement('color', { disabled: true });
        testing.foreground = helpers.createInputElement('color', { disabled: true });

        await testing.settings.changeCustomMode();
        jasmine.clock().tick(210);

        expect(testing.state.displayMode).toEqual('customMode');
        const bodyClasses = testing.body.getAttribute('class');
        expect(bodyClasses).toEqual('dark-mode');
        expect(testing.state.colors).toEqual({
          backgroundColor: '#111111',
          altBackgroundColor: '#2f4f4f',
          foregroundColor: '#eeeeee'
        });
        const storedState = JSON.parse(mockLocalStorage.storage['~~state~~']);
        expect(storedState).toEqual(jasmine.objectContaining({
          debug: false,
          displayMode: "customMode",
          colors: jasmine.objectContaining({
            backgroundColor: "#111111",
            altBackgroundColor: "#2f4f4f",
            foregroundColor: "#eeeeee"
          })
        }));
      });
      it('expects "settings.changeCustomMode" to toggle custom mode [OFF]', async () => {
        testing.state.displayMode = 'customMode';
        testing.background = helpers.createInputElement('color', { disabled: true });
        testing.altBackground = helpers.createInputElement('color', { disabled: true });
        testing.foreground = helpers.createInputElement('color', { disabled: true });

        await testing.settings.changeCustomMode();
        jasmine.clock().tick(210);

        expect(testing.state.displayMode).toEqual('');
        const bodyClasses = testing.body.getAttribute('class');
        expect(bodyClasses).not.toEqual('dark-mode');
        expect(testing.state.colors).toEqual({
          backgroundColor: '#ffffff',
          altBackgroundColor: '#fafad2',
          foregroundColor: '#000000'
        });
        const storedState = JSON.parse(mockLocalStorage.storage['~~state~~']);
        expect(storedState).toEqual(jasmine.objectContaining({
          debug: false,
          displayMode: "",
          colors: jasmine.objectContaining({
            backgroundColor: "#ffffff",
            altBackgroundColor: "#fafad2",
            foregroundColor: "#000000"
          })
        }));
      });

      it('expects "settings.changeDebugMode" to toggle stored debug state [with colors]', async () => {
        const backgroundColor = '#000000';
        const altBackgroundColor = '#222222';
        const foregroundColor = '#ffffff';
        testing.state.debug = false;
        testing.state.displayMode = '';
        mockLocalStorage.storage['~~state~~'] = JSON.stringify({ debug: false, displayMode: '', colors: {
          backgroundColor, altBackgroundColor, foregroundColor
        }});

        await testing.settings.changeDebugMode();

        expect(testing.state.debug).toEqual(true);
        expect(testing.state.displayMode).toEqual('');
        const storedState = JSON.parse(mockLocalStorage.storage['~~state~~']);
        expect(storedState).toEqual(jasmine.objectContaining({
          debug: true,
          displayMode: '',
          colors: jasmine.objectContaining({
            backgroundColor: '#000000',
            altBackgroundColor: '#222222',
            foregroundColor: '#ffffff'
          })
        }));
      });
      it('expects "settings.changeDebugMode" to toggle stored debug state [without colors]', async () => {
        testing.state.debug = false;
        testing.state.displayMode = '';
        mockLocalStorage.storage['~~state~~'] = JSON.stringify({ debug: false, displayMode: '' });

        await testing.settings.changeDebugMode();

        expect(testing.state.debug).toEqual(true);
        expect(testing.state.displayMode).toEqual('');
        const storedState = JSON.parse(mockLocalStorage.storage['~~state~~']);
        expect(storedState).toEqual(jasmine.objectContaining({
          debug: true,
          displayMode: ''
        }));
      });

      it('expects "settings.changeIndividualColor" to get colors and store', async () => {
        testing.background = { value: '#000000' };
        testing.altBackground = { value: '#222222' };
        testing.foreground = { value: '#ffffff' };

        await testing.settings.changeIndividualColor();

        expect(testing.state.colors).toEqual({
          backgroundColor: '#000000',
          altBackgroundColor: '#222222',
          foregroundColor: '#ffffff'
        });
        const storedState = JSON.parse(mockLocalStorage.storage['~~state~~']);
        expect(storedState).toEqual(jasmine.objectContaining({
          debug: false,
          displayMode: "",
          colors: jasmine.objectContaining({
            backgroundColor: "#000000",
            altBackgroundColor: "#222222",
            foregroundColor: "#ffffff"
          })
        }));
      });
    });

    describe('[custom colors]', () => {
      it('expects "settings.removeCustomColors" to remove attached styles on body', () => {
        testing.settings.setCustomColors();
        testing.settings.removeCustomColors();
        const style = testing.body.getAttribute('style');
        expect(style).toBeNull();
      });
  
      it('expects "settings.setCustomColors" to attach style attributes to body', () => {
        testing.settings.setCustomColors();
        const style = testing.body.getAttribute('style').replace(/\s/gm, '');
        expect(style).toEqual('--background-color:#ffffff;--alt-background-color:#fafad2;--foreground-color:#000000;--title-color:#800000;');
      });  
    });
  });
});
