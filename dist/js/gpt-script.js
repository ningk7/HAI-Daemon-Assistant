var quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
      toolbar: '#toolbar'
    }
  });
  const GPT_call = async(systemPrompt, message)=> {

      const chat = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo-0613',
      temperature: 0.8, 
      messages: [
          {
          role: 'system',
          content: systemPrompt,
          },
          ...chatHistory, 
          {
          role: 'user',
          content: message, 
          },
      ]
      });
      let answer = chat.data.choices[0].message?.content;
      return answer;
  }

  // setting as let since we will overwrite later
  document.querySelector('#grammarRoverButton').addEventListener('click', function() {
    let range = quill.getSelection(true);
    const xhr = new XMLHttpRequest();
  // Set the request method and URL.
      xhr.open('GET', 'https://mocki.io/v1/baff67f5-4af8-4d62-86ad-f49d75ce98fc');
  
  // Set the request header.
      xhr.setRequestHeader('Accept', 'application/json');
  
  // Send the request.
      xhr.send();
  
  // Listen for the response.
          xhr.onload = function() {
          if (xhr.status === 200) {
              // Success!
              const response = JSON.parse(xhr.responseText);
              console.log(response);
              quill.insertText(range.index, response.data + "grammarRoverButton");
          } else {
              // Error!
              console.log(xhr.statusText);
          }
          };
  });
  
  document.querySelector('#synthesizerButton').addEventListener('click', function() {
    let range = quill.getSelection(true);
    const xhr = new XMLHttpRequest();
    // Set the request method and URL.
    xhr.open('GET', 'https://mocki.io/v1/baff67f5-4af8-4d62-86ad-f49d75ce98fc');
  
    // Set the request header.
    xhr.setRequestHeader('Accept', 'application/json');
  
    // Send the request.
    xhr.send();
  
    // Listen for the response.
    xhr.onload = function() {
    if (xhr.status === 200) {
        // Success!
        const response = JSON.parse(xhr.responseText);
        console.log(response);
        quill.insertText(range.index, response.data + "synthesizerButton");
    } else {
        // Error!
        console.log(xhr.statusText);
    }
    };
  });
  
  document.querySelector('#elaboratorButton').addEventListener('click', function() {
    let range = quill.getSelection(true);
    const xhr = new XMLHttpRequest();
  // Set the request method and URL.
      xhr.open('GET', 'https://mocki.io/v1/baff67f5-4af8-4d62-86ad-f49d75ce98fc');
  
  // Set the request header.
      xhr.setRequestHeader('Accept', 'application/json');
  
  // Send the request.
      xhr.send();
  
  // Listen for the response.
          xhr.onload = function() {
          if (xhr.status === 200) {
              // Success!
              const response = JSON.parse(xhr.responseText);
              console.log(response);
              quill.insertText(range.index, response.data + "elaboratorButton");
          } else {
              // Error!
              console.log(xhr.statusText);
          }
          };
  });