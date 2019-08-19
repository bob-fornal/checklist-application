
const state = {
  debug: false,
  displayMode: '',
  colors: {},

  colorDefault: {
    backgroundColor: '#ffffff',
    foregroundColor: '#000000',
    altBackgroundColor: '#fafad2'
  },
  colorDark: {
    backgroundColor: '#000000',
    foregroundColor: '#ffffff',
    altBackgroundColor: '#2f4f4f'
  },

  init: async (store) => {
    const initialStates = await store.get(store.stateKey);
    const states = initialStates || store.stateDefault;

    state.debug = states.debug;
    state.displayMode = states.displayMode;

    if (initialStates === null) {
      await store.set(store.stateDefault, states);
    }

    if (state.displayMode === '') {
      state.colors = state.colorDefault;
    } else if (state.displayMode === 'darkMode') {
      state.colors = state.colorDark;
    } else if (state.displayMode === 'customMode') {
      state.colors = states.colors || state.colorDark;
    }

    // Command line option to turn on debugging state
    console.log('state.init', { state });
  }
};

const store = {
  storage: null,
  storedKey: '~~stored~~',
  stateKey: '~~state~~',
  stateDefault: {
    debug: false,
    displayMode: '' // '', 'darkMode', 'customMode'
    // if customMode, include foreground, background1 and background2 colors
  },

  init: () => {
    store.storage = window.localStorage;
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

    testing.state.debug && console.log('display-mode', { dysplayMode: testing.state.displayMode });
    if (testing.state.displayMode === 'darkMode') {
      testing.body.classList.add('dark-mode');
    } else if (testing.state.displayMode === '' || testing.state.displayMode === 'customMode') {
      testing.body.classList.remove('dark-mode');
    }

    testing.checklistName = document.getElementById('checklist-name');
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
    testing.state.debug && console.log('structure', { "testing.structure": testing.structure });

    if (testing.state.displayMode === 'customMode') {
      testing.setCustomColors();      
    }
  },

  getStoredElements: async (attach) => {
    const checklists = await testing.store.get(testing.store.storedKey) || [];

    attach.innerHTML = "";

    testing.state.debug && console.log('getStoredElements', { checklists });
    for(let name of checklists) {
      attach.appendChild(testing.buildChecklistElement(name));
    }
  },

  buildChecklistElement: (name)  => {
    const template = `
      <div id="checklist-${ name }" class="active-checklist">
        <a id="title-${ name }" class="checklist-title"href="#" onclick="testing.triggerChecklistView('${ name }')">
          ${ name }
        </a>
        <input id="edit-${ name }" class="input-text edit-checklist-name  hidden" value="${ name }" onkeypress="return testing.handleNamedKeypress('${ name }', event)" />

        <span id="actions-save-${ name }" class="checklist-action editing hidden">
          <a href="#" onclick="testing.triggerEditSave('${ name }')">
            <img src="images/checked.svg" />
          </a>
          <a href="#" onclick="testing.triggerEditCancel('${ name }')">
            <img src="images/error.svg" />
          </a>
        </span>
        <span id="actions-${ name }" class="checklist-action">
          <a href="#" onclick="testing.triggerEdit('${ name }')">
            <img src="images/edit.svg" />
          </a>
          <a href="#" onclick="testing.triggerDelete('${ name }')">
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
  triggerNewChecklist: () => {
    testing.newChecklistWrapperState = !testing.newChecklistWrapperState;
    if (testing.newChecklistWrapperState === true) {
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
    let stored = await testing.store.get(testing.store.storedKey) || [];
    if (stored.includes(name)) {
      // Duplicate Name (Handle)?
      return;
    } else {
      stored.push(name);
      stored = stored.sort();

      await testing.store.set(testing.store.storedKey, stored);
      await testing.store.set(name, testing.structure);

      testing.closeNewChecklist();
      testing.getStoredElements(testing.checklists);
    }
  },

  triggerDelete: async (name) => {
    testing.state.debug && console.log('triggerDelete', { name });

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
    testing.state.debug && console.log('triggerEdit', { name });

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
    testing.state.debug && console.log('triggerEditSave', { name });

    const input = document.getElementById(`edit-${ name }`);
    const newName = input.value;

    testing.closeEdit(name);

    let stored = await testing.store.get(testing.store.storedKey) || [];
    stored.splice(stored.indexOf(name), 1);
    stored.push(newName);
    stored = stored.sort();

    const state = await testing.store.get(name);
    testing.state.debug && console.log('triggerEditSave', { state });
    await testing.store.set(testing.store.storedKey, stored);
    await testing.store.remove(name);
    await testing.store.set(newName, state);

    testing.getStoredElements(testing.checklists);
  },
  triggerEditCancel: (name) => {
    testing.state.debug && console.log('triggerEditCancel', { name });
    
    const input = document.getElementById(`edit-${ name }`);
    input.value = name;
    
    testing.closeEdit(name);
  },

  buildChecklistState: (state) => {
    let content = '';
    for (let category of state.order) {
      const categoryData = state[category];
      const categoryTitle = `<h3 class="category-title">${ categoryData.title }</h3>`;
      let categoryContent = '';
      for (let question of categoryData.order) {
        const data = categoryData[question];
        const questionState = data.checked;
        categoryContent += `
          <label class="checkbox-label">
            <input type="checkbox" id="${ category }-${ question }" name="${ category }-${ question }" ${ (questionState ? "checked" : "") } onchange="testing.checkboxStateChange('${ state.name }', '${ category }', '${ question }', event)" />
            <span class="checkbox-custom"></span>
            <span class="checkbox-title">${ data.title }</span>
          </label>
        `;
      }
      content += `
        ${ categoryTitle }
        ${ categoryContent }
      `;
    }
    const template = `
      <h2 class="section-title">${ state.name }</h2>
      ${ content }
    `;
    let wrapper = testing.html.fragmentFromString(template);

    testing.displayedChecklist.innerHTML = "";
    testing.displayedChecklist.appendChild(wrapper);
  },
  buildChecklistCopy: (state) => {
    let content = '';
    for (let category of state.order) {
      const categoryData = state[category];
      const categoryTitle = `### ${ categoryData.title }`;
      let categoryContent = '';
      for (let question of categoryData.order) {
        const data = categoryData[question];
        const questionState = data.checked;
        categoryContent += `
${ (questionState ? "[x]" : "[ ]") } ${ data.title }
        `;
      }
      content += `
${ categoryTitle }
${ categoryContent }
      `;
    }
    const template = `
## ${ state.name }
${ content }
    `;

    return template;
  },

  triggerChecklistView: async (name) => {
    const state = await testing.store.get(name);
    testing.state.debug && console.log('triggerChecklistView', { name, state });

    state.name = name;
    testing.triggerCopyItem.setAttribute('onclick', `testing.triggerCopy('${ name }')`);
    testing.buildChecklistState(state);

    testing.newChecklistItem.classList.add('hidden');
    testing.copyChecklistItem.classList.remove('hidden');

    testing.checklists.classList.add('hidden');
    testing.displayedChecklist.classList.remove('hidden');
  },
  triggerCopy: async (name) => {
    const state = await testing.store.get(name);
    testing.state.debug && console.log('triggerCopy', { name, state });

    state.name = name;
    const copy = testing.buildChecklistCopy(state);
    testing.copyAreaItem.value = copy;
    
    testing.copyAreaItem.select();
    document.execCommand('copy');

    testing.messageItem.innerHTML = "Copied as Markdown.";
    testing.messageItem.classList.remove('hidden');
    setTimeout(function() {
      testing.messageItem.classList.add('hide-2s');
      setTimeout(function() {
        testing.messageItem.classList.remove('hide-2s');
        testing.messageItem.classList.add('hidden');
      }, 2500);
    }, 1000);
  },
  closeChecklist: () => {
    testing.state.debug && console.log('closeChecklist');

    testing.newChecklistItem.classList.remove('hidden');
    testing.copyChecklistItem.classList.add('hidden');

    testing.checklists.classList.remove('hidden');
    testing.displayedChecklist.classList.add('hidden');
  },

  checkboxStateChange: async (name, category, question, event) => {
    testing.state.debug && console.log('checkboxStateChange', { name, category, question });

    const checkedState = event.target.checked;
    const state = await testing.store.get(name);

    state[category][question].checked = checkedState;
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
        <input type="checkbox" id="dark-mode" name="dark-mode" ${ (displayMode === 'darkMode' ? "checked" : "") } onchange="testing.changeDarkMode()" />
        <span class="checkbox-custom"></span>
        <span class="checkbox-title">Dark Mode</span>
      </label>

      <label class="checkbox-label">
        <input type="checkbox" id="custom-mode" name="custom-mode" ${ (displayMode === 'customMode' ? "checked" : "") } onchange="testing.changeCustomMode()" />
        <span class="checkbox-custom"></span>
        <span class="checkbox-title">Custom Mode</span>
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
  triggerSettings: () => {
    testing.newChecklistItem.classList.add('hidden');
    testing.newChecklistWrapper.classList.add('hidden');
    testing.checklists.classList.add('hidden');

    testing.settings.classList.remove('hidden');
    testing.settingsItem.classList.remove('hidden');

    testing.buildSettingsState();
    setTimeout(() => {
      testing.background = document.getElementById('background-color');
      testing.altBackground = document.getElementById('alt-background-color');
      testing.foreground = document.getElementById('foreground-color');
    }, 200);
  },
  closeSettings: () => {
    testing.newChecklistItem.classList.remove('hidden');
    testing.checklists.classList.remove('hidden');

    testing.settings.classList.add('hidden');
    testing.settingsItem.classList.add('hidden');
  },

  disableCustomColorModeStates: (state) => {
    console.log('disableCustomColorModeStates', { state });
    if (state === true) {
      testing.background.disabled = state;
      testing.altBackground.disabled = state;
      testing.foreground.disabled = state;  
    } else {
      console.log('... removing attribute disabled')
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
      testing.body.classList.remove('dark-mode');
      testing.state.colors = testing.state.colorDark;
      await testing.store.set(testing.store.stateKey, { debug, displayMode, colors: testing.state.colorDark });
    } else {
      testing.body.classList.remove('dark-mode');
      testing.state.colors = testing.state.colorDefault;
      await testing.store.set(testing.store.stateKey, { debug, displayMode, colors: {} });
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

    debug = !debug;
    testing.state.debug = debug;

    await testing.store.set(testing.store.stateKey, { debug, displayMode });
  },
  changeDarkMode: async () => {
    const debug = testing.state.debug;

    testing.state.displayMode = testing.state.displayMode === 'darkMode' ? '' : 'darkMode';
    let displayMode = testing.state.displayMode;

    if (displayMode === 'darkMode') {
      testing.body.classList.add('dark-mode');
      testing.state.colors = testing.state.colorDark;
    } else {
      testing.body.classList.remove('dark-mode');
      testing.state.colors = testing.state.colorDefault;
    }

    await testing.store.set(testing.store.stateKey, { debug, displayMode, colors: {} });
    testing.buildSettingsState();
    testing.disableCustomColorModeStates(true);
    testing.removeCustomColors();
  },
  changeIndividualColor: () => {
    const debug = testing.state.debug;
    const displayMode = testing.state.displayMode;

    const backgroundColor = testing.background.value;
    const altBackgroundColor = testing.altBackground.value;
    const foregroundColor = testing.foreground.value;
    console.log({ backgroundColor, altBackgroundColor, foregroundColor });

    testing.state.colors = {
      backgroundColor, altBackgroundColor, foregroundColor
    };
    testing.store.set(testing.store.stateKey, { debug, displayMode, colors: testing.state.colors });
    testing.setCustomColors();
  },

  removeCustomColors: () => {
    testing.body.removeAttribute('style');
  },
  setCustomColors: () => {
    testing.body.setAttribute('style', `
      --background-color: ${ testing.state.colors.backgroundColor };
      --alt-background-color: ${ testing.state.colors.altBackgroundColor };
      --foreground-color: ${ testing.state.colors.foregroundColor };
    `.trim());
  }
}