var quill = new Quill('#editor', {
    theme: 'snow',
    "modules": {
      "toolbar": false
    }
});

const gptGenerate = async(systemPrompt, message)=> {
    try {
      let response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${'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'}`,
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
        return undefined
      }
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      return undefined;
    }
  }

var highlighted_text; // stores highlighted text
var end_index_ht; // stores end index of highlighted text
quill.on('selection-change', function (range, oldRange, source) {
    if (range && range.length > 0) {
        highlighted_text = quill.getText(range.index, range.length);
        end_index_ht = range.index + range.length;
    } else {
        // No text is currently highlighted
        console.log('No highlighted text');
    }
    });

var fullText = quill.getText(); // stores full text
var end_index_ft = quill.getLength(); // sotres endIndex of full text
quill.on('text-change', function(delta, oldDelta, source) {
  fullText = quill.getText();
  console.log('Content changed:', fullText);
  end_index_ft = quill.getLength();
});

let grammarPrompt = `<SYS>I want you to act as an editor. You will be given a text. Your task is to identify grammar errors in the text. List the grammar errors and how to correct them, and also provide reasoning for the corrections. Each entry should be in the format (error|correction|reasoning).
Example:
Text: I have two childs. One is a girl named Clair. The other is boy named Thatcher.
Corrections:
(I have two childs.|I have two children.|The plural form of a child is children.)
(The other is boy named Thatcher.|The other is a boy named Thatcher.|There needs to be an indefinite article to introduce the noun “boy.”)</SYS>`

function setResponse(res) {
  document.getElementById("responseText").innerHTML = res;
}

async function generateGrammarResponse(text) {
    let user_text = `Text: ${text}
    Corrections:
    `

    let gptResponse = await gptGenerate(grammarPrompt, user_text);
    if (gptResponse === undefined) {
        return undefined;
    }
    if (gptResponse.search("No corrections needed") !== -1) {
        return gptResponse;
    }
    let responseList = gptResponse.split('(');
    let res = "";
    let numError = 1;
    responseList.forEach((response) => {
        // remove closing parenthesis from response
        response = response.substring(0, response.length - 1);

        let parsedResponse = response.split('|');
        if (parsedResponse.length < 3) {
        return;
        }

        let initialSentence = parsedResponse[0];
        let correctSentence = parsedResponse[1];
        let reason = parsedResponse[2];

        let sentenceInd = text.search(initialSentence);
        if (sentenceInd === -1) {
        return;
        }
        if (reason.search("No corrections needed") !== -1) {
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

function generateSynthesizerResponse(text) {
  return "synthesizer";
}

function generateElaboratorResponse(text) {
  return "elaborator";
}
document.querySelector('#grammarRoverButton').addEventListener('click', async function() {
  if (grammarPrompt === undefined) {
    setResponse("Failed to fetch grammar prompt, try again.");
    return;
  }

  setResponse("Loading...");
  let text = quill.getText();
  let res = await generateGrammarResponse(text);
  if (res === undefined) {
    setResponse("Failed to receive gpt response.");
    return;
  }
  if (res.search("No corrections needed") !== -1) {
    setResponse("No corrections needed");
    return res;
  }
  setResponse(res);
});

document.querySelector('#synthesizerButton').addEventListener('click', function() {
  let text = quill.getText();
  let res = generateSynthesizerResponse(text);
  setResponse(res);
});

document.querySelector('#elaboratorButton').addEventListener('click', function() {
  let text = quill.getText();
  let res = generateElaboratorResponse(text);
  setResponse(res);
});