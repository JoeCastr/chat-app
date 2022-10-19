// Create WebSocket connection
const input = document.querySelector('input');
const chatWindow = document.getElementById('scrolling-chat');

// the chat text box is a form
// prevent default prevents reloading of page
// emit the message to other clients listening
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
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
})