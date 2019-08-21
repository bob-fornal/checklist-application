var oldState = { ...state };

var mockStore = {
  storage: {},
  stateKey: '~~key~~',
  stateDefault: {
    debug: false,
    displayMode: ''
  },
  get: async (key) => {
    if (key in mockStore.storage) {
      return await mockStore.storage[key];
    } else {
      return null;
    }
  },
  set: async (key, value) => {
    mockStore.storage[key] = value;
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

describe('Testing Checklist', () => {

  describe('"state" object', () => {
    beforeEach(() => {
      state.debug = oldState.debug;
      state.displayMode = oldState.displayMode;
      state.colors = oldState.colors;

      mockStore.storage = {};
      mockStore.stateDefault = {
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
      await state.init(mockStore);

      expect(state.debug).toEqual(false);
      expect(state.colors).toEqual({
        backgroundColor: '#ffffff',
        foregroundColor: '#000000',
        altBackgroundColor: '#fafad2'
      });
      expect(mockStore.storage[mockStore.stateKey]).toEqual({
        debug: false,
        displayMode: ''
      });
    });
    it('expects "init(store)" to configure values properly [debug=true]', async () => {
      mockStore.storage['~~key~~'] = {
        debug: true,
        displayMode: ''
      };
      mockStore.debug = true;

      await state.init(mockStore);

      expect(state.debug).toEqual(true);
      expect(state.colors).toEqual({
        backgroundColor: '#ffffff',
        foregroundColor: '#000000',
        altBackgroundColor: '#fafad2'
      });
      expect(mockStore.storage[mockStore.stateKey]).toEqual({
        debug: true,
        displayMode: ''
      });
    });
    it('expects "init(store)" to configure values properly [colors=customMode]', async () => {
      mockStore.storage['~~key~~'] = {
        debug: false,
        displayMode: 'customMode',
        colors: {
          backgroundColor: '#111111',
          foregroundColor: '#eeeeee',
          altBackgroundColor: '#2f4f4f'
        }
      };
      mockStore.displayMode = 'customMode';

      await state.init(mockStore);

      expect(state.debug).toEqual(false);
      expect(state.colors).toEqual({
        backgroundColor: '#111111',
        foregroundColor: '#eeeeee',
        altBackgroundColor: '#2f4f4f'
      });
      expect(mockStore.storage[mockStore.stateKey]).toEqual({
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
      fetchMock.get('./testing.json', { 'test': 'object' });

      const result = await store.getStructure();
      expect(result).toEqual({ 'test': 'object' });

      fetchMock.reset();
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
        'trigger-copy',
        'copy-area'
      ];
      const colors = [
        'background-color',
        'alt-background-color',
        'foreground-color'
      ];
      document.getElementById = jasmine.createSpy('HTML Element').and.callFake((key) => {
        if (key === 'body') {
          return document.createElement('body');
        } else if (divs.includes(key)) {
          return document.createElement('div');
        } else if (color.includes(key)) {
          return document.createElement('input').setAttribute('type', 'color');
        }
      });

      await store.init(mockLocalStorage);
      await state.init(store);
      await html.init();
      await testing.init(state, store, html);
    });

    afterEach(() => {
      mockStore.storage = {};
      mockLocalStorage.storage = {};
    });

    it('expects constant initialization', () => {
      expect(testing.state).not.toBeNull();
      expect(testing.store).not.toBeNull();
      expect(testing.html).not.toBeNull();

      expect(testing.selectedCategory).toBeNull();
    });

    it('expects functions', () => {
      expect(testing.init).toEqual(jasmine.any(Function));

      expect(testing.getStoredElements).toEqual(jasmine.any(Function));

      expect(testing.buildChecklistElement).toEqual(jasmine.any(Function));

      expect(testing.handleKeypress).toEqual(jasmine.any(Function));
      expect(testing.handleNamedKeypress).toEqual(jasmine.any(Function));

      expect(testing.closeNewChecklist).toEqual(jasmine.any(Function));
      expect(testing.createChecklistCategories).toEqual(jasmine.any(Function));
      expect(testing.checkboxCategoryChange).toEqual(jasmine.any(Function));
      expect(testing.triggerNewChecklist).toEqual(jasmine.any(Function));
      expect(testing.triggerCancelNewChecklist).toEqual(jasmine.any(Function));
      expect(testing.triggerSaveChecklist).toEqual(jasmine.any(Function));

      expect(testing.triggerDelete).toEqual(jasmine.any(Function));

      expect(testing.closeEdit).toEqual(jasmine.any(Function));
      expect(testing.triggerEdit).toEqual(jasmine.any(Function));
      expect(testing.triggerEditSave).toEqual(jasmine.any(Function));
      expect(testing.triggerEditCancel).toEqual(jasmine.any(Function));

      expect(testing.buildChecklistState).toEqual(jasmine.any(Function));
      expect(testing.buildChecklistCopy).toEqual(jasmine.any(Function));

      expect(testing.triggerChecklistView).toEqual(jasmine.any(Function));
      expect(testing.triggerCopy).toEqual(jasmine.any(Function));
      expect(testing.closeChecklist).toEqual(jasmine.any(Function));

      expect(testing.checkboxStateChange).toEqual(jasmine.any(Function));

      expect(testing.buildSettingsState).toEqual(jasmine.any(Function));
      expect(testing.triggerSettings).toEqual(jasmine.any(Function));
      expect(testing.closeSettings).toEqual(jasmine.any(Function));

      expect(testing.disableCustomColorModeStates).toEqual(jasmine.any(Function));

      expect(testing.changeCustomMode).toEqual(jasmine.any(Function));
      expect(testing.changeDebugMode).toEqual(jasmine.any(Function));
      expect(testing.changeIndividualColor).toEqual(jasmine.any(Function));

      expect(testing.removeCustomColors).toEqual(jasmine.any(Function));
      expect(testing.setCustomColors).toEqual(jasmine.any(Function));
    });

    // testing.changeCustomMode

    it('expects "changeDebugMode" to toggle stored debug state [with colors]', async () => {
      const backgroundColor = '#000000';
      const altBackgroundColor = '#222222';
      const foregroundColor = '#ffffff';
      testing.state.debug = false;
      testing.state.displayMode = '';
      testing.store.storage.storage['~~state~~'] = JSON.stringify({ debug: false, displayMode: '', colors: {
        backgroundColor, altBackgroundColor, foregroundColor
      }});

      await testing.changeDebugMode();

      expect(testing.state.debug).toEqual(true);
      expect(testing.state.displayMode).toEqual('');
      const storedState = JSON.parse(testing.store.storage.storage['~~state~~']);
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
    it('expects "changeDebugMode" to toggle stored debug state [without colors]', async () => {
      testing.state.debug = false;
      testing.state.displayMode = '';
      testing.store.storage.storage['~~state~~'] = JSON.stringify({ debug: false, displayMode: '' });

      await testing.changeDebugMode();

      expect(testing.state.debug).toEqual(true);
      expect(testing.state.displayMode).toEqual('');
      const storedState = JSON.parse(testing.store.storage.storage['~~state~~']);
      expect(storedState).toEqual(jasmine.objectContaining({
        debug: true,
        displayMode: ''
      }));
    });

    it('expects "changeIndividualColor" to get colors and store', async () => {
      testing.background = { value: '#000000' };
      testing.altBackground = { value: '#222222' };
      testing.foreground = { value: '#ffffff' };

      await testing.changeIndividualColor();

      expect(testing.state.colors).toEqual({
        backgroundColor: '#000000',
        altBackgroundColor: '#222222',
        foregroundColor: '#ffffff'
      });
      const storedState = JSON.parse(testing.store.storage.storage['~~state~~']);
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

    it('expects "removeCustomColors" to remove attached styles on body', () => {
      testing.setCustomColors();
      testing.removeCustomColors();
      const style = testing.body.getAttribute('style');
      expect(style).toBeNull();
    });

    it('expects "setCustomColors" to attach style attributes to body', () => {
      testing.setCustomColors();
      const style = testing.body.getAttribute('style').replace(/\s/gm, '');
      expect(style).toEqual('--background-color:#ffffff;--alt-background-color:#fafad2;--foreground-color:#000000;--title-color:#800000;');
    });
  });
});
