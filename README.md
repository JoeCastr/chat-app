# chat-app
Public chat room app

A running version can be found online: https://stormy-dawn-15713.herokuapp.com/

Process:

I originally sought out to learn about websockets with this app and I did manage to achieve that. But I learned more about Passport.js. The reason for that is that I thought that I needed a solution for managing multiple different sessions for different users. That doesn't seem to be the case, as sessions are stored by the express-session package. I spent a lot of time, however, trying to implement Passport.js. I also spent time looking into solutions like Redis as a message queue and MongoDB for session storage. None of these ended up being necessary. The websocket service and the express server don't directly send information to each other. Express sends the name variable to the front-end and the client-side socket.io implementation just grabs that variable. I don't like the solution - I wanted it to be more sophisticated than that. However this is simple and it does work so until there is a need for scaling, this is fine. I want to create an app designed to scale some day because that technology is relevant to the industry and interesting to me personally. I may have to wait.
