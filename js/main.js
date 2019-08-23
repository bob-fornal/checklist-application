
const state = {
  debug: false,
  displayMode: '',
  colors: {},

  colorDefault: {
    backgroundColor: '#ffffff',
    foregroundColor: '#000000',
    altBackgroundColor: '#fafad2'
  },
  colorCustomStart: {
    backgroundColor: '#111111',
    foregroundColor: '#eeeeee',
    altBackgroundColor: '#2f4f4f'
  },

  init: async (store) => {
    const initialStates = await store.get(store.stateKey);
    const states = initialStates || store.stateDefault;

    state.debug = states.debug;
    state.displayMode = states.displayMode;

    if (initialStates === null) {
      await store.set(store.stateKey, states);
    }

    if (state.displayMode === '') {
      state.colors = state.colorDefault;
    } else {
      state.colors = states.colors || state.colorDefault;
    }

    // Command line option to turn on debugging state
    console.log('state.init', { debug: state.debug, displayMode: state.displayMode, colors: state.colors });
  },

  calculateLogoColor: (color) => {
    // WHITE BACKGROUND
    const light = {
      r: 128,
      g: 0,
      b: 0
    };
    // BLACK BACKGROUND
    const dark = {
      r: 240,
      g: 128,
      b: 128
    };

    const brightness = state.calculateBrightness(color);

    const r = state.calculateIndividualColorAdjust(dark.r, light.r, brightness);
    const g = state.calculateIndividualColorAdjust(dark.g, light.g, brightness);
    const b = state.calculateIndividualColorAdjust(dark.b, light.b, brightness);

    const result = state.rgbToHex({ r, g, b });
    return result;
  },
  calculateIndividualColorAdjust: (dark, light, brightness) => {
    const diff = dark - light;
    const adjust = Math.round(diff * (brightness / 255));
    return dark - adjust;
  },
  calculateBrightness: (color) => {
    // #000000 BLACK = 0
    // #ffffff WHITE = 255
    const rgb = state.hexToRGB(color);
    return Math.round(0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b);
  },
  hexToRGB: (hex) => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },
  componentToHex: (color) => {
    const hex = color.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  },
  rgbToHex: (color) => {
    return `#${ state.componentToHex(color.r) }${ state.componentToHex(color.g) }${ state.componentToHex(color.b) }`;
  }
};

const store = {
  storage: null,
  storedKey: '~~stored~~',
  stateKey: '~~state~~',
  stateDefault: {
    debug: false,
    displayMode: '' // '', 'customMode' (dark mode is custom mode in start state)
    // if customMode, include foreground, background1 and background2 colors
  },

  init: (storage) => {
    store.storage = storage;
  },

  get: async (key) => {
    const retrieved = await store.storage.getItem(key);
    return (retrieved === null) ? null : JSON.parse(retrieved);
  },
  set: async (key, value) => {
    await store.storage.setItem(key, JSON.stringify(value));
  },

  remove: async (key) => {
    await store.storage.removeItem(key);
  },

  getStructure: async () => {
    return fetch('./testing.json').then(res => res.json());
  }
};

const html = {
  init: () => {},

  fragmentFromString: (stringHTML) => {
    let temp = document.createElement('template');
    temp.innerHTML = stringHTML;
    return temp.content;
  }
};

