var quill = new Quill('#editor', {
    theme: 'snow',
    "modules": {
      "toolbar": false
    }
});

let gptKey = "";

// Pass prompt to GPT-3.5 and generate response
const gptGenerate = async(systemPrompt, message)=> {
    try {
      let response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gptKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
          temperature: 1.0,
          top_p: 0.7,
          n: 1,
          stream: false,
          presence_penalty: 0,
          frequency_penalty: 0,
        }),
      })
      if (!response.ok) { 
        console.log("Error in GPT call, response not okay")
        return undefined
      }
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
        console.log("Error in GPT call: " + error)
        return undefined;
    }
  }

// Set reponse text
function setResponse(res) {
  document.getElementById("responseText").innerHTML = res;
}

// Check for user-highlighted text
let highlighted_text;
quill.on('selection-change', function (range) {
    if (range && range.length > 0) {
        highlighted_text = quill.getText(range.index, range.length);
    } else {
        // No text is currently highlighted
        highlighted_text = null;
        console.log('No highlighted text');
    }
    });

function resetHighlight() {
    let text = quill.getText();
    quill.formatText(0, text.length, 'background', '#FFFFFF');
}

// Finds grammar errors in user-inputted text and outputs fixes
async function generateGrammarResponse(text) {
    let user_text = `Text: ${text}
    Corrections:
    `
    let grammarPrompt = `I want you to act as an editor. You will be given a text. Your task is to identify possible grammar errors in the text. List the grammar errors and how to correct them, and also provide reasoning for the corrections. Each entry should be in the format (error|correction|reasoning).
    Example:
    Text: I have two childs. One is a girl named Clair. The other is boy named Thatcher.
    Corrections:
    (I have two childs.|I have two children.|The plural form of a child is children.)
    (The other is boy named Thatcher.|The other is a boy named Thatcher.|There needs to be an indefinite article to introduce the noun “boy.”)`

    let gptResponse = await gptGenerate(grammarPrompt, user_text);
    if (gptResponse === undefined) {
        return undefined;
    }
    if (gptResponse.toLowerCase().search("No corrections needed") !== -1) {
        return gptResponse;
    }

    let responseList = gptResponse.split('(');
    let res = "";
    let numError = 1;

    // Format output for each grammar error found
    responseList.forEach((response) => {
        response = response.substring(0, response.length - 1);

        let parsedResponse = response.split('|');
        if (parsedResponse.length < 3) {
            console.log("Parsed Response doesn't contain all contents.");
            return;
        }

        let initialSentence = parsedResponse[0];
        let correctSentence = parsedResponse[1];
        let reason = parsedResponse[2];
        reason = reason.substring(0, reason.length - 1);

        if (initialSentence.toLowerCase() === correctSentence.toLowerCase()) {
            console.log("No change to initial sentence.");
            return;
        }

        let sentenceInd = text.search(initialSentence);
        if (sentenceInd === -1) {
            console.log("Cannot find initial sentence in input: " + initialSentence);
        }
        if (reason.toLowerCase().search("No corrections needed") !== -1) {
            console.log("Reason states that there are no corrections needed for sentence.")
            return;
        }
        quill.formatText(sentenceInd, initialSentence.length, 'background', '#3399FF');
        res += "[" + numError + "]\nError: " + initialSentence + "\nCorrection: " + correctSentence + "\nReason: " + reason + "\n--------------------\n";
        numError += 1;
  })

  if (res === "") {
    return "No corrections needed";
  }
  return res;
}

// Generates introduction and conclusion paragraphs based on given text.
async function generateSynthesizerResponse(text) {
    const sys = `I want you to act as an editor. Given the body paragraphs below, first write me a short introduction paragraph with a strong and detailed thesis statement. Then write me a short conclusion paragraph. For both the introduction and conclusion paragraphs, give me a list of key points you used from the body paragraphs. Respond in the format:
    Introduction: 
    [Generated Introduction]
    * [List of key points from body paragraphs used in introduction]
    Conclusion: 
    [Generated Conclusion]
    * [List of key points from body paragraphs used in conclusion]`
    const body = `Body Paragraphs:
    ${text}`
    let res = await gptGenerate(sys, body);
    return res;
}

