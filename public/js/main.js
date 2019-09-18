
const logging = {
  state: null,
  init: (state) => {
    logging.state = state;
  },
  show: (...args) => {
    if (logging.state.debug === true) {
      console.log(...args);
    }
  }
};

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

  getStoredKey: async () => {
    return await store.get(store.storedKey) || [];
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
  logging: null,

  elements: {
    body: null,

    checklistName: null,
    newCategories: null,
    checklists: null,
    settingsList: null,
  
    newChecklistItem: null,
    copyChecklistItem: null,
    settingsItem: null,
    messageItem: null,
  
    newChecklistWrapper: null,
  
    displayedChecklist: null,
  
    triggerCopyItem: null,
    copyAreaItem: null,
  
    background: null,
    altBackground: null,
    foreground: null,

    init: () => {
      let elements = testing.elements;
      elements.body = document.getElementById('body');

      elements.checklistName = document.getElementById('checklist-name');
      elements.newCategories = document.getElementById('new-categories');
      elements.checklists = document.getElementById('checklists');
      elements.settingsList = document.getElementById('settings');
  
      elements.newChecklistItem = document.getElementById('nav-new-checklist-item');
      elements.copyChecklistItem = document.getElementById('nav-copy-checklist-item');
      elements.settingsItem = document.getElementById('nav-settings-item');
      elements.messageItem = document.getElementById('message');
  
      elements.newChecklistWrapper = document.getElementById('new-checklist-wrapper');
      testing.newChecklist.state = false;
  
      elements.displayedChecklist = document.getElementById('displayed-checklist');
  
      elements.triggerCopyItem = document.getElementById('trigger-copy');
      elements.copyAreaItem = document.getElementById('copy-area');  
    }
  },

  structure: null,

  init: async (state, store, html, logging) => {
    testing.state = state;
    testing.store = store;
    testing.html = html;
    testing.logging = logging;

    testing.elements.init();
    await testing.templates.init();

    testing.getStoredElements(testing.elements.checklists);

    testing.structure = await testing.store.getStructure();

    testing.logging.show('testing.init', {
      displayMode: testing.state.displayMode,
      "testing.structure": testing.structure
    });

    if (testing.state.displayMode === 'customMode') {
      testing.elements.body.classList.add('dark-mode');
      testing.settings.setCustomColors();      
    }
  },

  getStoredElements: async (attach) => {
    const checklists = await testing.store.getStoredKey();

    attach.innerHTML = "";
    testing.logging.show('getStoredElements', { checklists });
    for(let list of checklists) {
      attach.appendChild(testing.buildChecklistElement(list));
    }
  },

  templates: {
    categoryContent: null,
    categoryElement: null,
    checklist: null,
    settingsState: null,

    init: async () => {
      testing.templates.checklist = await testing.templates.get('checklist.html');
      testing.templates.categoryContent = await testing.templates.get('category-content.html');
      testing.templates.categoryElement = await testing.templates.get('category-element.html');
      testing.templates.settingsState = await testing.templates.get('settings-state.html');  
    },
    get: async (file) => {
      const templateLocation = `/templates/${ file }`;
      const response = await fetch(templateLocation);
      const html = await response.text();
      return html;
    }  
  },

  buildChecklistElement: (list)  => {
    let template = testing.templates.checklist;
    template = template.replace(/~~list.name~~/g, list.name);
    template = template.replace(/~~list.title~~/g, list.title);

    let wrapper = testing.html.fragmentFromString(template);
    return wrapper;
  },

  handleKeypress: (type, event) => {
    switch(true) {
      case (type==='checklist-name'):
        if (event.keyCode === 13) {
          testing.newChecklist.save();
          return false;
        }
        break;
    }
    return true;
  },  
  handleNamedKeypress: (name, event) => {
    if (event.keyCode === 13) {
      testing.edit.save(name);
      return false;
    }
    return true;
  },  

  newChecklist: {
    state: null,
    selectedCategory: null,
    trigger: () => {
      testing.newChecklist.state = !testing.newChecklist.state;
      if (testing.newChecklist.state === true) {
        testing.elements.newCategories.innerHTML = '';
        testing.elements.newCategories.appendChild(testing.newChecklist.createChecklistCategories());

        testing.elements.newChecklistWrapper.classList.remove('hidden');
        testing.elements.checklistName.focus();
      } else {
        testing.elements.newChecklistWrapper.classList.add('hidden');
      }
    },
  
    close: () => {
      testing.elements.checklistName.value = '';
      testing.newChecklist.state = false;
      testing.elements.newChecklistWrapper.classList.add('hidden');  
    },
    save: async () => {
      const name = testing.elements.checklistName.value;
      const category = testing.newChecklist.selectedCategory;
  
      if (name.length === 0 || category === null) {
        return;
      }
  
      let stored = await testing.store.getStoredKey();
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
  
      testing.newChecklist.selectedCategory = null;
      testing.newChecklist.close();
      testing.getStoredElements(testing.elements.checklists);
    },  

    createChecklistCategories: () => {
      let categoryElements = '';
      let first = true;
      testing.structure.categories.forEach((category, index) => {
        if (first === true) {
          testing.newChecklist.selectedCategory = category;
        }
        let cat = testing.templates.categoryElement;
        cat = cat.replace(/~~category.title~~/g, category.title);
        cat = cat.replace(/~~index~~/g, index);
        cat = cat.replace(/~~checked~~/g, (first ? 'checked' : ''));
        cat = categoryElements += cat;
        first = false;
      });
  
      let wrapper = testing.html.fragmentFromString(categoryElements);
      return wrapper;
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
          testing.newChecklist.selectedCategory = category;
        }
      });
    }
  },

  triggerDelete: async (name) => {
    testing.logging.show('triggerDelete', { name });

    let stored = await testing.store.getStoredKey();
    stored.splice(stored.indexOf(name), 1);

    await testing.store.set(testing.store.storedKey, stored);
    await testing.store.remove(name);

    testing.getStoredElements(testing.elements.checklists);
  },

  edit: {
    close: (name) => {
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
    trigger: (name) => {
      testing.logging.show('triggerEdit', { name });
  
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
    save: async (name) => {
      testing.logging.show('save', { name });
  
      const input = document.getElementById(`edit-${ name }`);
      const newName = input.value;
  
      testing.edit.close(name);
  
      let stored = await testing.store.getStoredKey();
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
      testing.logging.show('save', { state });
  
      await testing.store.set(testing.store.storedKey, stored);
      await testing.store.remove(name);
      await testing.store.set(newName, state);
  
      testing.getStoredElements(testing.elements.checklists);
    },
    cancel: (name) => {
      testing.logging.show('cancel', { name });
      
      const input = document.getElementById(`edit-${ name }`);
      input.value = name;
      
      testing.edit.close(name);
    } 
  },

  buildChecklist: {
    state: (state) => {
      testing.logging.show('buildChecklist.state', { state });
  
      let content = '';
      const categoryTitle = `<h3 class="category-title">${ state.title }</h3>`;
      let categoryContent = '';
      state.questions.forEach((data, index) => {
        const question = data.title;
        let cat = testing.templates.categoryContent;
        cat = cat.replace(/~~state.name~~/g, state.name);
        cat = cat.replace(/~~question~~/g, question);
        cat = cat.replace(/~~index~~/g, index);
        cat = cat.replace(/~~checked~~/g, (data.checked ? 'checked' : ''));
        categoryContent += cat;
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
      return wrapper;
    },
    copy: (state) => {
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
    }      
  },

  checklist: {
    view: async (name) => {
      const state = await testing.store.get(name);
      testing.logging.show('checklist.view', { name, state });
  
      state.name = name;
      await testing.elements.triggerCopyItem.setAttribute('onclick', `testing.checklist.copy('${ name }')`);

      testing.elements.displayedChecklist.innerHTML = "";
      testing.elements.displayedChecklist.appendChild(testing.buildChecklist.state(state));
  
      testing.elements.newChecklistItem.classList.add('hidden');
      testing.elements.copyChecklistItem.classList.remove('hidden');
  
      testing.elements.checklists.classList.add('hidden');
      testing.elements.displayedChecklist.classList.remove('hidden');
    },
    copy: async (name, forTest = false) => {
      const state = await testing.store.get(name);
      testing.logging.show('checklist.copy', { state });
  
      state.name = name;
      const copy = testing.buildChecklist.copy(state);
      testing.elements.copyAreaItem.value = copy;
      
      testing.elements.copyAreaItem.select();
      document.execCommand('copy');
  
      testing.elements.messageItem.innerHTML = "Copied as Markdown.";
      testing.elements.messageItem.classList.remove('hidden');
      
      if (forTest === false) {
        setTimeout(function() {
          testing.elements.messageItem.classList.add('hide-2s');
          setTimeout(function() {
            testing.elements.messageItem.classList.remove('hide-2s');
            testing.elements.messageItem.classList.add('hidden');
          }, 2500);
        }, 1000);  
      }
    },
    close: () => {
      testing.logging.show('checklist.close');
  
      testing.elements.newChecklistItem.classList.remove('hidden');
      testing.elements.copyChecklistItem.classList.add('hidden');
  
      testing.elements.checklists.classList.remove('hidden');
      testing.elements.displayedChecklist.classList.add('hidden');
    }  
  },

  checkboxStateChange: async (name, index, event) => {
    testing.logging.show('checkboxStateChange', { name, index });

    const checkedState = event.target.checked;
    const state = await testing.store.get(name);

    state.questions[index].checked = checkedState;
    await testing.store.set(name, state);
  },

  buildSettingsState: () => {
    const debug = testing.state.debug;
    const displayMode = testing.state.displayMode;
    const mode = (displayMode === 'customMode' ? "checked" : "");
    const disabled = (displayMode === 'customMode' ? '' : 'disabled="true"');

    let content = testing.templates.settingsState;
    content = content.replace(/~~debug~~/g, (debug ? 'checked' : ''));
    content = content.replace(/~~displayMode=customMode~~/g, mode);
    content = content.replace(/~~displayMode=customMode-disabled~~/g, disabled);
    content = content.replace(/~~testing.state.colors.backgroundColor~~/g, testing.state.colors.backgroundColor);
    content = content.replace(/~~testing.state.colors.altBackgroundColor~~/g, testing.state.colors.altBackgroundColor);
    content = content.replace(/~~testing.state.colors.foregroundColor~~/g, testing.state.colors.foregroundColor);

    let wrapper = testing.html.fragmentFromString(content);
    return wrapper;
  },

  settings: {
    trigger: (forTest = false) => {
      testing.elements.newChecklistItem.classList.add('hidden');
      testing.elements.newChecklistWrapper.classList.add('hidden');
      testing.elements.checklists.classList.add('hidden');
  
      testing.elements.settingsList.classList.remove('hidden');
      testing.elements.settingsItem.classList.remove('hidden');
  
      testing.elements.settingsList.innerHTML = "";
      testing.elements.settingsList.appendChild(testing.buildSettingsState());
  
      if (forTest === false) {
        setTimeout(() => {
          testing.elements.background = document.getElementById('background-color');
          testing.elements.altBackground = document.getElementById('alt-background-color');
          testing.elements.foreground = document.getElementById('foreground-color');
        }, 200);  
      }
    },
    close: () => {
      testing.elements.newChecklistItem.classList.remove('hidden');
      testing.elements.checklists.classList.remove('hidden');
  
      testing.elements.settingsList.classList.add('hidden');
      testing.elements.settingsItem.classList.add('hidden');
    },
  
    disableCustomColorModeStates: (state) => {
      testing.logging.show('settings.disableCustomColorModeStates', { state });
  
      if (state === true) {
        testing.elements.background.disabled = state;
        testing.elements.altBackground.disabled = state;
        testing.elements.foreground.disabled = state;  
      } else {
        testing.logging.show('... removing attribute disabled');
        testing.elements.background.removeAttribute('disabled');
        testing.elements.altBackground.removeAttribute('disabled');
        testing.elements.foreground.removeAttribute('disabled');
      }
    },
  
    changeCustomMode: async () => {
      const debug = testing.state.debug;
  
      testing.state.displayMode = testing.state.displayMode === 'customMode' ? '' : 'customMode';
      let displayMode = testing.state.displayMode;
  
      if (displayMode === 'customMode') {
        testing.elements.body.classList.add('dark-mode');
        testing.state.colors = testing.state.colorCustomStart;
        await testing.store.set(testing.store.stateKey, { debug, displayMode, colors: testing.state.colors });
        testing.settings.setCustomColors();
        testing.logging.show('settings.changeCustomMode on ...');
      } else {
        testing.elements.body.classList.remove('dark-mode');
        testing.state.colors = testing.state.colorDefault;
        await testing.store.set(testing.store.stateKey, { debug, displayMode, colors: testing.state.colors });
        testing.settings.disableCustomColorModeStates(true);
        testing.settings.removeCustomColors();
      }
  
      testing.elements.settingsList.innerHTML = "";
      testing.elements.settingsList.appendChild(testing.buildSettingsState());

      if (displayMode === 'customMode') {
        setTimeout(() => {
          testing.settings.disableCustomColorModeStates(false);
        }, 200);
      }
    },
    changeDebugMode: async () => {
      testing.state.debug = !testing.state.debug;
      const displayMode = testing.state.displayMode;
      const state = await testing.store.get(testing.store.stateKey);
  
      if ('colors' in state) {
        await testing.store.set(testing.store.stateKey, { debug: testing.state.debug, displayMode, colors: state.colors });
      } else {
        await testing.store.set(testing.store.stateKey, { debug: testing.state.debug, displayMode });
      }
    },
    changeIndividualColor: () => {
      const debug = testing.state.debug;
      const displayMode = testing.state.displayMode;
  
      const backgroundColor = testing.elements.background.value;
      const altBackgroundColor = testing.elements.altBackground.value;
      const foregroundColor = testing.elements.foreground.value;
  
      testing.state.colors = {
        backgroundColor, altBackgroundColor, foregroundColor
      };
      testing.logging.show('change individual color ...', { colors: testing.state.colors });
      testing.store.set(testing.store.stateKey, { debug, displayMode, colors: testing.state.colors });
      testing.settings.setCustomColors();
    },
  
    removeCustomColors: () => {
      testing.elements.body.removeAttribute('style');
    },
    setCustomColors: () => {
      const logoColor = testing.state.calculateLogoColor(testing.state.colors.backgroundColor);
      testing.logging.show('settings.setCustomColors', { bg: testing.state.colors.backgroundColor, logoColor });
  
      testing.elements.body.setAttribute('style', `
        --background-color: ${ testing.state.colors.backgroundColor };
        --alt-background-color: ${ testing.state.colors.altBackgroundColor };
        --foreground-color: ${ testing.state.colors.foregroundColor };
        --title-color: ${ logoColor };
      `.trim());
    }  
  }

};