const testing = {
  state: null,
  store: null,
  html: null,

  body: null,

  checklistName: null,
  newCategories: null,
  checklists: null,
  settings: null,

  newChecklistItem: null,
  copyChecklistItem: null,
  settingsItem: null,
  messageItem: null,

  newChecklistWrapper: null,
  newChecklistWrapperState: false,

  structure: null,
  displayedChecklist: null,

  triggerCopyItem: null,
  copyAreaItem: null,

  background: null,
  altBackground: null,
  foreground: null,

  init: async (state, store, html) => {
    testing.state = state;
    testing.store = store;
    testing.html = html;

    testing.body = document.getElementById('body');

    testing.state.debug && console.log('display-mode', { displayMode: testing.state.displayMode }); // jshint ignore:line
    if (testing.state.displayMode === 'customMode') {
      testing.body.classList.add('dark-mode');
    }

    testing.checklistName = document.getElementById('checklist-name');
    testing.newCategories = document.getElementById('new-categories');
    testing.checklists = document.getElementById('checklists');
    testing.settings = document.getElementById('settings');

    testing.newChecklistItem = document.getElementById('nav-new-checklist-item');
    testing.copyChecklistItem = document.getElementById('nav-copy-checklist-item');
    testing.settingsItem = document.getElementById('nav-settings-item');
    testing.messageItem = document.getElementById('message');

    testing.newChecklistWrapper = document.getElementById('new-checklist-wrapper');
    testing.newChecklistWrapperState = false;

    testing.displayedChecklist = document.getElementById('displayed-checklist');

    testing.triggerCopyItem = document.getElementById('trigger-copy');
    testing.copyAreaItem = document.getElementById('copy-area');

    testing.getStoredElements(testing.checklists);

    testing.structure = await testing.store.getStructure();
    testing.state.debug && console.log('structure', { "testing.structure": testing.structure }); // jshint ignore:line

    if (testing.state.displayMode === 'customMode') {
      testing.setCustomColors();      
    }
  },

  getStoredElements: async (attach) => {
    const checklists = await testing.store.get(testing.store.storedKey) || [];

    attach.innerHTML = "";

    testing.state.debug && console.log('getStoredElements', { checklists }); // jshint ignore:line
    for(let name of checklists) {
      attach.appendChild(testing.buildChecklistElement(name));
    }
  },

  buildChecklistElement: (list)  => {
    const template = `
      <div id="checklist-${ list.name }" class="active-checklist">
        <a id="title-${ list.name }" class="checklist-title"href="#" onclick="testing.triggerChecklistView('${ list.name }')">
          <div class="active-title">${ list.name }</div>
          <div class="active-category">${ list.title }</div>
        </a>
        <input id="edit-${ list.name }" class="input-text edit-checklist-name  hidden" value="${ list.name }" onkeypress="return testing.handleNamedKeypress('${ list.name }', event)" />

        <span id="actions-save-${ list.name }" class="checklist-action editing hidden">
          <a href="#" onclick="testing.triggerEditSave('${ list.name }')">
            <img src="images/checked.svg" />
          </a>
          <a href="#" onclick="testing.triggerEditCancel('${ list.name }')">
            <img src="images/error.svg" />
          </a>
        </span>
        <span id="actions-${ list.name }" class="checklist-action">
          <a href="#" onclick="testing.triggerEdit('${ list.name }')">
            <img src="images/edit.svg" />
          </a>
          <a href="#" onclick="testing.triggerDelete('${ list.name }')">
            <img src="images/trash.svg" />
          </a>
        </span>
      </div>
    `;
    let wrapper = testing.html.fragmentFromString(template);

    return wrapper;
  },

  handleKeypress: (type, event) => {
    switch(true) {
      case (type==='checklist-name'):
        if (event.keyCode === 13) {
          testing.triggerSaveChecklist();
          return false;
        }
        break;
    }
    return true;
  },  
  handleNamedKeypress: (name, event) => {
    if (event.keyCode === 13) {
      testing.triggerEditSave(name);
      return false;
    }
    return true;
  },  

  closeNewChecklist: () => {
    testing.checklistName.value = '';
    testing.newChecklistWrapperState = false;
    testing.newChecklistWrapper.classList.add('hidden');
  },
  selectedCategory: null,
  createChecklistCategories: () => {
    let categoryElements = '';
    let first = true;
    testing.structure.categories.forEach((category, index) => {
      if (first === true) {
        testing.selectedCategory = category;
      }
      categoryElements += `
        <label class="checkbox-label">
          <input class="all-categories" type="checkbox" data-title="${ category.title }" id="select-${ index }" name="select-${ category.title }" ${ (first ? "checked" : "") } onchange="testing.checkboxCategoryChange('${ category.title }', event)" />
          <span class="checkbox-custom"></span>
          <span class="checkbox-title">${ category.title }</span>
        </label>
      `;
      first = false;
    });

    let wrapper = testing.html.fragmentFromString(categoryElements);
    testing.newCategories.innerHTML = "";
    testing.newCategories.appendChild(wrapper);
  },
  checkboxCategoryChange: (categoryTitle) => {
    const categories = document.getElementsByClassName('all-categories');
    for (let i = 0, len = categories.length; i < len; i++) {
      const element = categories[i];
      const elementTitle = element.getAttribute('data-title');
      element.checked = (elementTitle === categoryTitle);
    }
    testing.structure.categories.forEach((category) => {
      if (category.title === categoryTitle) {
        testing.selectedCategory = category;
      }
    });
  },  
  triggerNewChecklist: () => {
    testing.newChecklistWrapperState = !testing.newChecklistWrapperState;
    if (testing.newChecklistWrapperState === true) {
      testing.createChecklistCategories();
      testing.newChecklistWrapper.classList.remove('hidden');
      testing.checklistName.focus();
    } else {
      testing.newChecklistWrapper.classList.add('hidden');
    }
  },
  triggerCancelNewChecklist: () => {
    testing.closeNewChecklist();
  },
  triggerSaveChecklist: async () => {
    const name = testing.checklistName.value;
    const category = testing.selectedCategory;

    if (name.length === 0 || category === null) {
      return;
    }

    let stored = await testing.store.get(testing.store.storedKey) || [];
    let exists = false;
    stored.forEach((item) => {
      if (item.name === name) {
        exists = true;
      }
    });
    if (exists) {
      return;
    }

    stored.push({ name, title: category.title });
    stored = stored.sort((a, b) => a.name - b.name);

    await testing.store.set(testing.store.storedKey, stored);
    await testing.store.set(name, category);

    testing.selectedCategory = null;
    testing.closeNewChecklist();
    testing.getStoredElements(testing.checklists);
  },

  triggerDelete: async (name) => {
    testing.state.debug && console.log('triggerDelete', { name }); // jshint ignore:line

    let stored = await testing.store.get(testing.store.storedKey) || [];
    stored.splice(stored.indexOf(name), 1);

    await testing.store.set(testing.store.storedKey, stored);
    await testing.store.remove(name);

    testing.getStoredElements(testing.checklists);
  },

  closeEdit: (name) => {
    const active = document.getElementById(`checklist-${ name }`);
    active.classList.remove('editing');
    
    const actions = document.getElementById(`actions-${ name }`);
    const save = document.getElementById(`actions-save-${ name }`);
    const title = document.getElementById(`title-${ name }`);
    const input = document.getElementById(`edit-${ name }`);

    actions.classList.remove('hidden');
    save.classList.add('hidden');
    title.classList.remove('hidden');
    input.classList.add('hidden');
  },
  triggerEdit: (name) => {
    testing.state.debug && console.log('triggerEdit', { name }); // jshint ignore:line

    const active = document.getElementById(`checklist-${ name }`);
    active.classList.add('editing');
    
    const actions = document.getElementById(`actions-${ name }`);
    const save = document.getElementById(`actions-save-${ name }`);
    const title = document.getElementById(`title-${ name }`);
    const input = document.getElementById(`edit-${ name }`);

    actions.classList.add('hidden');
    save.classList.remove('hidden');
    title.classList.add('hidden');
    input.classList.remove('hidden');

    input.focus();
    input.select();
  },
  triggerEditSave: async (name) => {
    testing.state.debug && console.log('triggerEditSave', { name }); // jshint ignore:line

    const input = document.getElementById(`edit-${ name }`);
    const newName = input.value;

    testing.closeEdit(name);

    let stored = await testing.store.get(testing.store.storedKey) || [];
    let index = -1;
    for (let i = 0, len = stored.length; i < len; i++) {
      if (stored[i].name === name) {
        index = i;
        break;
      }
    }
    if (index > -1) {
      let old = stored.splice(index, 1)[0];
      old.name = newName;
      stored.push(old);
      stored = stored.sort((a, b) => a.name - b.name);
    }

    const state = await testing.store.get(name);
    testing.state.debug && console.log('triggerEditSave', { state }); // jshint ignore:line

    await testing.store.set(testing.store.storedKey, stored);
    await testing.store.remove(name);
    await testing.store.set(newName, state);

    testing.getStoredElements(testing.checklists);
  },
  triggerEditCancel: (name) => {
    testing.state.debug && console.log('triggerEditCancel', { name }); // jshint ignore:line
    
    const input = document.getElementById(`edit-${ name }`);
    input.value = name;
    
    testing.closeEdit(name);
  },

  buildChecklistState: (state) => {
    testing.state.debug && console.log('buildChecklistState', { state }); // jshint ignore:line

    let content = '';
    const categoryTitle = `<h3 class="category-title">${ state.title }</h3>`;
    let categoryContent = '';
    state.questions.forEach((data, index) => {
      const questionState = data.checked;
      const question = data.title;
      categoryContent += `
        <label class="checkbox-label">
          <input type="checkbox" id="question-${ index }" name="question-${ index }" ${ (questionState ? "checked" : "") } onchange="testing.checkboxStateChange('${ state.name }', '${ index }', event)" />
          <span class="checkbox-custom"></span>
          <span class="checkbox-title">${ question }</span>
        </label>
      `;
    });

    content += `
      ${ categoryTitle }
      ${ categoryContent }
    `;

    const template = `
      <h2 class="section-title">${ state.name }</h2>
      ${ content }
    `;

    let wrapper = testing.html.fragmentFromString(template);
    testing.displayedChecklist.innerHTML = "";
    testing.displayedChecklist.appendChild(wrapper);
  },
  buildChecklistCopy: (state) => {
    const categoryTitle = `### ${ state.title }`;
    let categoryContent = '';
    for (let question of state.questions) {
      categoryContent += `
${ (question.checked === true ? "[x]" : "[ ]") } ${ question.title }
        `;
    }

    const template = `
## ${ state.name }
${ categoryTitle }
${ categoryContent }
    `;

    return template;
  },

  triggerChecklistView: async (name) => {
    const state = await testing.store.get(name);
    testing.state.debug && console.log('triggerChecklistView', { name, state }); // jshint ignore:line

    state.name = name;
    await testing.triggerCopyItem.setAttribute('onclick', `testing.triggerCopy('${ name }')`);
    testing.buildChecklistState(state);

    testing.newChecklistItem.classList.add('hidden');
    testing.copyChecklistItem.classList.remove('hidden');

    testing.checklists.classList.add('hidden');
    testing.displayedChecklist.classList.remove('hidden');
  },
  triggerCopy: async (name, forTest = false) => {
    const state = await testing.store.get(name);
    testing.state.debug && console.log('triggerCopy', { state }); // jshint ignore:line

    state.name = name;
    const copy = testing.buildChecklistCopy(state);
    testing.copyAreaItem.value = copy;
    
    testing.copyAreaItem.select();
    document.execCommand('copy');

    testing.messageItem.innerHTML = "Copied as Markdown.";
    testing.messageItem.classList.remove('hidden');
    
    if (forTest === false) {
      setTimeout(function() {
        testing.messageItem.classList.add('hide-2s');
        setTimeout(function() {
          testing.messageItem.classList.remove('hide-2s');
          testing.messageItem.classList.add('hidden');
        }, 2500);
      }, 1000);  
    }
  },
  closeChecklist: () => {
    testing.state.debug && console.log('closeChecklist'); // jshint ignore:line

    testing.newChecklistItem.classList.remove('hidden');
    testing.copyChecklistItem.classList.add('hidden');

    testing.checklists.classList.remove('hidden');
    testing.displayedChecklist.classList.add('hidden');
  },

  checkboxStateChange: async (name, index, event) => {
    testing.state.debug && console.log('checkboxStateChange', { name, index }); // jshint ignore:line

    const checkedState = event.target.checked;
    const state = await testing.store.get(name);

    state.questions[index].checked = checkedState;
    await testing.store.set(name, state);
  },

  buildSettingsState: () => {
    const debug = testing.state.debug;
    const displayMode = testing.state.displayMode;

    const content = `
      <label class="checkbox-label">
        <input type="checkbox" id="debug-mode" name="debug-mode" ${ (debug ? "checked" : "") } onchange="testing.changeDebugMode()" />
        <span class="checkbox-custom"></span>
        <span class="checkbox-title">Debug</span>
      </label>

      <label class="checkbox-label">
        <input type="checkbox" id="custom-mode" name="custom-mode" ${ (displayMode === 'customMode' ? "checked" : "") } onchange="testing.changeCustomMode()" />
        <span class="checkbox-custom"></span>
        <span class="checkbox-title">Dark Mode</span>
      </label>
      <div class="group">
        <input type="color" id="background-color" name="background-color" value="${ testing.state.colors.backgroundColor }" ${ displayMode === 'customMode' ? '' : 'disabled="true"' } onchange="testing.changeIndividualColor()">
        <label for="background-color">Background Color</label>
      </div>
      <div class="group">
        <input type="color" id="alt-background-color" name="alt-background-color" value="${ testing.state.colors.altBackgroundColor }" ${ displayMode === 'customMode' ? '' : 'disabled="true"' } onchange="testing.changeIndividualColor()">
        <label for="alt-background-color">Alt. Background Color</label>
      </div>
      <div class="group">
        <input type="color" id="foreground-color" name="foreground-color" value="${ testing.state.colors.foregroundColor }" ${ displayMode === 'customMode' ? '' : 'disabled="true"' } onchange="testing.changeIndividualColor()">
        <label for="foreground-color">Foreground Color</label>
      </div>
    `;
    let wrapper = testing.html.fragmentFromString(content);

    testing.settings.innerHTML = "";
    testing.settings.appendChild(wrapper);
  },
  triggerSettings: (forTest = false) => {
    testing.newChecklistItem.classList.add('hidden');
    testing.newChecklistWrapper.classList.add('hidden');
    testing.checklists.classList.add('hidden');

    testing.settings.classList.remove('hidden');
    testing.settingsItem.classList.remove('hidden');

    testing.buildSettingsState();

    if (forTest === false) {
      setTimeout(() => {
        testing.background = document.getElementById('background-color');
        testing.altBackground = document.getElementById('alt-background-color');
        testing.foreground = document.getElementById('foreground-color');
      }, 200);  
    }
  },
  closeSettings: () => {
    testing.newChecklistItem.classList.remove('hidden');
    testing.checklists.classList.remove('hidden');

    testing.settings.classList.add('hidden');
    testing.settingsItem.classList.add('hidden');
  },

  disableCustomColorModeStates: (state) => {
    testing.state.debug && console.log('disableCustomColorModeStates', { state }); // jshint ignore:line

    if (state === true) {
      testing.background.disabled = state;
      testing.altBackground.disabled = state;
      testing.foreground.disabled = state;  
    } else {
      testing.state.debug && console.log('... removing attribute disabled'); // jshint ignore:line
      testing.background.removeAttribute('disabled');
      testing.altBackground.removeAttribute('disabled');
      testing.foreground.removeAttribute('disabled');
    }
  },

  changeCustomMode: async () => {
    const debug = testing.state.debug;

    testing.state.displayMode = testing.state.displayMode === 'customMode' ? '' : 'customMode';
    let displayMode = testing.state.displayMode;

    if (displayMode === 'customMode') {
      testing.body.classList.add('dark-mode');
      testing.state.colors = testing.state.colorCustomStart;
      await testing.store.set(testing.store.stateKey, { debug, displayMode, colors: testing.state.colors });
      testing.setCustomColors();
      testing.state.debug && console.log('changeCustomMode on ...'); // jshint ignore:line
    } else {
      testing.body.classList.remove('dark-mode');
      testing.state.colors = testing.state.colorDefault;
      await testing.store.set(testing.store.stateKey, { debug, displayMode, colors: testing.state.colors });
      testing.disableCustomColorModeStates(true);
      testing.removeCustomColors();
    }

    testing.buildSettingsState();
    if (displayMode === 'customMode') {
      setTimeout(() => {
        testing.disableCustomColorModeStates(false);
      }, 200);
    }
  },
  changeDebugMode: async () => {
    let debug = testing.state.debug;
    const displayMode = testing.state.displayMode;
    const state = await testing.store.get(testing.store.stateKey);
    console.log('testing', { state });

    debug = !debug;
    testing.state.debug = debug;

    if ('colors' in state) {
      await testing.store.set(testing.store.stateKey, { debug, displayMode, colors: state.colors });
    } else {
      await testing.store.set(testing.store.stateKey, { debug, displayMode });
    }
  },
  changeIndividualColor: () => {
    const debug = testing.state.debug;
    const displayMode = testing.state.displayMode;

    const backgroundColor = testing.background.value;
    const altBackgroundColor = testing.altBackground.value;
    const foregroundColor = testing.foreground.value;

    testing.state.colors = {
      backgroundColor, altBackgroundColor, foregroundColor
    };
    testing.state.debug && console.log('change individual color ...', { colors: testing.state.colors }); // jshint ignore:line
    testing.store.set(testing.store.stateKey, { debug, displayMode, colors: testing.state.colors });
    testing.setCustomColors();
  },

  removeCustomColors: () => {
    testing.body.removeAttribute('style');
  },
  setCustomColors: () => {
    const logoColor = testing.state.calculateLogoColor(testing.state.colors.backgroundColor);
    testing.state.debug && console.log('setCustomColors', { bg: testing.state.colors.backgroundColor, logoColor }); // jshint ignore:line

    testing.body.setAttribute('style', `
      --background-color: ${ testing.state.colors.backgroundColor };
      --alt-background-color: ${ testing.state.colors.altBackgroundColor };
      --foreground-color: ${ testing.state.colors.foregroundColor };
      --title-color: ${ logoColor };
    `.trim());
  }
};