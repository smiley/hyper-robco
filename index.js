const path = require('path');
const process = require('process');
const electron = require('electron');
var sounds_path = path.join(__dirname, 'sounds').replace(/\\/g, "/");

function getSoundFullPath(sound_name) {
    return 'file://' + sounds_path + '/' + sound_name;
}

if (process.type === "renderer") {
    function makePlayer(sound_name) {
        var audio = new Audio(getSoundFullPath(sound_name));
        audio.volume = 0.2;
        return audio;
    }
} else {
    function makePlayer(sound_name) {
        return {
            'play': function(){}
        };
    }
}

const SOUNDS = {
    'SINGLE': [
        makePlayer('ui_hacking_charsingle_01.wav'),
        makePlayer('ui_hacking_charsingle_02.wav'),
        makePlayer('ui_hacking_charsingle_03.wav'),
        makePlayer('ui_hacking_charsingle_04.wav'),
        makePlayer('ui_hacking_charsingle_05.wav'),
        makePlayer('ui_hacking_charsingle_06.wav'),
    ],
    'ARROW': [
        makePlayer('ui_hacking_charscroll.wav'),
        makePlayer('ui_hacking_charscroll_lp.wav'),
    ],
    'ENTER': [
        makePlayer('ui_hacking_charenter_01.wav'),
        makePlayer('ui_hacking_charenter_02.wav'),
        makePlayer('ui_hacking_charenter_03.wav'),
    ],
    'EVENTS': {
        'OPEN': makePlayer('poweron.mp3'),
        'CLOSE': makePlayer('poweroff.mp3'),
    }
}

function getRandom(list) {
    var limit = list.length;
    var newRand = Math.floor(Math.random() * limit);
    if (list._lastNum !== undefined) {
        if (newRand == list._lastNum) {
            newRand = (newRand + 1) % limit;
        }
    }
    list._lastNum = newRand;
    return list[newRand];
}

exports.decorateTerm = (Term, { React, notify }) => {
    return class extends React.Component {

    constructor (props, context) {
      super(props, context);
      this._onTerminal = this._onTerminal.bind(this);
    }

    _onTerminal (term) {
        if (this.props && this.props.onTerminal) this.props.onTerminal(term);

        const handlers = [
            [
                "keydown",
                function(e) {
                    var repeatable = false;
                    var soundList = SOUNDS.SINGLE;
                    switch (e.key) {
                        case "ArrowDown":
                        case "ArrowUp":
                        case "ArrowLeft":
                        case "ArrowRight":
                            repeatable = true;
                            soundList = SOUNDS.ARROW;
                            break;
                        case "Enter":
                            soundList = SOUNDS.ENTER;
                            break;
                        case "Escape":
                            break;
                        default:
                            break;
                    }
                    
                    if (e.repeat && !repeatable) {
                        return true;
                    }
                    var sound = getRandom(soundList).play();
                    
                    return true;
                }.bind(term.keyboard)
            ],
        ];

        term.uninstallKeyboard();
        for (var i = 0; i < handlers.length; i++) {
            var handler = handlers[i];
            term.keyboard.handlers_ = [handler].concat(term.keyboard.handlers_);
        }
        term.installKeyboard();
    }

    render () {
        return React.createElement(Term, Object.assign({}, this.props, {
            onTerminal: this._onTerminal
        }));
    }

  };
};

exports.middleware = (store) => (next) => (action) => {
    if (action.type === 'TERM_GROUP_REQUEST') {
        SOUNDS.EVENTS.CLOSE.currentTime = 0.0;
        SOUNDS.EVENTS.OPEN.play();
    }
    if (action.type === 'TERM_GROUP_EXIT') {
        SOUNDS.EVENTS.CLOSE.currentTime = 0.0;
        SOUNDS.EVENTS.CLOSE.play();
    }
    next(action);
};