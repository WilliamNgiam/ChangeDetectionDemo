/**
 *
 * changeDetection.js
 * William Ngiam
 *
 * task script for change detection demo
 *
 **/

/* initialize jsPsych */
var jsPsych = initJsPsych({
    show_proress_bar: true
});

/* create timeline */
var timeline = [];

// DEFINE EXPERIMENT VARIABLES
let canvas_width = 1200 // sets canvas width
let canvas_height = 500 // sets canvas height
const item_size = 100 // sets item size
const n_trials = 50 // Number of trials
const stim_duration = 300 // Stimulus duration

let item_locs = [
    [canvas_width / 3 + item_size * -3, canvas_height / 2 + item_size * -2],
    [canvas_width / 3 + item_size * 2, canvas_height / 2 + item_size * -2],
    [canvas_width / 3 + item_size * -3, canvas_height / 2 + item_size * 2],
    [canvas_width / 3 + item_size * 2, canvas_height / 2 + item_size * 2]
]

let colors = jsPsych.randomization.sampleWithoutReplacement([
    "#d20000",
    "#18a000",
    "#fee700",
    "#0062d2", 
    "#ff00ff",
    "#ffa200",
    "#02cff8",
    "#8a06f0",
])


// BUILD EXPERIMENT

/* define welcome message trial */
var welcome = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
    <p>This is a demo of the change-detection task paradigm.</p>
    <p>This will take approximately 10 minutes. You will start with 10 practice trials, and then 50 test trials.</p>
    <br>
`,
    choices: [">>"],
    button_html: ['<button class="jspsych-btn">%choice%</button>']
};
timeline.push(welcome);

// Start instructions
var instructions = {
   type: jsPsychHtmlButtonResponse,
    stimulus: `
    <p>On each trial, four coloured squares will appear on the screen in four boxes.<br></p>
    <p>After a short delay, one square will re-appear with either the same or different colour.<br></p>
    <p>Press S for same or D for different.<br></p> 
    <p>The practice trials will start right away when you press the button.<br></p>
`,
    choices: [">>"],
    button_html: ['<button class="jspsych-btn">%choice%</button>']
}

timeline.push(instructions);

// Practice trials
var practice_stim = {
    type: jsPsychCanvasKeyboardResponse,
    on_start: function () {
        shuffledLocations = jsPsych.randomization.sampleWithoutReplacement([0, 1, 2, 3], 4);
        trial_colors = jsPsych.randomization.sampleWithoutReplacement(colors, 4);
    },
    canvas_size: [600, 800],
    stimulus: draw_stimulus,
    choices: "NO_KEYS",
    trial_duration: 1500,
    data: {
        task: 'practice_stim',
        colors: colors,
    },
    on_finish: function (data) {
        data.locations = shuffledLocations;
        data.trial_colors = trial_colors;
    }
};

function draw_stimulus(c) {
    let ctx = c.getContext('2d');
    ctx.clearRect(0, 0, canvas_width, canvas_height);
    ctx.globalCompositeOperation = "screen";

    for (let i = 0; i < 4; i++) {
        const position = shuffledLocations[i];

        ctx.strokeRect(item_locs[i][0], item_locs[i][1], item_size, item_size);
        ctx.fillStyle = trial_colors[i];
        ctx.fillRect(item_locs[position][0], item_locs[position][1], item_size, item_size);
    }
}

function reorderArray(originalArray, indexesArray) {
    return indexesArray.map(
        index => originalArray[index]
    );
}

// Draw blank period
var practice_blank = {
    type: jsPsychHtmlKeyboardResponse,
    canvas_size: [600, 800],
    stimulus: '',
    choices: "NO_KEYS",
    trial_duration: 500,
    data: {
        task: 'practice_blank'
    }
};

// Draw response screen
var practice_response = {
    type: jsPsychCanvasKeyboardResponse,
    on_start: function () {
        test_location = jsPsych.randomization.sampleWithoutReplacement([0, 1, 2, 3], 1)[0];
        probe_is_change = Math.random() < 0.5;

        probe_color = trial_colors[test_location];
        if (probe_is_change) {
            var remainingColors = colors.filter(color => color !== probe_color);
            probe_color = jsPsych.randomization.sampleWithoutReplacement(remainingColors, 1)[0];
        }

    },
    canvas_size: [600, 800],
    stimulus: drawResponse,
    choices: ['s', 'd'],
    data: {
        task: 'practice_response'
    },
    prompt: 'Press S if the same colour, or D if it is different.',
    on_finish: function (data) {
        data.test_location = test_location;
        data.trial_colors = trial_colors;
        data.probe_is_change = probe_is_change;
        data.probe_color = probe_color;

        if (probe_is_change) {
            data.correct = data.response === 'd'
        } else if (!probe_is_change) {
            data.correct = data.response === 's'
        }
    }
};

function drawResponse(c) {
    let ctx = c.getContext('2d');
    ctx.clearRect(0, 0, canvas_width, canvas_height);
    ctx.font = "36px Arial";

    const probe_position = shuffledLocations[test_location];
    const [x, y] = item_locs[probe_position];

    ctx.fillStyle = probe_color;
    ctx.fillRect(x, y, item_size, item_size);
    ctx.strokeRect(x, y, item_size, item_size);
}

// Practice feedback
var practice_feedback = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function () {
        var last_trial_correct = jsPsych.data.get().last(1).values()[0].correct;
        if(last_trial_correct){
        return "<p>Correct!</p>"; // the parameter value has to be returned from the function
        } else {
        return "<p>Wrong.</p>"; // the parameter value has to be returned from the function
        }

    },
    choices: "NO_KEYS",
    trial_duration: 800,
    data: {
        task: 'practice_feedback'
    }
};

// Inter-trial interval
var practice_ITI = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '',
    choices: "NO_KEYS",
    trial_duration: 500,
    data: {
        task: 'practice_ITI'
    }
};

// Set-up timeline loop
var practice_loop = {
    timeline: [practice_stim, practice_blank, practice_response, practice_feedback, practice_ITI],
    repetitions: 10,
    randomize_order: true
};
timeline.push(practice_loop);

// Start task
var start_task = {
   type: jsPsychHtmlButtonResponse,
    stimulus: `
    <p>You have now completed the practice trials.<br></p>
    <p>In the following trials, the coloured squares will be shown very quickly.<br></p> 
    <p>There are 50 test trials. Press to begin.</p>
    <br>
