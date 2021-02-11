// Create WebSocket connection.                             // username is a global variable - can I pass it to socket? can I add it to event.data?                                                 
// const socket = new WebSocket('ws://localhost:5000/welcome/')
const input = document.querySelector('input');
const chatWindow = document.getElementById('scrolling-chat');


form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
})

socket.on('chat message', function(msg) {
  const item = document.createElement('li');
  item.textContent = msg;
  messages.appendChild(item)
  window.scrollTo(0, document.body.scrollHeight);
})
// // Connection opened
// socket.addEventListener('open', function(event) {
//   console.log('Connected to WS Server')
//   socket.send(username)
// });

// Listen for messages
// socket.addEventListener('message', function(event) {
//   console.log("event.data is typeof " + (typeof event.data))
//   console.log("event.data is === " + event.data)
//   console.log("username.name is typeof " + (typeof username));
//   let parsedEventData = JSON.parse(event.data)
//   parsedEventData.author = username.name
//   let stringifiedEventData = JSON.stringify(parsedEventData)
//   console.log("I did some parsing and stringifying! Did it work: " + stringifiedEventData)
//   addMessage(stringifiedEventData);
// });

// let message_obj = {};

// const sendMessage = () => {
//   message_obj.text = document.querySelector('textarea').value;
//   socket.send(JSON.stringify(message_obj));
//   document.querySelector('textarea').value = "";
// }

// const addMessage = (obj) => {
//   let scrollingChat = document.querySelector(".scrolling-chat");
//   let newChatMessage = document.createElement('p');
//   let jsonObj = JSON.parse(obj)

//   newChatMessage.author = jsonObj.author;
//   newChatMessage.textContent = newChatMessage.author + ": " + jsonObj.text;
//   scrollingChat.appendChild(newChatMessage);
// }