// Finds areas that can be elaborated on in the user-inputted text
async function generateElaboratorResponse(text) {
    let sys = `I want you give me writing advice. Given this body of text, return a list of items (up to 5 at max) that could be further expanded and give a short paragraph to explain why. Only output the list of entries, each entry should be in the format (text|reason). Make sure that 'text' is a string within the given body of text.
    Example:
    Text: I really like cats. Dogs are amazing creatures. They are loyal and fun. They can be fluffly and cute too.
    Topics:
    (I really like cats.|You should expand a little bit about cats before talking about dogs here.)`

    let user; 
    if (highlighted_text == null) { 
        console.log("elaborating on full text");
        user = `Text: ${text}`
    } else { 
        console.log("elaborating on highlighted text: " + highlighted_text);
        user = `Text: ${highlighted_text}`
    }

    // Reformatted to match consistency of other functions
    let res_gpt = await gptGenerate(sys, user);
    if (res_gpt === undefined) {
        return undefined;
    }
    let responseList = res_gpt.split('(');
    let res = "";
    let numError = 1;

    responseList.forEach((response) => {
        // remove closing parenthesis from response
        response = response.substring(0, response.length - 1);
        let parsedResponse = response.split('|');
        if (parsedResponse.length < 2) {
            console.log("Parsed Response doesn't contain all contents.");
            return;
        }
        let initialSentence = parsedResponse[0];
        let reason = parsedResponse[1];
        reason = reason.substring(0, reason.length - 1);
        if (reason.substring(0, 7) === "Reason:") {
            reason = reason.substring(7, reason.length)
        }
        if (reason.search("No corrections needed") !== -1) {
            console.log("Reason states that there are no corrections needed for sentence.")
            return;
        }
        res += "[" + numError + "]\nTopic: " + initialSentence + "\nReason: " + reason + "\n--------------------\n";
        numError += 1;
    })
    return res;
}

// Stores user-inputted GPT API key
function storeGptKey() {
    var input = document.getElementById("userInput").value;
    gptKey = input;
    alert("Added GPT Key!")
}

document.querySelector('#grammarRoverButton').addEventListener('click', async function() {
    setResponse("Loading..."); // let user know that GPT is running
    resetHighlight();
    let text = quill.getText(); // get user input
    if (text === '') {
        setResponse("The textbox is empty, please add some text to use this function.");
        return;
    }
    let res = await generateGrammarResponse(text);
    if (res === undefined) {
        setResponse("Failed to receive gpt response. You may need to insert a GPT key.");
        return;
    }
    if (res.toLowerCase().search("No corrections needed") !== -1) {
        setResponse("No corrections needed");
        return res;
    }
    setResponse(res);
});

document.querySelector('#synthesizerButton').addEventListener('click', async function() {
    setResponse("Loading..."); // let user know that GPT is running
    resetHighlight();
    let text = quill.getText(); // get user input
    if (text === '') {
        setResponse("The textbox is empty, please add some text to use this function.");
        return;
    }
    let res = await generateSynthesizerResponse(text);
    if (res === undefined) {
        setResponse("Failed to receive gpt response. You may need to insert a GPT key.");
        return;
    }
    setResponse(res);
});

document.querySelector('#elaboratorButton').addEventListener('click', async function() {
    setResponse("Loading..."); // let user know that GPT is running
    resetHighlight();
    let text = quill.getText(); // get user input
    if (text === '') {
        setResponse("The textbox is empty, please add some text to use this function.");
        return;
    }
    let res = await generateElaboratorResponse(text);
    if (res === undefined) {
        setResponse("Failed to receive gpt response. You may need to insert a GPT key.");
        return;
    }
    setResponse(res);
});