`,
    choices: [">>"],
    button_html: ['<button class="jspsych-btn">%choice%</button>']
}

timeline.push(start_task);

// START TRIAL LOOP
// Draw stimulus
var stim = {
    type: jsPsychCanvasKeyboardResponse,
    on_start: function () {
        shuffledLocations = jsPsych.randomization.sampleWithoutReplacement([0, 1, 2, 3], 4);
        trial_colors = jsPsych.randomization.sampleWithoutReplacement(colors, 4);
    },
    canvas_size: [600, 800],
    stimulus: draw_stimulus,
    choices: "NO_KEYS",
    trial_duration: stim_duration,
    data: {
        task: 'stimulus',
        colors: colors,
    },
    on_finish: function (data) {
        data.locations = shuffledLocations;
        data.trial_colors = trial_colors;
    }
};

function draw_stimulus(c) {
    let ctx = c.getContext('2d');
    ctx.clearRect(0, 0, canvas_width, canvas_height);
    ctx.globalCompositeOperation = "screen";

    for (let i = 0; i < 4; i++) {
        const position = shuffledLocations[i];

        ctx.strokeRect(item_locs[i][0], item_locs[i][1], item_size, item_size);
        ctx.fillStyle = trial_colors[i];
        ctx.fillRect(item_locs[position][0], item_locs[position][1], item_size, item_size);
    }
}

// Draw blank period
var blank = {
    type: jsPsychHtmlKeyboardResponse,
    canvas_size: [600, 800],
    stimulus: '',
    choices: "NO_KEYS",
    trial_duration: 500,
    data: {
        task: 'blank'
    }
};

// Draw response screen
var response = {
    type: jsPsychCanvasKeyboardResponse,
    on_start: function () {
        test_location = jsPsych.randomization.sampleWithoutReplacement([0, 1, 2, 3], 1)[0];
        probe_is_change = Math.random() < 0.5;

        probe_color = trial_colors[test_location];
        if (probe_is_change) {
            var remainingColors = colors.filter(color => color !== probe_color);
            probe_color = jsPsych.randomization.sampleWithoutReplacement(remainingColors, 1)[0];
        }

        probe_colors = trial_colors.slice();
        probe_colors[test_location] = probe_color;
    },
    canvas_size: [600, 800],
    stimulus: drawResponse,
    choices: ['s', 'd'],
    data: {
        task: 'response'
    },
    prompt: 'Press S if the probed square is the same colour, or D if it is different.',
    on_finish: function (data) {
        data.test_location = test_location;
        data.trial_colors = trial_colors;
        data.probe_is_change = probe_is_change;
        data.probe_color = probe_color;

        if (probe_is_change) {
            data.correct = data.response === 'd'
        } else if (!probe_is_change) {
            data.correct = data.response === 's'
        }
    }
};

// Inter-trial interval
var ITI = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '',
    choices: "NO_KEYS",
    trial_duration: 500,
    data: {
        task: 'fixation'
    }
};

// Set-up timeline loop
var test_procedure = {
    timeline: [stim, blank, response, ITI],
    repetitions: n_trials,
    randomize_order: true
};
timeline.push(test_procedure);

var close_fullscreen = {
    type: jsPsychFullscreen,
    fullscreen_mode: false
}
timeline.push(close_fullscreen)

/* end of experiment */
var end_experiment = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        const responseData = jsPsych.data.get().filter({task: 'response'}).values();
        const totalTrials = responseData.length;
        const correctTrials = responseData.filter(d => d.correct).length;
        const percentCorrect = totalTrials > 0 ? (correctTrials / totalTrials) * 100 : 0;

        const changeTrials = responseData.filter(d => d.probe_is_change === true);
        const noChangeTrials = responseData.filter(d => d.probe_is_change === false);

        const hits = changeTrials.length > 0
            ? changeTrials.filter(d => d.response === 'd').length / changeTrials.length
            : 0;
        const falseAlarms = noChangeTrials.length > 0
            ? noChangeTrials.filter(d => d.response === 'd').length / noChangeTrials.length
            : 0;

        const cowansK = 4 * (hits - falseAlarms);

        return `
            <p>This is the end of the demo!</p>
            <p>Your overall performance was ${percentCorrect.toFixed(1)}% correct.</p>
            <p>Your estimated working memory capacity (Cowan's K) was ${cowansK.toFixed(2)}.</p>
        `;
    },
    choices: ["Finish"],
    button_html: ['<button class="jspsych-btn">%choice%</button>']
}
timeline.push(end_experiment)

/* start the experiment */
jsPsych.run(timeline);

